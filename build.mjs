// This file is called prepublish. It is responsible for placing any required files in the
// `./computedgrammar` directory to be bundled with the extension.

import fs from 'fs';
import fetch from 'node-fetch';

if (!fs.existsSync(`./computedgrammar`)) fs.mkdirSync(`./computedgrammar`);

let FetchFile = async(path, url) => {
    let data = await (await fetch(url)).text();
    if (!data || !JSON.parse(data)) throw `${path} invalid data response: ${data}`;
    fs.writeFileSync(path, data);
};

FetchFile(`./computedgrammar/ArgData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/arguments.json`)
FetchFile(`./computedgrammar/CompletionData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/functions.json`)
FetchFile(`./computedgrammar/Encryption.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/encryption.json`)
FetchFile(`./computedgrammar/Examples.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/examples.json`)
FetchFile(`./computedgrammar/HoverData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/descriptions.json`)
FetchFile(`./computedgrammar/Nightly.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/nightly.json`)
FetchFile(`./computedgrammar/ReturnData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/returns.json`)
FetchFile(`./computedgrammar/TypeData.json`, `https://raw.githubusercontent.com/WyattSL/greydocs/main/_data/types.json`)