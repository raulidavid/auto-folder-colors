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
    { name: 'Café', color: '#795548', icon: '🟤' },
    { name: 'Negro', color: '#343a40', icon: '⚫' },
    { name: 'Personalizado...', color: 'custom', icon: '🎨' }
];


let debounceTimer = null;
let tabScanTimer = null;

function activate(context) {
    statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'autoFolderColors.showOpenProjects';
    context.subscriptions.push(statusBarItem);

    // Aplicar color inicial
    updateColor();

    // Suscripciones a eventos con debounce para mejor rendimiento
    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            // Debounce para evitar múltiples ejecuciones rápidas
            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                currentColor = null;
                currentFolderName = null;
                updateColor();
            }, 50); // 50ms de debounce
        }),
        vscode.window.tabGroups.onDidChangeTabs(() => {
            // Debounce más largo para cambios de tabs (pueden ser múltiples)
            if (tabScanTimer) clearTimeout(tabScanTimer);
            tabScanTimer = setTimeout(() => {
                scanAllOpenTabs();
                updateStatusBar();
            }, 150); // 150ms de debounce
        }),
        registerCommands()
    );
}

function registerCommands() {
    return [
        vscode.commands.registerCommand('autoFolderColors.showOpenProjects', showOpenProjectsCommand),
        vscode.commands.registerCommand('autoFolderColors.changeColorPalette', changeColorPaletteCommand),
        vscode.commands.registerCommand('autoFolderColors.applyManualColor', applyManualColorCommand),
        vscode.commands.registerCommand('autoFolderColors.changeColor', changeColorCommand),
        vscode.commands.registerCommand('autoFolderColors.addFolder', addFolderCommand),
        vscode.commands.registerCommand('autoFolderColors.editFolder', editFolderCommand),
        vscode.commands.registerCommand('autoFolderColors.removeFolder', removeFolderCommand),
        vscode.commands.registerCommand('autoFolderColors.listFolders', listFoldersCommand)
    ];
}

// Cache para mejorar rendimiento
let foldersCache = null;
let pathColorCache = new Map();
const MAX_CACHE_SIZE = 100;

function getFolderColors() {
    // Cachear la configuración para evitar lecturas repetidas
    if (!foldersCache) {
        const config = vscode.workspace.getConfiguration('autoFolderColors');
        foldersCache = config.get('folders', {});
    }
    return foldersCache;
}

