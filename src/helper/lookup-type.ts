import {
    ASTBase,
    ASTChunk,
    ASTAssignmentStatement,
    ASTIdentifier,
    ASTMemberExpression,
    ASTIndexExpression,
    ASTCallExpression,
    ASTCallStatement,
    ASTLiteral,
    ASTFunctionStatement,
    ASTMapConstructorExpression,
    ASTListConstructorExpression
} from 'greybel-core';
import {
    Position,
    TextDocument
} from 'vscode';
import {
    ReturnData,
    HoverData,
    CompData,
    ArgData,
    Examples
} from '../grammar';
import {
    ArgDataCmd
} from '../types';
import { getDocumentAST } from './document-manager';
import * as ASTScraper from './ast-scraper';
import ASTStringify from './ast-stringify';

export interface MetaData {
    type: string;
    name: string | null;
    completions?: string[];
    returns?: MetaData[];
}

export interface NativeMetaData extends MetaData {
    description: string;
    arguments: ArgDataCmd[];
    examples: string[];
}

export function isNative(type: string, property: string) {
    return CompData[type]?.includes(property);
}

export function createNativeMeta(type: string, property: string): NativeMetaData {
    return {
        type: 'native',
        name: property,
        description: HoverData[type]?.[property],
        arguments: ArgData[type]?.[property],
        returns: ReturnData[type]?.[property].map((item) => {
            return {
                type: item.type,
                name: null
            };
        }),
        examples: Examples[type]?.[property] || []
    };
}

export function createLiteralMeta(type: string, name: string | null = null): MetaData {
    const meta: MetaData = {
        type,
        name
    };
    meta.returns = [meta];
    return meta;
}

export interface FunctionMetaData extends MetaData {
    arguments: MetaData[];
}

export function createFunctionMeta(name: string | null, args: MetaData[]): FunctionMetaData {
    return {
        type: 'Function',
        name,
        arguments: args
    };
}

export type LookupOuter = ASTBase[];

export interface LookupASTResult {
    closest: ASTBase;
    outer: LookupOuter;
}

export class LookupHelper {
    document: TextDocument;

    constructor(document: TextDocument) {
        this.document = document;
    }

    findAllAvailableIdentifier(outer: LookupOuter): string[] {
        const me = this;
        const root = me.lookupScope(outer);

        if (!root) {
            return [];
        }

        const identifier = ASTScraper.findEx((item: ASTBase, level: number) => {
            if (item.type === 'FunctionDeclaration') {
                return {
                    skip: true
                };
            } else if (item.type === 'AssignmentStatement') {
                return {
                    valid: true
                };
            }
        }, root);

        return identifier.map((item: ASTBase) => {
            return ASTStringify((item as ASTAssignmentStatement).variable)
        });
    }

    findAllAssignmentsOfIdentifier(identifier: string, root: ASTBase, end?: Position): ASTBase[] {
        return ASTScraper.findEx((item: ASTBase, level: number) => {
            if (end && item.end.line - 1 >= end.line) {
                return {
                    exit: true
                };
            }

            if (item.type === 'FunctionDeclaration') {
                return {
                    skip: true
                };
            } else if (item.type === 'AssignmentStatement') {
                const { variable } = item as ASTAssignmentStatement;
                const identifierName = ASTStringify(variable);

                if (identifierName === identifier) {
                    return {
                        valid: true
                    };
                }
            }
        }, root);
    }

    lookupScope(outer: LookupOuter): ASTBase | undefined {
        for (let index = outer.length - 1; index >= 0; index--) {
            const type = outer[index]?.type;

            if (type === 'FunctionDeclaration' || type === 'Chunk') {
                return outer[index];
            }
        }
    }

