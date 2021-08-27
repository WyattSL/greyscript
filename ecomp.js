const NormVarReg = new RegExp(`^\t*[^'"\s]+\s?=.*`)
const TabVarReg = new RegExp(`^\t*[^'"\s]+\[.*\]\s?=.*`);

exports.run = (src) => {
  let lines = src.split("\n");
  let line;
  for (line of lines) {
    
  }
};
