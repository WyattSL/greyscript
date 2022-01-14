import vscode, {
    ExtensionContext,
    Position,
    Location,
    Range,
    Diagnostic,
    TextDocumentChangeEvent,
    TextDocument
} from 'vscode';
import Encryption from './grammar/Encryption.json';
import { activate as activateHover } from './hover';
import { activate as activateAutocomplete } from './autocomplete';
import { activate as activateColorpicker } from './colorpicker';
import { activate as activateDebug } from './debug';
import { activate as activateBuild } from './build';
import { activate as activateMinify } from './minify';
import { activate as activateNextError } from './next-error';

export function activate(context: ExtensionContext) {
    activateHover(context);
    activateAutocomplete(context);
    activateColorpicker(context);
    activateDebug(context);
    activateBuild(context);
    activateMinify(context);
    activateNextError(context);

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
}

export function deactivate() {

}