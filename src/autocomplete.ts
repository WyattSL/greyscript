import vscode, {
    ExtensionContext,
    TextDocument,
    Position,
    CancellationToken,
    CompletionContext,
    CompletionItem,
    Range,
    CompletionList,
    ParameterInformation,
    SignatureInformation,
    SignatureHelp,
    SignatureHelpContext,
    ProviderResult
} from 'vscode';
import {
    CompData,
    ArgData,
    ReturnData,
    CompTypes
} from './grammar';
import {
    FunctionMetaData,
    NativeMetaData,
    MetaData,
    LookupHelper,
    lookupType
} from './helper/lookup-type';

export function activate(context: ExtensionContext) {
	const feature = vscode.languages.registerCompletionItemProvider('greyscript', {
        provideCompletionItems(
            document: TextDocument,
            position: Position,
            token: CancellationToken,
            ctx: CompletionContext
        ) {
            if (!vscode.workspace.getConfiguration("greyscript").get("autocomplete")) {
                return;
            }

            const lastCharacter = document.getText(new Range(
                position.translate(0, -1),
                position
            ));

            if (lastCharacter === '.') {
                let itemPosition = position.translate(0, -2);
                let item = lookupType(document, itemPosition);

                while (!item && itemPosition.character > 0) {
                    itemPosition = itemPosition.translate(0, -1); 
                    item = lookupType(document, itemPosition);
                }

                if (!item) {
                    return;
                }

                if (item.type === 'native') {
                    const returns = item.returns || [];

                    return new CompletionList(
                        returns.reduce((result: CompletionItem[], returnItem: MetaData) => {
                            return result.concat(
                                CompData[returnItem.type]?.map((property: string) => {
                                    return new CompletionItem(property, CompTypes[property] || CompTypes.default);
                                }) || []
                            );
                        }, [])
                    );
                }

                console.log('here', item);

                if (item.type in CompData) {
                    return new CompletionList(
                        CompData[item.type].map((property: string) => {
                            return new CompletionItem(property, CompTypes[property] || CompTypes.default);
                        })
                    );
                }
            } else {
                const helper = new LookupHelper(document);
                const astResult = helper.lookupAST(position);

                if (!astResult) {
                    return;
                }

                const item = helper.lookupMeta(astResult);

                if (item && item.type === 'any') {
                    return new CompletionList(
                        CompData.General.map((property: string) => {
                            return new CompletionItem(property, CompTypes[property] || CompTypes.default);
                        })
                    );
                }
            }

            //let type = CompTypes[c] || CompTypes["default"];
            
            
            /*let out = [];

            // Set default options (THIS IS ALSO THE FALLBACK)
            let options = {"General": CompData["General"]};

            // Get typed word
            let range = document.getWordRangeAtPosition(position);
            if (!range) {
                for (let key in options) {
                    // @ts-ignore: Claims to be implicitly any; needs to be revisited
                    for (let c of options[key]){
                        // Get type of completion item
                        let type = CompTypes[c] || CompTypes["default"];
                        
                        // Create completion item
                        let t = new CompletionItem(c,type)
    
                        // Add hover data to completion item
                        t.documentation = getHoverData(key, c);
                        t.commitCharacters = [".", ";"]
    
                        // Push completion item to result array
                        out.push(t);
                    }
                }
                return new CompletionList(out,true);
            }
            
            const word = document.getText(range);
            if (!word) return;
            //console.log(word);
            
            let variableOptions: any[] = [];

            // If there is a . in front of the text check what the previous item accesses
            if (
                range &&
                range.start.character - 2 >= 0
                && document.getText(new Range(new Position(range.start.line, range.start.character - 1), new Position(range.start.line, range.start.character))) == "."
            ) {
                const res = getOptionsBasedOfPriorCommand(document, range);
                if (res) options = res;
            } else {
                // Get All user defined variables
                const linesTillLine = document.getText(new Range(new Position(0, 0), range.start));
                // @ts-ignore: Claims matchAll does not exist, needs to be revisited
                const matches = linesTillLine.matchAll(/\b(\w+(\s|)=|end function)/g);
                let inFunction = false;
                let functionVars = [];
                if (matches) {
                    for (let match of Array.from(matches).reverse()) {
                        // @ts-ignore: Claims to be implicitly any; needs to be revisited
                        const fullMatch = match[0];
                        const variableName = fullMatch.replace(/(\s|)=/, "");
                        if (variableOptions.every(m => m.name !== variableName)) {
                            if(fullMatch == "end function"){
                                inFunction = true;
                                functionVars = [];
                                continue;
                            }
                            // @ts-ignore: TS cannot figure out type; needs to be revisited
                            let assignment = linesTillLine.substring(match.index, linesTillLine.indexOf("\n", match.index));
                            assignment = assignment.substring(assignment.indexOf("=") + 1).trim();

                            if(assignment.startsWith("function")){
                                inFunction = false;
                                const params = assignment.match(/(?<=\()(.*?)(?=\))/)?.[0].split(",").map(p => p.trim()) || [];

                                for (let p of params){
                                    const optionalParam = p.match(/\w+(\s|)=(\s|)/);
                                    if(optionalParam){
                                        let name = optionalParam?.[0].replace(/(\s|)=(\s|)/, "");
                                        functionVars.push({"name": name, "type": 5});
                                    }
                                    else functionVars.push({"name": p, "type": 5});
                                }
                            }

                            const variable = {
                                "name": variableName,
                                "type": (assignment.startsWith("function") ? 2 : 5)
                            };

                            inFunction
                                ? functionVars.push(variable)
                                : variableOptions.push(variable);
                        }
                    }
                    variableOptions = variableOptions.concat(functionVars);
                }
            }
           
            let output: { [key: string]: string[] } = {};

            // Get autocompletion of type and filter
            for (let key in options) {
                // @ts-ignore: Claims to be implicitly any; needs to be revisited
                let keyOutput = options[key].filter((cmd: any) => cmd.includes(word));
                if(keyOutput.length > 0) output[key] = keyOutput;
            }

            let variablesOutput = [];
            // Get autocompletion of variableNames
            for (let variable of variableOptions){
                if(variable.name.includes(word)) variablesOutput.push(variable);
            }

            // Go through filtered results
            for (let key in output) {
                for (let c of output[key]){
                    // Get type of completion item
                    let type = CompTypes[c] || CompTypes["default"];
                    
                    // Create completion item
                    let t = new CompletionItem(c,type)

                    // Add hover data to completion item
                    t.documentation = getHoverData(key, c);
                    t.commitCharacters = [".", ";"]

                    // Push completion item to result array
                    out.push(t);
                }
            }

            // Go through filtered variables
            for (let variable of variablesOutput){
                out.push(new CompletionItem(variable.name, variable.type));
            }

            // Return completion items
            return new CompletionList(out,true);*/
        }
    }, '.');

    if (vscode.workspace.getConfiguration("greyscript").get("autocomplete")) {
        context.subscriptions.push(feature);
        context.subscriptions.push(vscode.languages.registerSignatureHelpProvider("greyscript", {
            provideSignatureHelp(
                document: TextDocument,
                position: Position,
                token: CancellationToken,
                ctx: SignatureHelpContext
            ): ProviderResult<SignatureHelp> {
                console.log('signature >>');
                return;
                // Check if current line is not a function creation
                /*const re = RegExp("(\\s|)=(\\s|)function");
                const curLine = document.lineAt(position.line);
                const textTillCharacter = curLine.text.slice(0, position.character);
                if((ctx.triggerCharacter == "(" && curLine.text.match(re)) || textTillCharacter.lastIndexOf("(") < 1) return;
                if(textTillCharacter.split("(").length === textTillCharacter.split(")").length) return;

                // Get the function being called 
                const range = document.getWordRangeAtPosition(new Position(position.line, curLine.text.lastIndexOf("(") - 1));
                const word = document.getText(range);

                // Create default signature help
                const t = new SignatureHelp();
                const match = curLine.text.match(/(?<=\()(.*?)(?=\))/);

                if (match) {
                    t.activeParameter = match[0].split(",").length - 1;
                }

                t.signatures = [];
                t.activeSignature = 0;

                // Get all the possible signatures from comp data
                for (let key in CompData) {
                    if (CompData[key].includes(word)) {
                        let cmdType = CompTypes[word] || CompTypes["default"];

                        if(cmdType != 2 && cmdType != 1) {
                            continue;
                        }

                        const args = (ArgData[key][word] || []).map((d: ArgDataCmd) => {
                            return d.name + (d.optional ? "?" : "") + ": " + d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "")
                        }).join(", ")
                        const results = ": " + (ReturnData[key][word] || []).map((d: ReturnDataType) => {
                            return d.type + (d.type == "Map" || d.type == "List" ? `[${d.subType}]` : "");
                        }).join(" or ")

                        let info = new SignatureInformation(key + "." + word + "(" + args + ")" + results);
                        info.parameters = [];

                        for(let param of args.split(",")){
                            let p = new ParameterInformation(param.trim(), "");
                            if(param.trim().length > 0) info.parameters.push(p);
                        }

                        t.signatures.push(info);
                    }
                }
               
                // Get all lines till this line
                const linesTillLine = document.getText().split("\n").splice(0, range?.start?.line)
                const expr = RegExp("\\b" + word + "(\\s|)=(\\s|)function");
                
                // Get last defined user function using this word
                let func = null;
                let desc = null;

                for(let line of linesTillLine.reverse()){
                    if(expr.test(line)){
                        func = line;
                        if (linesTillLine[linesTillLine.indexOf(line) + 1].startsWith("//")) desc = linesTillLine[linesTillLine.indexOf(line) + 1].substring(2).trim();
                        break;
                    }
                }

                // If no user defined function is found return the current signatures
                if (!func) return t;
                
                // Parse the signature information
                let params = func.match(/(?<=\()(.*?)(?=\))/)?.[0] || '';
                const info = new SignatureInformation(word + "(" + params.split(",").map(p => processFunctionParameter(p)).join(", ") + "): any");
                info.parameters = []; 
                if (desc) info.documentation = desc;

                // Go through all parameters and register them
                for (let param of params.split(",")){
                    const p = param.trim();
                    const processed = processFunctionParameter(p)
                    const pInfo = new ParameterInformation(processed);
                    if(p.length > 0) info.parameters.push(pInfo);
                }
                
                // Push the user defined function as a signature
                t.signatures.push(info);

                // Return all found signatures
                return t;*/
            }
        }, ",", "("));
    }
}