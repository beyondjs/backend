import {ServiceIOConfiguration} from './io';
import Socket from './socket';

export /*bundle*/
class Backend {
    readonly #pkg: string;
    get pkg() {
        return this.#pkg;
    }

    readonly #host: string;
    get host() {
        return this.#host;
    }

    readonly #local: string;
    get local() {
        return this.#local;
    }

    #socket: Socket;

    #io = new ServiceIOConfiguration();
    get io() {
        return this.#io;
    }

    constructor(pkg: string, host: string, local?: string) {
        this.#pkg = pkg;
        this.#host = host;
        this.#local = local;
        this.#socket = new Socket(this);
    }

    get socket() {
        return this.#socket.get();
    }
}
