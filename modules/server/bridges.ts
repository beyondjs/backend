declare const bimport: (resource: string, version?: number) => Promise<any>;

interface ILocalBridges {
    get: (module: string) => Promise<any>
}

type MethodsSpecs = Map<string, {}>;
export type BridgeSpecs = Map<string, MethodsSpecs>;
type BridgesSpecs = Map<string, BridgeSpecs>;

class Bridges {
    // The bridges specification in production environment (not requested to the BEE)
    readonly #bridges: BridgesSpecs;

    constructor() {
        if (typeof (<any>globalThis).__bridges === 'object') return;

        // In production environment get the actions from the actions.specs.json file
        const {specifier} = (<any>globalThis).__app_package;
        const specs: any = bimport(`${specifier}/actions.specs.json`);
        if (!specs) return;

        this.#bridges = new Map(specs);
        this.#bridges.forEach((specs, module) => {
            this.#bridges.set(module, new Map(specs));
        });
    }

    async get(module: string): Promise<{ errors?: string[], classes?: BridgeSpecs }> {
        if (this.#bridges) {
            const classes: BridgeSpecs = this.#bridges.get(module);
            return Promise.resolve({classes});
        }

        // In development environment, request the bridges to the BEE
        const bridges: ILocalBridges = (<any>globalThis).__bridges;
        const response = await bridges.get(module);
        if (!response) return;

        const {errors} = response;
        if (errors?.length) return {errors};

        const classes: BridgeSpecs = new Map(response.bridges);
        classes.forEach((methods, key) => classes.set(key, new Map(methods)));
        return {classes};
    }
}

export const bridges = new Bridges();
