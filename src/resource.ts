import vscode, { Uri } from 'vscode';
import path from 'path';
// @ts-ignore: No type definitions
import { TextDecoderLite as TextDecoder } from 'text-encoder-lite';
import {
    ResourceProvider as TranspilerResourceProviderBase,
    ResourceHandler as TranspilerResourceHandler
} from 'greybel-transpiler';
import {
    ResourceProvider as InterpreterResourceProviderBase,
    ResourceHandler as InterpreterResourceHandler
} from 'greybel-interpreter';

const fs = vscode.workspace.fs;

async function tryToGet(targetUri: string): Promise<Uint8Array | null> {
	try {
		return await fs.readFile(Uri.file(targetUri));
	} catch(err) {
		console.error(err);
	}

	return null;
}

async function tryToDecode(targetUri: string): Promise<string> {
	const out = await tryToGet(targetUri);
	return out ? new TextDecoder().decode(out) : '';
}

export class TranspilerResourceProvider extends TranspilerResourceProviderBase {
	getHandler(): TranspilerResourceHandler {
		return {
			getTargetRelativeTo: async (source: string, target: string): Promise<string> => {
				const base = path.resolve(source, '..');
				const result = path.resolve(base, target);
				return await tryToGet(result) ? result : result + '.src';
			},
			has: async (target: string): Promise<boolean> => {
				return !!(await tryToGet(target));
			},
			get: (target: string): Promise<string> => {
				return tryToDecode(target);
			},
			resolve: (target: string): Promise<string> => {
				return Promise.resolve(path.resolve(target));
			}
		};
	}
}

export class InterpreterResourceProvider extends InterpreterResourceProviderBase {
	getHandler(): InterpreterResourceHandler {
		return {
			getTargetRelativeTo: async (source: string, target: string): Promise<string> => {
				const base = path.resolve(source, '..');
				const result = path.resolve(base, target);
				return await tryToGet(result) ? result : result + '.src';
			},
			has: async (target: string): Promise<boolean> => {
				return !!(await tryToGet(target));
			},
			get: (target: string): Promise<string> => {
				return tryToDecode(target);
			},
			resolve: (target: string): Promise<string> => {
				return Promise.resolve(path.resolve(target));
			}
		};
	}
}