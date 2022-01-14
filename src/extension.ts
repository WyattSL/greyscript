import vscode, {
    ExtensionContext,
    Position,
    Location,
    Range,
    Diagnostic,
    TextDocumentChangeEvent,
    TextEditor,
    TextEditorEdit,
    TextDocument,
    Uri
} from 'vscode';
import Encryption from './grammar/Encryption.json';
import { activate as activateHover } from './hover';
import { activate as activateAutocomplete } from './autocomplete';
import { activate as activateColorpicker } from './colorpicker';
import { activate as activateDebug } from './debug';
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
import { Parser } from 'greybel-core';
import { TextEncoder } from 'util';
import path from 'path';

export function activate(context: ExtensionContext) {
    activateHover(context);
    activateAutocomplete(context);
    activateColorpicker(context);
    activateDebug(context);

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

    async function build(
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

        if (!vscode.workspace.rootPath) {
            throw new Error('Cannot build when root path is undefined.');
        }

        const rootPath = vscode.workspace.rootPath;
        const buildPath = path.resolve(rootPath, './build');
        const buildUri = Uri.file(buildPath);

        try {
            await vscode.workspace.fs.delete(buildUri, { recursive: true });
        } catch (err) {
            console.error(err);
        }

        await vscode.workspace.fs.createDirectory(buildUri);

        Object.entries(result).forEach(([file, code]) => {
            const relativePath = file.replace(new RegExp("^" + rootPath), '.');
            const fullPath = path.resolve(buildPath, relativePath);
            const targetUri = Uri.file(fullPath);
            vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(code));
        });
	}
	
	context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.build", build));
    
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

    async function run(
        editor: TextEditor,
        edit: TextEditorEdit,
        args: any[]
    ) {
        const vsAPI = new Map();
        const outputChannel = vscode.window.createOutputChannel('greyscript-run');
        const sendMessage = (str: string) => {
            outputChannel.appendLine(str);
            console.log(str);
        };

        vsAPI.set('print', (customValue: CustomType): void => {
            sendMessage(customValue.toString());
        });

        outputChannel.show();

        const interpreter = new Interpreter({
            target: editor.document.fileName,
            api: initIntrinsics(vsAPI),
            resourceHandler: new InterpreterResourceProvider().getHandler()
        });

        try {
            await interpreter.digest();
        } catch (err) {
            sendMessage((err as Error).message);
        }

        vscode.window.showInformationMessage('Done...', { modal: false });
    }
    
    context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.run", run));
}

export function deactivate() {

}