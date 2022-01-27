import vscode, {
    ExtensionContext,
    Range,
    TextEditor,
    TextEditorEdit
} from 'vscode';
import { createDocumentAST } from './helper/document-manager';

export function activate(context: ExtensionContext) {
	async function refresh(
        editor: TextEditor,
        edit: TextEditorEdit,
        args: any[]
    ) {
       createDocumentAST(editor.document);
	}

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.refresh", refresh));
}