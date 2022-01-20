import vscode, {
	DocumentHighlight,
    ExtensionContext,
    TextEditor,
    TextEditorEdit,
    Uri
} from 'vscode';
import { TranspilerResourceProvider } from './resource';
import { Transpiler, TranspilerParseResult } from 'greybel-transpiler';
// @ts-ignore: No type definitions
import { TextEncoderLite as TextEncoder } from 'text-encoder-lite';
import path from 'path';

function createContentHeader(): string {
	return [
		's = get_shell',
		'c = s.host_computer',
		'h = home_dir'
	].join('\n');
}

function isRootDirectory(target: string): boolean {
	return /^(\.|\/)$/.test(target);
}

function createFolderLine(folder: string): string[] {
	const parent = path.dirname(folder);
	const target = path.basename(folder);
	let output: string[] = [];

	if (isRootDirectory(target)) {
		return output;
	}

	if (isRootDirectory(parent)) {
		output = output.concat([
			'folder = c.File(h + "/' + target + '")',
			'if (folder == null) then c.create_folder(h, "/' + target + '")'
		]);
	} else {
		output = output.concat([
			'folder = c.File(h + "' + parent + '/' + target + '")',
			'if (folder == null) then c.create_folder(h + "' + parent + '", "/' + target + '")'
		]);
	}

	return output;
}

function createFileLine(file: string, isNew?: boolean): string {
	const base = path.basename(file);
	const folder = path.dirname(file);
	let output = createFolderLine(folder);

	if (isNew) {
		if (isRootDirectory(folder)) {
			output = output.concat([
				'print("Creating " + h + "/' + base + '")',
				'c.touch(h, "' + base + '")',
				'file = c.File(h + "/' + base + '")',
				'lines = []'
			]);
		} else {
			output = output.concat([
				'print("Creating " + h + "' + folder + '/' + base + '")',
				'c.touch(h + "' + folder + '", "' + base + '")',
				'file = c.File(h + "' + folder + '/' + base + '")',
				'lines = []'
			]);
		}
	} else {
		if (isRootDirectory(folder)) {
			output = output.concat([
				'file = c.File(h + "/' + base + '")',
				'if (file == null) then',
				'c.touch(h, "' + base + '")',
				'file = c.File(h + "/' + base + '")',
				'end if',
				'lines = file.get_content.split(char(10))'
			]);
		} else {
			output = output.concat([
				'file = c.File(h + "' + folder + '/' + base + '")',
				'if (file == null) then',
				'c.touch(h + "' + folder + '", "' + base + '")',
				'file = c.File(h + "' + folder + '/' + base + '")',
				'end if',
				'lines = file.get_content.split(char(10))'
			]);
		}
	}

	return output.join('\n');
}

function createCodeInsertLine(line: string): string {
	const parsed = line
		.replace(/"/g, '""')
		.replace(/^import_code\(/i, 'import" + "_" + "code(');

	return 'lines.push("' + parsed + '")';
}

function createSetContentLine(): string {
	return 'file.set_content(lines.join(char(10)))';
}

function createImportList(parseResult: TranspilerParseResult, mainTarget: string): any[] {
	const pseudoRoot = path.dirname(mainTarget) || '';
	const list = [{
		filepath: mainTarget,
		pseudoFilepath: path.basename(mainTarget),
		content: parseResult[mainTarget]
	}];
	const imports = Object.entries(parseResult).map(([target, code]) => {
		return {
			filepath: target,
			pseudoFilepath: target
				.replace(pseudoRoot, '')
				.replace(path.sep, '/'),
			content: code
		};
	});

	return list.concat(imports);
}

function createInstaller(parseResult: TranspilerParseResult, mainTarget: string, targetRoot: string, maxWords: number): void {
	const importList = createImportList(parseResult, mainTarget);
	const maxWordsWithBuffer = maxWords - 1000;
	let installerSplits = 0;
	let content = createContentHeader();
	let item = importList.shift();
	const createInstallerFile = function() {
		if (content.length === 0) {
			return;
		}

        const target = path.resolve(targetRoot, './build/installer' + installerSplits + '.src');
        const targetUri = Uri.file(target);

        vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(content));
		installerSplits++;
	};
	const openFile = function(file: string) {
		const preparedLine = '\n' + createFileLine(file, true);
		const newContent = content + preparedLine;

		if (newContent.length > maxWordsWithBuffer) {
			createInstallerFile();
			content = createContentHeader() + '\n' + createFileLine(file, true);
		} else {
			content = newContent;
		}
	};
	const addLine = function(file: string, line: string) {
		const preparedLine = '\n' + createCodeInsertLine(line);
		const newContent = content + preparedLine;

		if (newContent.length > maxWordsWithBuffer) {
			content += '\n' + createSetContentLine();
			createInstallerFile();
			content = createContentHeader() + '\n' + createFileLine(file);
			addLine(file, line);
		} else {
			content = newContent;
		}
	};

	while (item) {
		const lines = item.content.split("\n");
		let line = lines.shift();

		openFile(item.pseudoFilepath);

		while (line) {
			addLine(item.pseudoFilepath, line);
			line = lines.shift();
		}

		content += '\n' + createSetContentLine();

		item = importList.shift();
	}

	createInstallerFile();
};

export function activate(context: ExtensionContext) {
    async function build(
        editor: TextEditor,
        edit: TextEditorEdit,
        args: any[]
    ) {
		if (editor.document.isDirty) {
			const isSaved = await editor.document.save();

			if (!isSaved) {
				vscode.window.showErrorMessage('You cannot build a file which does not exist in the file system.', { modal: false });
				return;
			}
		}
		
		try {
			const config = vscode.workspace.getConfiguration("greyscript");
			const target = editor.document.fileName;
			const result = await (new Transpiler({
				target,
				resourceHandler: new TranspilerResourceProvider().getHandler(),
				uglify: config.get("transpiler.uglify"),
				disableLiteralsOptimization: config.get("transpiler.dlo"),
				disableNamespacesOptimization: !config.get("transpiler.dno")
			}).parse());


			const rootPath = vscode.workspace.rootPath || path.dirname(editor.document.fileName);
			const buildPath = path.resolve(rootPath, './build');
			const buildUri = Uri.file(buildPath);
			const targetRoot = path.dirname(target);

			try {
				await vscode.workspace.fs.delete(buildUri, { recursive: true });
			} catch (err) {
				console.warn(err);
			}

			await vscode.workspace.fs.createDirectory(buildUri);

			Object.entries(result).forEach(([file, code]) => {
				const relativePath = file.replace(new RegExp("^" + targetRoot), '.');
				const fullPath = path.resolve(buildPath, relativePath);
				const targetUri = Uri.file(fullPath);
				vscode.workspace.fs.writeFile(targetUri, new TextEncoder().encode(code));
			});

			if (config.get("installer")) {
				createInstaller(result, target, rootPath, 75000);
			}
		} catch (err: any) {
			vscode.window.showErrorMessage(err.message, { modal: false });
		}
	}

	context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.build", build));
}