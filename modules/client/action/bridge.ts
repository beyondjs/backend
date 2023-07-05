import Action from './';
import { Bundle } from '@beyond-js/kernel/bundle';
import { backends } from '../backends';
export /*bundle*/
class ActionsBridge {
	readonly #distribution: string;
	readonly #bundle: string;
	#pkg: string;
	readonly #backend: string;

	get backend() {
		return backends.get(this.#pkg);
	}
	constructor(distribution: string, bundle: Bundle) {
		this.#distribution = distribution;
		this.#bundle = bundle.specifier;
		this.#pkg = bundle.module.pkg;
		this.#backend = `${bundle.module.pkg}/${this.#distribution}`;
	}

	async execute(action: string, ...params: any[]): Promise<any> {
		const a = new Action(this.#backend, this.#bundle, action, ...params);
		return await a.execute();
	}
}
