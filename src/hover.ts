import vscode, {
    ExtensionContext,
    TextDocument,
    Position,
    CancellationToken,
    Range,
    Hover,
    MarkdownString,
    ProviderResult
} from 'vscode';
import {
    FunctionMetaData,
    NativeMetaData,
    MetaData,
    lookupType
} from './helper/lookup-type';

function transformMetaToHover(meta: MetaData): Hover {
    const hoverText = new MarkdownString('');

    hoverText.supportHtml = true;

    if (meta.type === 'native') {
        const nativeMeta = meta as NativeMetaData;
        const returnValues = nativeMeta.returns
            ?.map((item) => item.type)
            ?.join(' or ') || 'null';

        if (nativeMeta.arguments.length === 0) {
            hoverText.appendCodeblock(`(native) ${nativeMeta.name}: ${returnValues}`);
        } else {
            const argValues = nativeMeta.arguments
                .map((item) => `${item.name}${item.optional ? '?' : ''}: ${item.type}`)
                .join(', ');

            hoverText.appendCodeblock(`(native) ${nativeMeta.name} (${argValues}): ${returnValues}`);
        }

        hoverText.appendMarkdown('<hr><br>');
        hoverText.appendMarkdown(`${nativeMeta.description}`);

        if (nativeMeta.examples.length > 0) { 
            hoverText.appendMarkdown('<br><br><b>Examples:</b><br>');

            nativeMeta.examples.forEach((example: string) => {
                hoverText.appendCodeblock(example);
            });
        }

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

            const meta = lookupType(document, position);

            if (!meta) {
                return;
            }

            return transformMetaToHover(meta);
        }
    })

    if (vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) {
    	context.subscriptions.push(feature);
    }
}