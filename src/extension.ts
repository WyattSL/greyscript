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
import { activate as activateDiagnostic } from './diagnostic';
import { activate as activateDeclaration } from './declaration';

export function activate(context: ExtensionContext) {
    activateHover(context);
    activateAutocomplete(context);
    activateColorpicker(context);
    activateDebug(context);
    activateBuild(context);
    activateMinify(context);
    activateNextError(context);
    activateDiagnostic(context);
    activateDeclaration(context);
}

export function deactivate() {

}