# Auto Folder Colors

Automatically change VS Code workspace colors based on the active project folder. Perfect for multi-root workspaces where you work on multiple projects simultaneously.

## Features

- 🎨 **Automatic Color Switching**: IDE colors change automatically when you switch between files from different projects
- ✨ **Manual Color Application**: Apply colors manually even without workspace or configured folders (NEW!)
- 🟢 **Visual Project Indicator**: Status bar shows current project with colored icon
- 📂 **Multi-Project Support**: Seamlessly handles multiple open projects
- 🎯 **Easy Configuration**: Pre-defined color palette with custom color support
- 🔄 **Live Updates**: Colors update in real-time as you navigate between files
- 🚀 **Works Everywhere**: No workspace? No problem! Apply colors to any VS Code instance

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
   - View configured folders (even if not open)
   - Apply colors manually without workspace
   - Change colors quickly
   - See file counts per project

3. **Manual Mode** (NEW!): Works even without workspace or configured folders!

   - Click the status bar when no project is detected
   - Use `Auto Folder Colors: Apply Color Without Workspace` command
   - Choose a color and apply it immediately
   - Perfect for single-file workspaces or temporary projects

4. **Commands**: Access via Command Palette (`Cmd/Ctrl+Shift+P`):
   - `Auto Folder Colors: Apply Color Without Workspace` - Apply color manually (NEW!)
   - `Auto Folder Colors: Add Folder` - Add new project folder with color
   - `Auto Folder Colors: Edit Folder Color` - Change existing folder color
   - `Auto Folder Colors: Remove Folder` - Remove folder configuration
   - `Auto Folder Colors: List All Folders` - View all configured folders

## Configuration

The extension starts with no folders configured. You can add your own folder-to-color mappings:

**Option 1: Using Commands (Recommended)**

- Use `Auto Folder Colors: Add Folder` to add folders interactively
- Use `Auto Folder Colors: Apply Color Without Workspace` for quick manual application

**Option 2: Manual Configuration in Settings**

```json
{
  "autoFolderColors.folders": {
    "my-frontend": "#dc3545",
    "my-backend": "#007acc",
    "my-api": "#28a745",
    "my-mobile": "#fd7e14"
  }
}
```

### 📂 Multi-root Workspace Example

If you use a `.code-workspace` file, you can define specific colors for each project in that workspace. This is the most professional way to organize multiple projects:

**File: `my-projects.code-workspace`**

```json
{
  "folders": [
    { "name": "Frontend App", "path": "apps/frontend" },
    { "name": "Backend API", "path": "services/backend" }
  ],
  "settings": {
    "autoFolderColors.folders": {
      "Frontend App": "#dc3545",
      "Backend API": "#007acc"
    }
  }
}
```

> **Note:** The extension matches the `folderName` defined in your settings with the folder names in your breadcrumbs/path. If you use a Multi-root workspace, use the **name** of the folder as shown in the VS Code sidebar.

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

### 1.1.0

- **NEW**: Manual color application without workspace
- **NEW**: Apply colors to any VS Code instance
- Enhanced status bar with better project selection
- Improved UX for users without configured folders

### 1.0.0

- Initial release
- Automatic color switching
- Multi-project support
- Status bar indicator
- Color palette with 8 preset colors
- Custom color support

## License

MIT
