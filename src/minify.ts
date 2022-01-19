import vscode, {
    ExtensionContext,
    Range,
    TextEditor,
    TextEditorEdit
} from 'vscode';
import { TranspilerResourceProvider } from './resource';
import { Transpiler } from 'greybel-transpiler';

export function activate(context: ExtensionContext) {
	async function minify(
        editor: TextEditor,
        edit: TextEditorEdit,
        args: any[]
    ) {
        const config = vscode.workspace.getConfiguration("greyscript");
        const result = await (new Transpiler({
            target: editor.document.fileName,
            resourceHandler: new TranspilerResourceProvider().getHandler(),
            uglify: config.get("transpiler.uglify"),
            disableLiteralsOptimization: config.get("transpiler.dlo"),
            disableNamespacesOptimization: config.get("transpiler.dno")
        }).parse());

        const firstLine = editor.document.lineAt(0);
        const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
        const textRange = new Range(firstLine.range.start, lastLine.range.end);

        editor.edit(function(editBuilder: TextEditorEdit) {
            editBuilder.replace(textRange, result[editor.document.fileName]);
        });

        vscode.window.showInformationMessage('Minified...', { modal: false });
	}

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.minify", minify));
}