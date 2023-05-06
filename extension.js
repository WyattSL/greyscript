const vscode = require("vscode");
//import { Buffer } from 'node:buffer';
//const { ky } = require('ky-universal');

console.log(`Hello World!`);

var bugout = vscode.window.createOutputChannel("Greyscript Debugger");
//var bugout = { appendLine: function() {}}

var CompData;
var TypeData;
var ArgData;
var ReturnData;
var Examples;
var HoverData;
var Encryption;
var Nightly;

var CompTypes = {};
// Deprecate CompTypes. For now I'm just going to give them all the same value (default).
// In the future, it should determine it's value automagically depending on other variables.

function ReloadGrammarFromFile() {

    CompData = require("./computedgrammar/CompletionData.json")
    TypeData = require("./computedgrammar/TypeData.json")
    ArgData = require("./computedgrammar/ArgData.json")
    ReturnData = require("./computedgrammar/ReturnData.json")
    Examples = require("./computedgrammar/Examples.json")
    //CompTypes = require("./grammar/CompletionTypes.json") // Constant 20 Function 2 Property 9 Method 1 Variable 5 Interface 7
    
    CompTypes = {};
    HoverData = require("./computedgrammar/HoverData.json");
    Encryption = require("./computedgrammar/Encryption.json");
    Nightly = require("./computedgrammar/Nightly.json")

};

ReloadGrammarFromFile();


// Try to pull the above grammar from Greydocs.
// This means I don't have to update for each grammar change!

async function UpdateGreyDocs() {

    bugout.appendLine("Updating from GD")

    let PullFromGreyDocs = async (path) => {
        bugout.appendLine(`Pull ${path}`)
        try {
            let res = await (await fetch(`https://raw.githubusercontent.com/WyattSL/greydocs/main/${path}`)).json();
            return res;
        } catch(err) {
            bugout.appendLine(`PullFromGreyDocs ${path}: ${err}`);
            return null;
        }
    }

    let GD_CompData = PullFromGreyDocs(`_data/functions.json`);
    if (GD_CompData) CompData = GD_CompData;
    let GD_TypeData = PullFromGreyDocs(`_data/types.json`);
    if (GD_TypeData) TypeData = GD_TypeData;
    let GD_ArgData = PullFromGreyDocs(`_data/arguments.json`);
    if (GD_ArgData) ArgData = GD_ArgData;
    let GD_ReturnData = PullFromGreyDocs(`_data/returns.json`);
    if (GD_ReturnData) ReturnData = GD_ReturnData;
    let GD_Examples = PullFromGreyDocs(`_data/examples.json`);
    if (GD_Examples) Examples = GD_Examples;
    let GD_HoverData = PullFromGreyDocs(`_data/descriptions.json`);
    if (GD_HoverData) HoverData = GD_HoverData;
    let GD_Encryption = PullFromGreyDocs(`_data/encryption.json`);
    if (GD_Encryption) Encryption = GD_Encryption;
    let GD_Nightly = PullFromGreyDocs(`_data/nightly.json`);
    if (GD_Nightly) Nightly = GD_Nightly;
};

var enumCompTypeText = {
    1: "method",
    2: "function",
    5: "variable",
    7: "interface",
    9: "property",
    20: "constant",
}

async function GetDocumentText(document, range) {
    //bugout.appendLine(`await GetDocumentText!`);
	let t = document.getText(range);
	return await HandleImports(t, document)
}

var FileCache = {};

async function HandleImports(t, document) {
    t = `${t}`;
    let reg = /import_code\("(.+)"\)/g
    //bugout.appendLine(`await HandleImports`,t,reg)
    //bugout.appendLine(typeof(t))
	let ms = t.matchAll(reg);
    //let ms = [];
    //bugout.appendLine(`IMPORT IN`);
    //bugout.appendLine(t);
    //bugout.appendLine(`MATCHES`)
    //bugout.appendLine(ms);
	for (let m of ms) {
        //bugout.appendLine(`MATCH ${m}`)
		let path = m[1].split("/").pop();
		let curPath = document.uri;
		let pathUrl = vscode.Uri.joinPath(curPath, `../${path}`);
        let ftext;
        if (FileCache[pathUrl] && FileCache[pathUrl].time >= Date.now() - 2500) {
            ftext = FileCache[pathUrl].text;
        } else {
            let fdata = await vscode.workspace.fs.readFile(pathUrl);
            //let fbuf = Buffer.from(fdata);
            //ftext = fbuf.toString();
            ftext = new TextDecoder().decode(fdata);
            FileCache[pathUrl] = {time: Date.now(), text: ftext};
        }
		t=t.replace(m[0], ftext);
	}
    //bugout.appendLine(`FINAL OUT`);
    //bugout.appendLine(t);
    return t;
}

