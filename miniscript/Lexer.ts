

// BEGIN
public class Lexer
{
    public bool AtEnd
    {
        get
        {
            return this.position >= this.inputLength && this.pending.Count == 0;
        }
    }

        public Lexer(string input)
    {
        this.input = input;
        this.inputLength = input.Length;
        this.position = 0;
        this.pending = new Queue<Token>();
    }

        public Token Peek()
    {
        if (this.pending.Count == 0)
        {
            if (this.AtEnd)
            {
                return Token.EOL;
            }
            this.pending.Enqueue(this.Dequeue());
        }
        return this.pending.Peek();
    }

        public Token Dequeue()
    {
        if (this.pending.Count > 0)
        {
            return this.pending.Dequeue();
        }
        this.SkipWhitespaceAndComment();
        if (this.AtEnd)
        {
            return Token.EOL;
        }
        Token token = new Token(Token.Type.Unknown, null);
        int num = this.position;
        string text = this.input;
        int num2 = this.position;
        this.position = num2 + 1;
        char c = text[num2];
        if (!this.AtEnd)
        {
            char c2 = this.input[this.position];
            if (c == '=' && c2 == '=')
            {
                token.type = Token.Type.OpEqual;
            }
            if (c == '!' && c2 == '=')
            {
                token.type = Token.Type.OpNotEqual;
            }
            if (c == '>' && c2 == '=')
            {
                token.type = Token.Type.OpGreatEqual;
            }
            if (c == '<' && c2 == '=')
            {
                token.type = Token.Type.OpLessEqual;
            }
            if (token.type != Token.Type.Unknown)
            {
                this.position++;
                return token;
            }
        }
        if (c == '+')
        {
            token.type = Token.Type.OpPlus;
        }
        else if (c == '-')
        {
            token.type = Token.Type.OpMinus;
        }
        else if (c == '*')
        {
            token.type = Token.Type.OpTimes;
        }
        else if (c == '/')
        {
            token.type = Token.Type.OpDivide;
        }
        else if (c == '%')
        {
            token.type = Token.Type.OpMod;
        }
        else if (c == '^')
        {
            token.type = Token.Type.OpPower;
        }
        else if (c == '(')
        {
            token.type = Token.Type.LParen;
        }
        else if (c == ')')
        {
            token.type = Token.Type.RParen;
        }
        else if (c == '[')
        {
            token.type = Token.Type.LSquare;
        }
        else if (c == ']')
        {
            token.type = Token.Type.RSquare;
        }
        else if (c == '{')
        {
            token.type = Token.Type.LCurly;
        }
        else if (c == '}')
        {
            token.type = Token.Type.RCurly;
        }
        else if (c == ',')
        {
            token.type = Token.Type.Comma;
        }
        else if (c == ':')
        {
            token.type = Token.Type.Colon;
        }
        else if (c == '=')
        {
            token.type = Token.Type.OpAssign;
        }
        else if (c == '<')
        {
            token.type = Token.Type.OpLesser;
        }
        else if (c == '>')
        {
            token.type = Token.Type.OpGreater;
        }
        else if (c == '@')
        {
            token.type = Token.Type.AddressOf;
        }
        else if (c == ';' || c == '\n')
        {
            token.type = Token.Type.EOL;
            token.text = ((c == ';') ? ";" : "\n");
            if (c != ';')
            {
                this.lineNum++;
            }
        }
        if (c == '\r')
        {
            token.type = Token.Type.EOL;
            if (this.position < this.inputLength && this.input[this.position] == '\n')
            {
                this.position++;
                token.text = "\r\n";
            }
            else
            {
                token.text = "\r";
            }
            this.lineNum++;
        }
        if (token.type != Token.Type.Unknown)
        {
            return token;
        }
        if (c == '.' && (this.position >= this.inputLength || !Lexer.IsNumeric(this.input[this.position])))
        {
            token.type = Token.Type.Dot;
            return token;
        }
        if (c == '.' || Lexer.IsNumeric(c))
        {
            token.type = Token.Type.Number;
            while (this.position < this.inputLength)
            {
                char c3 = c;
                c = this.input[this.position];
                if (!Lexer.IsNumeric(c) && c != '.' && c != 'E' && c != 'e' && (c != '-' || (c3 != 'E' && c3 != 'e')))
                {
                    break;
                }
                this.position++;
            }
        }
        else
        {
            if (Lexer.IsIdentifier(c))
            {
                while (this.position < this.inputLength && Lexer.IsIdentifier(this.input[this.position]))
                {
                    this.position++;
                }
                token.text = this.input.Substring(num, this.position - num);
                token.type = (Keywords.IsKeyword(token.text) ? Token.Type.Keyword : Token.Type.Identifier);
                if (token.text == "end")
                {
                    Token token2 = this.Dequeue();
                    if (token2 == null || token2.type != Token.Type.Keyword)
                    {
                        throw new LexerException("'end' without following keyword ('if', 'function', etc.)");
                    }
                    token.text = token.text + " " + token2.text;
                }
                else if (token.text == "else")
                {
                    int num3 = this.position;
                    Token token3 = this.Dequeue();
                    if (token3 != null && token3.text == "if")
                    {
                        token.text = "else if";
                    }
                    else
                    {
                        this.position = num3;
                    }
                }
                return token;
            }
            if (c == '"')
            {
                token.type = Token.Type.String;
                bool flag = false;
                num = this.position;
                bool flag2 = false;
                while (this.position < this.inputLength)
                {
                    string text2 = this.input;
                    num2 = this.position;
                    this.position = num2 + 1;
                    c = text2[num2];
                    if (c == '"')
                    {
                        if (this.position >= this.inputLength || this.input[this.position] != '"')
                        {
                            flag2 = true;
                            break;
                        }
                        flag = true;
                        this.position++;
                    }
                }
                if (!flag2)
                {
                    throw new LexerException("missing closing quote (\")");
                }
                token.text = this.input.Substring(num, this.position - num - 1);
                if (flag)
                {
                    token.text = token.text.Replace("\"\"", "\"");
                }
                return token;
            }
            else
            {
                token.type = Token.Type.Unknown;
            }
        }
        token.text = this.input.Substring(num, this.position - num);
        return token;
    }

