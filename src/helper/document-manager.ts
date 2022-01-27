import vscode from 'vscode';
import { TextDocument } from 'vscode';
import { ASTBase, Parser } from 'greybel-core';

const activeDocumentASTMap: Map<string, ASTBase> = new Map();
const lastErrorsMap: Map<string, Error[]> = new Map();

export function createDocumentAST(document: TextDocument): { chunk: ASTBase, errors: Error[] } {
    const parser = new Parser(document.getText(), { unsafe: true });
    const chunk = parser.parseChunk();

    activeDocumentASTMap.set(document.fileName, chunk);
    lastErrorsMap.set(document.fileName, parser.errors);

    return {
        chunk,
        errors: parser.errors
    };
}

export function clearDocumentAST(document: TextDocument): void {
    activeDocumentASTMap.delete(document.fileName);
    lastErrorsMap.delete(document.fileName);
}

export function getLastDocumentASTErrors(document: TextDocument): Error[] {
    return lastErrorsMap.get(document.fileName) || createDocumentAST(document).errors;
}

export function getDocumentAST(document: TextDocument): ASTBase {
    return activeDocumentASTMap.get(document.fileName) || createDocumentAST(document).chunk;
}