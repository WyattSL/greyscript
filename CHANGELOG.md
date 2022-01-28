# 2.0.5
- fixed bundler boilerplate "file not defined"
- fixed dynamic file loading - which means builder and interpreter should work now everywhere
- fixed hover link on imported files
- switched to vscode path handling instead of NodeJS path

# 2.0.4
- fixed debugger error handling, differentiates now between runtime and parser errors
- fixed diagnostic when unsafe mode would return an empty result in edge cases

# 2.0.3
- update to latest greybel which use crypto

# 2.0.2
- bundle commonjs differently
- exclude node_modules

# 2.0.1
- bundle commonjs
- bundle browser with iife format

# 2.0.0
- autocompletion overhaul
- hover overhaul
- diagnostics overhaul
- next-error command overhaul
- minify command overhaul
- added build command
- added interpreter
- added debugger
- added typescript
- replace webpack with rollup for browser extension
- added test launch.json for extension
- Refer to the README.md for more information regarding these specific features

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
