import {BackendServer} from '@beyond-js/backend/server';
import * as http from 'http';

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

interface IBackendServerSpecs {
    port?: number,
    server?: http.Server
}

export /*bundle*/ function listen(port: number | http.Server): void {
    if (typeof (<any>globalThis).__bee === 'object') {
        const specs: IBeeSpecs = (<any>globalThis).__bee.specs;
        port = <number>specs.ports.http;
    }

    if (!port) {
        console.log('Port or Server must be specified');
        return;
    }

    const specs: IBackendServerSpecs = {};
    typeof port === 'number' ? specs.port = port : specs.server = port;
    new BackendServer(specs);
}
