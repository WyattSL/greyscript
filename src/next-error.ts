import vscode, {
    ExtensionContext,
    Position,
    Range,
    TextEditor,
    TextEditorEdit
} from 'vscode';
import { Parser } from 'greybel-core';

export function activate(context: ExtensionContext) {
    function gotoNextError(
        editor: TextEditor,
        edit: TextEditorEdit,
        args: any[]
    ) {
        const parser = new Parser(editor.document.getText());
        const selectedLine = (line: number) => {
            const eol = editor.document.lineAt(line - 1).text.length;
            const start = new Position(line - 1, 0)
            const end = new Position(line - 1, eol)
            const range = new Range(start, end)

            vscode.window.showTextDocument(editor.document, {
                "selection": range
            });
        };

        try {
            parser.parseChunk();
            vscode.window.showInformationMessage('all good :)', { modal: false });
        } catch (err: any) {
            if (err.hasOwnProperty('line')) {
                selectedLine(err.line);
            } else if (err.hasOwnProperty('token')) {
                selectedLine(err.token.line);
            }

            vscode.window.showErrorMessage(err.message, { modal: false });
        }
    }

    context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.gotoError", gotoNextError));
}