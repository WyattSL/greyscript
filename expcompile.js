const Types = [
    "Unknown",
	"Keyword",
	"Number",
	"String",
	"Identifier",
	"OpAssign",
	"OpPlus",
	"OpMinus",
	"OpTimes",
	"OpDivide",
	"OpMod",
	"OpPower",
	"OpEqual",
	"OpNotEqual",
	"OpGreater",
	"OpGreatEqual",
	"OpLesser",
	"OpLessEqual",
	"LParen",
	"RParen",
	"LSquare",
	"RSquare",
	"LCurly",
	"RCurly",
	"AddressOf",
	"Comma",
	"Dot",
	"Colon",
	"Comment",
	"EOL"
]

const Ops = [
    "Noop",
    "AssignA",
    "AssignImplicit",
    "APlusB",
    "AMinusB",
    "ATimesB",
    "ADividedByB",
    "AModB",
    "APowB",
    "AEqualB",
    "ANotEqualB",
    "AGreaterThanB",
    "AGreatOrEqualB",
    "ALessThanB",
    "ALessOrEqualB",
    "AAndB",
    "AOrB",
    "CopyA",
    "NotA",
    "GotoA",
    "GotoAifB",
    "GotoAifTrulyB",
    "GotoAifNotB",
    "PushParam",
    "CallFunctionA",
    "CallIntrinsicA",
    "ReturnA",
    "ElemBofA",
    "ElemBofIterA",
    "LengthOfA"
];

class Lexer {
    constructor() {

    }
}

