const assert = require('assert');
const vscode = require('vscode');

suite('Extension Test Suite', () => {
    vscode.window.showInformationMessage('Start all tests.');

    test('Extension should be present', () => {
        assert.ok(vscode.extensions.getExtension('jiban-advanced-systems.auto-folder-colors'));
    });

    test('Commands should be registered', async () => {
        const commands = await vscode.commands.getCommands(true);
        const registeredCommands = [
            'autoFolderColors.showOpenProjects',
            'autoFolderColors.changeColorPalette',
            'autoFolderColors.applyManualColor',
            'autoFolderColors.changeColor',
            'autoFolderColors.addFolder',
            'autoFolderColors.editFolder',
            'autoFolderColors.removeFolder',
            'autoFolderColors.listFolders'
        ];

        registeredCommands.forEach(cmd => {
            assert.ok(commands.includes(cmd), `Command ${cmd} should be registered`);
        });
    });

    test('Should read default configuration correctly', () => {
        const config = vscode.workspace.getConfiguration('autoFolderColors');
        const folders = config.get('folders');
        assert.strictEqual(typeof folders, 'object', 'Folders configuration should be an object');
    });
});
