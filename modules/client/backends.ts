import {Backend} from './backend';
import type Action from './action';

declare const bimport: (resource: string, version?: number) => Promise<any>;

export /*bundle*/ const backends = new class {
    readonly #hosts: Map<string, Backend> = new Map();

    register(pkg: string, host: string) {
        !this.#hosts.has(pkg) && this.#hosts.set(pkg, new Backend(pkg, host));
    }

    async get(pkg: string): Promise<Backend> {
        if (this.#hosts.has(pkg)) return this.#hosts.get(pkg);

        try {
            const {backend: config} = (await bimport(`${pkg}/config`)).default;
            if (!config) {
                console.log(`Backend configuration not set on package "${pkg}"`);
                this.#hosts.set(pkg, void 0);
                return;
            }

            const {host, local} = config;

            // Due to the get method is asynchronous, check if host is already set
            if (this.#hosts.has(pkg)) return this.#hosts.get(pkg);

            const backend = new Backend(pkg, host, local);
            this.#hosts.set(pkg, backend);
            return this.#hosts.get(pkg);
        } catch (exc) {
            console.log(`Error importing package "${pkg}" configuration: ${exc.message}`);
            this.#hosts.set(pkg, void 0);
        }
    }

    /**
     * @deprecated Actually used by the legacy module.execute(...)
     *
     * @param {string} pkg
     * @param {string} distribution
     * @param {string} module
     * @param {string} action
     * @param params
     * @return {Promise<*>}
     */
    async execute(pkg: string, distribution: string, module: string, action: string, ...params: any[]): Promise<any> {
        const a: Action = new (require('./action').default)(`${pkg}/${distribution}`, module, action, ...params);
        return await a.execute();
    }
}
