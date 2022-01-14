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
import CompData from './grammar/CompletionData.json';
import {
    getHoverData,
    getOptionsBasedOfPriorCommand,
    processFunctionParameter
} from './helper';

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

            const range = document.getWordRangeAtPosition(position)
            if (!range) return;
            const word = document.getText(range)

            let options: { [key: string]: string[] } = {
            	General: CompData["General"]
            };

            // If there is a . in front of the text check what the previous item accesses
            if(
            	range &&
            	range.start.character - 2 >= 0 &&
            	document.getText(
            		new Range(
            			new Position(range.start.line, range.start.character - 1),
            			new Position(range.start.line, range.start.character)
            		)
            	) == "."
            ) {
                let res = getOptionsBasedOfPriorCommand(document, range);
                if(res) options = res;
            }

            const output: {
                key: string | null,
                cmd: string | null
            } = {
            	"key": null,
            	"cmd": null
            };

            for (let key in options) {
                output.cmd = options[key].find((cmd: string) => cmd == word) || null;
                if (output.cmd) {
                    output.key = key;
                    break;  
                } 
            }

            if (output.key) {
                return new Hover(getHoverData(output.key, output.cmd));
            } else {
                // Variable hover
                const hoverText = new MarkdownString("");

                // Get Text
                let text = document.getText()
                let linesTillCurLine = document.getText().split("\n").splice(0, range.start.line);
                
                // Check if in function and maybe variable is parameter
                for(let line of linesTillCurLine.reverse()){
                    if (line.includes("end function")) break;

                    if (
                        line.match(/\w+(\s|)=(\s|)function/) &&
                        linesTillCurLine.reverse().slice(linesTillCurLine.indexOf(line)).every(l => !l.includes("end function"))
                    ) {
                        const params = line.match(/(?<=\()(.*?)(?=\))/)?.[0].split(",").map(p => p.trim()) || [];
                        for(let p of params) {
                            const optionalParam = p.match(/\w+(\s|)=(\s|)/);
                            if (optionalParam){
                                const name = optionalParam[0].replace(/(\s|)=(\s|)/, "");
                                if(name == word){
                                    hoverText.appendCodeblock("(parameter) " + processFunctionParameter(p));
                                    return new Hover(hoverText);
                                }
                            }
                            else if(p == word) {
                                hoverText.appendCodeblock("(parameter) " + processFunctionParameter(p));
                                return new Hover(hoverText);
                            }
                        }
                    }
                }

                const lines = [];
                const expr = new RegExp("\\b"+word+"(\\s|)=")
                let i = 0;
                
                // Get all lines that interact with the variable prior to the line
                for(let line of text.split("\n")){
                    if(i > range.start.line) break;
                    if(line && expr.test(line)) lines.push(line);
                    i++;
                }

                // Get the assigned value
                let assignment: any = lines[lines.length - 1];
                if(!assignment || !expr.test(assignment)) return;

                const match = assignment.match(expr)?.[0];
                assignment = assignment.substring(assignment.indexOf(match) + match.length).trim().replace(";", "");
                assignment = assignment.split(".")
                assignment = assignment[assignment.length - 1];

                // If its a string type return the string hover
                if(assignment.startsWith("\"")) {
                    hoverText.appendCodeblock("(variable) " + word + ": String")
                    return new Hover(hoverText);
                }

                // If its a list type return the list hover
                if(assignment.startsWith("[")) {
                    hoverText.appendCodeblock("(variable) " + word + ": List")
                    return new Hover(hoverText);
                }

                // If its a map type return the map hover
                if(assignment.startsWith("{")) {
                    hoverText.appendCodeblock("(variable) " + word + ": Map")
                    return new Hover(hoverText);
                }

                // If its a function type return the function hover
                if(assignment.startsWith("function")) {
                    let description = null;
                    if(linesTillCurLine[linesTillCurLine.indexOf(lines[lines.length - 1]) + 1].startsWith("//")){
                        description = linesTillCurLine[linesTillCurLine.indexOf(lines[lines.length - 1]) + 1].substring(2).trim();
                    }
                    hoverText.appendCodeblock("(function) " + word + "(" + assignment.match(/(?<=\()(.*?)(?=\))/)?.[0] + ")")
                    if(description) hoverText.appendText(description);
                    return new Hover(hoverText);
                }
            }
        }
    })

    if (vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) {
    	context.subscriptions.push(feature);
    }
}