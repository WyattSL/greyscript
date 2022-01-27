import vscode, {
    ExtensionContext,
    Diagnostic,
    TextDocumentChangeEvent,
    TextDocument
} from 'vscode';
import { Encryption } from './grammar';
import {
    ASTBase,
    ASTAssignmentStatement,
    ASTIdentifier,
    ASTFunctionStatement,
    ASTCallStatement,
    ASTCallExpression,
    ASTChunk
} from 'greybel-core';
import * as ASTScraper from './helper/ast-scraper';
import {
    createDocumentAST,
    getDocumentAST,
    getLastDocumentASTErrors,
    clearDocumentAST
} from './helper/document-manager';

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
    const errors = getLastDocumentASTErrors(document);
    const result: Diagnostic[] = [];

    if (errors.length === 0) {
        const chunk = getDocumentAST(document) as ASTChunk;

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
                    ASTScraper.forEach((item: ASTBase, level: number) => {
                        const name = getEncryptionCallName(item);

                        if (name) {
                            result.push(
                                new Diagnostic(
                                    document.lineAt(item.start.line - 1).range,
                                    `Cannot use ${name} in ${left.name}`,
                                    vscode.DiagnosticSeverity.Error
                                )
                            );
                        }
                    }, right);
                }
            }
        });
    } else {
        return errors.map((err: any) => {
            let line = -1;

            if (err.hasOwnProperty('line')) {
                line = err.line;
            } else if (err.hasOwnProperty('token')) {
                line = err.token.line;
            }

            return new Diagnostic(
                document.lineAt(line - 1).range,
                err.message,
                vscode.DiagnosticSeverity.Error
            );
        });
    }

    return result;
}

export function activate(context: ExtensionContext) {
    const collection = vscode.languages.createDiagnosticCollection("greyscript");

    function updateDiagnosticCollection(document: TextDocument) {
        createDocumentAST(document);
        const err = lookupErrors(document);
        collection.set(document.uri, err);
    }

    function clearDiagnosticCollection(document: TextDocument) {
        clearDocumentAST(document);
        collection.delete(document.uri);
    }

	context.subscriptions.push(
        collection,
        vscode.workspace.onDidOpenTextDocument(updateDiagnosticCollection),
        vscode.workspace.onDidChangeTextDocument((event: TextDocumentChangeEvent) => {
            updateDiagnosticCollection(event.document);
        }),
        vscode.workspace.onDidSaveTextDocument(updateDiagnosticCollection),
        vscode.workspace.onDidCloseTextDocument(clearDiagnosticCollection)
    );
}