import vscode, {
    ExtensionContext,
    Range,
    Diagnostic,
    TextDocumentChangeEvent,
    TextDocument,
    Position
} from 'vscode';
import { Encryption } from './grammar';
import {
    ASTBase,
    ASTAssignmentStatement,
    ASTIdentifier,
    ASTFunctionStatement,
    ASTCallStatement,
    ASTCallExpression,
    Parser
} from 'greybel-core';

function getEncryptionCallName(item: ASTBase): string | undefined {
    let expression;

    if (item.type === 'CallStatement') {
        expression = (item as ASTCallStatement).expression as ASTCallExpression;
    } else if (item.type === 'CallExpression') {
        expression = item as ASTCallExpression;
    }

    if (expression) {
        const identifier = expression.base as ASTIdentifier;

        if (Encryption.includes(identifier.name)) {
            return identifier.name;
        }
    }

    return;
}

function lookupErrors(document: TextDocument): Diagnostic[] {
    const source = document.getText();
    const parser = new Parser(source);
    const result = [];

    try {
        const chunk = parser.parseChunk();

        //check for encryption
        chunk.body.forEach((item) => {
            if (item.type === 'AssignmentStatement') {
                const { init, variable } = item as ASTAssignmentStatement;
                const left = variable.type === 'Identifier' ? variable as ASTIdentifier : null;
                const right = init.type === 'FunctionDeclaration' ? init as ASTFunctionStatement : null;

                if (
                    left &&
                    right &&
                    /^(Encode|Decode)$/.test(left.name)
                ) {
                    right.body.forEach((innerItem) => {
                        const name = getEncryptionCallName(innerItem);

                        console.log(name, innerItem);

                        if (name) {
                            result.push(
                                new Diagnostic(
                                    document.lineAt(innerItem.line - 1).range,
                                    `Cannot use ${name} in ${left.name}`,
                                    vscode.DiagnosticSeverity.Error
                                )
                            );
                        } else if (innerItem.type === 'AssignmentStatement') {
                            const rightName = getEncryptionCallName((innerItem as ASTAssignmentStatement).init);

                            result.push(
                                new Diagnostic(
                                    document.lineAt(innerItem.line - 1).range,
                                    `Cannot use ${rightName} in ${left.name}`,
                                    vscode.DiagnosticSeverity.Error
                                )
                            );
                        }
                    });
                }
            }
        });
    } catch (err: any) {
        vscode.window.showErrorMessage(err.message, { modal: false });

        let line;

        if (err.hasOwnProperty('line')) {
            line = err.line;
        } else if (err.hasOwnProperty('token')) {
            line = err.token.line;
        }

        result.push(
            new Diagnostic(
                document.lineAt(line - 1).range,
                err.message,
                vscode.DiagnosticSeverity.Error
            )
        );
    }

    return result;
}

export function activate(context: ExtensionContext) {
    const collection = vscode.languages.createDiagnosticCollection("greyscript");

    function updateDiagnosticCollection(document: TextDocument) {
        const err = lookupErrors(document);
        collection.set(document.uri, err);
    }

	context.subscriptions.push(
        collection,
        vscode.workspace.onDidOpenTextDocument(updateDiagnosticCollection),
        vscode.workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
            updateDiagnosticCollection(event.document);
        })
    );
}