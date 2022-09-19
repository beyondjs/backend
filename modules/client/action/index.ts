import type {Socket} from 'socket.io-client';
import {PendingPromise, Events} from '@beyond-js/kernel/core';
import {backends} from '../backends';
import type {Backend} from '../backend';
import {ExecutionError} from './execution-error';

let autoincrement = 0;

interface ActionRequest {
    id: number,
    pkg: string,
    module: string,
    action: string,
    params: any[]
}

export default class extends Events {
    readonly #pkg: string;
    readonly #request: ActionRequest;

    readonly #module: string;
    get module() {
        return this.#module;
    }

    readonly #action: string;
    get action() {
        return this.#action;
    }

    readonly #params: any[];
    get params() {
        return this.#params;
    }

    constructor(backend: string, module: string, action: string, ...params: any[]) {
        super();

        const id = this.#id;
        const pkg = this.#pkg = (() => {
            const split = backend.split('/');
            split.pop(); // Remove the distribution name
            return split.join('/');
        })();

        this.#module = module;
        this.#action = action;
        this.#params = params;
        this.#request = {id, pkg, module, action, params};
    }

    #id = ++autoincrement;
    get id() {
        return this.#id;
    }

    #channel = `response-v2-${this.#id}`;
    get channel() {
        return this.#channel;
    }

    #executed = false;
    get executed() {
        return this.#executed;
    }

    #executing = false;
    get executing() {
        return this.#executing;
    }

    #error = false;
    get error() {
        return this.#error;
    }

    #timer: number;
    #attempts = 0;

    #promise: PendingPromise<any> = new PendingPromise();

    #send = (socket: Socket) => {
        this.#attempts && this.trigger('retrying', this.#attempts);
        this.#attempts++;

        try {
            socket.emit('rpc-v2', this.#request);
        } catch (exc) {
            this.#executing = false;
            this.#executed = true;
            this.#error = true;
            this.#promise.reject(exc);
        }
    }

    async execute() {
        if (this.#executing || this.#executed) return this.#promise;
        this.#executing = true;

        const backend: Backend = await backends.get(this.#pkg);
        if (!backend) throw new Error(`Project "${this.#pkg}" does not have a backend configured`);

        try {
            const socket = await backend.socket;
            if (!socket) {
                const message = `Error getting socket on "${backend.pkg}" backend. `;
                this.#promise.reject(new Error(message));
                return;
            }

            const onresponse = (response: any) => {
                this.#executed = true;
                this.#executing = false;

                clearTimeout(this.#timer);
                socket.off(this.#channel, onresponse);

                const {error, message, source, processingTime} = response;
                void (source); // source can be 'server' or 'cache'
                void (processingTime);

                error ?
                    this.#promise.reject(new ExecutionError(error.message, error.stack)) :
                    this.#promise.resolve(message);
            };

            socket.on(this.#channel, onresponse);
            this.#send(socket);
        } catch (exc) {
            this.#promise.reject(exc);
            return;
        }

        return this.#promise;
    }
}
