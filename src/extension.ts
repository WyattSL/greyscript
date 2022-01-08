import vscode from 'vscode';
import CompData from '../grammar/CompData.json';
import TypeData from '../grammar/TypeData.json';
import ArgData from '../grammar/ArgData.json';
import ReturnData from '../grammar/ReturnData.json';
import CompTypes from '../grammar/CompTypes.json';
import Encryption from '../grammar/Encryption.json';
import getHoverData from './hover-data';

export function activate(context) {
    const hoverD = vscode.languages.registerHoverProvider('greyscript', {
        provideHover(document,position,token) {
            if (!vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) return;

            let range = document.getWordRangeAtPosition(position)
            if(!range) return;
            let word = document.getText(range)

            let options = {"General": CompData["General"]};

            // If there is a . in front of the text check what the previous item accesses
            if(range && range.start.character - 2 >= 0 && document.getText(new vscode.Range(new vscode.Position(range.start.line, range.start.character - 1), new vscode.Position(range.start.line, range.start.character))) == "."){
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
                let text = document.getText()
                let linesTillCurLine = document.getText().split("\n").splice(0, range.start.line);
                
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
                    if(linesTillCurLine[linesTillCurLine.indexOf(lines[lines.length - 1]) + 1].startsWith("//")){
                        description = linesTillCurLine[linesTillCurLine.indexOf(lines[lines.length - 1]) + 1].substring(2).trim();
                    }
                    hoverText.appendCodeblock("(function) " + word + "(" +assignment.match(/(?<=\()(.*?)(?=\))/)[0] + ")")
                    if(description) hoverText.appendText(description);
                    return new vscode.Hover(hoverText);
                }
            }
        }
    })

    if (vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) context.subscriptions.push(hoverD)

    context.subscriptions.push(vscode.languages.registerDeclarationProvider('greyscript', {
        provideDeclaration(document, position, token) {

            let range = document.getWordRangeAtPosition(position);
            let word = document.getText(range);
            let Text = document.getText();

            let re = RegExp("\\b"+word+"(\\s|)=");
            let Match = Text.match(re);

            let index = Match.index;
            let nt = Text.slice(0, index);

            let lines = nt.split(new RegExp("\n","g")).length;
            let Pos = new vscode.Position(lines-1, word.length);

            return new vscode.Location(document.uri, Pos);
        }
    }));

    /*

    let foldD = vscode.languages.registerFoldingRangeProvider('greyscript', {
        provideFoldingRanges(document, foldContext, token) {
            console.log(`Request To Provide Folding Ranges`);
            let Text = document.getText();
            let kind = vscode.FoldingRangeKind.Region;
            var List = [];
            let Exp = new RegExp(`( = |=) function`, `g`);
            let Matches = Text.matchAll(Exp);
            console.log(`Folding Matches`);
            console.log(Matches);
            var i;
            for (i of Matches) {
                let index = i.index;
                console.log(`I: ${index}`);
                let stext = Text.slice(0,index);
                let text = Text.slice(index,Text.length);
                console.log(`T: ${text}`);
                let Exp = new RegExp("end function");
                let M = text.match(Exp)
                console.log(`M: ${M}`)
                if (!M) continue;
                M = M.index+index;
                console.log(`M: ${M}`);
                let start = stext.split("\n").length-1;
                let etext = Text.slice(0, M);
                let end = etext.split("\n").length-1;
                let F = new vscode.FoldingRange(start, end, kind);
                List.push(F);
            };
            console.log(`Folding Ranges`)
            console.log(List);
            return List;
        }
    })

    context.subscriptions.push(foldD);
    */

    let getOptionsBasedOfPriorCommand = (document, range) => {
        //console.log("Checking item before .");

        // Get Target if there was a delimiter before starting character
        let targetRange = document.getWordRangeAtPosition(new vscode.Position(range.start.line, range.start.character - 2));
        let targetWord = document.getText(targetRange);

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

        // Get return data from command
        if(prevCmd){
            let returnValues = ReturnData[prevCmd.type][prevCmd.cmd];
            let options = {};

            // Get options based of return value
            for(returnValue of returnValues){
                if(!CompData[returnValue.type]) continue;
                options[returnValue.type] = CompData[returnValue.type];
            }

            return Object.keys(options).length > 0 ? options : undefined;
        }
        else {
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
                console.log("Greyscript: Target is unknown returning all CompData.")
                return CompData;
            }
        }
    }

    let compD = vscode.languages.registerCompletionItemProvider('greyscript', {
        provideCompletionItems(document,position,token,ccontext) {
            if (!vscode.workspace.getConfiguration("greyscript").get("autocomplete")) return;
            let out = [];

            // Set default options (THIS IS ALSO THE FALLBACK)
            let options = {"General": CompData["General"]};

            // Get typed word
            let range = document.getWordRangeAtPosition(position);
            if(!range) {
                for (key in options) {
                    for(c of options[key]){
                        //console.log("Processing result: " + c);
    
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
            //console.log(word);
            
            let variableOptions = [];

            // If there is a . in front of the text check what the previous item accesses
            if(range && range.start.character - 2 >= 0 && document.getText(new vscode.Range(new vscode.Position(range.start.line, range.start.character - 1), new vscode.Position(range.start.line, range.start.character))) == "."){
                let res = getOptionsBasedOfPriorCommand(document, range);
                if(res) options = res;
            }
            else {
                // Get All user defined variables
                let linesTillLine = document.getText(new vscode.Range(new vscode.Position(0, 0), range.start))
                matches = linesTillLine.matchAll(/\b(\w+(\s|)=|end function)/g);
                let inFunction = false;
                let functionVars = [];
                if(matches){
                    for(match of Array.from(matches).reverse()){
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

                            if(assignment.startsWith("function")){
                                inFunction = false;
                                params = assignment.match(/(?<=\()(.*?)(?=\))/)[0].split(",").map(p => p.trim());
                                for(p of params){
                                    optionalParam = p.match(/\w+(\s|)=(\s|)/);
                                    if(optionalParam){
                                        let name = optionalParam[0].replace(/(\s|)=(\s|)/, "");
                                        functionVars.push({"name": name, "type": 5});
                                    }
                                    else functionVars.push({"name": p, "type": 5});
                                }
                            }

                            let variable = {"name": variableName, "type": (assignment.startsWith("function") ? 2 : 5)}
                            if(inFunction) functionVars.push(variable);
                            else variableOptions.push(variable);
                        }
                    }
                    variableOptions = variableOptions.concat(functionVars);
                }
            }
           
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

            //console.log(output);

            // Instantiate result array

            // Instantiate sort text index
            //var a = 0;

            // Go through filtered results
            for (key in output) {
                for(c of output[key]){
                    //console.log("Processing result: " + c);

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

            //console.log("AutoCompletion result:");
            //console.log(out);

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
            provideSignatureHelp(document, position, token, ctx) {
                // Check if current line is not a function creation
                let re = RegExp("(\\s|)=(\\s|)function");
                let curLine = document.lineAt(position.line);
                let textTillCharacter = curLine.text.slice(0, position.character);
                if((ctx.triggerCharacter == "(" && curLine.text.match(re)) || textTillCharacter.lastIndexOf("(") < 1) return;
                if(textTillCharacter.split("(").length === textTillCharacter.split(")").length) return;

                // Get the function being called 
                let range = document.getWordRangeAtPosition(new vscode.Position(position.line, curLine.text.lastIndexOf("(") - 1));
                let word = document.getText(range);

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
                let linesTillLine = document.getText().split("\n").splice(0, range.start.line)
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

    let ColorPicker = vscode.languages.registerColorProvider('greyscript', {
        provideDocumentColors(document, token) {
            let txt = document.getText();
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
                //console.log(m);
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

	
    function readerror(document) {
	   let uri = document.uri;
	   //collection.clear();
	   let e = LookForErrors(document.getText());
	   collection.set(uri, e);
    }
	let listen1 = vscode.workspace.onDidOpenTextDocument( readerror);
	let listen2 = vscode.workspace.onDidChangeTextDocument(function(event) {
		readerror(event.document);
	});
	console.log("Hello Hackers!")
	context.subscriptions.push(collection, listen1, listen2);
    
	function minify(editor, edit, context) {
        let text = editor.document.getText().replace(/\/\/.*/g, "");

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

export function deactivate() {

}
