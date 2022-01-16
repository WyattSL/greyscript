import {
    TextDocument,
    Range,
    Position
} from 'vscode';
import {
    CompData,
    ReturnData
} from '../grammar';

export default function getOptionsBasedOfPriorCommand(
    document: TextDocument,
    range: Range
): any {
    // Get Target if there was a delimiter before starting character
    const position = new Position(range.start.line, range.start.character - 2);
    const targetRange = document.getWordRangeAtPosition(position);
    const targetWord = document.getText(targetRange);

    // Find type of target
    // Check if target is command
    let prevCmd = null;
    for (let type in CompData) {
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
        const returnValues = ReturnData[prevCmd.type][prevCmd.cmd];
        const options: { [key: string]: string[] } = {};

        // Get options based of return value
        for (let returnValue of returnValues) {
            const returnTypeValue = <string>returnValue.type;

             if (CompData.hasOwnProperty(returnTypeValue)) {
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
            const returnValues: any = ReturnData[prevCmd.type][prevCmd.cmd];
            const options: { [key: string]: string[] } = {};

            // Get options based of return value
            for (let returnValue of returnValues){
                const returnTypeValue = <string>returnValue.type;

                if (CompData.hasOwnProperty(returnTypeValue)) {
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