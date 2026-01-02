const vscode = require('vscode');

let currentColor = null;
let statusBarItem;
let currentFolderName = null;
let openTabsInfo = new Map();

const COLOR_PALETTE = [
    { name: 'Rojo', color: '#dc3545', icon: '🔴' },
    { name: 'Azul', color: '#007acc', icon: '🔵' },
    { name: 'Verde', color: '#28a745', icon: '🟢' },
    { name: 'Naranja', color: '#fd7e14', icon: '🟠' },
    { name: 'Amarillo', color: '#ffc107', icon: '🟡' },
    { name: 'Morado', color: '#9c27b0', icon: '💜' },
    { name: 'Café', color: '#795548', icon: '��' },
    { name: 'Negro', color: '#343a40', icon: '⚫' },
    { name: 'Personalizado...', color: 'custom', icon: '🎨' }
];

const DEFAULT_FOLDERS = {
    'frontend': '#dc3545',
    'backend': '#007acc',
    'api': '#28a745'
};

function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'autoFolderColors.showOpenProjects';
    context.subscriptions.push(statusBarItem);

    // Aplicar color inicial
    updateColor();

    // Suscripciones a eventos
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            currentColor = null;
            currentFolderName = null;
            updateColor();
        }),
        vscode.window.tabGroups.onDidChangeTabs(() => {
            scanAllOpenTabs();
            updateStatusBar();
        }),
        registerCommands()
    );
}

function registerCommands() {
    return [
        vscode.commands.registerCommand('autoFolderColors.showOpenProjects', showOpenProjectsCommand),
        vscode.commands.registerCommand('autoFolderColors.changeColorPalette', changeColorPaletteCommand),
        vscode.commands.registerCommand('autoFolderColors.changeColor', changeColorCommand),
        vscode.commands.registerCommand('autoFolderColors.addFolder', addFolderCommand),
        vscode.commands.registerCommand('autoFolderColors.editFolder', editFolderCommand),
        vscode.commands.registerCommand('autoFolderColors.removeFolder', removeFolderCommand),
        vscode.commands.registerCommand('autoFolderColors.listFolders', listFoldersCommand)
    ];
}

function getFolderColors() {
    const config = vscode.workspace.getConfiguration('autoFolderColors');
    return config.get('folders', DEFAULT_FOLDERS);
}

