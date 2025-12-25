import { ParsedEquation, DocumentFrontmatter, ParsedDocument } from './types';

/**
 * Parse any color format to RGB values
 */
function parseToRGB(color: string): { r: number; g: number; b: number } | null {
  const trimmed = color.trim();

  // Parse #RRGGBB or #RRGGBBAA
  const hexMatch = trimmed.match(/^#([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})([0-9A-Fa-f]{2})?$/);
  if (hexMatch) {
    return {
      r: parseInt(hexMatch[1], 16),
      g: parseInt(hexMatch[2], 16),
      b: parseInt(hexMatch[3], 16),
    };
  }

  // Parse rgba(r, g, b, a) or rgb(r, g, b)
  const rgbaMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
  if (rgbaMatch) {
    return {
      r: parseInt(rgbaMatch[1]),
      g: parseInt(rgbaMatch[2]),
      b: parseInt(rgbaMatch[3]),
    };
  }

  return null;
}

/**
 * Convert color to hex format (for SVG fill/stroke attributes)
 */
function toHexColor(color: string): string {
  const rgb = parseToRGB(color);
  if (rgb) {
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0');
    return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
  }
  return color.trim();
}

/**
 * Convert color to LaTeX RGB model format: [RGB]{r,g,b}
 * This works with MathJax's standard color package
 */
function toLatexRGB(color: string): string {
  const rgb = parseToRGB(color);
  if (rgb) {
    return `[RGB]{${rgb.r},${rgb.g},${rgb.b}}`;
  }
  // Return empty for named colors (they work as-is)
  return '';
}

function generateId(): string {
  // Fallback for environments without crypto.randomUUID (HTTP contexts)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Simple UUID v4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function extractLabel(latex: string): string | null {
  const match = latex.match(/\\label\{([\w:.-]+)\}/);
  return match ? match[1] : null;
}

/**
 * Resolve color value - if it starts with $, look it up in presets
 * Returns hex format for SVG fill/stroke attributes
 */
function resolveColor(color: string | undefined, presets: Record<string, string> | undefined): string | undefined {
  if (!color) return undefined;

  // Check if it's a preset reference ($name)
  if (color.startsWith('$')) {
    const presetName = color.substring(1);
    const resolved = presets?.[presetName] || color;
    return toHexColor(resolved);
  }

  return toHexColor(color);
}

/**
 * Replace \color{name} with \color[RGB]{r,g,b} for custom color presets
 * Converts CSS colors to LaTeX RGB model format
 * Standard LaTeX colors are left unchanged
 */
function replaceColorReferences(latex: string, presets: Record<string, string> | undefined): string {
  // Standard LaTeX/xcolor color names (leave these unchanged)
  const standardColors = new Set([
    'black', 'white', 'red', 'green', 'blue', 'cyan', 'magenta', 'yellow',
    'darkgray', 'gray', 'lightgray', 'brown', 'lime', 'olive', 'orange', 'pink',
    'purple', 'teal', 'violet'
  ]);

  // Replace \color{name} with \color[RGB]{r,g,b}
  return latex.replace(/\\color\{([^}]+)\}/g, (match, colorName) => {
    const trimmed = colorName.trim();

    // If it's a standard color, leave it as is
    if (standardColors.has(trimmed.toLowerCase())) {
      return match;
    }

    // If it's a custom preset, convert to LaTeX RGB format
    const colorValue = presets?.[trimmed];
    if (colorValue) {
      const rgbModel = toLatexRGB(colorValue);
      return rgbModel ? `\\color${rgbModel}` : match;
    }

    // If it looks like a CSS color (starts with # or rgb), convert to LaTeX RGB
    if (trimmed.startsWith('#') || trimmed.startsWith('rgb')) {
      const rgbModel = toLatexRGB(trimmed);
      return rgbModel ? `\\color${rgbModel}` : match;
    }

    // Otherwise leave unchanged
    return match;
  });
}

/**
 * Extract color directive from comment at end of content: % color: #ff0000
 * Only matches if it's the last non-empty line
 */
function extractColor(latex: string): string | null {
  const lines = latex.split('\n');
  // Find last non-empty line
  for (let i = lines.length - 1; i >= 0; i--) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^%\s*color:\s*(\S.*)$/);
    return match ? match[1].trim() : null;
  }
  return null;
}

