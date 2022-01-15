import vscode, {
    ExtensionContext,
    Range,
    Diagnostic,
    TextDocumentChangeEvent,
    TextDocument
} from 'vscode';
import Encryption from './grammar/Encryption.json';

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

export function activate(context: ExtensionContext) {
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