async function selectColorFromPalette(currentColor = null) {
    const items = COLOR_PALETTE.map(c => ({
        label: `${c.icon} ${c.name}`,
        description: c.color !== 'custom' ? c.color : 'Ingresa tu propio código hex',
        color: c.color
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Selecciona un color de la paleta',
        matchOnDescription: true
    });

    if (!selected) return null;

    if (selected.color === 'custom') {
        return await vscode.window.showInputBox({
            prompt: 'Ingresa el código hexadecimal del color',
            placeHolder: 'ej: #ff5733',
            value: currentColor || '#',
            validateInput: (value) => {
                return /^#[0-9A-Fa-f]{6}$/.test(value) ? null : 'Ingresa un color hex válido (ej: #ff5733)';
            }
        });
    }

    return selected.color;
}

function getColorForPath(filePath) {
    if (!filePath) return null;
    
    const folders = getFolderColors();
    
    for (const [folderName, color] of Object.entries(folders)) {
        if (filePath.includes(`/${folderName}/`) || filePath.includes(`\\${folderName}\\`)) {
            return { name: folderName, color };
        }
    }
    
    return null;
}

function adjustColor(color, percent, lighten = true) {
    const num = parseInt(color.replace("#",""), 16);
    const amt = Math.round(2.55 * percent);
    const adjust = (val) => lighten ? Math.min(255, val + amt) : Math.max(0, val - amt);
    
    const R = adjust(num >> 16);
    const G = adjust((num >> 8) & 0x00FF);
    const B = adjust(num & 0x0000FF);
    
    return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

function scanAllOpenTabs() {
    openTabsInfo.clear();
    
    for (const tabGroup of vscode.window.tabGroups.all) {
        for (const tab of tabGroup.tabs) {
            if (tab.input?.uri) {
                const folderInfo = getColorForPath(tab.input.uri.fsPath);
                if (folderInfo) {
                    if (!openTabsInfo.has(folderInfo.name)) {
                        openTabsInfo.set(folderInfo.name, {
                            color: folderInfo.color,
                            count: 0,
                            icon: COLOR_PALETTE.find(c => c.color === folderInfo.color)?.icon || '📁'
                        });
                    }
                    openTabsInfo.get(folderInfo.name).count++;
                }
            }
        }
    }
}

function changeWorkspaceColor(folderInfo) {
    if (!folderInfo || (currentColor === folderInfo.color && currentFolderName === folderInfo.name)) {
        return;
    }
    
    currentColor = folderInfo.color;
    currentFolderName = folderInfo.name;
    
    scanAllOpenTabs();
    
    const lightColor = adjustColor(folderInfo.color, 15, true);
    const darkColor = adjustColor(folderInfo.color, 10, false);
    const multipleProjects = openTabsInfo.size > 1;
    
    const colorCustomizations = {
        'titleBar.activeBackground': folderInfo.color,
        'titleBar.activeForeground': '#ffffff',
        'titleBar.inactiveBackground': folderInfo.color + 'cc',
        'titleBar.inactiveForeground': '#ffffff99',
        'statusBar.background': folderInfo.color,
        'statusBar.foreground': '#ffffff',
        'activityBar.background': folderInfo.color + 'dd',
        'activityBar.foreground': '#ffffff',
        'activityBar.inactiveForeground': '#ffffff99',
        'tab.activeBackground': darkColor,
        'tab.activeForeground': '#ffffff',
        'tab.activeBorder': folderInfo.color,
        'tab.activeBorderTop': folderInfo.color,
        'tab.inactiveBackground': '#252526',
        'tab.inactiveForeground': '#969696',
        'tab.activeModifiedBorder': folderInfo.color,
        'tab.inactiveModifiedBorder': multipleProjects ? '#888888' : folderInfo.color + '88',
        'tab.hoverBackground': folderInfo.color + '44',
        'tab.hoverForeground': '#ffffff',
        'tab.border': folderInfo.color + '33',
        'editorGroupHeader.tabsBackground': '#1e1e1e',
        'editorGroupHeader.tabsBorder': folderInfo.color + '66',
        'editorGroupHeader.border': multipleProjects ? '#888888' : folderInfo.color,
        'breadcrumb.background': folderInfo.color + '22',
        'breadcrumb.foreground': '#cccccc',
        'breadcrumb.focusForeground': '#ffffff',
        'breadcrumb.activeSelectionForeground': folderInfo.color
    };
    
    vscode.workspace.getConfiguration('workbench')
        .update('colorCustomizations', colorCustomizations, vscode.ConfigurationTarget.Workspace);
    
    updateStatusBar();
}

function updateStatusBar() {
    if (!currentFolderName || !currentColor) {
        statusBarItem.text = '📁 Sin proyecto';
        statusBarItem.tooltip = 'No hay proyectos detectados';
    } else {
        const currentInfo = openTabsInfo.get(currentFolderName);
        const icon = currentInfo?.icon || COLOR_PALETTE.find(c => c.color === currentColor)?.icon || '📁';
        
        statusBarItem.text = `${icon} ${currentFolderName}`;
        
        if (openTabsInfo.size > 1) {
            const otherProjects = Array.from(openTabsInfo.entries())
                .filter(([name]) => name !== currentFolderName)
                .map(([name, info]) => `${info.icon} ${name}: ${info.count} archivo(s)`)
                .join('\n');
            
            statusBarItem.tooltip = `Proyecto activo: ${currentFolderName}\n\nOtros proyectos abiertos:\n${otherProjects}\n\nClick para cambiar color`;
        } else {
            statusBarItem.tooltip = `Proyecto: ${currentFolderName}\nColor: ${currentColor}\nClick para cambiar color`;
        }
    }
    statusBarItem.show();
}

function updateColor() {
    const editor = vscode.window.activeTextEditor;
    if (editor) {
        const folderInfo = getColorForPath(editor.document.uri.fsPath);
        if (folderInfo) {
            changeWorkspaceColor(folderInfo);
        }
    }
}

// Comandos
async function showOpenProjectsCommand() {
    scanAllOpenTabs();
    
    if (openTabsInfo.size === 0) {
        vscode.window.showInformationMessage('No hay archivos de proyectos configurados abiertos');
        return;
    }

    const items = Array.from(openTabsInfo.entries()).map(([name, info]) => ({
        label: `${info.icon} ${name}`,
        description: `${info.count} archivo(s) abiertos`,
        detail: info.color,
        name,
        color: info.color
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Proyectos con tabs abiertas - Selecciona uno para cambiar color'
    });

    if (!selected) return;

    const newColor = await selectColorFromPalette(selected.color);
    if (!newColor) return;

    const config = vscode.workspace.getConfiguration('autoFolderColors');
    const folders = config.get('folders', {});
    folders[selected.name] = newColor;
    
    await config.update('folders', folders, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`✅ Color de ${selected.name} actualizado`);
    
    updateColor();
}

async function changeColorPaletteCommand() {
    if (!currentFolderName) {
        vscode.window.showWarningMessage('No hay una carpeta activa detectada');
        return;
    }

    const newColor = await selectColorFromPalette(currentColor);
    if (!newColor) return;

    const config = vscode.workspace.getConfiguration('autoFolderColors');
    const folders = config.get('folders', {});
    folders[currentFolderName] = newColor;
    
    await config.update('folders', folders, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`✅ Color de ${currentFolderName} actualizado`);
    
    changeWorkspaceColor({ name: currentFolderName, color: newColor });
}

async function changeColorCommand() {
    const folders = getFolderColors();
    const items = Object.entries(folders).map(([name, color]) => ({
        label: `${COLOR_PALETTE.find(c => c.color === color)?.icon || '🎨'} ${name}`,
        description: color,
        detail: `Click para aplicar el color de ${name}`,
        color,
        name
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Selecciona el color de una carpeta para aplicar'
    });

    if (selected) {
        changeWorkspaceColor({ name: selected.name, color: selected.color });
    }
}

async function addFolderCommand() {
    const folderName = await vscode.window.showInputBox({
        prompt: 'Nombre de la carpeta',
        placeHolder: 'ej: mi-proyecto'
    });

    if (!folderName) return;

    const color = await selectColorFromPalette();
    if (!color) return;

    const config = vscode.workspace.getConfiguration('autoFolderColors');
    const folders = config.get('folders', {});
    folders[folderName] = color;
    
    await config.update('folders', folders, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`✅ Agregado ${folderName} con color ${color}`);
}

async function editFolderCommand() {
    const folders = getFolderColors();
    const items = Object.entries(folders).map(([name, color]) => ({
        label: `${COLOR_PALETTE.find(c => c.color === color)?.icon || '🎨'} ${name}`,
        description: color,
        name,
        currentColor: color
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Selecciona la carpeta a editar'
    });

    if (!selected) return;

    const newColor = await selectColorFromPalette(selected.currentColor);
    if (!newColor) return;

    const config = vscode.workspace.getConfiguration('autoFolderColors');
    const updatedFolders = config.get('folders', {});
    updatedFolders[selected.name] = newColor;
    
    await config.update('folders', updatedFolders, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`✅ Actualizado ${selected.name} a ${newColor}`);
    
    updateColor();
}

async function removeFolderCommand() {
    const folders = getFolderColors();
    const items = Object.entries(folders).map(([name, color]) => ({
        label: `${COLOR_PALETTE.find(c => c.color === color)?.icon || '🎨'} ${name}`,
        description: color,
        name
    }));

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Selecciona la carpeta a eliminar'
    });

    if (!selected) return;

    const confirm = await vscode.window.showWarningMessage(
        `¿Eliminar "${selected.name}"?`,
        'Sí', 'No'
    );

    if (confirm !== 'Sí') return;

    const config = vscode.workspace.getConfiguration('autoFolderColors');
    const updatedFolders = config.get('folders', {});
    delete updatedFolders[selected.name];
    
    await config.update('folders', updatedFolders, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`🗑️ Eliminado ${selected.name}`);
}

async function listFoldersCommand() {
    const folders = getFolderColors();
    const items = Object.entries(folders).map(([name, color]) => {
        const icon = COLOR_PALETTE.find(c => c.color === color)?.icon || '🎨';
        return `${icon} ${name}: ${color}`;
    });
    
    vscode.window.showInformationMessage(
        `Carpetas configuradas:\n\n${items.join('\n')}`,
        { modal: false }
    );
}

function deactivate() {
    statusBarItem?.dispose();
}

module.exports = { activate, deactivate };
