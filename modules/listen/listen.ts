import {BackendServer} from '@beyond-js/backend/server';

interface IBeeSpecs {
    id: string,
    engine: string,
    dashboard: boolean,
    project: {
        id: number,
        path: string,
        pkg: string
    },
    distribution: {
        name: string,
        local: boolean,
        platform: string,
        bundles: {
            mode: string
        },
        imports: [string, string][]
    },
    ports: {
        bundles: number,
        server: number,
        http: number
    }
}

export /*bundle*/ function listen(port: number): void {
    if (typeof (<any>globalThis).__bee === 'object') {
        const specs: IBeeSpecs = (<any>globalThis).__bee.specs;
        port = specs.ports.http;
    }

    if (!port) {
        console.log('Port must be specified');
        return;
    }

    new BackendServer(port);
}
