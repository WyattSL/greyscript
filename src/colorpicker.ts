import vscode, {
    TextDocument,
    CancellationToken,
    ColorInformation,
    Range,
    Color,
    Position,
    ColorPresentation
} from 'vscode';

function hexToRgb(hex: string): { r: number, g: number, b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i.exec(hex);
    return result 
	    ? {
	        r: parseInt(result[1], 16),
	        g: parseInt(result[2], 16),
	        b: parseInt(result[3], 16)
	    }
	    : null;
}

function rgbToHex(r: number, g: number, b: number): string {
	const cast = (v: number) => {
		const casted = (r * 255).toString(16);
		return casted.length === 1 ? "0" + casted : casted;
	};
  
    return "#" + cast(r) + cast(g) + cast(b);
  }

export function activate(context: vscode.ExtensionContext) {
    const feature = vscode.languages.registerColorProvider('greyscript', {
        provideDocumentColors(
        	document: vscode.TextDocument,
            token: vscode.CancellationToken
        ): vscode.ColorInformation[] {
            const txt = document.getText();
            const expr = /(?:(?:<color=)?(#[0-9a-f]{6})|<color=\"?(black|blue|green|orange|purple|red|white|yellow)\"?)>/gi;
            // @ts-ignore: Claims matchAll does not exist, needs to be revisited
            const mchs = txt.matchAll(expr);
            const out = [];
            let startPos = 0;
            let prevLine = 0;

            for (let m of mchs) {
                // All text till occurence
                let ps = txt.slice(0,m.index);

                // Get line number
                let pl = ps.split("\n").length - 1;

                // Get line text
                let line = document.lineAt(pl);

                if(prevLine < pl) startPos = 0;

                if(line.text.indexOf(m[0], startPos) == -1) continue;
                
                // Get color tag range
                let range = new Range(pl, line.text.indexOf(m[0], startPos), pl, line.text.indexOf(m[0], startPos) + m[0].length);

                // Parse color
                let color;

                if (m[1]) {
                    range = new Range(pl, line.text.indexOf(m[1], startPos), pl, line.text.indexOf(m[1], startPos) + m[1].length);
                    let d = hexToRgb(m[1]);

                    if (!d) {
                        continue;
                    }

                    color = new Color(d.r, d.g, d.b,16);
                } else {
                    range = new Range(pl, line.text.indexOf(m[2], startPos), pl, line.text.indexOf(m[2], startPos) + m[2].length);
                    switch(m[2]){
                        case "black":
                            color = new Color(0,0,0,16);
                            break;

                        case "white":
                            color = new Color(16,16,16,16);
                            break;

                        case "red":
                            color = new Color(16,0,0,16);
                            break;

                        case "green":
                            color = new Color(0,16,0,16);
                            break;

                        case "blue":
                            color = new Color(0,0,16,16);
                            break;
                        
                        case "orange":
                            color = new Color(255, 165, 0, 16);
                            break;

                        case "purple":
                            color = new Color(128, 0, 128, 16);
                            break;

                        case "yellow":
                            color = new Color(255, 255, 0, 16);
                            break;
                    }
                }

                if (color) {
                    let c = new ColorInformation(range, color)
                    startPos = range.end.character;
                    prevLine = pl;
                    out.push(c);
                }
            }
            return out;
        },
        provideColorPresentations(
        	color: Color,
        	ctx: { document: TextDocument, range: Range },
        	token: CancellationToken
        ): ColorPresentation[] {
            const hex = rgbToHex(color.red, color.green, color.blue);
            ctx.range = new Range(ctx.range.start, new Position(ctx.range.end.line, ctx.range.start.character + hex.length))
            return [new ColorPresentation(hex)];
        }
    });

    if (vscode.workspace.getConfiguration("greyscript").get("colorpicker")) {
    	context.subscriptions.push(feature);
    }
}