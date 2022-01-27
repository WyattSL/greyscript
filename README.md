GreyScript formatting, highlighting, and other cool features for [Grey Hack](https://greyhackgame.com).<br>
Report bugs [here](https://github.com/WyattSL/greyscript/issues).

## Usage
Greyscript's syntax highlighting (*should*) automatically activate if you edit a `.gs` or `.src` file, but to enable it manually, use CTRL+K, CTRL+M and select `Greyscript`.


To use commands, press CTRL+SHIFT+P to view the command bar, and enter `Greyscript:`.

## Features

* `Goto Error` command: will highlight the next existing syntax error
* `Minify` command: will minify current file
* `Build` command: will build your files and put them into a `build` folder. It's also able to minfiy and bundle your files.
* `Interpreter` which enables you to execute code, it includes all intrinsics Grey Hack would too
* `Debugger` which enables you to set breakpoints, run code in a breakpoint context, jump to the next line of execution etc.
* `Autocompletion` which figures out the current context and tries to give suggestions accordingly
* `Hover Tooltips` which give you informations about functions/types
* `Diagnostics` which give you information about syntax errors or invalid encryption methods in the Encode/Decode context

## Settings
If you decide that you do not like some of the awesome features provided by the extension, you may disable certain aspects in the [settings menu](https://code.visualstudio.com/docs/getstarted/settings) of Visual Studio Code.

## Todo

* Add `Grey Hack` intrinsics
