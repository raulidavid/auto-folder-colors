# Auto Folder Colors

Automatically change VS Code workspace colors based on the active project folder. Perfect for multi-root workspaces where you work on multiple projects simultaneously.

## Features

- 🎨 **Automatic Color Switching**: IDE colors change automatically when you switch between files from different projects
- 🟢 **Visual Project Indicator**: Status bar shows current project with colored icon
- 📂 **Multi-Project Support**: Seamlessly handles multiple open projects
- 🎯 **Easy Configuration**: Pre-defined color palette with custom color support
- 🔄 **Live Updates**: Colors update in real-time as you navigate between files

## How It Works

The extension detects which project folder your active file belongs to and automatically applies a color theme to:
- Title bar
- Status bar
- Activity bar
- Active tab
- Tab borders
- Breadcrumbs

## Usage

1. **Automatic Mode**: Just open files from different project folders - colors change automatically!

2. **Click Status Bar**: Click the project indicator in the status bar to:
   - View all open projects
   - Change colors quickly
   - See file counts per project

3. **Commands**: Access via Command Palette (`Cmd/Ctrl+Shift+P`):
   - `Auto Folder Colors: Add Folder` - Add new project folder with color
   - `Auto Folder Colors: Edit Folder Color` - Change existing folder color
   - `Auto Folder Colors: Remove Folder` - Remove folder configuration
   - `Auto Folder Colors: List All Folders` - View all configured folders

## Configuration

Configure folder-to-color mappings in your settings:

```json
{
  "autoFolderColors.folders": {
    "frontend": "#dc3545",
    "backend": "#007acc",
    "api": "#28a745",
    "mobile": "#fd7e14"
  }
}
```

## Color Palette

Choose from 8 predefined colors or use custom hex codes:
- 🔴 Red `#dc3545`
- 🔵 Blue `#007acc`
- 🟢 Green `#28a745`
- 🟠 Orange `#fd7e14`
- 🟡 Yellow `#ffc107`
- 💜 Purple `#9c27b0`
- 🟤 Brown `#795548`
- ⚫ Black `#343a40`
- 🎨 Custom (any hex color)

## Requirements

- VS Code 1.80.0 or higher
- Multi-root workspace recommended for full experience

## Known Issues

- VS Code API doesn't support per-tab colors, only the active tab reflects the current project color

## Release Notes

### 1.0.0
- Initial release
- Automatic color switching
- Multi-project support
- Status bar indicator
- Color palette with 8 preset colors
- Custom color support

## License

MIT
