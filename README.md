# MathEdit

Convert LaTeX math equations to high-quality SVG images with embedded metadata for seamless round-trip editing.

Available as a **web app** and **native macOS app**.

**Web**: https://mathedit.vercel.app/

## Features

- **Round-trip editing**: SVG files include embedded LaTeX source as metadata, enabling seamless re-import and editing
- **Color support**: Full support for `\color{}` commands to highlight specific terms or expressions
- **Project management**: Save and organize collections of related equations as reusable projects
- **Clipboard support**: Copy and paste SVG images directly to/from presentation softwares (e.g., Keynote)
- **High-quality rendering**: Professional typesetting powered by MathJax

## Use Cases

This tool is designed for creating professional mathematical visuals, particularly for:

**Presentation Design**
- Generate publication-quality equation images for slides (Keynote, PowerPoint, Google Slides)
- Superior typography compared to built-in equation editors
- Vector format images in SVG

**Iterative Editing**
- Create variations of equations with different highlights
- Centralized management of all equation assets in one place
- Easily update equations across multiple documents by re-exporting

## Development

```bash
pnpm install
pnpm dev              # run web app
pnpm build:native     # build web assets for macOS
open MathEdit/MathEdit.xcodeproj  # then ⌘R in Xcode
```

## Project Structure

```
MathEdit/              # macOS app (Swift/SwiftUI)
packages/
  core/                # shared rendering logic
  web-standalone/      # web app
  web-native/          # minimal editor for macOS
```

## License

MIT
