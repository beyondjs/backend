import Action from "./";
import {Bundle} from '@beyond-js/kernel/bundle';

export /*bundle*/
class ActionsBridge {
    readonly #distribution: string;
    readonly #bundle: string;
    readonly #backend: string;

    constructor(distribution: string, bundle: Bundle) {
        this.#distribution = distribution;
        this.#bundle = bundle.specifier;
        this.#backend = `${bundle.module.pkg}/${this.#distribution}`;
    }

    async execute(action: string, ...params: any[]): Promise<any> {
        const a = new Action(this.#backend, this.#bundle, action, ...params);
        return await a.execute();
    }
}
