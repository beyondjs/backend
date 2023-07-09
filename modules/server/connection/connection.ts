import type { Socket } from 'socket.io';
import { Executor } from './executor/executor';
import { Cache } from './cache/cache';
import type { IActionRequest } from './executor/action';

declare const bimport: (resource: string, version?: number) => Promise<any>;

const MaxActiveRequests = process.env.MAX_ACTIVE_REQUEST ?? 60;

enum State {
	Executing,
	Executed,
}

export class Connection {
	readonly #socket: Socket;
	readonly #cache: Cache;
	readonly #executor: Executor;
	#counter: number;
	#active: number;

	constructor(socket: Socket) {
		this.#socket = socket;
		this.#executor = new Executor(socket);

		this.#cache = new Cache(socket.id);
		socket.on('rpc-v2', this.#_onmessage);
	}

	disconnect() {
		this.#socket.off('rpc-v2', this.#_onmessage);
	}

	#_onmessage = (message: IActionRequest) => this.#onmessage(message).catch(exc => console.error(exc.stack));

	async #onmessage(rq: IActionRequest) {
		const socket = this.#socket;

		if (typeof rq !== 'object') {
			console.warn('Invalid rpc, request must be an object');
			return;
		}
		if (!rq.id) {
			console.warn('Action id not set');
			return;
		}

		interface IError {
			message: string;
			stack?: any;
		}

		interface IResponse {
			error: IError;
			message: any;
			processingTime: number;
			source: string;
		}

		const respond = (response: Partial<IResponse>): void => {
			const { error, message, processingTime, source } = response;
			socket.emit(`response-v2-${rq.id}`, { error, message, processingTime, source });
		};

		if (this.#cache.has(rq.id)) {
			const cached = this.#cache.get(rq.id);
			if (cached.state === State.Executed) {
				return respond({ message: cached.response });
			} else {
				return; // Continue waiting the response to be ready
			}
		}

		this.#cache.insert(rq.id, { state: State.Executing, requestedTime: Date.now() });

		this.#counter++;

		if (this.#active > MaxActiveRequests) {
			const error = { message: 'Max number of active connections achieved' };
			return respond({ error });
		}

		this.#active++;

		try {
			const response = await this.#executor.execute(rq);
			const cached = this.#cache.get(rq.id);
			const processingTime = cached ? Date.now() - cached.requestedTime : void 0;

			this.#cache.update(rq.id, {
				state: State.Executed,
				requestedTime: cached.requestedTime,
				processingTime: processingTime,
				response: response,
			});

			this.#active--;
			return respond({ message: response, source: 'server', processingTime: processingTime });
		} catch (exc) {
			this.#active--;

			if (!(exc instanceof Error)) return respond({ error: { message: exc } });

			const { message, stack } = exc;
			const { specifier } = (<any>globalThis).__app_package;
			const { local } = await bimport(`${specifier}/config`);
			const error = local ? { message, stack } : { message };
			console.log(stack);
			return respond({ error });
		}
	}
}
