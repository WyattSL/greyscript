import vscode, {
    ExtensionContext,
    CancellationToken,
    ProviderResult,
    DebugAdapterDescriptorFactory,
    Uri,
    WorkspaceFolder,
    DebugConfiguration
} from 'vscode';
import { GreybelDebugSession } from './session';
import path from 'path';

export function activate(context: ExtensionContext, factory?: DebugAdapterDescriptorFactory) {
	context.subscriptions.push(
		vscode.commands.registerCommand('greyscript.debug.runEditorContents', (resource: Uri) => {
			let targetResource = resource;
			if (!targetResource && vscode.window.activeTextEditor) {
				targetResource = vscode.window.activeTextEditor.document.uri;
			}
			if (targetResource) {
				vscode.debug.startDebugging(undefined, {
					type: 'greyscript',
					name: 'Run File',
					request: 'launch',
					program: targetResource.fsPath
				},
					{ noDebug: true }
				);
			}
		}),
		vscode.commands.registerCommand('greyscript.debug.debugEditorContents', (resource: Uri) => {
			let targetResource = resource;
			if (!targetResource && vscode.window.activeTextEditor) {
				targetResource = vscode.window.activeTextEditor.document.uri;
			}
			if (targetResource) {
				vscode.debug.startDebugging(undefined, {
					type: 'greyscript',
					name: 'Debug File',
					request: 'launch',
					program: targetResource.fsPath
				});
			}
		})
	);

	context.subscriptions.push(vscode.commands.registerCommand('greyscript.debug.getProgramName', async (config) => {
		const target = vscode.window.activeTextEditor?.document.uri.fsPath;

		if (target) {
			return target;
		}

		const rootPath = vscode.workspace.rootPath || 'unknown';
		const value = await vscode.window.showInputBox({
			placeHolder: "Please enter the name of a src file in the workspace folder",
			value: "test.src"
		});

		if (!value) {
			return;
		}

		return path.resolve(rootPath, value);
	}));

	// register a configuration provider for 'mock' debug type
	const provider = new MockConfigurationProvider();
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('greyscript', provider));

	// register a dynamic configuration provider for 'mock' debug type
	context.subscriptions.push(vscode.debug.registerDebugConfigurationProvider('greyscript', {
		provideDebugConfigurations(folder: WorkspaceFolder | undefined): ProviderResult<DebugConfiguration[]> {
			return [
				{
					name: "Dynamic Launch",
					request: "launch",
					type: "mock",
					program: "${file}"
				},
				{
					name: "Another Dynamic Launch",
					request: "launch",
					type: "mock",
					program: "${file}"
				},
				{
					name: "Mock Launch",
					request: "launch",
					type: "mock",
					program: "${file}"
				}
			];
		}
	}, vscode.DebugConfigurationProviderTriggerKind.Dynamic));

	if (!factory) {
		factory = new InlineDebugAdapterFactory();
	}
	context.subscriptions.push(vscode.debug.registerDebugAdapterDescriptorFactory('greyscript', factory));
	if ('dispose' in factory) {
		context.subscriptions.push(factory);
	}
}

class MockConfigurationProvider implements vscode.DebugConfigurationProvider {
	resolveDebugConfiguration(folder: WorkspaceFolder | undefined, config: DebugConfiguration, token?: CancellationToken): ProviderResult<DebugConfiguration> {
		// if launch.json is missing or empty
		if (!config.type && !config.request && !config.name) {
			const editor = vscode.window.activeTextEditor;
			if (editor && editor.document.languageId === 'greyscript') {
				config.type = 'greyscript';
				config.name = 'Launch';
				config.request = 'launch';
				config.program = '${file}';
			}
		}

		if (!config.program) {
			return vscode.window.showInformationMessage("Cannot find a program to debug").then(_ => {
				return undefined;
			});
		}

		return config;
	}
}

class InlineDebugAdapterFactory implements vscode.DebugAdapterDescriptorFactory {
	createDebugAdapterDescriptor(_session: vscode.DebugSession): ProviderResult<vscode.DebugAdapterDescriptor> {
		return new vscode.DebugAdapterInlineImplementation(new GreybelDebugSession());
	}
}