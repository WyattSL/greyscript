

// BEGIN
public class Parser
{
        public Parser()
    {
        this.Reset();
    }

        public void Reset()
    {
        this.output = new Parser.ParseState();
        if (this.outputStack == null)
        {
            this.outputStack = new Stack<Parser.ParseState>();
        }
        else
        {
            this.outputStack.Clear();
        }
        this.outputStack.Push(this.output);
    }

        public bool NeedMoreInput()
    {
        return this.outputStack.Count > 1 || this.output.backpatches.Count > 0;
    }

        public void Parse(string sourceCode, bool replMode = false)
    {
        Lexer lexer = new Lexer(sourceCode);
        this.ParseMultipleLines(lexer);
        if (!replMode && this.NeedMoreInput())
        {
            lexer.lineNum++;
            if (this.outputStack.Count > 1)
            {
                throw new CompilerException(this.errorContext, lexer.lineNum, "'function' without matching 'end function'");
            }
            if (this.output.backpatches.Count > 0)
            {
                string waitingFor = this.output.backpatches[this.output.backpatches.Count - 1].waitingFor;
                string message;
                if (!(waitingFor == "end for"))
                {
                    if (!(waitingFor == "end if"))
                    {
                        if (!(waitingFor == "end while"))
                        {
                            message = "unmatched block opener";
                        }
                        else
                        {
                            message = "'while' without matching 'end while'";
                        }
                    }
                    else
                    {
                        message = "'if' without matching 'end if'";
                    }
                }
                else
                {
                    message = "'for' without matching 'end for'";
                }
                throw new CompilerException(this.errorContext, lexer.lineNum, message);
            }
        }
    }

        public TAC.Machine CreateVM(TextOutputMethod standardOutput)
    {
        return new TAC.Machine(new TAC.Context(this.output.code), standardOutput);
    }

        public void REPL(string line)
    {
        this.Parse(line, false);
        TAC.Dump(this.output.code);
        TAC.Machine machine = this.CreateVM(null);
        while (!machine.done)
        {
            machine.Step();
        }
    }

        private void ParseMultipleLines(Lexer tokens)
    {
        while (!tokens.AtEnd)
        {
            if (tokens.Peek().type == Token.Type.EOL)
            {
                tokens.Dequeue();
            }
            else
            {
                SourceLoc location = new SourceLoc(this.errorContext, tokens.lineNum);
                if (tokens.Peek().type == Token.Type.Keyword && tokens.Peek().text == "end function")
                {
                    tokens.Dequeue();
                    if (this.outputStack.Count <= 1)
                    {
                        throw new CompilerException("'end function' without matching block starter")
                        {
                            location = location
                        };
                    }
                    this.outputStack.Pop();
                    this.output = this.outputStack.Peek();
                }
                else
                {
                    int count = this.output.code.Count;
                    try
                    {
                        this.ParseStatement(tokens, false);
                    }
                    catch (MiniscriptException ex)
                    {
                        if (ex.location == null)
                        {
                            ex.location = location;
                        }
                        throw ex;
                    }
                    for (int i = count; i < this.output.code.Count; i++)
                    {
                        this.output.code[i].location = location;
                    }
                }
            }
        }
    }

