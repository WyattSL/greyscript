const compTypeTextMapping: { [type: number]: string } = {
    1: "method",
    2: "function",
    5: "variable",
    7: "interface",
    9: "property",
    20: "constant"
};

export function getCompTypeText(type: number): string {
    return compTypeTextMapping[type];
}