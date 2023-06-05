# 3.0.7
- Fix some syntax

# 3.0.6
**This update is for 3.0.1 - 3.0.6 merging from preview into stable.**
- (3.0.1) Documentation is now automatically pulled from [Greydocs](https://wyattsl.github.io/greydocs)
- (3.0.1) User-defined variables & functions are now highlighted.
- (3.0.3) Added some snippets for basic flow control.
- (3.0.6) Improved the performance of the new semantics provider.
- (3.0.6) Variables now support comments, and variables assigned to methods will show the return type of that method.
- (3.0.6) Added JsDoc support! Only `@description`, `@param`, `@returns`, `@example`, `@author`, `@deprecated`, & `@readonly` are supported at this time. Example:
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

# 3.0.5
- Fixed a bug in the semantics provider which would crash highlighting if a function contained a 'type'.

# 3.0.3
- Added some snippets for basic keywords, courtesy of @Crater44

# 3.0.2
- Semantics improved, now colors when variables and functions are used. (Thanks tux for testing)

# 3.0.1
- Instead of having two separate documentations (extension docs, and greydocs website) the extension will now attempt to pull documentation data from Greydocs on startup. This can be disabled in settings if your paranoid. When the extension is updated, the current Greydocs data will also be bundled with the extension, to permit offline use. (If you disable this in settings, it will always use bundled.)
- Added semantics! This is the feature that allows highlighting of specific keywords, like variables. The following things are currently classified: classes (Shell, Computer, etc); functions, parameters, variables, methods, strings, keywords, comments, & numbers. Please note I do not handle the colors assigned: those are dependent on your theme. (Thanks Volk & AweTux for the testing)
- *if your wondering why this is 3.x.x now, it because of how the Visual Studio marketplace works. These changes do* ***not*** *merit a major bump, but after removing the old preview branch that used 2.x.x, new updates have to be 3.x.x*

# 1.9.3
- Updated function hints, comments may now be placed one line above, on the same line, or a line below the function definition.

# 1.9.2
- Updated grammar to latest version of the game.
- Fix "Go to Declaration" ([#25](https://github.com/WyattSL/greyscript/issues/25))
- Added a setting for showing symbols in imported files.
- Fixed hoverdocs not showing under specific circumstances.

# 1.9.1
- Added symbols support.
- Added autocomplete support for import_code

# 1.9.0
- Add cross file declarations and multiple declarations per file. Thanks, [@SlaskoCZ](https://github.com/SlaskoCZ)!

# 1.8.1
- Fix matching patterns for keywords.
- Add support for `File.allow_import`
- Fix description of `List.pop`
- Add descriptions for `Shell.masterkey()`, `Shell.masterkey_direct()`, `Shell.restore_network()`, and `File.meta_info()`.

## 1.7.12
- Hotfix mark `null` constant.
- Hotfix mark `not` constant.

## 1.7.11
- Fix highlighting color always showing support color.
- Add `null` to autocomplete.
- Add `not` to autocomplete.

## 1.7.10
- Fix when closing a `)` it didn't stop showing the parameters.
- Fix autocomplete not always showing all the variable options available.
- Add support for describing user defined functions by adding a comment above the defining line. Example below.
```
// Description of function
random = function()
...
```

## 1.7.9
- Hotfix if hovered over function and prior variable is inside map.

## 1.7.8
- Hotfix certain data being undefined in hover text get function.

## 1.7.7
- Hotfix color picker not resetting startPos.

## 1.7.6
- Fix color picker when same tags occur twice.
- Add parameter autocomplete and hover text.

## 1.7.5
- Add variables in completion items.
- Add function parameter signatures.
- Add grammar changes for \[Nightly\] Update v0.7.4063a

## 1.7.4
- Fix color picking not working.
- Add hover text for variables and own defined functions.
- The constants 'end', 'then' and 'function' are now included in predictions.
- Fix 'else' description being the same as the 'if' description.
- *maybe* Webpack support.

## 1.7.3
- Fix minifier adding unnecessary semi-colons. 

## 1.7.2
- Minifier is now included, to access use CTRL+SHIFT+P to bring up the console, and use the command "Greyscript: Minify".

## 1.7.1
- Webpack support
- Better autocomplete/prediction.

## 1.6.4
- Patch minor coloring issues.

## 1.6.3
- Hotfix for potential bug in encryption detection.

## 1.6.2
- Hotfix for HoverDocs

## 1.6.1
- Support for the new nightly functions.

## 1.6.0
- Introduced support for error checking, will currently check for disallowed functions inside encryption/decryption. Will be expanded in future releases.

## 1.4.2
- Visual Studio Code will now auto-indent as you type.

## 1.4.1
- You may now use Go To Declaration to find the declaration of a variable or function. Rightclick on some text and press ``Go To Declaration`` to try it out.

## 1.4.0
- ``Computer.create_folder`` is now highlighted.
- ``Router.firewall_rules`` is now highlighted.
- Properties should no longer be half-highlighted (e.g. ``val``ue)
- Support functions should now have hover-data associated with them.
- ``hash``, ``wait``, ``yield``, and ``launch_path`` are now properly highlighted and documented.
- ``Goto Error`` should now be **far** more accurate. You should be placed either on the line, or within 1-3 lines in either direction.

## 1.3.5
- ``self`` is now highlighted.
- Fixed some highlighting issues between class definitions.

## 1.3.4
- Highlighting fixes. (again...)

## 1.3.3
- Highlighting fixes.

## 1.3.2
- You can now disable autocomplete or hover-documentation in the GreyScript Configuration. Use CTRL+, to access the VSCode Configuration.

## 1.3.1
- Properly documented ``File.is_folder``
- Added documentation for control characters.


## 1.3.0
- You can now find the accurate line of a error (within like, two or so lines in both directions), this however requires the inaccurate line given by the compiler. You can access this command with CTRL+SHIFT+P, then type in ``Goto Error``. Press enter, then type in the inaccurate line. 

## 1.2.3
- scan_address (*should*) be correctly highlighted.


## 1.2.2
- Fixed duplicates in auto-completion lists.
- Shows all documentation data, instead of just data for strings. (lists/maps)


## 1.2.1
- True/False now receive highlighting.
- The params constant now receives highlighting.


## 1.2.0
- All String, Number, List, and Map functions now receive highlighting, and autocompletion.


## 1.1.1
- All classes now receive highlighting.
- Null now receives highlighting.


## 1.1.0
- Shell.launch is now highlighted.
- Shell.connect_service is now highlighted.
- File.set_owner is properly documented.


## 1.0.1
- Introduction of autocompletion.
- Minor bug fixes.