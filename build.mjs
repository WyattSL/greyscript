// This file is called prepublish. It is responsible for placing any required files in the
// `./computedgrammar` directory to be bundled with the extension.
// It also generates the `./syntaxes/greyscript.tmLanguage.json` file from the template.

import fs from 'fs';
import fetch from 'node-fetch';

if (!fs.existsSync(`./computedgrammar`)) fs.mkdirSync(`./computedgrammar`);

let Template = fs.readFileSync(`./syntaxes/greyscript.tmLanguage.json.template`, `utf8`);

let FetchFile = async(path, url) => {
    let data = await (await fetch(url)).text();
    if (!data || !JSON.parse(data)) throw `${path} invalid data response: ${data}`;
    fs.writeFileSync(path, data);
    if (path == `./computedgrammar/ReturnData.json`) {
        console.log(`good!`)
        let jdata = JSON.parse(data);
        let classes = [];
        let generals = [];
        let nongens = [];
        for (let i in jdata) {
            let d = jdata[i];
            if (i != "General") classes.push(i);
            for (let x in d) {
                if (i == "General") generals.push(x);
                else nongens.push(x);
            }
        }
        Template = Template.replace(`--CLASSES--`, classes.join("|"));
        Template = Template.replace(`--GENFUNCTIONS--`, generals.join("|"));
        Template = Template.replace(`--NONGENFUNCTIONS--`, nongens.join("|"));
        console.log(`Write syntax!`)
        fs.writeFileSync(`./syntaxes/greyscript.tmLanguage.json`, Template);
    }
};

FetchFile(`./computedgrammar/ArgData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/arguments.json`)
FetchFile(`./computedgrammar/CompletionData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/functions.json`)
FetchFile(`./computedgrammar/Encryption.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/encryption.json`)
FetchFile(`./computedgrammar/Examples.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/examples.json`)
FetchFile(`./computedgrammar/HoverData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/descriptions.json`)
FetchFile(`./computedgrammar/Nightly.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/nightly.json`)
FetchFile(`./computedgrammar/ReturnData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/returns.json`)
FetchFile(`./computedgrammar/TypeData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/types.json`)