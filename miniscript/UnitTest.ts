


// BEGIN
public static class UnitTest
{
        public static void ReportError(string err)
    {
        console.error(err);
    }

        public static void ErrorIf(bool condition, string err)
    {
        if (condition)
        {
            UnitTest.ReportError(err);
        }
    }

        public static void ErrorIfNull(object obj)
    {
        if (obj == null)
        {
            UnitTest.ReportError("Unexpected null");
        }
    }

        public static void ErrorIfNotNull(object obj)
    {
        if (obj != null)
        {
            UnitTest.ReportError("Expected null, but got non-null");
        }
    }

        public static void ErrorIfNotEqual(string actual, string expected, string desc = "Expected {1}, got {0}")
    {
        if (actual == expected)
        {
            return;
        }
        UnitTest.ReportError(string.Format(desc, actual, expected));
    }

        public static void ErrorIfNotEqual(float actual, float expected, string desc = "Expected {1}, got {0}")
    {
        if (actual == expected)
        {
            return;
        }
        UnitTest.ReportError(string.Format(desc, actual, expected));
    }

        public static void Run()
    {
        Lexer.RunUnitTests();
        Parser.RunUnitTests();
    }
}
// END