        private void SkipWhitespaceAndComment()
    {
        while (!this.AtEnd && Lexer.IsWhitespace(this.input[this.position]))
        {
            this.position++;
        }
        if (this.position < this.input.Length - 1 && this.input[this.position] == '/' && this.input[this.position + 1] == '/')
        {
            this.position += 2;
            while (!this.AtEnd && this.input[this.position] != '\n')
            {
                this.position++;
            }
        }
    }

        public static bool IsNumeric(char c)
    {
        return c >= '0' && c <= '9';
    }

        public static bool IsIdentifier(char c)
    {
        return c == '_' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c > '\u009f';
    }

        public static bool IsWhitespace(char c)
    {
        return c == ' ' || c == '\t';
    }

        public static void Check(Token tok, Token.Type type, string text = null, int lineNum = 0)
    {
        UnitTest.ErrorIfNull(tok);
        if (tok == null)
        {
            return;
        }
        UnitTest.ErrorIf(tok.type != type, string.Concat(new object[]
        {
            "Token type: expected ",
            type,
            ", but got ",
            tok.type
        }));
        UnitTest.ErrorIf(text != null && tok.text != text, "Token text: expected " + text + ", but got " + tok.text);
    }

        public static void CheckLineNum(int actual, int expected)
    {
        UnitTest.ErrorIf(actual != expected, string.Concat(new object[]
        {
            "Lexer line number: expected ",
            expected,
            ", but got ",
            actual
        }));
    }

