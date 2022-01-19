import vscode, {
    ExtensionContext,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    CompletionItem,
    Range,
    CompletionList,
    ParameterInformation,
    SignatureInformation,
    SignatureHelp,
    SignatureHelpContext,
    ProviderResult
} from 'vscode';
import {
    CompData,
    ArgData,
    ReturnData,
    CompTypes
} from './grammar';
import {
    FunctionMetaData,
    NativeMetaData,
    MetaData,
    LookupHelper,
    lookupType
} from './helper/lookup-type';
import { ASTBase, ASTCallExpression } from 'greybel-core';
import ASTStringify from './helper/ast-stringify';

export function activate(context: ExtensionContext) {
	const completionFeature = vscode.languages.registerCompletionItemProvider('greyscript', {
        provideCompletionItems(
            document: TextDocument,
            position: Position,
            token: CancellationToken,
            ctx: CompletionContext
        ) {
            if (!vscode.workspace.getConfiguration("greyscript").get("autocomplete")) {
                return;
            }

            const lastCharacter = document.getText(new Range(
                position.translate(0, -1),
                position
            ));

            if (lastCharacter === '.') {
                let itemPosition = position.translate(0, -1);
                let item = lookupType(document, itemPosition);

                while (!item && itemPosition.character > 0) {
                    itemPosition = itemPosition.translate(0, -1); 
                    item = lookupType(document, itemPosition);
                }

                if (!item) {
                    return;
                }

                if (item.type === 'native') {
                    const returns = item.returns || [];

                    return new CompletionList(
                        returns.reduce((result: CompletionItem[], returnItem: MetaData) => {
                            return result.concat(
                                CompData[returnItem.type]?.map((property: string) => {
                                    return new CompletionItem(property, CompTypes[property] || CompTypes.default);
                                }) || []
                            );
                        }, [])
                    );
                }

                if (item.type in CompData) {
                    return new CompletionList(
                        CompData[item.type].map((property: string) => {
                            return new CompletionItem(property, CompTypes[property] || CompTypes.default);
                        })
                    );
                }
            } else {
                const helper = new LookupHelper(document);
                const astResult = helper.lookupAST(position);

                if (!astResult) {
                    return;
                }

                const result = [];
                
                //get all available identifier
                result.push(
                    ...helper.findAllAvailableIdentifier(astResult.outer).map((property: string) => {
                        return new CompletionItem(property, CompTypes[property] || CompTypes.default);
                    })
                );

                const item = helper.lookupMeta(astResult);

                //get general items
                if (item && item.type === 'any') {
                    result.push(
                        ...CompData.General.map((property: string) => {
                            return new CompletionItem(property, CompTypes[property] || CompTypes.default);
                        })
                    );
                }

                return new CompletionList(result);
            }
        }
    }, '.');
    const signatureFeature = vscode.languages.registerSignatureHelpProvider("greyscript", {
        provideSignatureHelp(
            document: TextDocument,
            position: Position,
            token: CancellationToken,
            ctx: SignatureHelpContext
        ): ProviderResult<SignatureHelp> {
            const helper = new LookupHelper(document);
            const astResult = helper.lookupAST(position);

            if (!astResult) {
                return;
            }

            //filter out root call expression for signature
            let rootCallExpression: ASTCallExpression | undefined;

            if (astResult.closest.type === 'CallExpression') {
                rootCallExpression = astResult.closest as ASTCallExpression;
            } else {
                for (let index = astResult.outer.length - 1; index >= 0; index--) {
                    const current = astResult.outer[index];

                    if (current.type === 'CallExpression') {
                        rootCallExpression = current as ASTCallExpression;
                        break;
                    }
                }
            }

            if (!rootCallExpression) {
                return;
            }

            const root = helper.lookupScope(astResult.outer);
            const item = helper.lookupMeta({ closest: rootCallExpression, outer: root ? [root] : [] });

            if (!item) {
                return;
            }

            //figure out argument position
            let selectedIndex = 0;

            //TODO Bug: doesn't work on custom functions
            if (rootCallExpression.type !== astResult.closest.type) {
                for (let index = 0; index < rootCallExpression.arguments.length; index++) {
                    const argItem = rootCallExpression.arguments[index];

                    if (
                        argItem.start.character <= astResult.closest.start.character &&
                        argItem.end.character >= astResult.closest.end.character
                    ) {
                        selectedIndex = index;
                        break;
                    }
                }
            }

            //display signature
            const signatureHelp = new SignatureHelp();

            if (item.type === 'native') {
                const nativeMeta = item as NativeMetaData;

                signatureHelp.activeParameter = selectedIndex === -1 ? 0 : selectedIndex;
                signatureHelp.signatures = [];
                signatureHelp.activeSignature = 0;

                const returnValues = nativeMeta.returns
                    ?.map((item) => item.type)
                    ?.join(' or ') || 'null';
                const argValues = nativeMeta.arguments
                    .map((item) => `${item.name}${item.optional ? '?' : ''}: ${item.type}`)
                    .join(', ');

                const signatureInfo = new SignatureInformation(`(native) ${nativeMeta.name} (${argValues}): ${returnValues}`);

                for (let argItem of nativeMeta.arguments) {
                    const paramInfo = new ParameterInformation(`${argItem.name}${argItem.optional ? '?' : ''}: ${argItem.type}`);
                    signatureInfo.parameters.push(paramInfo);
                }

                signatureHelp.signatures.push(signatureInfo);
            } else if (item.type === 'Function') {
                const fnMeta = item as FunctionMetaData;

                signatureHelp.activeParameter = selectedIndex === -1 ? 0 : selectedIndex;
                signatureHelp.signatures = [];
                signatureHelp.activeSignature = 0;

                const argValues = fnMeta.arguments.map((argMeta) => {
                    return `${argMeta.name}:${argMeta.type}`;
                });

                const signatureInfo = new SignatureInformation(`(native) ${fnMeta.name} (${argValues}): any`);

                for (let argItem of fnMeta.arguments) {
                    const paramInfo = new ParameterInformation(`${argItem.name}: ${argItem.type}`);
                    signatureInfo.parameters.push(paramInfo);
                }

                signatureHelp.signatures.push(signatureInfo);
            }

            return signatureHelp;
        }
    }, ",", "(");

    if (vscode.workspace.getConfiguration("greyscript").get("autocomplete")) {
        context.subscriptions.push(completionFeature);
        context.subscriptions.push(signatureFeature);
    }
}