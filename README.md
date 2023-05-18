GreyScript formatting, highlighting, and other cool features for [Grey Hack](https://greyhackgame.com).<br>
Report bugs [here](https://github.com/WyattSL/greyscript/issues).

## Usage
Greyscript's syntax highlighting (*should*) automatically activate if you edit a `.gs` or `.src` file, but to enable it manually, use CTRL+K, CTRL+M and select `Greyscript`.


To use commands, press CTRL+SHIFT+P to view the command bar, and enter `Greyscript:`.

Greyscript has a `Goto Error` command, which *should* be able to take the error line given from a program, and translate it to the actual line. Grey Hack has (*or had?*) a known bug where the line given would sometimes be off by an amount, due to certain circumstances.

Greyscript also has a `Minify` command, which *should* able to minify the current file.

## Settings
If you decide that you do not like some of the awesome features provided by the extension, you may disable certain aspects in the [settings menu](https://code.visualstudio.com/docs/getstarted/settings) of Visual Studio Code.

## JsDoc
Greyscript supports *some* of the JsDoc documentation features! The following attributes are supported: `@description`, `@param`, `@return`, `@author`, `@example`, `@deprecated`, `@readonly`, with more planned. You may use them like the following:
```js
// Concatinate or add three strings or numbers.
// @description (Why is this a function again?)
// @param a {String|Number} String or number 1
// @param b {String|Number} String or number 2
// @param c {String|Number} String or number 3
// @return {String|Number} The concatination of a, b, and c
// @author WyattL
// @example foo("Hello", " ", "There!") // Hello There!
// @example foo(1,2,5) 
foo = function(a,b,c)
    return a+b+c
end function
```