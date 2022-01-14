import {
	LoggingDebugSession,
	InitializedEvent,
	TerminatedEvent,
	StoppedEvent,
	OutputEvent
} from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';
import { Interpreter, CustomType, Debugger, OperationContext } from 'greybel-interpreter';
import { InterpreterResourceProvider } from '../resource';
import { init as initIntrinsics } from 'greybel-intrinsics';

interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
	program: string;
}

export class GreybelDebugSession extends LoggingDebugSession {
	private static threadID = 1;
	private _runtime: Interpreter | undefined;
	private lastContext: OperationContext | undefined;

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
		response.body.supportsCompletionsRequest = true;
		response.body.completionTriggerCharacters = [ ".", "[" ];

		// make VS Code send cancel request
		response.body.supportsCancelRequest = false;

		// make VS Code send the breakpointLocations request
		response.body.supportsBreakpointLocationsRequest = false;

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

		response.body.supportsSingleThreadExecutionRequests = true;

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

		class GrebyelDebugger extends Debugger {
			interact(operationContext: OperationContext) {
				me.lastContext = operationContext;
				me.sendEvent(new StoppedEvent('breakpoint', GreybelDebugSession.threadID));
			}
		}
		
		me._runtime = new Interpreter({
			target: args.program,
			api: initIntrinsics(vsAPI),
            resourceHandler: new InterpreterResourceProvider().getHandler(),
			debugger: new GrebyelDebugger()
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

	protected continueRequest(response: DebugProtocol.ContinueResponse, args: DebugProtocol.ContinueArguments): void {
		this._runtime?.context?.debugger.setBreakpoint(false);
		this.sendResponse(response);
	}

	protected nextRequest(response: DebugProtocol.NextResponse, args: DebugProtocol.NextArguments): void {
		this._runtime?.context?.debugger.next();
		this.sendResponse(response);
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
}

