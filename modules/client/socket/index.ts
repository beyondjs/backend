import {SingleCall} from '@beyond-js/kernel/core';
import type {Socket} from 'socket.io-client';
import type {Backend} from '../backend';
import Initiator from './initiator';

declare const bimport: (resource: string, version?: number) => Promise<any>;

export default class {
    readonly #backend: Backend;
    readonly #initiator: Initiator;
    #socket: Socket;

    constructor(backend: Backend) {
        this.#backend = backend;
        this.#initiator = new Initiator(backend);
    }

    @SingleCall
    async get(): Promise<Socket> {
        if (this.#socket) return this.#socket;

        const backend = this.#backend;
        const {pkg} = backend;

        // Check if the service is running. Start it if it is not
        pkg !== '@beyond-js/local' && await this.#initiator.check();

        const {io} = await bimport('socket.io-client');
        let query = backend.io.querystring && await backend.io.querystring();

        const {host} = this.#backend;
        return this.#socket = io(host, {transports: ['websocket'], 'query': query});
    }
}
