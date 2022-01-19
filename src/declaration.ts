import vscode, {
    ExtensionContext,
    Position,
    Location
} from 'vscode';

export function activate(context: ExtensionContext) {
    context.subscriptions.push(vscode.languages.registerDeclarationProvider('greyscript', {
        provideDeclaration(document, position, token) {
            console.log('here', position);

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
}