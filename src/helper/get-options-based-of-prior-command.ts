import {
    TextDocument,
    Range,
    Position
} from 'vscode';
import {
    CompData,
    ReturnData
} from '../grammar';
import {
    ASTBase,
    ASTAssignmentStatement,
    Parser,
    Lexer
} from 'greybel-core';
import * as ASTScraper from './ast-scraper';
import ASTStringify from './ast-stringify';

export default function getOptionsBasedOfPriorCommand(
    document: TextDocument,
    range: Range
): any {
    console.log('>>', 'prior', range);

    // Get Target if there was a delimiter before starting character
    const position = new Position(range.start.line, range.start.character - 2);
    const targetRange = document.getWordRangeAtPosition(position);
    const targetWord = document.getText(targetRange);

    // Find type of target
    // Check if target is command
    const compDataType = Object.keys(CompData).find((type: string) => {
        return CompData[type].includes(targetWord);
    });

    // Get return data from command
    if (compDataType) {
        const returnValues = ReturnData[compDataType][targetWord];
        const options: { [key: string]: string[] } = {};

        // Get options based of return value
        for (let returnValue of returnValues) {
            const returnTypeValue = <string>returnValue.type;

             if (CompData.hasOwnProperty(returnTypeValue)) {
                options[returnTypeValue] = CompData[returnTypeValue];
            }
        }

        return Object.keys(options).length > 0 ? options : undefined;
    } else {
        const content = document.getText();
        const parser = new Parser(content, {
            unsafe: true,
            lexer: new Lexer(content, { unsafe: true })
        });
        const chunk = parser.parseChunk();
        const assignments = ASTScraper.findEx((item: ASTBase, level: number) => {
            if (item.type === 'AssignmentStatement') {
                const { variable } = item as ASTAssignmentStatement;
                const identifier = ASTStringify(variable);

                if (identifier === targetWord) {
                    return {
                        valid: true
                    };
                }
            }
        }, chunk);

        console.log('>>', assignments);

        for (let assignment of assignments) {
            const { init } = assignment as ASTAssignmentStatement;

            if (init.type === 'StringLiteral') {
                return {
                    "String": CompData["String"]
                };
            } else if (init.type === 'MapConstructorExpression') {
                return {
                    "Map": CompData["Map"]
                };
            } else if (init.type === 'ListConstructorExpression') {
                return {
                    "List": CompData["List"]
                };
            }

            const rightWord = ASTStringify(init);
            const rightCompDataType = Object.keys(CompData).find((type: string) => {
                return CompData[type].includes(rightWord);
            });

            if (rightCompDataType) {
                const returnValues: any = ReturnData[rightCompDataType][rightWord];
                const options: { [key: string]: string[] } = {};
    
                // Get options based of return value
                for (let returnValue of returnValues){
                    const returnTypeValue = <string>returnValue.type;
    
                    if (CompData.hasOwnProperty(returnTypeValue)) {
                        options[returnTypeValue] = CompData[returnTypeValue];
                    }
                }
    
                return Object.keys(options).length > 0 ? options : undefined;
            }
        }

        console.log("Greyscript: Target is unknown returning all CompData.")
        return CompData;
    }
}