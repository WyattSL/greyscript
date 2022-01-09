export interface ArgDataCmd {
	type: string;
	subType?: string;
	name: string;
	optional: boolean;
}

export interface ArgDataMap {
	[type: string]: {
		[cmd: string]: ArgDataCmd
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