    lookupAST(position: Position): LookupASTResult | undefined {
        const me = this;
        const chunk = getDocumentAST(me.document) as ASTChunk;

        //gather all wrapping ASTs
        const outer = ASTScraper.findEx((item: ASTBase, level: number) => {
            const startLine = item.start.line - 1;
            const startCharacter = item.start.character - 1;
            const endLine = item.end.line - 1;
            const endCharacter = item.end.character - 1;
            
            if (startLine > position.line) {
                return {
                    exit: true
                };
            }

            if (startLine === position.line && endLine === position.line) {
                return {
                    valid: (
                        startLine <= position.line &&
                        startCharacter <= position.character &&
                        endLine >= position.line &&
                        endCharacter >= position.character
                    )
                };
            } else if (startLine === position.line) {
                return {
                    valid: (
                        startLine <= position.line &&
                        startCharacter <= position.character &&
                        endLine >= position.line
                    )
                };
            } else if (endLine === position.line) {
                return {
                    valid: (
                        startLine <= position.line &&
                        endLine >= position.line &&
                        endCharacter >= position.character
                    )
                };
            }
            
            return {
                valid: (
                    startLine <= position.line &&
                    endLine >= position.line
                )
            };
        }, chunk) as LookupOuter;
        //get closest AST
        const closest = outer.pop();

        //nothing to get info for
        if (!closest) {
            return;
        }

        return {
            closest,
            outer
        };
    }

    lookupIdentifier(root: ASTBase): string | undefined {
        const me = this;
        if (root.type === 'CallStatement') {
            return me.lookupIdentifier((root as ASTCallStatement).expression);
        } else if (root.type === 'CallExpression') {
            return me.lookupIdentifier((root as ASTCallExpression).base);
        } else if (root.type === 'Identifier') {
            return (root as ASTIdentifier).name;
        }
    }
    
    lookupIdentifierOfIndex(root: ASTBase): string | undefined {
        if (root.type === 'StringLiteral') {
            return (root as ASTLiteral).value.toString();
        }
    }

    resolveReturn(metaItem: MetaData, name: string | null = null): MetaData {
        if (metaItem.type === 'native') {
            const type = metaItem.returns?.[0]?.type || 'any';
            return {
                type,
                name,
                completions: CompData[type]
            };
        }

        return {
            ...metaItem,
            name: name || metaItem.name
        };
    }

    resolveMetaProperty(meta: MetaData, property: string): MetaData | undefined {
        if (isNative(meta.type, property)) {
            return createNativeMeta(meta.type, property) as MetaData;
        } else if (meta.completions?.includes(property)) {
            return meta.returns?.find((item: MetaData) => {
                return item.name === property;
            });
        }

        return {
            type: 'any',
            name: property
        };
    }

    resolveMemberPath(item: ASTBase, root?: ASTBase): MetaData | undefined {
        const me = this;

        if (item.type === 'MemberExpression') {
            const { base, identifier } = item as ASTMemberExpression;
            const property = me.lookupIdentifier(identifier);

            if (!property) {
                return;
            }

            if (base.type === 'MemberExpression' || base.type === 'IndexExpression') {
                const memberBaseMeta = me.resolveMemberPath(base, root);

                if (!memberBaseMeta) {
                    return;
                }
                
                return me.resolveMetaProperty(
                    me.resolveReturn(memberBaseMeta, property),
                    property
                );
            }

            const baseMeta = me.lookupMeta({ closest: base, outer: root ? [root] : [] });

            if (!baseMeta) {
                return;
            }
            
            return me.resolveMetaProperty(
                me.resolveReturn(baseMeta, property),
                property
            );
        } else if (item.type === 'IndexExpression') {
            const { base, index } = item as ASTIndexExpression;
            const property = me.lookupIdentifierOfIndex(index);

            if (!property) {
                return;
            }

            if (base.type === 'MemberExpression' || base.type === 'IndexExpression') {
                const baseMeta = me.resolveMemberPath(base);

                if (baseMeta) {
                    return me.resolveMetaProperty(baseMeta, property);
                }
            }

            const baseMeta = me.lookupMeta({ closest: base, outer: root ? [root] : [] });

            if (!baseMeta) {
                return;
            }
            
            return me.resolveMetaProperty(baseMeta, property);
        }

        return me.resolveReturn(
            me.lookupMeta({ closest: item, outer: root ? [root] : [] }) ||
            {
                type: 'any',
                name: null
            }
        );
    }