class Parser {
    constructor() {
        Reset()
    }
    Parse(source) {
        var lexer = new Lexer()
        ParseMultipleLines(lexer)
        if (NeedMoreInput()) {
            lexer.lineNum++
            if (this.outputStack.length > 1) {
                throw new CompilerException(this.errorContext, lexer.lineNum, "'function' without matching 'end function'");
            }
            if (this.output.backpatches > 0) {
                var i = output.backpatches[output.backpatches.Count-1].waitingfor
                var msg;
                switch (i) {
                    case "end for":
                        msg = "'for' without matching 'end for'"
                        break;
                    case "end if":
                        msg = "'if' without matching 'end if'"
                        break;
                    case "end while":
                        msg = "'while' without matching 'end while'"
                        break;
                    default:
                        msg = "unmatched block opener"
                }
                throw new CompilerException(this.errorContext,lexer.lineNum, msg);
            }
        }
    }
    NeedMoreInput() {
        if (this.outputStack.length > 1 || this.backpatches.length > 0) return true;
        return false;
    }
    Reset() {
        this.output = new ParseState()
        this.outputStack = [];
        this.outputStack.push(output);
    }
    ParseStatement(tokens, allowExtra=false) {
        if (tokens.Peek().type == Types.indexOf("Keyword") && tokens.Peek().text != "not") {
            var text = tokens.Dequeue().text;
            switch (text) {
                case "return":
                    rhsA = null;
                    if (tokens.Peek().type != Types.indexOf("EOL")) {
                        rhsA = ParseExpr(tokens)
                    }
                    this.output.Add(new TACLine(TAC.LTemp(0), Ops.indexOf("ReturnA"), rhsA))
                    break;
                case "if":
                    rhsB2 = ParseExpr(tokens)
                    RequireToken(tokens, Types.indexOf("Keyword"), "then");
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoAifNotB"), null, rhsB2))
                    this.output.AddBackpatch("if:MARK");
                    this.output.AddBackpatch("else");
                    if (tokens.Peek().type != Types.indexOf("EOL")) {
                        this.ParseStatement(tokens, true)
                        if (tokens.Peek().Type == Types.indexOf("Keyword") && tokens.Peek().text == "text") {
                            tokens.Dequeue();
                            StartElseClause();
                            this.ParseStatement(tokens, true)
                        } else {
                            RequireEitherToken(tokens, Types.indexOf("Keyword"), "else", Types.indexOf("EOL"))
                        }
                        this.output.PatchIfBlock()
                    } else {
                        tokens.Dequeue();
                    }
                    return;
                case "else":
                    StartElseClause();
                    break;
                case "else if":
                    StartElseClause()
                    rhsB = ParseExpr(tokens)
                    RequireToken(tokens, Types.indexOf("Keyword"), "then")
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoAifNotB"), null, rhsB));
                    this.output.AddBackpatch("else");
                    break;
                case "end if":
                    this.output.PatchIfBlock()
                    break;
                case "while":
                    this.output.AddJumpPoint(text)
                    rhsB3 = ParseExpr(tokens);
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoAifNotB"), null, rhsB3))
                    this.output.addBackpatch("end while")
                    break;
                case "end while":
                    let jumpPoint3 = this.output.CloseJumpPoint("while");
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoA"), TAC.Num(jumpPoint3.lineNum)));
                    this.output.Patch(text,"break")
                    break;
                case "for":
                    let token = RequireToken(tokens, Types.indexOf("Identifer"))
                    let lhs = new ValVar(token.text);
                    RequireToken(tokens, Types.indexOf("Keyword"), "in");
                    let value = ParseExpr(tokens)
                    if (!value) {
                        throw new CompilerException(errorContext, tokens.lineNum, "sequence expression expected for 'for' loop.")
                    }
                    let valVar = new valVar("__" + token.text + "_idx")
                    this.output.Add(new TACLine(valVar, Ops.indexOf("AssignA"), TAC.Num(-1.0)));
                    this.output.AddJumpPoint(text);
                    this.output.Add(new TACLine(valVar, Ops.indexOf("APlusB"), TAC.Num(1.0)));
                    let valTemp = new ValTemp(this.output.nextTempNum++);
                    this.output.Add(new TACLine(valTemp, Ops.indexOf("LengthOfA"), value));
                    let valTemp2 = new ValTemp(this.output.nextTempNum++);
                    this.output.Add(new TACLine(valTemp2, Ops.indexOf("AGreatOrEqualB"), valVar, valTemp));
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoAifB"), null, valTemp2));
                    this.output.AddBackpatch("end for")
                    this.output.Add(new TACLine(lhs, Ops.indexOf("ElemBofIterA"), value, valVar));
                    break;
                case "end for":
                    let jumpPoint2 = this.output.CloseJumpPoint("for");
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoA"), TAC.Num(jumpPoint2.lineNum)));
                    this.output.Patch(text, "break");
                    break;
                case "break":
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoA")));
                    this.output.AddBackpatch("break");
                    break;
                case "continue":
                    if (this.output.jumpPoints.length == 0) {
                        throw new CompilerException(errorContext, tokens.lineNum, "'continue' without open loop block");
                    }
                    let jumpPoint = output.jumpPoints[-1];
                    this.output.Add(new TACLine(null, Ops.indexOf("GotoA"), TAC.Num(jumpPoint.lineNum)));
                    break;
                case "true":
                    this.output.Add(new TACLine(null, Ops.indexOf("AssignImplicit"), 1));
                    break;
                case "false":
                    this.output.Add(new TACLine(null, Ops.indexOf("AssignImplicit"), 0));
                    break;
                default:
                    throw new CompilerException(errorContext, tokens.lineNum, "unexpected keyword '"+text+"' at start of line");
            }
        }
    }
    ParseMultipleLines(tokens) {
        while (!tokens.atEnd) {
            if (tokens.Peek().type == Types.indexOf("EOL")) {
                tokens.Dequeue();
                continue;
            }
            location = new SourceLoc(errorContext, tokens.lineNum);
            if (tokens.Peek().type == Types.indexOf("Keyword") && tokens.Peek().text == "end function") {
                tokens.Dequeue();
                if (this.outputStack.length > 1) {
                    this.outputStack.pop()
                    output = this.outputStack.Peek()
                    continue;
                }
                throw new CompilerException("'end function' without matching block starter", location)
            }
            var count = output.code.length
            try {
                ParseStatement(tokens)
            } catch(err) {
                if (!err.location) {
                    err.location = location;
                }
                throw err;
            }
            for (i=count;i<output.code.length;i++) {
                output.code[i].location = location;
            }
        }
    }
}

class ParseState extends Parser {
    constructor() {
        this.code = [];
        this.backpatches = [];
        this.jumpPoints = [];
    }
}

class TAC {}

class TACLine extends TAC {
    lhs;
    op;
    rhsA;
    rhsB;
    constructor(lhs, op, rhsA=null, rhsB=null) {
        this.lhs = lhs;
        this.op = op;
        this.rhsA = rhsA
        this.rhsB = rhsB
    }
}

class BackPatch {
    lineNum;
    waitingFor;
}

class JumpPoint {
    keyword;
    lineNum;
}

class Interpreter {
    constructor(source, normalout, errorout) {
        this.source = source;
        if (!normalout) {
            normalout = output.appendLine
        }
        if (!errorout) {
            errorout = output.appendLine
        }
        this.normalout = normalout
        this.errorout = errorout
    }
    ReportError(e) {
        this.errorout(e)
    }
    Compile() {
        if (!this.parser) {
            this.parser = new Parser
        }
        try {
            this.parser.Parse(this.source)
        } catch(exception) {
            ReportError(exception)
        }
    }
}