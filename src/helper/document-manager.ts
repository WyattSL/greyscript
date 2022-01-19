import { TextDocument } from 'vscode';
import { ASTBase, Parser } from 'greybel-core';

const activeDocumentASTMap: Map<string, ASTBase> = new Map();
const lastErrorsMap: Map<string, Error[]> = new Map();

export function getLastDocumentASTErrors(document: TextDocument): Error[] {
    return lastErrorsMap.get(document.fileName) || [];
}

export function createDocumentAST(document: TextDocument): ASTBase {
    const parser = new Parser(document.getText(), { unsafe: true });
    const chunk = parser.parseChunk();

    activeDocumentASTMap.set(document.fileName, chunk);
    lastErrorsMap.set(document.fileName, parser.errors);

    return chunk;
}

export function getDocumentAST(document: TextDocument): ASTBase {
    const activeDocumentAST = activeDocumentASTMap.get(document.fileName);

    if (activeDocumentAST) {
        return activeDocumentAST;
    }

    return createDocumentAST(document);
}