import vscode from 'vscode';
import CompTypes from '../grammar/CompTypes.json';
import ArgData from '../grammar/ArgData.json';
import Encryption from '../grammar/Encryption.json';
import Examples from '../grammar/Examples.json';
import HoverData from '../grammar/HoverData.json';
import { getCompTypeText } from './utils';
import {
    ArgDataCmd,
    ReturnDataType
} from './types';

export default function (type: number, cmd: string, asMarkdown: boolean = true): string | vscode.MarkdownString {
    // Create markdownString
    const str = new vscode.MarkdownString("", true);

    // Get type of cmd
    const cmdType = CompTypes[cmd] || CompTypes["default"];

    // Get type text, example: Shell.
    const typeText = type !== "General" ? type + "." : "";

    // Combine base data together
    const docs = {
        title: "(" + getCompTypeText(cmdType) + ") " + typeText + cmd,
        description: ""
    };

    const argData = ArgData[type][cmd] || [];
    const returnData = ReturnData[type][cmd] || [];

    // Add arguments if its a function/method
    if(cmdType === 2 || cmdType === 1){
        const args: string = argData
            .map(d: ArgDataCmd => {
                return d.name + (d.optional ? "?" : "") + ": " + d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")
            })
            .join(", ");
        docs.title += `(${args})`;
    }

    // Add result
    docs.title += ": " + returnData
        .map(d: ReturnDataType => {
            return d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "");
        })
        .join(" or ");

    // Add info/hover text
    docs.description = HoverData[type][cmd] || "";

    // Apply encryption text to hover text if available
    if (Encryption.includes(cmd)) docs.description += "\n\n\**This function cannot be used in encryption.*";

    // Add examples
    const codeExamples = Examples[type]?.[cmd] || [];

    // Return normal text
    if (!asMarkdown) {
        return docs.title + "\n\n\n" + docs.description.replace(/<[^>]*>?/gm, '') + "\n\n" + codeExamples.join("\n\n\n");
    }

    // Append markdown string areas
    str.appendCodeblock(docs.title);
    str.appendMarkdown("---\n"+docs.description);

    if(codeExamples.length > 0) {
        str.appendMarkdown("\n### Examples\n---");
        str.appendCodeblock(codeExamples.join("\n\n"));
    }

    // Return markdown string
    return str;
}