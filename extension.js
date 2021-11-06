const vscode = require("vscode");

var CompData = require("./grammar/CompletionData.json")
var TypeData = require("./grammar/TypeData.json")
var ArgData = require("./grammar/ArgData.json")
var ReturnData = require("./grammar/ReturnData.json")
var Examples = require("./grammar/Examples.json")
var CompTypes = require("./grammar/CompletionTypes.json") // Constant 20 Function 2 Property 9 Method 1 Variable 5 Interface 7
var HoverData = require("./grammar/HoverData.json");
var Encryption = require("./grammar/Encryption.json");

var enumCompTypeText = {
    1: "method",
    2: "function",
    5: "variable",
    7: "interface",
    9: "property",
    20: "constant",
}

function activate(context) {
    let hoverD = vscode.languages.registerHoverProvider('greyscript', {
        provideHover(document,position,token) {
            if (!vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) return;

            let range = document.getWordRangeAtPosition(position)
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
        }
    })

    if (vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) context.subscriptions.push(hoverD)

    let decD = vscode.languages.registerDeclarationProvider('greyscript', {
        provideDeclaration(document, position, token) {
            let range = document.getWordRangeAtPosition(position);
            let word = document.getText(range);
            let Exp = new RegExp(`(${word} = |${word}=)`);
            let Text = document.getText();
            let Match = Text.match(Exp);
            let index = Match.index;
            let nt = Text.slice(0, index);
            let lines = nt.split(new RegExp("\n","g")).length;
            let Pos = new vscode.Position(lines-1, word.length);
            return new vscode.Location(document.uri, Pos);
        }
    });

    context.subscriptions.push(decD);

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

    let getHoverData = (type, cmd, asMarkdown = true) => {
        // Create markdownString
        let str = new vscode.MarkdownString("", true);
        
        // Get type of cmd
        let cmdType = CompTypes[cmd] || CompTypes["default"];

        // Get type text, example: Shell.
        typeText = "";
        if (type != "General") typeText = type + ".";

        // Combine base data together
        let docs = {"title": enumCompTypeText[cmdType] + " " + typeText + cmd, "description": ""};
        
        // Add arguments if its a function/method
        if(cmdType == 2 || cmdType == 1){
            docs.title += "(" + ArgData[type][cmd].map(d => d.name + (d.optional ? "?" : "") + ": " + d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")).join(", ") + ")";
        }

        // Add result if set
        let resultTypes = ReturnData[type][cmd];
        if (resultTypes) docs.title += ": " + resultTypes.map(d => d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")).join(" or ");

        // Add info/hover text
        docs.description = HoverData[type][cmd] || "";

        // Apply encryption text to hover text if available
        if (Encryption.includes(c)) docs.description += "\n\n\**This function cannot be used in encryption.*";

        // Add examples
        let Ex = Examples[type] ? Examples[type][cmd] : null;
        let codeExamples = [];
        
        if (Ex) {
            codeExamples = Ex;
        }
        
        // Return normal text
        if(!asMarkdown) return docs.title + "\n\n\n" + docs.description.replace(/<[^>]*>?/gm, '') + "\n\n" + codeExamples.join("\n\n\n");

        // Append markdown string areas
        str.appendCodeblock(docs.title);
        str.appendMarkdown("---\n" + docs.description + codeExamples.length > 0 ? "\n---" : "");
        if(codeExamples.length > 0) str.appendCodeblock(codeExamples.join("\n\n"));

        // Return markdown string
        return str;
    }

    let getOptionsBasedOfPriorCommand = (document, range) => {
        console.log("Checking item before .");

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
            let match = assignment.match(re)[0];
            assignment = assignment.substring(assignment.indexOf(match) + match.length).trim().replace(";", "");
            assignment = assignment.split(".")
            assignment = assignment[assignment.length - 1];

            // If its a string type return the string options
            if(assignment.startsWith("\"")) return {"String": CompData["String"]};

            // If its a list type return the string options
            if(assignment.startsWith("[")) return {"List": CompData["List"]};

            // If its a map type return the string options
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
                console.log("Greyscript: Target is unknown returning all CompData as completion items")
                return CompData;
            }
        }
        return undefined;
    }

    let compD = vscode.languages.registerCompletionItemProvider('greyscript', {
        provideCompletionItems(document,position,token,ccontext) {
            if (!vscode.workspace.getConfiguration("greyscript").get("autocomplete")) return;
            
            // Get typed word
            let range = document.getWordRangeAtPosition(position);
            let word = document.getText(range);
            //console.log(word);
            
            // Set default options (THIS IS ALSO THE FALLBACK)
            let options = {"General": CompData["General"]};

            // If there is a . in front of the text check what the previous item accesses
            if(range && range.start.character - 2 >= 0 && document.getText(new vscode.Range(new vscode.Position(range.start.line, range.start.character - 1), new vscode.Position(range.start.line, range.start.character))) == "."){
                let res = getOptionsBasedOfPriorCommand(document, range);
                console.log(res);
                if(res) options = res;
            }
           
            let output = {};

            // Get autocompletion of type and filter
            for(key in options){
               let keyOutput = options[key].filter(cmd => cmd.includes(word));
               if(keyOutput.length > 0) output[key] = keyOutput;
            }
            //console.log(output);

            // Instantiate result array
            let out = [];

            // Instantiate sort text index
            var a = 0;

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

                    // Push completion item to result array
                    out.push(t);

                    // Increment sort text index
                    a++
                }
            }

            //console.log("AutoCompletion result:");
            //console.log(out);

            // Return completion items
            return new vscode.CompletionList(out,true);
        }
    });

    if (vscode.workspace.getConfiguration("greyscript").get("autocomplete")) context.subscriptions.push(compD)

    function hexToRgb(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
            a: parseInt(result[4], 16)
        } : null;
    }

    let ColorPicker = vscode.languages.registerColorProvider('greyscript', {
        provideDocumentColors(document, token) {
            let txt = document.getText();
            let reg = /(?:(?:<color=)?(#[0-9a-f]{6,8})|<color=\"?(black|blue|green|orange|purple|red|white|yellow)\"?)>/gi
            let mchs = txt.matchAll(reg);
            let out = [];
            for (var m of mchs) {
                let ps = txt.slice(0,m.index);
                let pl = txt.split("\n").length;
                let pc = txt.lastIndexOf("\n")+m.index
                let range = new vscode.Range(pl, pc, pl, pc+m[0].length);
                let color;
                if (m[1].includes("#")) {
                    let d = hexToRgb(m[1])
                    color = new vscode.Color(d.r,d.g,d.b,d.a ? d.a : 16);
                }
                let c = new vscode.ColorInformation(range, color)
                out.push(c);
            }
            return out;
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
                
        let lines = text.split("\r\n")
        console.log(lines);
        let cleanedLines = [];
        for(i in lines){
            if(lines[i].length == 0) continue;

            if(lines[i].includes("if") && lines[i].includes("then")){
                let expression = lines[i].substring(lines[i].indexOf("then") + 4).trim();
                if(expression.length == 0) continue;
                lines[i] += " end if;";
            }
            else if(lines[i].substring(lines[i].length - 1) != ";") {
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
