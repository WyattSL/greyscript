namespace miniscript
{
    class MiniscriptException extends Exception
    {
        constructor(a?,b?,c?,d?) {
            super()
            return this.MiniscriptException(a,b,c,d)
        }
        public MiniscriptException(a?,b?,c?,d?)
        {
            if (!a) return this.MiniscriptExceptionA();
            if (a && !b) return this.MiniscriptExceptionB(a);
            if (a && b && c && !d) return this.MiniscriptExceptionC(a, b, c)
            if (a && b && !c) return this.MiniscriptExceptionD(a, b)
        }

        public MiniscriptExceptionA() {}

        public MiniscriptExceptionB(message: string)
        {
            return this.Exception(message)
        }

        public MiniscriptExceptionC(context: string, lineNum: number, message: string)
        {
            this.location = new SourceLoc(context, lineNum);
        }

        public MiniscriptExceptionD(message: string, inner: Exception)
        {
        }

        public Description() : string
        {
            var text = "Error: ";
            if (this instanceof LexerException)
            {
                text = "Lexer Error: ";
            }
            else if (this instanceof CompilerException)
            {
                text = "Compiler Error: ";
            }
            else if (this instanceof RuntimeException)
            {
                text = "Runtime Error: ";
            }
            text += this.Message;
            if (this.location != null)
            {
                text = text + " " + this.location;
            }
            return text;
        }

        public location : SourceLoc;
    }
}