    lookupMeta({ closest, outer }: LookupASTResult): MetaData | undefined {
        const me = this;
        const previous = outer.length > 0 ? outer[outer.length - 1] : undefined;
        
        if (closest.type === 'Identifier') {
            const name = (closest as ASTIdentifier).name;
            const root = me.lookupScope(outer);

            if (previous?.type === 'AssignmentStatement') {
                const { variable, init } = previous as ASTAssignmentStatement;

                if (
                    variable.start.character <= closest.start.character &&
                    variable.end.character >= closest.end.character
                ) {
                    return me.resolveReturn(
                        me.lookupMeta({ closest: init, outer }) ||
                        { type: 'any', name },
                        name
                    );
                }
            }

            if (previous?.type === 'MemberExpression' || previous?.type === 'IndexExpression') {
                const previousMeta = me.resolveMemberPath(previous, root);

                if (previousMeta) {
                    return previousMeta;
                }
            } else {
                if (isNative('General', name)) {
                    return createNativeMeta('General', name) as MetaData;
                }
            }

            let metaResult: MetaData = {
                type: 'any',
                name
            };

            if (!root) {
                return metaResult;
            }

            if (root.type === 'FunctionDeclaration') {
                const fnBlockMeta = me.lookupMeta({ closest: root, outer: [] }) as FunctionMetaData;

                if (!fnBlockMeta) {
                    return metaResult;
                }

                for (let argMeta of fnBlockMeta.arguments) {
                    if (argMeta.name === name) {
                        metaResult = argMeta;
                        break;
                    }
                }
            }

            const assignments = ASTScraper.findEx((item: ASTBase, level: number) => {
                if (item.start.line > closest.end.line - 1) {
                    return {
                        exit: true
                    };
                }

                if (item.type === 'FunctionDeclaration') {
                    return {
                        skip: true
                    };
                } else if (item.type === 'AssignmentStatement') {
                    const { variable, init } = item as ASTAssignmentStatement;
                    const identifierName = ASTStringify(variable);
                    const initName = ASTStringify(init);

                    if (identifierName === name && initName !== name) {
                        return {
                            valid: true
                        };
                    }
                }
            }, root);

            for (let assignItem of assignments) {
                const { init } = assignItem as ASTAssignmentStatement;
                const initMeta = me.lookupMeta({ closest: init, outer: [root] });
                metaResult = me.resolveReturn(initMeta || metaResult, name);
            }

            metaResult.name = name;

            return metaResult;
        } else if (closest.type === 'MemberExpression' || closest.type === 'IndexExpression') {
            const root = me.lookupScope(outer);
            return me.resolveMemberPath(closest, root);
        } else if (closest.type === 'FunctionDeclaration') {
            const functionDeclaration = closest as ASTFunctionStatement;
            let name = null;

            if (previous?.type === 'AssignmentStatement') {
                name = ASTStringify((previous as ASTAssignmentStatement).variable);
            }

            return createFunctionMeta(name, functionDeclaration.parameters.reduce((result: MetaData[], argItem: ASTBase) => {
                if (argItem.type === 'Identifier') {
                    const identifierValue = ASTStringify(argItem);
                    result.push({
                        type: 'null',
                        name: identifierValue
                    });
                } else {
                    const assignment = argItem as ASTAssignmentStatement;

                    result.push({
                        type: me.lookupMeta({ closest: assignment.init, outer: [] })?.type || 'any',
                        name: ASTStringify(assignment.variable)
                    });
                }
                
                return result;
            }, []));
        } else if (closest.type === 'StringLiteral') {
            return createLiteralMeta('String', (closest as ASTLiteral).raw.toString());
        } else if (closest.type === 'NumericLiteral') {
            return createLiteralMeta('Number', (closest as ASTLiteral).value.toString());
        } else if (closest.type === 'BooleanLiteral') {
            return createLiteralMeta('Boolean', (closest as ASTLiteral).value.toString());
        } else if (closest.type === 'MapConstructorExpression') {
            //TODO: full implementation
            return createLiteralMeta('Map', '{}');
        } else if (closest.type === 'ListConstructorExpression') {
            //TODO: full implementation
            return createLiteralMeta('List', '[]');
        } else if (closest.type === 'CallStatement') {
            const { expression } = closest as ASTCallStatement;
            return me.lookupMeta({ closest: expression, outer })
        } else if (closest.type === 'CallExpression') {
            const { base } = closest as ASTCallExpression;
            const newOuter = outer.concat([closest]);
            return me.lookupMeta({ closest: base, outer: newOuter })
        }
    }

    lookupType(position: Position): MetaData | undefined {
        const me = this;
        const astResult = me.lookupAST(position);

        //nothing to get info for
        if (!astResult) {
            return;
        }

        return me.lookupMeta(astResult);
    }
}

export function lookupType(document: TextDocument, position: Position): MetaData | undefined {
    const helper = new LookupHelper(document);
    return helper.lookupType(position);
}