const vscode = require("vscode");

var CompData = require("./grammar/CompletionData.json")
var TypeData = require("./grammar/TypeData.json")
var ArgData = require("./grammar/ArgData.json")
var ReturnData = require("./grammar/ReturnData.json")
var Examples = require("./grammar/Examples.json")
var CompTypes = require("./grammar/CompletionTypes.json") // Constant 20 Function 2 Property 9 Method 1 Variable 5 Interface 7
var HoverData = require("./grammar/HoverData.json");
var Encryption = require("./grammar/Encryption.json");

function activate(context) {
    let hoverD = vscode.languages.registerHoverProvider('greyscript', {
        provideHover(document,position,token) {
            if (!vscode.workspace.getConfiguration("greyscript").get("hoverdocs")) return;
            let range = document.getWordRangeAtPosition(position)
            let word = document.getText(range)
            let docs = HoverData[word];
            if (Array.isArray(docs)) {
                docs = docs.join("\n\n\n")
            }
	    if (Encryption.includes(word)) docs = docs + "\n\n\This function cannot be used in encryption.";
            if (docs) {
                return new vscode.Hover({
                    language: "greyscript",
                    value: docs
                });
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

    let compD = vscode.languages.registerCompletionItemProvider('greyscript', {
        provideCompletionItems(document,position,token,ccontext) {
            if (!vscode.workspace.getConfiguration("greyscript").get("autocomplete")) return;
            let range = document.getWordRangeAtPosition(position);
            let word = document.getText(range);
            let output = []
            let match = function(c) {
                let w = word;
                return c.includes(w)
            }
            output = CompData.filter(match)
            var outputS = [];
            var i;
            for (i=0;i<output.length;i++) {
                outputS.push(i+""+output.shift)
            }
            let c;
            let out = [];
            var a = -1;
            for (c of output) {
                a++
                let type = CompTypes[c] || CompTypes["default"];
                let s = outputS[a]
                let t = new vscode.CompletionItem(c,type)
                t.sortText = s;
                let Ex = Examples[c];
                let Exs = [];
                if (Ex) {
                    let i;
                    for (i=0;i<Ex.length;i++) {
                        Exs[i] = Ex[i].join("\n");
                    }
                }
                var docs = HoverData[c]
                if (Array.isArray(docs)) {
                    docs = docs.join("\n\n\n")
                }
		        if (Encryption.includes(c)) docs = docs + "\n\n\**This function cannot be used in encryption.*";
                t.documentation = new vscode.MarkdownString(docs, true);
                if (Ex) t.documentation = new vscode.MarkdownString(docs+"\n\n"+Exs.join("\n\n"), true);
                out.push(t);
            }
            return new vscode.CompletionList(out,true);
        }
    });

    if (vscode.workspace.getConfiguration("greyscript").get("autocomplete")) context.subscriptions.push(compD)
	
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
