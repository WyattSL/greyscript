namespace miniscript
{
    class CompilerException extends MiniscriptException {
        public CompilerExceptionA() : string
        {
            return this.MiniscriptException("Syntax Error")
        }
 
        public CompilerExceptionB(message: string)
        {
            return this.MiniscriptException(message);
        }

        public CompilerExceptionC(context: string, lineNum: number, message: string)
        {
            return this.MiniscriptException(context, lineNum, message)
        }

        public CompilerExceptionD(message: string, inner: Exception)
        {
            return this.MiniscriptException(message, inner)
        }
    }
}