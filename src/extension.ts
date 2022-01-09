import vscode, {
    ExtensionContext,
    Position,
    Location,
    Range,
    Diagnostic,
    Event,
    TextDocumentChangeEvent,
    TextEditor,
    TextEditorEdit,
    TextDocument
} from 'vscode';
import Encryption from './grammar/Encryption.json';
import { activate as activateHover } from './hover';
import { activate as activateAutocomplete } from './autocomplete';
import { activate as activateColorpicker } from './colorpicker';
import {
    TranspilerResourceProvider,
    InterpreterResourceProvider
} from './resource';
import { Transpiler } from 'greybel-transpiler';
import {
    Interpreter,
    CustomType
} from 'greybel-interpreter';
import { init as initIntrinsics } from 'greybel-intrinsics';
import {
    Parser,
    UnexpectedStringEOL,
    InvalidCharacter,
    UnexpectedValue,
    UnexpectedValues,
    UnexpectedIdentifier,
    UnexpectedArguments,
    UnexpectedAssignmentOrCall,
    UnexpectedExpression,
    UnexpectedParameterInFunction,
    UnexpectedEOF,
    UnexpectedNonStringLiteralInImportCode,
    CallExpressionEOL
} from 'greybel-core';

export function activate(context: ExtensionContext) {
    activateHover(context);
    activateAutocomplete(context);
    activateColorpicker(context);

    context.subscriptions.push(vscode.languages.registerDeclarationProvider('greyscript', {
        provideDeclaration(document, position, token) {

            let range = document.getWordRangeAtPosition(position);
            let word = document.getText(range);
            let Text = document.getText();

            let re = RegExp("\\b"+word+"(\\s|)=");
            let match = Text.match(re);

            let index = match?.index;
            let nt = Text.slice(0, index);

            let lines = nt.split(new RegExp("\n","g")).length;
            let Pos = new Position(lines-1, word.length);

            return new Location(document.uri, Pos);
        }
    }));
    
    function lookupErrors(source: string): Diagnostic[] {
	    const result = [];
	    const expr = new RegExp(`$(Encode|Decode)(?:\\s)?=(?:\\s)?function\\(.+\\).*(${Encryption.join("|")}).*end function`, "s");
	    const match = source.match(expr);

	    if (match) {
            let s = source.indexOf(match[2]);
            let e = source.indexOf(match[2]) + match[2].length;
            let li = source.slice(0, s).split("/n").length;
            let eli = source.slice(e, source.length).split("/n").length;
            let max = source.slice(0, s);
            let max2 = source.slice(0, e);
            let sch = max.slice(max.lastIndexOf("/n"), max.indexOf(match[2])).length;
            let ech = max2.slice(max2.lastIndexOf("/n"), max2.indexOf(match[2])+match[2].length).length;
            let r = new Range(li, 1, eli, 99999)
            let ms = "Cannot use "+match[2]+" in "+ (match[1] == "Encode" ? "encryption." : "decryption.");
            let d = new Diagnostic(r, ms, vscode.DiagnosticSeverity.Error);
            result.push(d);
	    }

	    return result;
    }
	
    const diagnosticCollection = vscode.languages.createDiagnosticCollection("greyscript");

    function updateDiagnosticCollection(document: TextDocument) {
        const err = lookupErrors(document.getText());
        diagnosticCollection.set(document.uri, err);
    }

	context.subscriptions.push(
        diagnosticCollection,
        vscode.workspace.onDidOpenTextDocument(updateDiagnosticCollection),
        vscode.workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
            updateDiagnosticCollection(event.document);
        })
    );
    
	async function minify(
        editor: TextEditor,
        edit: TextEditorEdit,
        args: any[]
    ) {
        const result = await (new Transpiler({
            target: editor.document.fileName,
            resourceHandler: new TranspilerResourceProvider().getHandler(),
            uglify: true
        }).parse());
        const firstLine = editor.document.lineAt(0);
        const lastLine = editor.document.lineAt(editor.document.lineCount - 1);
        const textRange = new Range(
            firstLine.range.start.line,
            firstLine.range.start.character,
            lastLine.range.end.line,
            lastLine.range.end.character
        );

        edit.replace(textRange, result[editor.document.fileName]);
	}
	
	context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.minify", minify));

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
            console.log("all good :)");
        } catch (err) {
            console.error(err);

            if (
                err instanceof UnexpectedStringEOL ||
                err instanceof InvalidCharacter
            ) {
                selectedLine(err.line);
            } else if (
                err instanceof UnexpectedValue ||
                err instanceof UnexpectedValues ||
                err instanceof UnexpectedIdentifier ||
                err instanceof UnexpectedArguments ||
                err instanceof UnexpectedAssignmentOrCall ||
                err instanceof UnexpectedExpression ||
                err instanceof UnexpectedParameterInFunction ||
                err instanceof UnexpectedEOF ||
                err instanceof UnexpectedNonStringLiteralInImportCode ||
                err instanceof CallExpressionEOL
            ) {
                selectedLine(err.token.line);
            }
        }
    }

    context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.gotoError", gotoNextError));

    async function run(
        editor: TextEditor,
        edit: TextEditorEdit,
        args: any[]
    ) {
        const vsAPI = new Map();
        const sendMessage = (str: string) => {
            const terminal = vscode.window.activeTerminal;

            if (terminal) {
                terminal.sendText(str, true);
            }

            console.log(str);
        };

        vsAPI.set('print', (customValue: CustomType): void => {
            sendMessage(customValue.toString());
        });

        const interpreter = new Interpreter({
            target: editor.document.fileName,
            api: initIntrinsics(vsAPI)
        });

        try {
            await interpreter.digest();
        } catch (err) {
            sendMessage((err as Error).message);
        }
    }
    
    context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.run", run));
}

export function deactivate() {

}