        private void ParseStatement(Lexer tokens, bool allowExtra = false)
    {
        if (tokens.Peek().type == Token.Type.Keyword && tokens.Peek().text != "not")
        {
            string text = tokens.Dequeue().text;
            uint num = <PrivateImplementationDetails>.ComputeStringHash(text);
            if (num <= 959999494U)
            {
                if (num <= 645182837U)
                {
                    if (num != 184981848U)
                    {
                        if (num != 231090382U)
                        {
                            if (num == 645182837U)
                            {
                                if (text == "end for")
                                {
                                    Parser.JumpPoint jumpPoint = this.output.CloseJumpPoint("for");
                                    this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoA, TAC.Num((double)jumpPoint.lineNum), null));
                                    this.output.Patch(text, "break", 0);
                                    goto IL_69E;
                                }
                            }
                        }
                        else if (text == "while")
                        {
                            this.output.AddJumpPoint(text);
                            Value rhsB = this.ParseExpr(tokens, false, false);
                            this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoAifNotB, null, rhsB));
                            this.output.AddBackpatch("end while");
                            goto IL_69E;
                        }
                    }
                    else if (text == "false")
                    {
                        this.output.Add(new TAC.Line(null, TAC.Line.Op.AssignImplicit, ValNumber.zero, null));
                        goto IL_69E;
                    }
                }
                else if (num != 774195049U)
                {
                    if (num != 944409863U)
                    {
                        if (num == 959999494U)
                        {
                            if (text == "if")
                            {
                                Value rhsB2 = this.ParseExpr(tokens, false, false);
                                this.RequireToken(tokens, Token.Type.Keyword, "then");
                                this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoAifNotB, null, rhsB2));
                                this.output.AddBackpatch("if:MARK");
                                this.output.AddBackpatch("else");
                                if (tokens.Peek().type != Token.Type.EOL)
                                {
                                    this.ParseStatement(tokens, true);
                                    if (tokens.Peek().type == Token.Type.Keyword && tokens.Peek().text == "else")
                                    {
                                        tokens.Dequeue();
                                        this.StartElseClause();
                                        this.ParseStatement(tokens, true);
                                    }
                                    else
                                    {
                                        this.RequireEitherToken(tokens, Token.Type.Keyword, "else", Token.Type.EOL, null);
                                    }
                                    this.output.PatchIfBlock();
                                    return;
                                }
                                tokens.Dequeue();
                                return;
                            }
                        }
                    }
                    else if (text == "else if")
                    {
                        this.StartElseClause();
                        Value rhsB3 = this.ParseExpr(tokens, false, false);
                        this.RequireToken(tokens, Token.Type.Keyword, "then");
                        this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoAifNotB, null, rhsB3));
                        this.output.AddBackpatch("else");
                        goto IL_69E;
                    }
                }
                else if (text == "end if")
                {
                    this.output.PatchIfBlock();
                    goto IL_69E;
                }
            }
            else if (num <= 2901640080U)
            {
                if (num != 1303515621U)
                {
                    if (num != 2246981567U)
                    {
                        if (num == 2901640080U)
                        {
                            if (text == "for")
                            {
                                Token token = this.RequireToken(tokens, Token.Type.Identifier, null);
                                ValVar lhs = new ValVar(token.text);
                                this.RequireToken(tokens, Token.Type.Keyword, "in");
                                Value value = this.ParseExpr(tokens, false, false);
                                if (value == null)
                                {
                                    throw new CompilerException(this.errorContext, tokens.lineNum, "sequence expression expected for 'for' loop");
                                }
                                ValVar valVar = new ValVar("__" + token.text + "_idx");
                                this.output.Add(new TAC.Line(valVar, TAC.Line.Op.AssignA, TAC.Num(-1.0), null));
                                this.output.AddJumpPoint(text);
                                this.output.Add(new TAC.Line(valVar, TAC.Line.Op.APlusB, valVar, TAC.Num(1.0)));
                                Parser.ParseState parseState = this.output;
                                int nextTempNum = parseState.nextTempNum;
                                parseState.nextTempNum = nextTempNum + 1;
                                ValTemp valTemp = new ValTemp(nextTempNum);
                                this.output.Add(new TAC.Line(valTemp, TAC.Line.Op.LengthOfA, value, null));
                                Parser.ParseState parseState2 = this.output;
                                nextTempNum = parseState2.nextTempNum;
                                parseState2.nextTempNum = nextTempNum + 1;
                                ValTemp valTemp2 = new ValTemp(nextTempNum);
                                this.output.Add(new TAC.Line(valTemp2, TAC.Line.Op.AGreatOrEqualB, valVar, valTemp));
                                this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoAifB, null, valTemp2));
                                this.output.AddBackpatch("end for");
                                this.output.Add(new TAC.Line(lhs, TAC.Line.Op.ElemBofIterA, value, valVar));
                                goto IL_69E;
                            }
                        }
                    }
                    else if (text == "return")
                    {
                        Value rhsA = null;
                        if (tokens.Peek().type != Token.Type.EOL)
                        {
                            rhsA = this.ParseExpr(tokens, false, false);
                        }
                        this.output.Add(new TAC.Line(TAC.LTemp(0), TAC.Line.Op.ReturnA, rhsA, null));
                        goto IL_69E;
                    }
                }
                else if (text == "true")
                {
                    this.output.Add(new TAC.Line(null, TAC.Line.Op.AssignImplicit, ValNumber.one, null));
                    goto IL_69E;
                }
            }
            else if (num <= 3183434736U)
            {
                if (num != 2977070660U)
                {
                    if (num == 3183434736U)
                    {
                        if (text == "else")
                        {
                            this.StartElseClause();
                            goto IL_69E;
                        }
                    }
                }
                else if (text == "continue")
                {
                    if (this.output.jumpPoints.Count == 0)
                    {
                        throw new CompilerException(this.errorContext, tokens.lineNum, "'continue' without open loop block");
                    }
                    Parser.JumpPoint jumpPoint2 = this.output.jumpPoints.Last<Parser.JumpPoint>();
                    this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoA, TAC.Num((double)jumpPoint2.lineNum), null));
                    goto IL_69E;
                }
            }
            else if (num != 3378807160U)
            {
                if (num == 4176180067U)
                {
                    if (text == "end while")
                    {
                        Parser.JumpPoint jumpPoint3 = this.output.CloseJumpPoint("while");
                        this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoA, TAC.Num((double)jumpPoint3.lineNum), null));
                        this.output.Patch(text, "break", 0);
                        goto IL_69E;
                    }
                }
            }
            else if (text == "break")
            {
                this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoA, null, null));
                this.output.AddBackpatch("break");
                goto IL_69E;
            }
            throw new CompilerException(this.errorContext, tokens.lineNum, "unexpected keyword '" + text + "' at start of line");
        }
        this.ParseAssignment(tokens, allowExtra);
        IL_69E:
        if (!allowExtra)
        {
            this.RequireToken(tokens, Token.Type.EOL, null);
        }
        if (this.pendingState != null)
        {
            this.output = this.pendingState;
            this.outputStack.Push(this.output);
            this.pendingState = null;
        }
    }

        private void StartElseClause()
    {
        this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoA, null, null));
        this.output.Patch("else", 0);
        this.output.AddBackpatch("end if");
    }

        private void ParseAssignment(Lexer tokens, bool allowExtra = false)
    {
        Value value = this.ParseExpr(tokens, true, true);
        Token.Type type = tokens.Peek().type;
        if (type == Token.Type.OpAssign)
        {
            tokens.Dequeue();
            Value lhs = value;
            Value value2 = this.ParseExpr(tokens, false, false);
            if (value2 is ValTemp && this.output.code.Count > 0)
            {
                TAC.Line line = this.output.code[this.output.code.Count - 1];
                if (line.lhs.Equals(value2))
                {
                    line.lhs = lhs;
                    return;
                }
            }
            this.output.Add(new TAC.Line(lhs, TAC.Line.Op.AssignA, value2, null));
            return;
        }
        if (type == Token.Type.EOL)
        {
            Value value2 = this.FullyEvaluate(value);
            this.output.Add(new TAC.Line(null, TAC.Line.Op.AssignImplicit, value2, null));
            return;
        }
        if (allowExtra)
        {
            Value value2 = this.FullyEvaluate(value);
            this.output.Add(new TAC.Line(null, TAC.Line.Op.AssignImplicit, value2, null));
            return;
        }
        this.RequireEitherToken(tokens, Token.Type.EOL, Token.Type.OpAssign, null);
    }

        private Value ParseExpr(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        return new Parser.ExpressionParsingMethod(this.ParseFunction)(tokens, asLval, statementStart);
    }

        private Value ParseFunction(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseOr);
        Token token = tokens.Peek();
        if (token.type != Token.Type.Keyword || token.text != "function")
        {
            return expressionParsingMethod(tokens, asLval, statementStart);
        }
        tokens.Dequeue();
        this.RequireToken(tokens, Token.Type.LParen, null);
        Function function = new Function(null);
        while (tokens.Peek().type != Token.Type.RParen)
        {
            Token token2 = tokens.Dequeue();
            if (token2.type != Token.Type.Identifier)
            {
                throw new CompilerException(this.errorContext, tokens.lineNum, "got " + token2 + " where an identifier is required");
            }
            Value defaultValue = null;
            if (tokens.Peek().type == Token.Type.OpAssign)
            {
                tokens.Dequeue();
                defaultValue = this.ParseExpr(tokens, false, false);
            }
            function.parameters.Add(new Function.Param(token2.text, defaultValue));
            if (tokens.Peek().type == Token.Type.RParen)
            {
                break;
            }
            this.RequireToken(tokens, Token.Type.Comma, null);
        }
        this.RequireToken(tokens, Token.Type.RParen, null);
        if (this.pendingState != null)
        {
            throw new CompilerException(this.errorContext, tokens.lineNum, "can't start two functions in one statement");
        }
        this.pendingState = new Parser.ParseState();
        function.code = this.pendingState.code;
        return new ValFunction(function);
    }

        private Value ParseOr(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseAnd);
        Value value = expressionParsingMethod(tokens, asLval, statementStart);
        List<TAC.Line> list = null;
        Token token = tokens.Peek();
        while (token.type == Token.Type.Keyword && token.text == "or")
        {
            tokens.Dequeue();
            value = this.FullyEvaluate(value);
            TAC.Line line = new TAC.Line(null, TAC.Line.Op.GotoAifTrulyB, null, value);
            this.output.Add(line);
            if (list == null)
            {
                list = new List<TAC.Line>();
            }
            list.Add(line);
            Value rhsB = expressionParsingMethod(tokens, false, false);
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            int tempNum = nextTempNum;
            this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.AOrB, value, rhsB));
            value = TAC.RTemp(tempNum);
            token = tokens.Peek();
        }
        if (list != null)
        {
            this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoA, TAC.Num((double)(this.output.code.Count + 2)), null));
            this.output.Add(new TAC.Line(value, TAC.Line.Op.AssignA, ValNumber.one, null));
            foreach (TAC.Line line2 in list)
            {
                line2.rhsA = TAC.Num((double)(this.output.code.Count - 1));
            }
        }
        return value;
    }

        private Value ParseAnd(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseNot);
        Value value = expressionParsingMethod(tokens, asLval, statementStart);
        List<TAC.Line> list = null;
        Token token = tokens.Peek();
        while (token.type == Token.Type.Keyword && token.text == "and")
        {
            tokens.Dequeue();
            value = this.FullyEvaluate(value);
            TAC.Line line = new TAC.Line(null, TAC.Line.Op.GotoAifNotB, null, value);
            this.output.Add(line);
            if (list == null)
            {
                list = new List<TAC.Line>();
            }
            list.Add(line);
            Value rhsB = expressionParsingMethod(tokens, asLval, statementStart);
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            int tempNum = nextTempNum;
            this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.AAndB, value, rhsB));
            value = TAC.RTemp(tempNum);
            token = tokens.Peek();
        }
        if (list != null)
        {
            this.output.Add(new TAC.Line(null, TAC.Line.Op.GotoA, TAC.Num((double)(this.output.code.Count + 2)), null));
            this.output.Add(new TAC.Line(value, TAC.Line.Op.AssignA, ValNumber.zero, null));
            foreach (TAC.Line line2 in list)
            {
                line2.rhsA = TAC.Num((double)(this.output.code.Count - 1));
            }
        }
        return value;
    }

        private Value ParseNot(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseComparisons);
        Token token = tokens.Peek();
        Value value;
        if (token.type == Token.Type.Keyword && token.text == "not")
        {
            tokens.Dequeue();
            value = expressionParsingMethod(tokens, false, false);
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            int tempNum = nextTempNum;
            this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.NotA, value, null));
            value = TAC.RTemp(tempNum);
        }
        else
        {
            value = expressionParsingMethod(tokens, asLval, statementStart);
        }
        return value;
    }

        private Value ParseComparisons(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseAddSub);
        Value value = expressionParsingMethod(tokens, asLval, statementStart);
        Value rhsA = value;
        TAC.Line.Op op = Parser.ComparisonOp(tokens.Peek().type);
        bool flag = true;
        while (op != TAC.Line.Op.Noop)
        {
            tokens.Dequeue();
            Value value2 = expressionParsingMethod(tokens, false, false);
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            int num = nextTempNum;
            this.output.Add(new TAC.Line(TAC.LTemp(num), op, rhsA, value2));
            if (flag)
            {
                flag = false;
            }
            else
            {
                Parser.ParseState parseState2 = this.output;
                nextTempNum = parseState2.nextTempNum;
                parseState2.nextTempNum = nextTempNum + 1;
                num = nextTempNum;
                this.output.Add(new TAC.Line(TAC.LTemp(num), TAC.Line.Op.ATimesB, value, TAC.RTemp(num - 1)));
            }
            value = TAC.RTemp(num);
            rhsA = value2;
            op = Parser.ComparisonOp(tokens.Peek().type);
        }
        return value;
    }

        private static TAC.Line.Op ComparisonOp(Token.Type tokenType)
    {
        switch (tokenType)
        {
        case Token.Type.OpEqual:
            return TAC.Line.Op.AEqualB;
        case Token.Type.OpNotEqual:
            return TAC.Line.Op.ANotEqualB;
        case Token.Type.OpGreater:
            return TAC.Line.Op.AGreaterThanB;
        case Token.Type.OpGreatEqual:
            return TAC.Line.Op.AGreatOrEqualB;
        case Token.Type.OpLesser:
            return TAC.Line.Op.ALessThanB;
        case Token.Type.OpLessEqual:
            return TAC.Line.Op.ALessOrEqualB;
        default:
            return TAC.Line.Op.Noop;
        }
    }

        private Value ParseAddSub(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseMultDiv);
        Value value = expressionParsingMethod(tokens, asLval, statementStart);
        Token token = tokens.Peek();
        while (token.type == Token.Type.OpPlus || token.type == Token.Type.OpMinus)
        {
            tokens.Dequeue();
            value = this.FullyEvaluate(value);
            Value rhsB = expressionParsingMethod(tokens, false, false);
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            int tempNum = nextTempNum;
            this.output.Add(new TAC.Line(TAC.LTemp(tempNum), (token.type == Token.Type.OpPlus) ? TAC.Line.Op.APlusB : TAC.Line.Op.AMinusB, value, rhsB));
            value = TAC.RTemp(tempNum);
            token = tokens.Peek();
        }
        return value;
    }

        private Value ParseMultDiv(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseUnaryMinus);
        Value value = expressionParsingMethod(tokens, asLval, statementStart);
        Token token = tokens.Peek();
        while (token.type == Token.Type.OpTimes || token.type == Token.Type.OpDivide || token.type == Token.Type.OpMod)
        {
            tokens.Dequeue();
            value = this.FullyEvaluate(value);
            Value rhsB = expressionParsingMethod(tokens, false, false);
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            int tempNum = nextTempNum;
            switch (token.type)
            {
            case Token.Type.OpTimes:
                this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.ATimesB, value, rhsB));
                break;
            case Token.Type.OpDivide:
                this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.ADividedByB, value, rhsB));
                break;
            case Token.Type.OpMod:
                this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.AModB, value, rhsB));
                break;
            }
            value = TAC.RTemp(tempNum);
            token = tokens.Peek();
        }
        return value;
    }

        private Value ParseUnaryMinus(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseNew);
        if (tokens.Peek().type != Token.Type.OpMinus)
        {
            return expressionParsingMethod(tokens, asLval, statementStart);
        }
        tokens.Dequeue();
        Value value = expressionParsingMethod(tokens, false, false);
        if (value is ValNumber)
        {
            ValNumber valNumber = (ValNumber)value;
            valNumber.value = -valNumber.value;
            return valNumber;
        }
        Parser.ParseState parseState = this.output;
        int nextTempNum = parseState.nextTempNum;
        parseState.nextTempNum = nextTempNum + 1;
        int tempNum = nextTempNum;
        this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.AMinusB, TAC.Num(0.0), value));
        return TAC.RTemp(tempNum);
    }

        private Value ParseNew(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseAddressOf);
        if (tokens.Peek().type != Token.Type.Keyword || tokens.Peek().text != "new")
        {
            return expressionParsingMethod(tokens, asLval, statementStart);
        }
        tokens.Dequeue();
        Value value = expressionParsingMethod(tokens, false, false);
        ValMap valMap = new ValMap();
        valMap.SetElem(ValString.magicIsA, value);
        Parser.ParseState parseState = this.output;
        int nextTempNum = parseState.nextTempNum;
        parseState.nextTempNum = nextTempNum + 1;
        Value value2 = new ValTemp(nextTempNum);
        this.output.Add(new TAC.Line(value2, TAC.Line.Op.CopyA, valMap, null));
        return value2;
    }

        private Value ParseAddressOf(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParsePower);
        if (tokens.Peek().type != Token.Type.AddressOf)
        {
            return expressionParsingMethod(tokens, asLval, statementStart);
        }
        tokens.Dequeue();
        return expressionParsingMethod(tokens, true, statementStart);
    }

        private Value ParsePower(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseCallExpr);
        Value value = expressionParsingMethod(tokens, asLval, statementStart);
        Token token = tokens.Peek();
        while (token.type == Token.Type.OpPower)
        {
            tokens.Dequeue();
            value = this.FullyEvaluate(value);
            Value rhsB = expressionParsingMethod(tokens, false, false);
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            int tempNum = nextTempNum;
            this.output.Add(new TAC.Line(TAC.LTemp(tempNum), TAC.Line.Op.APowB, value, rhsB));
            value = TAC.RTemp(tempNum);
            token = tokens.Peek();
        }
        return value;
    }

        private Value FullyEvaluate(Value val)
    {
        if (val is ValSeqElem || val is ValVar)
        {
            Parser.ParseState parseState = this.output;
            int nextTempNum = parseState.nextTempNum;
            parseState.nextTempNum = nextTempNum + 1;
            ValTemp valTemp = new ValTemp(nextTempNum);
            this.output.Add(new TAC.Line(valTemp, TAC.Line.Op.CallFunctionA, val, ValNumber.zero));
            return valTemp;
        }
        return val;
    }

        private Value ParseCallExpr(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Value value = new Parser.ExpressionParsingMethod(this.ParseMap)(tokens, asLval, statementStart);
        for (;;)
        {
            if (tokens.Peek().type == Token.Type.Dot)
            {
                tokens.Dequeue();
                Token token = this.RequireToken(tokens, Token.Type.Identifier, null);
                value = this.FullyEvaluate(value);
                value = new ValSeqElem(value, new ValString(token.text));
                if (tokens.Peek().type == Token.Type.LParen)
                {
                    value = this.ParseCallArgs(value, tokens);
                }
            }
            else if (tokens.Peek().type == Token.Type.LSquare)
            {
                tokens.Dequeue();
                value = this.FullyEvaluate(value);
                if (tokens.Peek().type == Token.Type.Colon)
                {
                    tokens.Dequeue();
                    Value toIdx = this.ParseExpr(tokens, false, false);
                    Parser.ParseState parseState = this.output;
                    int nextTempNum = parseState.nextTempNum;
                    parseState.nextTempNum = nextTempNum + 1;
                    ValTemp valTemp = new ValTemp(nextTempNum);
                    Intrinsics.CompileSlice(this.output.code, value, null, toIdx, valTemp.tempNum);
                    value = valTemp;
                }
                else
                {
                    Value value2 = this.ParseExpr(tokens, false, false);
                    if (tokens.Peek().type == Token.Type.Colon)
                    {
                        tokens.Dequeue();
                        Value toIdx2 = null;
                        if (tokens.Peek().type != Token.Type.RSquare)
                        {
                            toIdx2 = this.ParseExpr(tokens, false, false);
                        }
                        Parser.ParseState parseState2 = this.output;
                        int nextTempNum = parseState2.nextTempNum;
                        parseState2.nextTempNum = nextTempNum + 1;
                        ValTemp valTemp2 = new ValTemp(nextTempNum);
                        Intrinsics.CompileSlice(this.output.code, value, value2, toIdx2, valTemp2.tempNum);
                        value = valTemp2;
                    }
                    else if (statementStart)
                    {
                        if (value is ValSeqElem)
                        {
                            ValSeqElem valSeqElem = (ValSeqElem)value;
                            Parser.ParseState parseState3 = this.output;
                            int nextTempNum = parseState3.nextTempNum;
                            parseState3.nextTempNum = nextTempNum + 1;
                            ValTemp valTemp3 = new ValTemp(nextTempNum);
                            this.output.Add(new TAC.Line(valTemp3, TAC.Line.Op.ElemBofA, valSeqElem.sequence, valSeqElem.index));
                            value = valTemp3;
                        }
                        value = new ValSeqElem(value, value2);
                    }
                    else
                    {
                        Parser.ParseState parseState4 = this.output;
                        int nextTempNum = parseState4.nextTempNum;
                        parseState4.nextTempNum = nextTempNum + 1;
                        ValTemp valTemp4 = new ValTemp(nextTempNum);
                        this.output.Add(new TAC.Line(valTemp4, TAC.Line.Op.ElemBofA, value, value2));
                        value = valTemp4;
                    }
                }
                this.RequireToken(tokens, Token.Type.RSquare, null);
            }
            else
            {
                if ((!(value is ValVar) && !(value is ValSeqElem)) || (asLval && tokens.Peek().type != Token.Type.LParen))
                {
                    break;
                }
                value = this.ParseCallArgs(value, tokens);
            }
        }
        return value;
    }

        private Value ParseMap(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseList);
        if (tokens.Peek().type != Token.Type.LCurly)
        {
            return expressionParsingMethod(tokens, asLval, statementStart);
        }
        tokens.Dequeue();
        ValMap valMap = new ValMap();
        if (tokens.Peek().type != Token.Type.RCurly)
        {
            for (;;)
            {
                Value value = this.ParseExpr(tokens, false, false);
                if (value == null)
                {
                    break;
                }
                this.RequireToken(tokens, Token.Type.Colon, null);
                Value value2 = this.ParseExpr(tokens, false, false);
                if (value2 == null)
                {
                    goto Block_4;
                }
                valMap.map.Add(value, value2);
                if (this.RequireEitherToken(tokens, Token.Type.Comma, Token.Type.RCurly, null).type == Token.Type.RCurly)
                {
                    goto IL_C3;
                }
            }
            throw new CompilerException(this.errorContext, tokens.lineNum, "expression required as map key");
            Block_4:
            throw new CompilerException(this.errorContext, tokens.lineNum, "expression required as map value");
        }
        tokens.Dequeue();
        IL_C3:
        Parser.ParseState parseState = this.output;
        int nextTempNum = parseState.nextTempNum;
        parseState.nextTempNum = nextTempNum + 1;
        Value value3 = new ValTemp(nextTempNum);
        this.output.Add(new TAC.Line(value3, TAC.Line.Op.CopyA, valMap, null));
        return value3;
    }

        private Value ParseList(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseQuantity);
        if (tokens.Peek().type != Token.Type.LSquare)
        {
            return expressionParsingMethod(tokens, asLval, statementStart);
        }
        tokens.Dequeue();
        ValList valList = new ValList(null);
        if (tokens.Peek().type != Token.Type.RSquare)
        {
            for (;;)
            {
                Value value = this.ParseExpr(tokens, false, false);
                if (value == null)
                {
                    break;
                }
                valList.values.Add(value);
                if (this.RequireEitherToken(tokens, Token.Type.Comma, Token.Type.RSquare, null).type == Token.Type.RSquare)
                {
                    goto IL_85;
                }
            }
            throw new CompilerException("expression required as list element");
        }
        tokens.Dequeue();
        IL_85:
        if (statementStart)
        {
            return valList;
        }
        Parser.ParseState parseState = this.output;
        int nextTempNum = parseState.nextTempNum;
        parseState.nextTempNum = nextTempNum + 1;
        Value value2 = new ValTemp(nextTempNum);
        this.output.Add(new TAC.Line(value2, TAC.Line.Op.CopyA, valList, null));
        return value2;
    }

        private Value ParseQuantity(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Parser.ExpressionParsingMethod expressionParsingMethod = new Parser.ExpressionParsingMethod(this.ParseAtom);
        if (tokens.Peek().type != Token.Type.LParen)
        {
            return expressionParsingMethod(tokens, asLval, statementStart);
        }
        tokens.Dequeue();
        Value result = this.ParseExpr(tokens, false, false);
        this.RequireToken(tokens, Token.Type.RParen, null);
        return result;
    }

        private Value ParseCallArgs(Value funcRef, Lexer tokens)
    {
        int num = 0;
        if (tokens.Peek().type == Token.Type.LParen)
        {
            tokens.Dequeue();
            if (tokens.Peek().type == Token.Type.RParen)
            {
                tokens.Dequeue();
            }
            else
            {
                do
                {
                    Value rhsA = this.ParseExpr(tokens, false, false);
                    this.output.Add(new TAC.Line(null, TAC.Line.Op.PushParam, rhsA, null));
                    num++;
                }
                while (this.RequireEitherToken(tokens, Token.Type.Comma, Token.Type.RParen, null).type != Token.Type.RParen);
            }
        }
        Parser.ParseState parseState = this.output;
        int nextTempNum = parseState.nextTempNum;
        parseState.nextTempNum = nextTempNum + 1;
        ValTemp valTemp = new ValTemp(nextTempNum);
        this.output.Add(new TAC.Line(valTemp, TAC.Line.Op.CallFunctionA, funcRef, TAC.Num((double)num)));
        return valTemp;
    }

        private Value ParseAtom(Lexer tokens, bool asLval = false, bool statementStart = false)
    {
        Token token = (!tokens.AtEnd) ? tokens.Dequeue() : Token.EOL;
        if (token.type == Token.Type.Number)
        {
            double value;
            if (!double.TryParse(token.text, out value))
            {
                throw new CompilerException(string.Format("got {0} where number, string, or identifier is required", token.text));
            }
            return new ValNumber(value);
        }
        else
        {
            if (token.type == Token.Type.String)
            {
                return new ValString(token.text);
            }
            if (token.type == Token.Type.Identifier)
            {
                return new ValVar(token.text);
            }
            if (token.type == Token.Type.Keyword)
            {
                string text = token.text;
                if (text == "null")
                {
                    return null;
                }
                if (text == "true")
                {
                    return ValNumber.one;
                }
                if (text == "false")
                {
                    return ValNumber.zero;
                }
            }
            throw new CompilerException(string.Format("got {0} where number, string, or identifier is required", token));
        }
    }

        private Token RequireToken(Lexer tokens, Token.Type type, string text = null)
    {
        Token token = tokens.AtEnd ? Token.EOL : tokens.Dequeue();
        if (token.type != type || (text != null && token.text != text))
        {
            Token arg = new Token(type, text);
            throw new CompilerException(string.Format("got {0} where {1} is required", token, arg));
        }
        return token;
    }

        private Token RequireEitherToken(Lexer tokens, Token.Type type1, string text1, Token.Type type2, string text2 = null)
    {
        Token token = tokens.AtEnd ? Token.EOL : tokens.Dequeue();
        if ((token.type != type1 && token.type != type2) || (text1 != null && token.text != text1 && text2 != null && token.text != text2))
        {
            Token arg = new Token(type1, text1);
            Token arg2 = new Token(type2, text2);
            throw new CompilerException(string.Format("got {0} where {1} or {2} is required", token, arg, arg2));
        }
        return token;
    }

        private Token RequireEitherToken(Lexer tokens, Token.Type type1, Token.Type type2, string text2 = null)
    {
        return this.RequireEitherToken(tokens, type1, null, type2, text2);
    }

        public static void RunUnitTests()
    {
        string text = "f = function(x); print(\"foo\"); end function; print(false and f)";
        Console.WriteLine("\nTesting parser on: " + text);
        Parser parser = new Parser();
        parser.Parse(text, false);
        TAC.Dump(parser.output.code);
    }

        public string errorContext;

        private Stack<Parser.ParseState> outputStack;

        private Parser.ParseState output;

        private Parser.ParseState pendingState;

        private class BackPatch
    {
                public int lineNum;

                public string waitingFor;
    }

        private class JumpPoint
    {
                public int lineNum;

                public string keyword;
    }

        private class ParseState
    {
                public void Add(TAC.Line line)
        {
            this.code.Add(line);
        }

                public void AddBackpatch(string waitFor)
        {
            this.backpatches.Add(new Parser.BackPatch
            {
                lineNum = this.code.Count - 1,
                waitingFor = waitFor
            });
        }

                public void AddJumpPoint(string jumpKeyword)
        {
            this.jumpPoints.Add(new Parser.JumpPoint
            {
                lineNum = this.code.Count,
                keyword = jumpKeyword
            });
        }

                public Parser.JumpPoint CloseJumpPoint(string keyword)
        {
            int num = this.jumpPoints.Count - 1;
            if (num < 0 || this.jumpPoints[num].keyword != keyword)
            {
                throw new CompilerException(string.Format("'end {0}' without matching '{0}'", keyword));
            }
            Parser.JumpPoint result = this.jumpPoints[num];
            this.jumpPoints.RemoveAt(num);
            return result;
        }

                public void Patch(string keywordFound, int reservingLines = 0)
        {
            this.Patch(keywordFound, null, reservingLines);
        }

                public void Patch(string keywordFound, string alsoPatch, int reservingLines = 0)
        {
            int num = this.backpatches.Count - 1;
            while (num >= 0 && !(this.backpatches[num].waitingFor == keywordFound))
            {
                if (alsoPatch == null || this.backpatches[num].waitingFor != alsoPatch)
                {
                    throw new CompilerException(string.Concat(new string[]
                    {
                        "'",
                        keywordFound,
                        "' skips expected '",
                        this.backpatches[num].waitingFor,
                        "'"
                    }));
                }
                num--;
            }
            if (num < 0)
            {
                throw new CompilerException("'" + keywordFound + "' without matching block starter");
            }
            Value rhsA = TAC.Num((double)(this.code.Count + reservingLines));
            for (int i = this.backpatches.Count - 1; i >= num; i--)
            {
                this.code[this.backpatches[i].lineNum].rhsA = rhsA;
            }
            this.backpatches.RemoveRange(num, this.backpatches.Count - num);
        }

                public void PatchIfBlock()
        {
            Value rhsA = TAC.Num((double)this.code.Count);
            for (int i = this.backpatches.Count - 1; i >= 0; i--)
            {
                Parser.BackPatch backPatch = this.backpatches[i];
                if (backPatch.waitingFor == "if:MARK")
                {
                    this.backpatches.RemoveAt(i);
                    return;
                }
                if (backPatch.waitingFor == "end if" || backPatch.waitingFor == "else")
                {
                    this.code[backPatch.lineNum].rhsA = rhsA;
                    this.backpatches.RemoveAt(i);
                }
            }
        }

                public List<TAC.Line> code = new List<TAC.Line>();

                public List<Parser.BackPatch> backpatches = new List<Parser.BackPatch>();

                public List<Parser.JumpPoint> jumpPoints = new List<Parser.JumpPoint>();

                public int nextTempNum;
    }

        // (Invoke) Token: 0x06004FEA RID: 20458
    private delegate Value ExpressionParsingMethod(Lexer tokens, bool asLval = false, bool statementStart = false);
}
// END