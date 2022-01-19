import {
    ASTImportCodeExpression,
    ASTFeatureImportExpression,
    ASTLiteral
} from 'greybel-core';
import vscode, {
    ExtensionContext,
    TextDocument,
    Position,
    CancellationToken,
    Range,
    Hover,
    MarkdownString,
    ProviderResult,
    Uri
} from 'vscode';
import {
    FunctionMetaData,
    NativeMetaData,
    MetaData,
    lookupType,
    LookupHelper
} from './helper/lookup-type';
import path from 'path';

function transformMetaToHover(meta: MetaData): Hover {
    const hoverText = new MarkdownString('');

    if (meta.type === 'native') {
        const nativeMeta = meta as NativeMetaData;
        const returnValues = nativeMeta.returns
            ?.map((item) => item.type)
            ?.join(' or ') || 'null';
        let headline;

        if (nativeMeta.arguments.length === 0) {
            headline = `(native) ${nativeMeta.name}: ${returnValues}`;
        } else {
            const argValues = nativeMeta.arguments
                .map((item) => `${item.name}${item.optional ? '?' : ''}: ${item.type}`)
                .join(', ');

            headline = `(native) ${nativeMeta.name} (${argValues}): ${returnValues}`;
        }

        const output = [
            '```',
            headline,
            '```',
            '***',
            nativeMeta.description
        ];

        if (nativeMeta.examples.length > 0) {
            output.push(...[
                '#### Examples:',
                '```',
                ...nativeMeta.examples,
                '```'
            ]);
        }

        hoverText.appendMarkdown(output.join('\n'));

        return new Hover(hoverText);
    } else if (meta.type === 'Function') {
        const fnMeta = meta as FunctionMetaData;
        const argValues = fnMeta.arguments.map((argMeta) => {
            return `${argMeta.name}: ${argMeta.type}`;
        });
        
        if (meta.name) {
            hoverText.appendCodeblock(`(function) ${meta.name} (${argValues.join(', ')})`);
        } else {
            hoverText.appendCodeblock(`(function) (${argValues.join(', ')})`);
        }

        return new Hover(hoverText);
    } else if (meta.type === 'String' || meta.type === 'Number' || meta.type === 'Boolean') {
        hoverText.appendCodeblock(`(literal) ${meta.name}:${meta.type}`);
        return new Hover(hoverText);
    }

    hoverText.appendCodeblock(`(variable) ${meta.name}:${meta.type}`);
    return new Hover(hoverText);
}

export function activate(context: ExtensionContext) {
	const feature = vscode.languages.registerHoverProvider('greyscript', {
        provideHover(
        	document: TextDocument,
        	position: Position,
        	token: CancellationToken
        ): ProviderResult<Hover> {
            if (!vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) {
            	return;
            }

            const helper = new LookupHelper(document);
            const astResult = helper.lookupAST(position);

            if (!astResult) {
                return;
            }

            const meta = helper.lookupMeta(astResult);

            if (!meta) {
                if (astResult.closest.type === 'ImportCodeExpression') {
                    //shows link to importCode resource
                    const hoverText = new MarkdownString('');
                    const importAst = astResult.closest as ASTImportCodeExpression;
                    const gameDir = importAst.gameDirectory as ASTLiteral;
                    const fileDir = importAst.fileSystemDirectory as ASTLiteral;
                    let output = [];

                    if (fileDir) {
                        const rootDir = path.dirname(document.fileName);
                        const target = path.resolve(rootDir, fileDir.value.toString());
                        const uri = Uri.file(target);

                        output = [
                            `[Imports file "${path.basename(target)}" inside this code](${uri.toString()})`,
                            '***',
                            'Click the link above to open the file.',
                            '',
                            'Use the build command to create an installer',
                            'file which will bundle all dependencies.'
                        ];
                    } else {
                        output = [
                            `Imports game file "${gameDir.value}" inside this code`,
                            '***',
                            'WARNING: There is no actual file path',
                            'therefore this will be ignored while building.',
                            '',
                            'Following example shows how to enable inclusion when building.',
                            '',
                            '**Example:**',
                            '```',
                            'import_code("/ingame/path":"/relative/physical/path")',
                            '```'
                        ];
                    }

                    hoverText.appendMarkdown(output.join('\n'));

                    return new Hover(hoverText);
                } else if (
                    astResult.closest.type === 'FeatureImportExpression' ||
                    astResult.closest.type === 'FeatureIncludeExpression'
                ) {
                    //shows link to import/include resource
                    const hoverText = new MarkdownString('');
                    const importCodeAst = astResult.closest as ASTFeatureImportExpression;
                    const fileDir = importCodeAst.path;

                    const rootDir = path.dirname(document.fileName);
                    const target = path.resolve(rootDir, fileDir);
                    const uri = Uri.file(target);

                    const output = [
                        `[Inserts file "${path.basename(target)}" inside this code when building](${uri.toString()})`,
                        '***',
                        'Click the link above to open the file.'
                    ];

                    hoverText.appendMarkdown(output.join('\n'));

                    return new Hover(hoverText);
                }

                return;
            }

            return transformMetaToHover(meta);
        }
    })

    if (vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) {
    	context.subscriptions.push(feature);
    }
}