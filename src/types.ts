export interface ArgDataCmd {
	type: string;
	subType?: string;
	name: string;
	optional: boolean;
}

export interface ArgDataMap {
	[type: string]: {
		[cmd: string]: ArgDataCmd[]
	}
}

export interface ReturnDataType {
	type: string;
	subType?: string;
}

export interface ReturnDataMap {
	[type: string]: {
		[cmd: string]: ReturnDataType[]
	}
}

export interface CompletionDataMap {
	[type: string]: string[]
}

export interface CompletionTypesMap {
	[type: string]: number
}

export interface ExamplesMap {
	[type: string]: {
		[cmd: string]: string[]
	}
}

export interface HoverDataMap {
	[type: string]: {
		[cmd: string]: string
	}
}

export interface TypeDataMap {
	[type: string]: string
}