function parseFrontmatter(content: string): DocumentFrontmatter {
  const frontmatter: DocumentFrontmatter = {};
  const colorPresets: Record<string, string> = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comment lines
    if (line.trim().startsWith('%')) continue;

    const match = line.match(/^([\w.]+):\s*(\S.*)$/);
    if (match) {
      const [, key, value] = match;
      if (key === 'color') {
        frontmatter.color = value.trim();
      } else if (key.startsWith('define.')) {
        const presetName = key.substring(7); // Remove 'define.' prefix
        colorPresets[presetName] = value.trim();
      }
    }
  }

  if (Object.keys(colorPresets).length > 0) {
    frontmatter.colorPresets = colorPresets;
  }

  // Resolve the global color if it references a preset
  if (frontmatter.color) {
    frontmatter.color = resolveColor(frontmatter.color, colorPresets);
  }

  return frontmatter;
}

/**
 * Check if content looks like frontmatter (has uncommented key: value lines, no LaTeX)
 */
function isFrontmatter(content: string): boolean {
  const lines = content.split('\n');
  let hasKeyValue = false;

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('%')) continue;

    // Check for LaTeX commands
    if (trimmed.includes('\\')) return false;

    // Check for key: value pattern (including define.name format)
    if (/^[\w.]+:\s*\S/.test(trimmed)) {
      hasKeyValue = true;
    }
  }

  return hasKeyValue;
}

/**
 * Parse document with frontmatter and equations
 * Frontmatter is the first section if it contains key: value pairs (no LaTeX)
 * Equations are matched by position (index) for ID preservation
 */
export function parseDocumentWithFrontmatter(
  document: string,
  previousEquations?: ParsedEquation[]
): ParsedDocument {
  const lines = document.split('\n');
  const sections: ParsedEquation[] = [];
  let frontmatter: DocumentFrontmatter = {};

  let currentSection: string[] = [];
  let startLine = 0;
  let equationIndex = 0;
  let sectionIndex = 0;
  let isFirstSection = true;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for separator
    if (/^---+$/.test(line.trim())) {
      if (currentSection.length > 0) {
        const content = currentSection.join('\n').trim();
        if (content) {
          // Check if first section is frontmatter (contains key: value, no LaTeX commands)
          if (isFirstSection && isFrontmatter(content)) {
            frontmatter = parseFrontmatter(content);
          } else {
            const explicitLabel = extractLabel(content);
            const label = explicitLabel || `eq${++equationIndex}`;
            const color = extractColor(content);

            // Reuse ID from previous equation: match by explicit label, or by latex content if no label
            const previousEq = explicitLabel
              ? previousEquations?.find(eq => eq.label === label)
              : previousEquations?.find(eq => eq.latex === replaceColorReferences(content, frontmatter.colorPresets));
            const id = previousEq?.id || generateId();

            sections.push({
              id,
              label,
              latex: replaceColorReferences(content, frontmatter.colorPresets),
              startLine,
              endLine: i - 1,
              color: resolveColor(color || undefined, frontmatter.colorPresets),
            });

            sectionIndex++;
          }
          isFirstSection = false;
        }

        currentSection = [];
      }
      startLine = i + 1;
    } else {
      currentSection.push(line);
    }
  }

  // Last section
  if (currentSection.length > 0) {
    const content = currentSection.join('\n').trim();
    if (content) {
      // Check if first section is frontmatter
      if (isFirstSection && isFrontmatter(content)) {
        frontmatter = parseFrontmatter(content);
      } else {
        const explicitLabel = extractLabel(content);
        const label = explicitLabel || `eq${++equationIndex}`;
        const color = extractColor(content);

        const previousEq = explicitLabel
          ? previousEquations?.find(eq => eq.label === label)
          : previousEquations?.find(eq => eq.latex === replaceColorReferences(content, frontmatter.colorPresets));
        const id = previousEq?.id || generateId();

        sections.push({
          id,
          label,
          latex: replaceColorReferences(content, frontmatter.colorPresets),
          startLine,
          endLine: lines.length - 1,
          color: resolveColor(color || undefined, frontmatter.colorPresets),
        });
      }
    }
  }

  return { frontmatter, equations: sections };
}

/**
 * Parse document and preserve IDs from previous parse when equations match
 * Equations are matched by position (index) in the document
 * @deprecated Use parseDocumentWithFrontmatter instead
 */
export function parseDocument(
  document: string,
  previousEquations?: ParsedEquation[]
): ParsedEquation[] {
  return parseDocumentWithFrontmatter(document, previousEquations).equations;
}
