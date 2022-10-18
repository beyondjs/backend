import {Events, PendingPromise} from '@beyond-js/kernel/core';
import type {Backend} from '../backend';

declare const bimport: (resource: string, version?: number) => Promise<any>;

declare class Launcher extends Events {
    get status(): Promise<string>;

    start(): Promise<void>;

    stop(): Promise<void>;
}

declare class BeyondLocal {
    on(event: string, listener: any, priority?: number): this;

    get launchers(): {
        get(id: string): Launcher;
    };
}

/**
 * Service launcher required only in local development environment
 */
export default class {
    readonly #backend: Backend;
    #local: BeyondLocal;

    constructor(backend: Backend) {
        this.#backend = backend;
    }

    #promise: PendingPromise<void>;
    #initialise = async () => {
        if (this.#promise) {
            await this.#promise;
            return;
        }
        this.#promise = new PendingPromise();

        if (!this.#backend.local || this.#local) return;
        this.#local = <BeyondLocal>(await bimport('@beyond-js/local/main')).local;
        this.#promise.resolve();
    }

    async check() {
        await this.#initialise();
        if (!this.#local) return;

        const {pkg, local} = this.#backend;
        const id = `${pkg}/${local}`;
        const launcher = this.#local.launchers.get(id);
        const status = await launcher.status;
        if (status === 'running') return;

        await launcher.start();
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
}
