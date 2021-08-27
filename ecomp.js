const NormVarReg = new RegExp(`^\s*([^'"\s]+)\s?=\s?(.*)$`)
const TabVarReg = new RegExp(`^\s*([^'"\s]+)(\[.*\])+\s?=\s?(.*)$`);
const FunctionReg = new RegExp(`^function(\([a-zA-Z0-9_]+((,\s?[a-zA-Z0-9_]+)*)\))?$`);
const IfReg = new RegExp(`^\s*if (.*) then`);
const ElseIfReg = new RegExp(`^\s*else if (.*) then`);
const ElseReg = new RegExp(`^\s*else`);
const WhileReg = new RegExp(`^\s*while (.*)`);
const ForReg = new RegExp(`^\s*for [a-zA-Z0-9_]+ in .*`);
const EndReg = new RegExp(`^\s*end (if|for|while|function)`);
const Break = new RegExp(`^\s*break$`);
const Continue = new RegExp(`^\s*continue$`);

exports.run = (src) => {
  let errors = [];
  let warns = []
  let lines = src.split("\n");
  let line;
  let nested = []
  for (line of lines) {
    let lt;
    if (line.test(NormVarReg)) lt = "AssignVarNorm";
    if (line.test(TabVarReg)) lt = "AssignVarTable";
    if (line.test(IfReg)) lt = "If";
    if (line.test(ElseIfReg)) lt = "ElseIf"
    if (line.test(ElseReg)) lt = "Else";
    if (line.test(WhileReg)) lt = "While";
    if (line.test(ForReg)) lt = "For";
    if (line.test(EndReg)) lt = "End";
    if (line.test(BreakReg)) lt = "Break";
    if (line.test(ContinueReg)) lt = "Continue"
    
    let nt = nested[nested.length-1];
    
    if (lt == "Break" || lt == "Continue") {
      if (nt != "while" && nt != "for") errors.push({line: line, text: `${lt} Statement outside of loop loop`});
    }
    if (lt.includes("AssignVar")) {
      let d;
      if (lt == "AssignVarNorm") {
        d = line.match(NormVarReg)[1];
      } else {
        d = line.match(TabVarReg)[2];
      }
      if (line.includes("func") && !line.test(FunctionReg)) {
        errors.push({line: line, text: "Function declaration invalid"});
      }
    }
    if (lt == "If") {
      nested.push("if") //TODO check conditional
    }
    if (lt == "ElseIf") {
      if (nested[nested.length-1] == "if") {
        //TODO check conditional
      } else {
        errors.push({line: line, text: "ElseIf outside of If statement"});
      }
    }
    if (lt == "Else") {
      if (nested[nested.length-1] == "if") {
        //TODO check conditional
      } else {
        errors.push({line: line, text: "Else outside of If statement"});
      }
    }
    if (lt == "While") {
      nested.push("while")
      //TODO check conditional
    }
    if (lt == "For") nested.push("for");
    if (lt == "End") {
      let g = line.match(EndReg);
      let nt = nested[nested.length-1]
      if (nt == g[0]) { nested.pop } else {
        errors.push({line: line, text: "End Statement '"+g[0]+" found, expected End Statement '"+nt+"'"});
      }
    }
  }
};
