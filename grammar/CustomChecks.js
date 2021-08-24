function fileChars(line, pretype, arg) {
  let r = new RegExp("/[a-zA-Z0-9_-\.]/")
  return arg.match(r)
}

function folderChars(line, pretype, arg) {
  let r = new RegExp("/[a-zA-Z0-9_-]/")
  return arg.match(r)
}

exports.touch = [fileChars]