        public static void RunUnitTests()
    {
        Lexer lexer = new Lexer("42  * 3.14158");
        Lexer.Check(lexer.Dequeue(), Token.Type.Number, "42", 0);
        Lexer.CheckLineNum(lexer.lineNum, 1);
        Lexer.Check(lexer.Dequeue(), Token.Type.OpTimes, null, 0);
        Lexer.Check(lexer.Dequeue(), Token.Type.Number, "3.14158", 0);
        UnitTest.ErrorIf(!lexer.AtEnd, "AtEnd not set when it should be");
        Lexer.CheckLineNum(lexer.lineNum, 1);
        Lexer lexer2 = new Lexer("6*(.1-foo) end if // and a comment!");
        Lexer.Check(lexer2.Dequeue(), Token.Type.Number, "6", 0);
        Lexer.CheckLineNum(lexer2.lineNum, 1);
        Lexer.Check(lexer2.Dequeue(), Token.Type.OpTimes, null, 0);
        Lexer.Check(lexer2.Dequeue(), Token.Type.LParen, null, 0);
        Lexer.Check(lexer2.Dequeue(), Token.Type.Number, ".1", 0);
        Lexer.Check(lexer2.Dequeue(), Token.Type.OpMinus, null, 0);
        Lexer.Check(lexer2.Peek(), Token.Type.Identifier, "foo", 0);
        Lexer.Check(lexer2.Peek(), Token.Type.Identifier, "foo", 0);
        Lexer.Check(lexer2.Dequeue(), Token.Type.Identifier, "foo", 0);
        Lexer.Check(lexer2.Dequeue(), Token.Type.RParen, null, 0);
        Lexer.Check(lexer2.Dequeue(), Token.Type.Keyword, "end if", 0);
        Lexer.Check(lexer2.Dequeue(), Token.Type.EOL, null, 0);
        UnitTest.ErrorIf(!lexer2.AtEnd, "AtEnd not set when it should be");
        Lexer.CheckLineNum(lexer2.lineNum, 1);
        Lexer lexer3 = new Lexer("\"foo\" \"isn't \"\"real\"\"\" \"now \"\"\"\" double!\"");
        Lexer.Check(lexer3.Dequeue(), Token.Type.String, "foo", 0);
        Lexer.Check(lexer3.Dequeue(), Token.Type.String, "isn't \"real\"", 0);
        Lexer.Check(lexer3.Dequeue(), Token.Type.String, "now \"\" double!", 0);
        UnitTest.ErrorIf(!lexer3.AtEnd, "AtEnd not set when it should be");
        Lexer lexer4 = new Lexer("foo\nbar\rbaz\r\nbamf");
        Lexer.Check(lexer4.Dequeue(), Token.Type.Identifier, "foo", 0);
        Lexer.CheckLineNum(lexer4.lineNum, 1);
        Lexer.Check(lexer4.Dequeue(), Token.Type.EOL, null, 0);
        Lexer.Check(lexer4.Dequeue(), Token.Type.Identifier, "bar", 0);
        Lexer.CheckLineNum(lexer4.lineNum, 2);
        Lexer.Check(lexer4.Dequeue(), Token.Type.EOL, null, 0);
        Lexer.Check(lexer4.Dequeue(), Token.Type.Identifier, "baz", 0);
        Lexer.CheckLineNum(lexer4.lineNum, 3);
        Lexer.Check(lexer4.Dequeue(), Token.Type.EOL, null, 0);
        Lexer.Check(lexer4.Dequeue(), Token.Type.Identifier, "bamf", 0);
        Lexer.CheckLineNum(lexer4.lineNum, 4);
        Lexer.Check(lexer4.Dequeue(), Token.Type.EOL, null, 0);
        UnitTest.ErrorIf(!lexer4.AtEnd, "AtEnd not set when it should be");
    }
    public int lineNum = 1;
    public int position;
    private string input;
    private int inputLength;
    private Queue<Token> pending;
}
// END


module.exports = Lexer;