// Función para limpiar el cache cuando cambie la configuración
function clearCache() {
    foldersCache = null;
    pathColorCache.clear();
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

// Helper para actualizar configuración y limpiar cache
async function updateFoldersConfig(folders) {
    const config = vscode.workspace.getConfiguration('autoFolderColors');
    await config.update('folders', folders, vscode.ConfigurationTarget.Global);
    clearCache(); // Limpiar cache después de actualizar
}

function getColorForPath(filePath) {
    if (!filePath) return null;

    // Verificar cache primero
    if (pathColorCache.has(filePath)) {
        return pathColorCache.get(filePath);
    }

    const folders = getFolderColors();
    let result = null;

    for (const [folderName, color] of Object.entries(folders)) {
        if (filePath.includes(`/${folderName}/`) || filePath.includes(`\\${folderName}\\`)) {
            result = { name: folderName, color };
            break;
        }
    }

    // Guardar en cache (con límite de tamaño)
    if (pathColorCache.size >= MAX_CACHE_SIZE) {
        // Eliminar el primer elemento (LRU básico)
        const firstKey = pathColorCache.keys().next().value;
        pathColorCache.delete(firstKey);
    }
    pathColorCache.set(filePath, result);

    return result;
}

function adjustColor(color, percent, lighten = true) {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const adjust = (val) => lighten ? Math.min(255, val + amt) : Math.max(0, val - amt);

    const R = adjust(num >> 16);
    const G = adjust((num >> 8) & 0x00FF);
    const B = adjust(num & 0x0000FF);

    return "#" + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
}

function scanAllOpenTabs() {
    openTabsInfo.clear();

    // Cache para iconos para evitar búsquedas repetidas
    const iconCache = new Map();

    for (const tabGroup of vscode.window.tabGroups.all) {
        for (const tab of tabGroup.tabs) {
            // Verificar que el tab tenga URI antes de procesar
            if (!tab.input?.uri?.fsPath) continue;

            const folderInfo = getColorForPath(tab.input.uri.fsPath);
            if (!folderInfo) continue;

            if (!openTabsInfo.has(folderInfo.name)) {
                // Usar cache de iconos
                let icon = iconCache.get(folderInfo.color);
                if (!icon) {
                    icon = COLOR_PALETTE.find(c => c.color === folderInfo.color)?.icon || '📁';
                    iconCache.set(folderInfo.color, icon);
                }

                openTabsInfo.set(folderInfo.name, {
                    color: folderInfo.color,
                    count: 0,
                    icon
                });
            }
            openTabsInfo.get(folderInfo.name).count++;
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

    const items = [];

    // Agregar proyectos abiertos
    if (openTabsInfo.size > 0) {
        items.push({
            label: '$(folder-opened) PROYECTOS ABIERTOS',
            kind: vscode.QuickPickItemKind.Separator
        });

        openTabsInfo.forEach((info, name) => {
            items.push({
                label: `${info.icon} ${name}`,
                description: `${info.count} archivo(s) abiertos`,
                detail: info.color,
                name,
                color: info.color,
                type: 'open'
            });
        });
    }

    // Agregar carpetas configuradas
    const folders = getFolderColors();
    const configuredFolders = Object.entries(folders)
        .filter(([name]) => !openTabsInfo.has(name)); // Solo las que no están abiertas

    if (configuredFolders.length > 0) {
        items.push({
            label: '$(folder) CARPETAS CONFIGURADAS',
            kind: vscode.QuickPickItemKind.Separator
        });

        configuredFolders.forEach(([name, color]) => {
            const icon = COLOR_PALETTE.find(c => c.color === color)?.icon || '📁';
            items.push({
                label: `${icon} ${name}`,
                description: color,
                detail: 'Click para aplicar este color',
                name,
                color,
                type: 'configured'
            });
        });
    }

    // Opción para aplicar color manualmente
    items.push({
        label: '$(add) APLICAR COLOR MANUALMENTE',
        kind: vscode.QuickPickItemKind.Separator
    });

    items.push({
        label: '🎨 Aplicar color sin proyecto',
        description: 'Aplicar un color al workspace actual',
        detail: 'Útil cuando no hay workspace o carpetas configuradas',
        type: 'manual'
    });

    if (items.filter(i => !i.kind).length === 0) {
        const applyManual = await vscode.window.showInformationMessage(
            'No hay proyectos abiertos ni carpetas configuradas. ¿Deseas aplicar un color manualmente?',
            'Sí', 'No'
        );

        if (applyManual === 'Sí') {
            await applyManualColorCommand();
        }
        return;
    }

    const selected = await vscode.window.showQuickPick(items, {
        placeHolder: 'Selecciona un proyecto o aplica un color manualmente'
    });

    if (!selected || selected.kind) return;

    if (selected.type === 'manual') {
        await applyManualColorCommand();
        return;
    }

    const newColor = await selectColorFromPalette(selected.color);
    if (!newColor) return;

    const config = vscode.workspace.getConfiguration('autoFolderColors');
    const updatedFolders = config.get('folders', {});
    updatedFolders[selected.name] = newColor;

    await config.update('folders', updatedFolders, vscode.ConfigurationTarget.Global);
    vscode.window.showInformationMessage(`✅ Color de ${selected.name} actualizado`);

    changeWorkspaceColor({ name: selected.name, color: newColor });
}

async function changeColorPaletteCommand() {
    if (!currentFolderName) {
        vscode.window.showWarningMessage('No hay una carpeta activa detectada. Usa "Aplicar color manualmente" desde la paleta de comandos.');
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

async function applyManualColorCommand() {
    const folderName = await vscode.window.showInputBox({
        prompt: 'Nombre del proyecto/workspace (opcional)',
        placeHolder: 'ej: mi-workspace',
        value: vscode.workspace.name || 'Workspace Manual'
    });

    if (!folderName) return;

    const color = await selectColorFromPalette();
    if (!color) return;

    // Guardar en configuración
    const config = vscode.workspace.getConfiguration('autoFolderColors');
    const folders = config.get('folders', {});
    folders[folderName] = color;

    await config.update('folders', folders, vscode.ConfigurationTarget.Global);

    // Aplicar el color inmediatamente
    changeWorkspaceColor({ name: folderName, color });
    vscode.window.showInformationMessage(`✅ Aplicado color ${color} a "${folderName}"`);
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