function activate(context) {

    let ARG = vscode.workspace.getConfiguration('greyscript').get('remoteGrammar');
    if (ARG) UpdateGreyDocs();

    let hoverD = vscode.languages.registerHoverProvider('greyscript', {
        async provideHover(document,position,token) {
            if (!vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) return;

            let range = document.getWordRangeAtPosition(position)
            if(!range) return;
            let word = document.getText(range)

            let options = {"General": CompData["General"]};

            // If there is a . in front of the text check what the previous item accesses
            if(range && range.start.character - 2 >= 0 && document.getText(new vscode.Range(new vscode.Position(range.start.line, range.start.character - 1), new vscode.Position(range.start.line, range.start.character))) == "."){
                bugout.appendLine(`Hovering on a property, range ${range}`);
                let res = getOptionsBasedOfPriorCommand(document, range);
                if(res) options = res;
            }

            let output = {"key": null, "cmd": null}
            for(key in options){
                output.cmd = options[key].find(cmd => cmd == word);
                if(output.cmd){
                    output.key = key;
                    break;  
                } 
            }

            if(output.key) {
                return new vscode.Hover(getHoverData(output.key, output.cmd));
            }
            else{
                // Variable hover
                hoverText = new vscode.MarkdownString("", true);

                // Get Text
                //let text = document.getText()
                let text = await GetDocumentText(document);
                let linesTillCurLine = text.split("\n").splice(0, range.start.line)
                
                // Check if in function and maybe variable is parameter
                for(line of linesTillCurLine.reverse()){
                    if(line.includes("end function")) break;

                    if(line.match(/\w+(\s|)=(\s|)function/) && linesTillCurLine.reverse().slice(linesTillCurLine.indexOf(line)).every(l => !l.includes("end function"))){
                        params = line.match(/(?<=\()(.*?)(?=\))/)[0].split(",").map(p => p.trim());
                        for(p of params){
                            optionalParam = p.match(/\w+(\s|)=(\s|)/);
                            if(optionalParam){
                                let name = optionalParam[0].replace(/(\s|)=(\s|)/, "");
                                if(name == word){
                                    hoverText.appendCodeblock("(parameter) " + processFunctionParameter(p));
                                    return new vscode.Hover(hoverText);
                                }
                            }
                            else if(p == word) {
                                hoverText.appendCodeblock("(parameter) " + processFunctionParameter(p));
                                return new vscode.Hover(hoverText);
                            }
                        }
                    }
                }

                lines = [];
                let re = new RegExp("\\b"+word+"(\\s|)=")
                i = 0;
                
                // Get all lines that interact with the variable prior to the line
                for(line of text.split("\n")){
                    if(i > range.start.line) break;
                    if(line && line.match(re)) lines.push(line);
                    i++;
                }

                // Get the assigned value
                let assignment = lines[lines.length - 1];
                if(!assignment || !assignment.match(re)) return;

                let match = assignment.match(re)[0];
                assignment = assignment.substring(assignment.indexOf(match) + match.length).trim().replace(";", "");
                assignment = assignment.split(".")
                assignment = assignment[assignment.length - 1];

                // If its a string type return the string hover
                if(assignment.startsWith("\"")) {
                    hoverText.appendCodeblock("(variable) " + word + ": String")
                    return new vscode.Hover(hoverText);
                }

                // If its a list type return the list hover
                if(assignment.startsWith("[")) {
                    hoverText.appendCodeblock("(variable) " + word + ": List")
                    return new vscode.Hover(hoverText);
                }

                // If its a map type return the map hover
                if(assignment.startsWith("{")) {
                    hoverText.appendCodeblock("(variable) " + word + ": Map")
                    return new vscode.Hover(hoverText);
                }

                // If its a function type return the function hover
                if(assignment.startsWith("function")) {
                    let description = null;
                    //if(linesTillCurLine[linesTillCurLine.indexOf(lines[lines.length - 1]) + 1].startsWith("//")){
                    //    description = linesTillCurLine[linesTillCurLine.indexOf(lines[lines.length - 1]) + 1].substring(2).trim();
                    let preline = linesTillCurLine[linesTillCurLine.indexOf(lines[lines.length - 1]) + 1]
                    let thisline = document.getText(new vscode.Range(new vscode.Position(position.line, 0), new vscode.Position(position.line+1,0))).replace(`\n`,``)
                    let postline = document.getText(new vscode.Range(new vscode.Position(position.line+1, 0), new vscode.Position(position.line+2,0))).replace(`\n`, ``)
                    bugout.appendLine(preline+`\n`+thisline+`\n`+postline)
                    bugout.appendLine(new vscode.Position(position.line, 0) + `\n` + new vscode.Position(position.line+1,0) + `\n` + new vscode.Range(new vscode.Position(position.line, 0), new vscode.Position(position.line+1,0)))
                    if (preline.includes("//")) description = preline.replace(`//`,``);
                    if (thisline.includes("//")) description = thisline.split(`//`)[1];
                    if (postline.includes("//")) description = postline.replace(`//`,``);
                    if (!description) description = ``;
                    if (word.includes("gk")) description += `\ngk258 is my hero!`;
                    hoverText.appendCodeblock("(function) " + word + "(" +assignment.match(/(?<=\()(.*?)(?=\))/)[0] + ")")
                    if(description && description != ``) hoverText.appendText(description);
                    return new vscode.Hover(hoverText);
                }
            }
        }
    })

    if (vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) context.subscriptions.push(hoverD)

    context.subscriptions.push(vscode.languages.registerDeclarationProvider('greyscript', {
        provideDeclaration(document, position, token) {

            locations = [];
            let range = document.getWordRangeAtPosition(position);

            let word = document.getText(range);
            let re = RegExp("\\b.*" + word + "?\\s*=", 'g');

            vscode.workspace.textDocuments.forEach(async document => {
                let filename = document.fileName;
                if (filename.endsWith(".git")) {
                    return;
                }

                let text = document.getText()
                //let text = await GetDocumentText(document);
                let matches = text.matchAll(re);
                let match = matches.next();
                while (!match.done) {
                    let index = match.value.index;
                    let nt = text.slice(0, index);

                    let lines = nt.split(new RegExp("\n", "g")).length;
                    let Pos = new vscode.Position(lines - 1, word.length);
                    locations.push(new vscode.Location(document.uri, Pos));
                    match = matches.next();
                }
            });

            return locations
        }
    }));

    /*

    let foldD = vscode.languages.registerFoldingRangeProvider('greyscript', {
        provideFoldingRanges(document, foldContext, token) {
            bugout.appendLine(`Request To Provide Folding Ranges`);
            let Text = document.getText();
            let kind = vscode.FoldingRangeKind.Region;
            var List = [];
            let Exp = new RegExp(`( = |=) function`, `g`);
            let Matches = Text.matchAll(Exp);
            bugout.appendLine(`Folding Matches`);
            bugout.appendLine(Matches);
            var i;
            for (i of Matches) {
                let index = i.index;
                bugout.appendLine(`I: ${index}`);
                let stext = Text.slice(0,index);
                let text = Text.slice(index,Text.length);
                bugout.appendLine(`T: ${text}`);
                let Exp = new RegExp("end function");
                let M = text.match(Exp)
                bugout.appendLine(`M: ${M}`)
                if (!M) continue;
                M = M.index+index;
                bugout.appendLine(`M: ${M}`);
                let start = stext.split("\n").length-1;
                let etext = Text.slice(0, M);
                let end = etext.split("\n").length-1;
                let F = new vscode.FoldingRange(start, end, kind);
                List.push(F);
            };
            bugout.appendLine(`Folding Ranges`)
            bugout.appendLine(List);
            return List;
        }
    })

    context.subscriptions.push(foldD);
    */

    let getHoverData = (type, cmd, asMarkdown = true) => {
        // Create markdownString
        let str = new vscode.MarkdownString("", true);
        
        // Get type of cmd
        let cmdType = CompTypes[cmd] || CompTypes["default"];

        // Get type text, example: Shell.
        typeText = "";
        if (type != "General") typeText = type + ".";

        // Combine base data together
        let docs = {"title": "(" + enumCompTypeText[cmdType] + ") " + typeText + cmd, "description": ""};
        
        // Add arguments if its a function/method
        if(cmdType == 2 || cmdType == 1){
            docs.title += "(" + (ArgData[type][cmd] || []).map(d => d.name + (d.optional ? "?" : "") + ": " + d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")).join(", ") + ")";
        }

        // Add result
        docs.title += ": " + (ReturnData[type][cmd] || []).map(d => d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")).join(" or ");

        // Add info/hover text
        docs.description = HoverData[type][cmd] || "";

        // Apply encryption text to hover text if available
        if (Encryption.includes(`${type}.${cmd}`)) docs.description += "\n\n\**This function cannot be used in encryption.*";

        // Apply nightly text to hover text if available
        if (Nightly.includes(`${type}.${cmd}`)) docs.description += "\n\n\**This function is either introduced or changed in the nightly build of the game. These functions are subject to change or removal at any time.";

        // Add examples
        let codeExamples = Examples[type] ? Examples[type][cmd] || [] : [];
        
        // Return normal text
        if(!asMarkdown) return docs.title + "\n\n\n" + docs.description.replace(/<[^>]*>?/gm, '') + "\n\n" + codeExamples.join("\n\n\n");

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

    let getOptionsBasedOfPriorCommand = (document, range) => {
        //bugout.appendLine("Checking item before .");

        // Get Target if there was a delimiter before starting character
        //bugout.appendLine(`gOBOPC: ${range}, ${range.start.line}:${range.start.character}`)
        let targetRange = document.getWordRangeAtPosition(new vscode.Position(range.start.line, range.start.character - 2));
        if (!targetRange) targetRange = document.getWordRangeAtPosition(new vscode.Position(range.start.line, range.start.character - 3));
        if (!targetRange) targetRange = document.getWordRangeAtPosition(new vscode.Position(range.start.line, range.start.character - 4));
        //bugout.appendLine(`gOBOPC tR ${targetRange}`);
        if (!targetRange) return []; // No target, return empty array
        let targetWord = document.getText(targetRange);

        //bugout.appendLine(targetWord)

        // Find type of target
        // Check if target is command
        let prevCmd = null;
        for (type in CompData) {
            for(cmd of CompData[type]) {
                if(cmd == targetWord){
                    prevCmd = {"type": type, "cmd": cmd};
                    break;
                }
            }
            if(prevCmd) break;
        }

        //bugout.appendLine(prevCmd);

        // Get return data from command
        if(prevCmd){
            //bugout.appendLine("prevcmd!")
            let returnValues = ReturnData[prevCmd.type][prevCmd.cmd];
            let options = {};

            // Get options based of return value
            for(returnValue of returnValues){
                if(!CompData[returnValue.type]) continue;
                options[returnValue.type] = CompData[returnValue.type];
            }
            //bugout.appendLine("done prevcmd!")
            return Object.keys(options).length > 0 ? options : undefined;
        }
        else {
            //bugout.appendLine("no prevcmd!")
            // Check variable assignment if its not a command
            let text = document.getText()
            lines = [];
            let re = new RegExp("\\b"+targetWord+"(\\s|)=")
            i = 0;
            
            // Get all lines that interact with the variable prior to the line
            for(line of text.split("\n")){
                if(i > targetRange.start.line) break;
                if(line.match(re)) lines.push(line);
                i++;
            }

            // Get the assigned value
            let assignment = lines[lines.length - 1];
            if(!assignment) return CompData;

            let matches = assignment.match(re);
            if(!matches) return CompData;

            let match = matches[0];
            assignment = assignment.substring(assignment.indexOf(match) + match.length).trim().replace(";", "");
            
            if(assignment.includes(".")) {
                assignment = assignment.split(".");
                assignment = assignment[assignment.length - 1];
            }

            if(assignment.includes("+")) {
                assignment = assignment.split("+");
                assignment = assignment[assignment.length - 1];
            }
            
            assignment = assignment.trim();

            // If its a string type return the string options
            if(assignment.startsWith("\"")) return {"String": CompData["String"]};

            // If its a list type return the list options
            if(assignment.startsWith("[")) return {"List": CompData["List"]};

            // If its a map type return the list options
            if(assignment.startsWith("{")) return {"Map": CompData["Map"]};

            // Check if value is command
            for (type in CompData) {
                for(cmd of CompData[type]) {
                    if(cmd == assignment){
                        prevCmd = {"type": type, "cmd": cmd};
                        break;
                    }
                }
                if(prevCmd) break;
            }

            // Set options based off command
            if(prevCmd){
                let returnValues = ReturnData[prevCmd.type][prevCmd.cmd];
                options = {};

                // Get options based of return value
                for(returnValue of returnValues){
                    if(!CompData[returnValue.type]) continue;
                    options[returnValue.type] = CompData[returnValue.type];
                }

                return Object.keys(options).length > 0 ? options : undefined;
            }
            else{
                bugout.appendLine("Greyscript: Target is unknown returning all CompData.")
                return CompData;
            }
        }
    }

    let compD = vscode.languages.registerCompletionItemProvider('greyscript', {
        async provideCompletionItems(document,position,token,ccontext) {
            bugout.appendLine(`Get Completion Options`)
            if (!vscode.workspace.getConfiguration("greyscript").get("autocomplete")) return;
            let out = [];

            // Set default options (THIS IS ALSO THE FALLBACK)
            let options = {"General": CompData["General"]};

            // Get typed word
            let range = document.getWordRangeAtPosition(position);
            if(!range) {
                for (key in options) {
                    for(c of options[key]){
                        //bugout.appendLine("Processing result: " + c);
    
                        // Get type of completion item
                        let type = CompTypes[c] || CompTypes["default"];
                        
                        // Create completion item
                        let t = new vscode.CompletionItem(c,type)
    
                        // Add hover data to completion item
                        t.documentation = getHoverData(key, c);
                        t.commitCharacters = [".", ";"]
    
                        // Push completion item to result array
                        out.push(t);
                    }
                }
                return new vscode.CompletionList(out,true);
            }
            
            let word = document.getText(range);
            if(!word) return;
            //bugout.appendLine(word);
            
            let variableOptions = [];

            // If there is a . in front of the text check what the previous item accesses
            if(range && range.start.character - 2 >= 0 && document.getText(new vscode.Range(new vscode.Position(range.start.line, range.start.character - 1), new vscode.Position(range.start.line, range.start.character))) == "."){
                let res = getOptionsBasedOfPriorCommand(document, range);
                if(res) options = res;
            }
            else {
                // Get All user defined variables
                //let linesTillLine = document.getText(new vscode.Range(new vscode.Position(0, 0), range.start))
                let linesTillLine = await GetDocumentText(document, new vscode.Range(new vscode.Position(0, 0), range.start));
                matches = linesTillLine.matchAll(/\b(\w+(\s|)=|end function)/g);
                let inFunction = false;
                let functionVars = [];
                if(matches){
                    for(match of Array.from(matches).reverse()){
                        //bugout.appendLine(`MATCHED, ${match}, ${match[0]}`)
                        let fullMatch = match[0];
                        variableName = fullMatch.replace(/(\s|)=/, "");
                        if(variableOptions.every(m => m.name !== variableName)) {
                            if(fullMatch == "end function"){
                                inFunction = true;
                                functionVars = [];
                                continue;
                            }
                            let assignment = linesTillLine.substring(match.index, linesTillLine.indexOf("\n", match.index));
                            assignment = assignment.substring(assignment.indexOf("=") + 1).trim();

                            //bugout.appendLine(`ASSIGNMENT: ${assignment}`)

                            if(assignment.startsWith("function")){
                                //bugout.appendLine(`Found function ${variableName}`)
                                inFunction = false;
                                try {
                                    params = assignment.match(/(?<=\()(.*?)(?=\))/)[0].split(",").map(p => p.trim());
                                    for(p of params){
                                        //bugout.appendLine(`PARSE PARAM ${p}`)
                                        optionalParam = p.match(/\w+(\s|)=(\s|)/);
                                        if(optionalParam){
                                            let name = optionalParam[0].replace(/(\s|)=(\s|)/, "");
                                            functionVars.push({"name": name, "type": 5});
                                        }
                                        else functionVars.push({"name": p, "type": 5});
                                    }
                                    } catch(err) {
                                    bugout.appendLine(`Failed to parse function params: ${err}`)
                                }
                            }

                            let variable = {"name": variableName, "type": (assignment.startsWith("function") ? 2 : 5)}
                            if(inFunction) functionVars.push(variable);
                            else variableOptions.push(variable);
                            //bugout.appendLine(`POST MATCH ${match[0]}`)
                        }
                    }
                    variableOptions = variableOptions.concat(functionVars);
                }
            }

            //bugout.appendLine(`VOPT`)
            //bugout.appendLine(variableOptions);
           
            let output = {};

            // Get autocompletion of type and filter
            for(key in options){
               let keyOutput = options[key].filter(cmd => cmd.includes(word));
               if(keyOutput.length > 0) output[key] = keyOutput;
            }

            let variablesOutput = [];
            // Get autocompletion of variableNames
            for(variable of variableOptions){
                if(variable.name.includes(word)) variablesOutput.push(variable);
            }

            //bugout.appendLine(output);

            // Instantiate result array

            // Instantiate sort text index
            //var a = 0;

            // Go through filtered results
            for (key in output) {
                for(c of output[key]){
                    //bugout.appendLine("Processing result: " + c);

                    // Get type of completion item
                    let type = CompTypes[c] || CompTypes["default"];
                    
                    // Create completion item
                    let t = new vscode.CompletionItem(c,type)

                    // Add hover data to completion item
                    t.documentation = getHoverData(key, c);
                    t.commitCharacters = [".", ";"]

                    // Push completion item to result array
                    out.push(t);

                    // Increment sort text index
                    //a++
                }
            }

            // Go through filtered variables
            for(variable of variablesOutput){
                out.push(new vscode.CompletionItem(variable.name, variable.type));
            }

            //bugout.appendLine("AutoCompletion result:");
            //bugout.appendLine(out);

            // Return completion items
            return new vscode.CompletionList(out,true);
        }
    });

    function processFunctionParameter(p) {
        if(p.length == 0) return "";

        // Parse the user defined function parameters
        optionalParam = p.match(/\b\w+(\s|)=(\s|)/);
        if(optionalParam){
            let value = p.substring(optionalParam[0].length);
            let name = optionalParam[0].replace(/(\s|)=(\s|)/, "");

            if(value == "true" || value == "false") return name + ": Bool";
            else if(!isNaN(value)) return name + ": Number";
            else if(value.startsWith("\"")) return name + ": String";
            else if(value.startsWith("[")) return name + ": List";
            else if(value.startsWith("{")) return name + ": Map";
            else return name + ": any";
        }
        else return p.trim() + ": any"
    }

    if (vscode.workspace.getConfiguration("greyscript").get("autocomplete")) {
        context.subscriptions.push(compD)
        context.subscriptions.push(vscode.languages.registerSignatureHelpProvider("greyscript", {
            async provideSignatureHelp(document, position, token, ctx) {
                // Check if current line is not a function creation
                let re = RegExp("(\\s|)=(\\s|)function");
                let curLine = document.lineAt(position.line);
                let textTillCharacter = curLine.text.slice(0, position.character);
                if((ctx.triggerCharacter == "(" && curLine.text.match(re)) || textTillCharacter.lastIndexOf("(") < 1) return;
                if(textTillCharacter.split("(").length === textTillCharacter.split(")").length) return;

                // Get the function being called 
                let range = document.getWordRangeAtPosition(new vscode.Position(position.line, curLine.text.lastIndexOf("(") - 1));
                let word = await GetDocumentText(document, range);

                // Create default signature help
                let t = new vscode.SignatureHelp();
                if(curLine.text.match(/(?<=\()(.*?)(?=\))/)) t.activeParameter = curLine.text.match(/(?<=\()(.*?)(?=\))/)[0].split(",").length - 1;
                t.signatures = [];
                t.activeSignature = 0;

                // Get all the possible signatures from comp data
                for(key in CompData){
                    if(CompData[key].includes(word)) {
                        let cmdType = CompTypes[word] || CompTypes["default"];
                        if(cmdType != 2 && cmdType != 1) continue;

                        args = (ArgData[key][word] || []).map(d => d.name + (d.optional ? "?" : "") + ": " + d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")).join(", ")
                        results = ": " + (ReturnData[key][word] || []).map(d => d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")).join(" or ")

                        let info = new vscode.SignatureInformation(key + "." + word + "(" + args + ")" + results);
                        info.parameters = [];

                        for(param of args.split(",")){
                            let p = new vscode.ParameterInformation(param.trim(), "");
                            if(param.trim().length > 0) info.parameters.push(p);
                        }

                        t.signatures.push(info);
                    }
                }
               
                // Get all lines till this line
                let text = await GetDocumentText(document)
                let linesTillLine = text.split("\n").splice(0, range.start.line)
                re = RegExp("\\b" + word + "(\\s|)=(\\s|)function");
                
                // Get last defined user function using this word
                let func = null;
                let desc = null;
                for(line of linesTillLine.reverse()){
                    matches = line.match(re);
                    if(matches){
                        func = line;
                        if(linesTillLine[linesTillLine.indexOf(line) + 1].startsWith("//")) desc = linesTillLine[linesTillLine.indexOf(line) + 1].substring(2).trim();
                        break;
                    }
                }

                // If no user defined function is found return the current signatures
                if(!func) return t;
                
                // Parse the signature information
                let params = func.match(/(?<=\()(.*?)(?=\))/)[0];
                let info = new vscode.SignatureInformation(word + "(" + params.split(",").map(p => processFunctionParameter(p)).join(", ") + "): any");
                info.parameters = []; 
                if(desc) info.documentation = desc;

                // Go through all parameters and register them
                for(param of params.split(",")){
                    let p = param.trim();
                    let processed = processFunctionParameter(p)
                    let pInfo = new vscode.ParameterInformation(processed);
                    if(p.length > 0) info.parameters.push(pInfo);
                }
                
                // Push the user defined function as a signature
                t.signatures.push(info);

                // Return all found signatures
                return t;
            }
        }, [",", "("]))
    }

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    function rgbToHex(r,g,b) {
        r = (r*255).toString(16);
        g = (g*255).toString(16);
        b = (b*255).toString(16);
      
        if (r.length == 1)
          r = "0" + r;
        if (g.length == 1)
          g = "0" + g;
        if (b.length == 1)
          b = "0" + b;
      
        return "#" + r + g + b;
      }
    
    // Returns an array of vscode Ranges for any matching text in the document.
    function RegExpToRanges(document, exp, group=0, postfunc=null) {
        bugout.appendLine(`RETR 1 ${exp} (${group}) [${postfunc}]`)
        let out = [];
        let text = document.getText();
        bugout.appendLine(`RETR 1.5 DocLen ${text.length}`)
        exp.global = true;
        let iter = text.matchAll(exp);
        bugout.appendLine("RETR 2")
        for (let m of iter) {
            bugout.appendLine(`RETR 3: ${m}`)
            let textbf = text.slice(0,m.index);
            let textaf = text.slice(0,m.index+m[0].length);
            let textbfs = textbf.split("\n");
            let textafs = textaf.split("\n");

            let startline = textbfs.length;
            let endline = textafs.length;

            let startchar = m.index - textbf.length
            let endchar = startchar + m[0].length;

            if (group > 0) {
                let txt = textafs[textafs.length-1].slice(startchar,endchar);
                let nind = txt.indexOf(m[group]);
                startchar += nind;
                endchar = startchar + m[group].length;
            }

            if (!postfunc) out.push(new vscode.Range(startline, startchar, endline, endchar))
            if (postfunc) {
                let res = postfunc(textafs, startline, startchar, endline, endchar)
                for (let i of res) { out.push(i) };
            }
            // unlimited power!!!
        }
        bugout.appendLine(`RETR 4 ${out.length}`)
        return out;
    }
    
    let SemanticsLegend = new vscode.SemanticTokensLegend(
        ['class','parameter','variable','property','function','method','string','keyword','number','comment'],
        []
    )
    let SemanticProvider = vscode.languages.registerDocumentSemanticTokensProvider({
        language: 'greyscript',
        scheme: 'file'
    }, {

        provideDocumentSemanticTokens(document) {
            try {
            // analyze & return highlighting and stuff.
            bugout.appendLine(`Proviidng semantics`);

            var tokensBuilder = new vscode.SemanticTokensBuilder(SemanticsLegend);
            let outcount = 0;

            let tbPush = (a, b) => { tokensBuilder.push(a, b); outcount++; };

            let keywords = RegExpToRanges(document, /\b(if|while|for|function|then|returnend if|end for|end while|end function|else|and|or|in|not|continue|break|new|null)\b/g);
            bugout.appendLine(`${keywords.length} keywords`);
            for (let v of keywords) { tbPush(v, "keyword") };

            let classes = RegExpToRanges(document, /\b(Shell|FtpShell|Computer|File|Router|NetSession|Metaxploit|MetaMail|Metalib|Port|Crypto|int|float|number|string|String|Int|Float|Number|bool|map|Map|list|List)\b/g);
            bugout.appendLine(`${classes.length} classes`);
            for (let v of classes) { tbPush(v, "class") };
            
            let strings = RegExpToRanges(document, /".*"/g);
            bugout.appendLine(`${strings.length} strings`);
            for (let v of strings) { tbPush(v, "string") };

            let numbers = RegExpToRanges(document, /\d(\.\d)?/g);
            bugout.appendLine(`${numbers.length} numbers`);
            for (let v of numbers) { tbPush(v, "number") };

            let comments = RegExpToRanges(document, /\/\/.*/g);
            bugout.appendLine(`${comments.length} comments`);
            for (let v of comments) { tbPush(v, "comment") };

            /* // redundant because of variable & function search below
            let funcs = RegExpToRanges(document, /(\w+)(\s|)=(\s|)function/, 1);
            for (let v of funcs) { tbPush(v, "function") };
            */

            let params = RegExpToRanges(document, /\w+(?:\s|)=(?:\s|)function\((.*)\)/g, 1, (textafs, startline, startchar, endline, endchar) => {
                let out = [];
                let txt = textafs[textafs.length-1].slice(startchar,endchar);
                let opts = txt.split(",");
                for (let o of opts) {
                    let s = o.split("=")[0];
                    let exe = new RegExp(`(?<=^|,\s?)${s}(?=$|,|=)`).exec(txt);
                    out.push(new vscode.Range(startline, startchar+exe.index, endline, startchar+exe.index+s.length))
                }
                return out;
            });
            bugout.appendLine(`${params.length} params`);
            for (let v of params) { tbPush(v, "parameter") };

            let vars = GetAvailableVariables(document.getText(), document, true);
            bugout.appendLine(`${vars.length} vars & funcs`);
            for (let v of vars) {
                tbPush(v.range, v.type ? `function` : `variable`)
            }

            bugout.appendLine(`Provided ${outcount} tokens!`)
        } catch(err) {
            bugout.appendLine(`Caught error: ${err}`)
        }
        }

    }, SemanticsLegend);

    if (vscode.workspace.getConfiguration('greyscript').get('semanticsProvider')) context.subscriptions.push(SemanticProvider);

    let ColorPicker = vscode.languages.registerColorProvider('greyscript', {
        async provideDocumentColors(document, token) {
            //let txt = document.getText();
            let txt = await GetDocumentText(document);
            let reg = /(?:(?:<color=)?(#[0-9a-f]{6})|<color=\"?(black|blue|green|orange|purple|red|white|yellow)\"?)>/gi
            let mchs = txt.matchAll(reg);
            let out = [];
            let startPos = 0;
            let prevLine = 0;
            for (var m of mchs) {
                // All text till occurence
                let ps = txt.slice(0,m.index);

                // Get line number
                let pl = ps.split("\n").length - 1;

                // Get line text
                let line = document.lineAt(pl);

                if(prevLine < pl) startPos = 0;

                if(line.text.indexOf(m[0], startPos) == -1) continue;
                
                // Get color tag range
                let range = new vscode.Range(pl, line.text.indexOf(m[0], startPos), pl, line.text.indexOf(m[0], startPos) + m[0].length);

                // Parse color
                //bugout.appendLine(m);
                let color;
                if (m[1]) {
                    range = new vscode.Range(pl, line.text.indexOf(m[1], startPos), pl, line.text.indexOf(m[1], startPos) + m[1].length);
                    let d = hexToRgb(m[1])
                    color = new vscode.Color(d.r,d.g,d.b,16);
                }
                else {
                    range = new vscode.Range(pl, line.text.indexOf(m[2], startPos), pl, line.text.indexOf(m[2], startPos) + m[2].length);
                    let c = undefined;
                    switch(m[2]){
                        case "black":
                            color = new vscode.Color(0,0,0,16);
                            break;

                        case "white":
                            color = new vscode.Color(16,16,16,16);
                            break;

                        case "red":
                            color = new vscode.Color(16,0,0,16);
                            break;

                        case "green":
                            color = new vscode.Color(0,16,0,16);
                            break;

                        case "blue":
                            color = new vscode.Color(0,0,16,16);
                            break;
                        
                        case "orange":
                            c = hexToRgb("#FFA500")
                            color = new vscode.Color(c.r, c.g, c.b, 16);
                            break;

                        case "purple":
                            c = hexToRgb("#800080")
                            color = new vscode.Color(c.r, c.g, c.b, 16);
                            break;

                        case "yellow":
                            c = hexToRgb("#ffff00")
                            color = new vscode.Color(c.r, c.g, c.b, 16);
                            break;
                    }
                }
                let c = new vscode.ColorInformation(range, color)
                startPos = range.end.character;
                prevLine = pl;
                out.push(c);
            }
            return out;
        },
        provideColorPresentations(color, ctx, token){
            let hex = rgbToHex(color.red, color.green, color.blue);
            ctx.range = new vscode.Range(ctx.range.start, new vscode.Position(ctx.range.end.line, ctx.range.start.character + hex.length))
            return [vscode.ColorPresentation(hex)]
        }
    });

    if (vscode.workspace.getConfiguration("greyscript").get("colorpicker")) context.subscriptions.push(ColorPicker)

    let GetAvailableVariables = function(text, document, includeFunctionVars=false) {
        let variableOptions = [];
        //let linesTillLine = document.getText(new vscode.Range(new vscode.Position(0, 0), range.start))
        let linesTillLine = text
        matches = linesTillLine.matchAll(/\b(\w+(\s|)=|end function)/g);
        let inFunction = false;
        let functionVars = [];
        if(matches){
            for(match of Array.from(matches).reverse()){
                //bugout.appendLine(`MATCHED, ${match}, ${match[0]}`)
                let fullMatch = match[0];
                variableName = fullMatch.replace(/(\s|)=/, "");
                if(variableOptions.every(m => m.name !== variableName)) {
                    if(fullMatch == "end function"){
                        inFunction = true;
                        functionVars = [];
                        continue;
                    }
                    let assignment = linesTillLine.substring(match.index, linesTillLine.indexOf("\n", match.index));
                    assignment = assignment.substring(assignment.indexOf("=") + 1).trim();

                    let range = new vscode.Range(document.positionAt(match.index), document.positionAt(match.index + fullMatch.length));

                    let lb = text.slice(0, match.index).split("\n").length;

                    //bugout.appendLine(`ASSIGNMENT: ${assignment}`)

                    if(assignment.startsWith("function")){
                        //bugout.appendLine(`Found function ${variableName}`)
                        inFunction = false;
                        try {
                            params = assignment.match(/(?<=\()(.*?)(?=\))/)[0].split(",").map(p => p.trim());
                            for(p of params){
                                //bugout.appendLine(`PARSE PARAM ${p}`)
                                optionalParam = p.match(/\w+(\s|)=(\s|)/);
                                if(optionalParam){
                                    let name = optionalParam[0].replace(/(\s|)=(\s|)/, "");
                                    functionVars.push({"name": name, "type": 5});
                                }
                                else functionVars.push({"name": p, "type": 5});
                            }
                            } catch(err) {
                            bugout.appendLine(`Failed to parse function params: ${err}`)
                        }
                    }

                    let variable = {"name": variableName, "type": (assignment.startsWith("function") ? 2 : 5), "range": range, "linesBefore": lb}
                    if(inFunction && !includeFunctionVars) functionVars.push(variable);
                    else variableOptions.push(variable);
                    //bugout.appendLine(`POST MATCH ${match[0]}`)
                }
            }
        }
        return variableOptions;
    }

    let SymbolProvider = vscode.languages.registerDocumentSymbolProvider('greyscript', 
    {
        async provideDocumentSymbols(document, token) {
            bugout.appendLine(`Provide document symbols!`);
            let text = document.getText();
            // Don't use GetDocumentText here, only show the symbols in the current file
            let symbols = [];
            // Get All user defined variables
            
            let variableOptions = GetAvailableVariables(text, document);
                
            //bugout.appendLine(`VARS VARS: ${JSON.stringify(variableOptions)}`)
            variableOptions = variableOptions.filter(v => v.type == 2);
            //bugout.appendLine(`FINAL VARS: ${JSON.stringify(variableOptions)}`)
            for (let opt of variableOptions) {
                let sym = new vscode.DocumentSymbol(opt.name, `Line ${opt.linesBefore}`, vscode.SymbolKind.Function, opt.range, opt.range)
                symbols.push(sym);
            }
            if (vscode.workspace.getConfiguration("greyscript").get("remoteSymbols")) {
                for (let fi in FileCache) {
                    let t = FileCache[fi].text;
                    let vopt = GetAvailableVariables(t, document);
                    for (let opt of vopt) {
                        if (!text.includes(`${opt.name}(`)) continue;
                        let sym = new vscode.DocumentSymbol(opt.name, `${fi.split("/").pop()}`, vscode.SymbolKind.Function, opt.range, opt.range)
                        symbols.push(sym);
                    }
                }
            }
            return symbols;
        }
    });

    if (vscode.workspace.getConfiguration("greyscript").get("symbols")) context.subscriptions.push(SymbolProvider);
	
    function LookForErrors(source) {
	    let outp = [];
	    let reg = new RegExp(`$(Encode|Decode)(?:\\s)?=(?:\\s)?function\\(.+\\).*(${Encryption.join("|")}).*end function`, "s");
	    let m = source.match(reg);
	    if (m) {
		    let match = m;
			    let s = source.indexOf(match[2]);
			    let e = source.indexOf(match[2])+match[2].length;
			    let li = source.slice(0, s).split("/n").length;
			    let eli = source.slice(e, source.length).split("/n").length;
			    let max = source.slice(0, s);
                let max2 = source.slice(0, e);
			    let sch = max.slice(max.lastIndexOf("/n"), max.indexOf(match[2])).length;
			    let ech = max2.slice(max2.lastIndexOf("/n"), max2.indexOf(match[2])+match[2].length).length;
			    let r = new vscode.Range(li, 1, eli, 99999)
			    let ms = "Cannot use "+match[2]+" in "+ (match[1] == "Encode" ? "encryption." : "decryption.");
			    let d = new vscode.Diagnostic(r, ms, vscode.DiagnosticSeverity.Error);
			    outp.push(d);
	    }
	    return outp;
    }
	
let collection = vscode.languages.createDiagnosticCollection("greyscript");

	
    async function readerror(document) {
	   let uri = document.uri;
	   //collection.clear();
	   //let e = LookForErrors(document.getText());
       let e = LookForErrors(await GetDocumentText(document));
	   collection.set(uri, e);
    }
	let listen1 = vscode.workspace.onDidOpenTextDocument( readerror);
	let listen2 = vscode.workspace.onDidChangeTextDocument(function(event) {
		readerror(event.document);
	});
	bugout.appendLine("Hello Hackers!! :>")
	context.subscriptions.push(collection, listen1, listen2);
    
	function minify(editor, edit, context) {
        //let text = editor.document.getText().replace(/\/\/.*/g, "");

        var firstLine = editor.document.lineAt(0);
        var lastLine = editor.document.lineAt(editor.document.lineCount - 1);
        var textRange = new vscode.Range(firstLine.range.start.line,
            firstLine.range.start.character,
            lastLine.range.end.line,
            lastLine.range.end.character);
                
        let lines = text.split("\r\n");
        let cleanedLines = [];
        let inListOrMap = false;
        for(i in lines){
            lines[i] = lines[i].trim();
            if(lines[i].length == 0) continue;

            if(lines[i].includes("if") && lines[i].includes("then")){
                let expression = lines[i].substring(lines[i].indexOf("then") + 4).trim();
                if(expression.length != 0) lines[i] += " end if";
            }
            
            if(lines[i].match(/{(?=(?:[^"]*"[^"]*")*[^"]*$)/g)){
                inListOrMap = true;
            }
            
            if(lines[i].match(/}(?=(?:[^"]*"[^"]*")*[^"]*$)/g)){
                inListOrMap = false;
                lines[i] += ";";
            }

            if(lines[i].substring(lines[i].length - 1) != ";" && !inListOrMap) {
                lines[i] += ";";
            }

            cleanedLines.push(lines[i]);
        }

        text = cleanedLines.join(" ");

        edit.replace(textRange, text.replace(/\s+(?=(?:[^"]*"[^"]*")*[^"]*$)/g, " "));//.replace(/\r/g, "").replace(/\n/g, " "));
	}
	
	context.subscriptions.push(vscode.commands.registerTextEditorCommand("greyscript.minify", minify));

    let gecmd = vscode.commands.registerTextEditorCommand("greyScript.gotoError", (editor, edit, context) => {
        let options = {"prompt": "Enter provided line number"}
        vscode.window.showInputBox(options).then((line) => {
            line = Number(line);
            var text = editor.document.getText();
            var exp = new RegExp("else","gm")
            var list = text.matchAll(exp)
            var exp2 = new RegExp("else if","gm")
            var list2 = text.matchAll(exp2)
            var l = 0
            var l2 = 0
            for (i of list) {
                var index = i.index+i[0].length;
                var r = new vscode.Range(1,0,1,index)
                var text = editor.document.getText();
                var nt = text.slice(0, index);
                var lines = nt.split(new RegExp("\n","g")).length;
                if (lines <= line) l++;
            }
            for (i of list2) {
                var index = i.index+i[0].length;
                var text = editor.document.getText();
                var nt = text.slice(0, index);
                var lines = nt.split(new RegExp("\n","g")).length;
                if (lines <= line) l2++;
            }
            var actualline = (line-(l-l2))
            var linel = editor.document.lineAt(actualline-1).text.length;
            var pos1 = new vscode.Position(actualline-1, 0)
            var pos2 = new vscode.Position(actualline-1, linel)
            var range = new vscode.Range(pos1,pos2)
            //editor.revealRange(range, vscode.TextEditorRevealType.InCenter)
            let options = {
                "selection": range
            };
            vscode.window.showTextDocument(editor.document, options)
        });
    });

    context.subscriptions.push(gecmd)
}

function deactivate() {}

module.exports = {activate, deactivate};