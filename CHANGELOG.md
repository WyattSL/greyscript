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