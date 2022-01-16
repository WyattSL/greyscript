export default function processFunctionParameter(p: string): string {
    if (p.length == 0) return "";

    // Parse the user defined function parameters
    const optionalParam = p.match(/\b\w+(\s|)=(\s|)/);

    if (optionalParam) {
        let value = p.substring(optionalParam[0].length);
        let name = optionalParam[0].replace(/(\s|)=(\s|)/, "");

        if (value == "true" || value == "false") return name + ": Bool";
        else if(!Number.isNaN(Number(value))) return name + ": Number";
        else if(value.startsWith("\"")) return name + ": String";
        else if(value.startsWith("[")) return name + ": List";
        else if(value.startsWith("{")) return name + ": Map";
        else return name + ": any";
    }
    else return p.trim() + ": any"
}