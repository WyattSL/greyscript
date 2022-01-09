import vscode from 'vscode';
import CompData from './grammar/CompletionData.json';
import CompTypes from './grammar/CompletionTypes.json';
import ArgData from './grammar/ArgData.json';
import Encryption from './grammar/Encryption.json';
import Examples from './grammar/Examples.json';
import HoverData from './grammar/HoverData.json';
import ReturnData from './grammar/ReturnData.json';
import { getCompTypeText } from './utils';
import {
    ArgDataCmd,
    ReturnDataType
} from './types';

export function processFunctionParameter(p: string): string {
    if (p.length == 0) return "";

    // Parse the user defined function parameters
    const optionalParam = p.match(/\b\w+(\s|)=(\s|)/);

    if (optionalParam) {
        let value = p.substring(optionalParam[0].length);
        let name = optionalParam[0].replace(/(\s|)=(\s|)/, "");

        if (value == "true" || value == "false") return name + ": Bool";
        else if(!Number.isNaN(Number(value))) return name + ": Number";
        else if(value.startsWith("\"")) return name + ": String";
        else if(value.startsWith("[")) return name + ": List";
        else if(value.startsWith("{")) return name + ": Map";
        else return name + ": any";
    }
    else return p.trim() + ": any"
}

export function getHoverData (type: string, cmd: string | null = 'unknown', asMarkdown: boolean = true): string | vscode.MarkdownString {
    // Create markdownString
    const str = new vscode.MarkdownString("", true);

    // Get type of cmd
    // @ts-ignore: Claims to be implicitly any; needs to be revisited
    const cmdType: number = CompTypes[cmd] || CompTypes["default"];

    // Get type text, example: Shell.
    const typeText = type !== "General" ? type + "." : "";

    // Combine base data together
    const docs = {
        title: "(" + getCompTypeText(cmdType) + ") " + typeText + cmd,
        description: ""
    };

    // @ts-ignore: Claims to be implicitly any; needs to be revisited
    const argData = ArgData[type][cmd] || [];
    // @ts-ignore: Claims to be implicitly any; needs to be revisited
    const returnData = ReturnData[type][cmd] || [];

    // Add arguments if its a function/method
    if (cmdType === 2 || cmdType === 1){
        const args: string = argData.map((d: ArgDataCmd) => {
            return d.name + (d.optional ? "?" : "") + ": " + d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "");
        }).join(", ");
        docs.title += `(${args})`;
    }

    // Add result
    docs.title += ": " + returnData.map((d: ReturnDataType) => {
        return d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "");
    }).join(" or ");

    // Add info/hover text
    // @ts-ignore: Claims to be implicitly any; needs to be revisited
    docs.description = HoverData[type][cmd] || "";

    // Apply encryption text to hover text if available
    if (cmd && Encryption.includes(cmd)) {
        docs.description += "\n\n\**This function cannot be used in encryption.*";
    }

    // Add examples
    // @ts-ignore: Claims to be implicitly any; needs to be revisited
    const codeExamples = Examples[type]?.[cmd] || [];

    // Return normal text
    if (!asMarkdown) {
        return docs.title + "\n\n\n" + docs.description.replace(/<[^>]*>?/gm, '') + "\n\n" + codeExamples.join("\n\n\n");
    }

    // Append markdown string areas
    str.appendCodeblock(docs.title);
    str.appendMarkdown("---\n"+docs.description);

    if (codeExamples.length > 0) {
        str.appendMarkdown("\n### Examples\n---");
        str.appendCodeblock(codeExamples.join("\n\n"));
    }

    // Return markdown string
    return str;
}

export function getOptionsBasedOfPriorCommand(
    document: vscode.TextDocument,
    range: vscode.Range
): any {
    // Get Target if there was a delimiter before starting character
    const position = new vscode.Position(range.start.line, range.start.character - 2);
    const targetRange = document.getWordRangeAtPosition(position);
    const targetWord = document.getText(targetRange);

    // Find type of target
    // Check if target is command
    let prevCmd = null;
    for (let type in CompData) {
        // @ts-ignore: Claims to be implicitly any; needs to be revisited
        if (CompData[type].includes(targetWord)) {
            prevCmd = {
                type,
                cmd: targetWord
            };
            break;
        }
    }

    // Get return data from command
    if (prevCmd) {
        // @ts-ignore: Claims to be implicitly any; needs to be revisited
        const returnValues = ReturnData[prevCmd.type][prevCmd.cmd];
        const options: { [key: string]: string[] } = {};

        // Get options based of return value
        for (let returnValue of returnValues) {
            const returnTypeValue = <string>returnValue.type;

             if (CompData.hasOwnProperty(returnTypeValue)) {
                // @ts-ignore: Claims to be implicitly any; needs to be revisited
                options[returnTypeValue] = CompData[returnTypeValue];
            }
        }

        return Object.keys(options).length > 0 ? options : undefined;
    } else {
        // Check variable assignment if its not a command
        const text = document.getText();
        const lines = [];
        const expr = new RegExp("\\b" + targetWord + "(\\s|)=");
        let i = 0;
        const eol = targetRange?.start?.line || 0;
        
        // Get all lines that interact with the variable prior to the line
        for (let line of text.split("\n")) {
            if (i > eol) {
                break;
            }

            if (expr.test(line)) {
                lines.push(line);
            }

            i++;
        }

        // Get the assigned value
        let assignment: any = lines[lines.length - 1];
        if (!assignment) return CompData;

        let matches = assignment.match(expr);
        if (!matches) return CompData;

        let match = matches[0];
        assignment = assignment.substring(assignment.indexOf(match) + match.length).trim().replace(";", "");
        
        if (assignment.includes(".")) {
            assignment = assignment.split(".");
            assignment = assignment[assignment.length - 1];
        }

        if (assignment.includes("+")) {
            assignment = assignment.split("+");
            assignment = assignment[assignment.length - 1];
        }
        
        assignment = assignment.trim();

        // If its a string type return the string options
        if (assignment.startsWith("\"")) return {"String": CompData["String"]};

        // If its a list type return the list options
        if(assignment.startsWith("[")) return {"List": CompData["List"]};

        // If its a map type return the list options
        if(assignment.startsWith("{")) return {"Map": CompData["Map"]};

        // Check if value is command
        for (let type in CompData) {
            // @ts-ignore: Claims to be implicitly any; needs to be revisited
            if (CompData[type].includes(assignment)) {
                prevCmd = {
                    type,
                    cmd: assignment
                };
                break;
            }
        }

        // Set options based off command
        if (prevCmd) {
            // @ts-ignore: Claims to be implicitly any; needs to be revisited
            const returnValues: any = ReturnData[prevCmd.type][prevCmd.cmd];
            const options: { [key: string]: string[] } = {};

            // Get options based of return value
            for (let returnValue of returnValues){
                const returnTypeValue = <string>returnValue.type;

                if (CompData.hasOwnProperty(returnTypeValue)) {
                    // @ts-ignore: Claims to be implicitly any; needs to be revisited
                    options[returnTypeValue] = CompData[returnTypeValue];
                }
            }

            return Object.keys(options).length > 0 ? options : undefined;
        } else {
            console.log("Greyscript: Target is unknown returning all CompData.")
            return CompData;
        }
    }
}