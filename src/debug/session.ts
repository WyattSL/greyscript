import {
	LoggingDebugSession,
	InitializedEvent,
	TerminatedEvent,
	StoppedEvent,
	OutputEvent,
	Thread,
	Breakpoint,
	BreakpointEvent,
	Source
} from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';
import { Interpreter, CustomType, Debugger, OperationContext, ContextType } from 'greybel-interpreter';
import { InterpreterResourceProvider } from '../resource';
import { init as initIntrinsics } from 'greybel-intrinsics';

interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	program: string;
	noDebug?: boolean;
}

export class GreybelDebugSession extends LoggingDebugSession {
	public static threadID = 1;
	public lastContext: OperationContext | undefined;
	public breakpoints: Map<string, DebugProtocol.Breakpoint[]> = new Map();

	private _runtime: Interpreter | undefined;
	private _breakpointIncrement: number = 0;

	public constructor() {
		super("greybel-debug.txt");

		// this debugger uses zero-based lines and columns
		this.setDebuggerLinesStartAt1(false);
		this.setDebuggerColumnsStartAt1(false);
	}

	/**
	 * The 'initialize' request is the first request called by the frontend
	 * to interrogate the features the debug adapter provides.
	 */
	protected initializeRequest(response: DebugProtocol.InitializeResponse, args: DebugProtocol.InitializeRequestArguments): void {
		// build and return the capabilities of this debug adapter:
		response.body = response.body || {};

		// the adapter implements the configurationDone request.
		response.body.supportsConfigurationDoneRequest = false;

		// make VS Code use 'evaluate' when hovering over source
		response.body.supportsEvaluateForHovers = false;

		// make VS Code show a 'step back' button
		response.body.supportsStepBack = false;

		// make VS Code support data breakpoints
		response.body.supportsDataBreakpoints = false;

		// make VS Code support completion in REPL
		response.body.supportsCompletionsRequest = false;
		response.body.completionTriggerCharacters = [ ".", "[" ];

		// make VS Code send cancel request
		response.body.supportsCancelRequest = false;

		// make VS Code send the breakpointLocations request
		response.body.supportsBreakpointLocationsRequest = true;

		// make VS Code provide "Step in Target" functionality
		response.body.supportsStepInTargetsRequest = false;

		// the adapter defines two exceptions filters, one with support for conditions.
		response.body.supportsExceptionFilterOptions = false;
		response.body.exceptionBreakpointFilters = [];

		// make VS Code send exceptionInfo request
		response.body.supportsExceptionInfoRequest = false;

		// make VS Code send setVariable request
		response.body.supportsSetVariable = false;

		// make VS Code send setExpression request
		response.body.supportsSetExpression = false;

		// make VS Code send disassemble request
		response.body.supportsDisassembleRequest = false;
		response.body.supportsSteppingGranularity = false;
		response.body.supportsInstructionBreakpoints = false;

		// make VS Code able to read and write variable memory
		response.body.supportsReadMemoryRequest = false;
		response.body.supportsWriteMemoryRequest = false;

		this.sendResponse(response);

		// since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
		// we request them early by sending an 'initializeRequest' to the frontend.
		// The frontend will end the configuration sequence by calling 'configurationDone' request.
		this.sendEvent(new InitializedEvent());
	}

	protected async launchRequest(response: DebugProtocol.LaunchResponse, args: ILaunchRequestArguments) {
		const me = this;
		const vsAPI = new Map();

		vsAPI.set('print', (customValue: CustomType): void => {
            const e: DebugProtocol.OutputEvent = new OutputEvent(`${customValue.toString()}\n`);
			me.sendEvent(e);
        });
		
		me._runtime = new Interpreter({
			target: args.program,
			api: initIntrinsics(vsAPI),
            resourceHandler: new InterpreterResourceProvider().getHandler(),
			debugger: args.noDebug ? new GrebyelPseudoDebugger() : new GrebyelDebugger(me)
		});

		// start the program in the runtime
		try {
			await me._runtime.digest();
			me.sendResponse(response);
		} catch (err: any) {
			me.sendErrorResponse(response, {
				id: 1001,
				format: err.message,
				showUser: true
			});
		}

		me.sendEvent(new TerminatedEvent());
	}

	protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
		// runtime supports no threads so just return a default thread.
		response.body = {
			threads: [
				new Thread(GreybelDebugSession.threadID, "thread 1")
			]
		};
		this.sendResponse(response);
	}

	protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
		this._runtime?.context?.debugger.setBreakpoint(false);
		this.sendResponse(response);
	}

	protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
		this._runtime?.context?.debugger.next();
		this.sendResponse(response);
	}

	protected disconnectRequest(response: DebugProtocol.DisconnectResponse, args: DebugProtocol.DisconnectArguments, request?: DebugProtocol.Request): void {
		this._runtime?.context?.debugger.setBreakpoint(false);
		this._runtime?.exit();
		this.sendResponse(response);
		this.shutdown();
	}

	protected async evaluateRequest(response: DebugProtocol.EvaluateResponse, args: DebugProtocol.EvaluateArguments): Promise<void> {
		try {
			await this._runtime?.context?.debugger.run(args.expression);

			response.body = {
				result: `Execution of ${args.expression} was successful.`,
				variablesReference: 0
			};
		} catch (err: any) {
			response.body = {
				result: err.toString(),
				variablesReference: 0
			};
		}

		this.sendResponse(response);
	}

	protected async setBreakPointsRequest(response: DebugProtocol.SetBreakpointsResponse, args: DebugProtocol.SetBreakpointsArguments): Promise<void> {
		const me = this;
		const path = args.source.path as string;
		const clientLines = args.lines || [];

		const actualBreakpoints0 = clientLines.map((line: number) => {
			const bp = new Breakpoint(
				false,
				line,
				0,
				new Source(path, path)
			) as DebugProtocol.Breakpoint;
			bp.id= me._breakpointIncrement++;
			return bp;
		});
		const actualBreakpoints = await Promise.all<DebugProtocol.Breakpoint>(actualBreakpoints0);

		me.breakpoints.set(path, actualBreakpoints);

		response.body = {
			breakpoints: actualBreakpoints
		};

		this.sendResponse(response);
	}

	protected breakpointLocationsRequest(response: DebugProtocol.BreakpointLocationsResponse, args: DebugProtocol.BreakpointLocationsArguments, request?: DebugProtocol.Request): void {
		if (args.source.path) {
			const breakpoints = this.breakpoints.get(args.source.path) || [];
			const actualBreakpoint = breakpoints.find((bp: DebugProtocol.Breakpoint) => {
				return bp.line === args.line;
			}) as DebugProtocol.Breakpoint;

			if (actualBreakpoint) {
				response.body = {
					breakpoints: [{
						line: args.line
					}]
				};

				this.sendResponse(response);
				return;
			}
		}

		response.body = {
			breakpoints: []
		};

		this.sendResponse(response);
	}
}

class GrebyelDebugger extends Debugger {
	session: GreybelDebugSession;

	constructor(session: GreybelDebugSession) {
		super();
		this.session = session;
	}

	getBreakpoint(operationContext: OperationContext): boolean {
		if (operationContext.type === ContextType.INJECTION) {
			return false;
		}

		const breakpoints = this.session.breakpoints.get(operationContext.target) || [];
		const actualBreakpoint = breakpoints.find((bp: DebugProtocol.Breakpoint) => {
			return bp.line === operationContext.line;
		}) as DebugProtocol.Breakpoint;

		if (actualBreakpoint) {
			actualBreakpoint.verified = true;
			this.session.sendEvent(new BreakpointEvent('changed', actualBreakpoint));
			this.breakpoint = true;
		}

		return this.breakpoint;
	}

	interact(operationContext: OperationContext) {
		this.session.lastContext = operationContext;
		this.session.sendEvent(new StoppedEvent('breakpoint', GreybelDebugSession.threadID));
	}
}

class GrebyelPseudoDebugger extends Debugger {
	getBreakpoint(operationContext: OperationContext): boolean {
		return false;
	}

	interact(operationContext: OperationContext) {
	}
}