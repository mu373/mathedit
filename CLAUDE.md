# MathEdit - Claude Code Instructions

LaTeX math equation editor with SVG export. Available as web app and native macOS app.

## Project Structure

```
MathEdit/                    # macOS app (Swift/SwiftUI)
  MathEdit/
    Views/                   # SwiftUI views
    Bridge/                  # Swift-JS bridge (RenderService.swift)
    web/                     # Built web-native assets (copied by build:native)
  MathEdit.xcodeproj

packages/
  core/                      # Shared rendering logic (TypeScript)
    src/parser/              # Document parsing, color handling
    src/renderer/            # MathJax SVG rendering
  web-native/                # Minimal React editor for macOS WebView
  web-standalone/            # Full web app (Vercel deployment)
```

## Build Commands

```bash
pnpm install                 # Install dependencies

# Web development
pnpm dev                     # Run web-standalone dev server

# macOS app development
pnpm build:native            # Build web-native AND copy to MathEdit/MathEdit/web/
# Then open MathEdit/MathEdit.xcodeproj and ⌘R in Xcode

# Other commands
pnpm build                   # Build all packages
pnpm build:web               # Build web-standalone only
pnpm copy:native             # Copy web-native dist to Xcode (without rebuilding)
pnpm type-check              # TypeScript type checking
pnpm clean                   # Clean all build artifacts
```

## Key Development Notes

### After modifying packages/core or packages/web-native:
Always run `pnpm build:native` to rebuild and copy assets to the Xcode project.

### Swift-JS Bridge:
- EditorWebView.swift loads web-native from MathEdit/web/
- RenderService.swift handles rendering requests
- Communication via WKScriptMessageHandler

## File Formats

### Document format (.mathedit):
Plain text with equations separated by `---`. Optional frontmatter:
```
define.mycolor: #FF0000
color: $mycolor
---
\color{mycolor}{x^2 + y^2}
---
E = mc^2
```

### SVG output:
Includes embedded metadata for round-trip editing (LaTeX source preserved).
