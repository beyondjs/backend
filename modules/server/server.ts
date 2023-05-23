import * as http from 'http';
import {Server, ServerOptions, Socket} from 'socket.io';
import {Connection} from './connection/connection';

// import {instrument} from '@socket.io/admin-ui';
interface IBackendServerSpecs {
    port?: number,
    server?: http.Server
}

export /* bundle */
class BackendServer {
    #server: Server;
    #connections: Map<string, Connection> = new Map();

    #onConnection = async (socket: Socket) => {
        const connection = new Connection(socket);

        const connections = this.#connections;
        connections.set(socket.id, connection);

        const disconnect = () => {
            connections.delete(socket.id);
            connection.disconnect();
            socket.off('disconnect', disconnect);
        }

        socket.on('disconnect', disconnect);
    }

    constructor(specs: IBackendServerSpecs) {
        const options: Partial<ServerOptions> = {
            serveClient: false,
            maxHttpBufferSize: 100000,
            cors: {
                origin: ["https://admin.socket.io"],
                credentials: true
            }
        };

        const server = specs.server ? specs.server : http.createServer();
        const io = this.#server = new Server(server, options);

        // instrument(io, {auth: false});
        io.on('connection', this.#onConnection);

        specs.port && server.listen(specs.port);

        typeof process.send === 'function' && process.send({type: 'ready'});
    }
}
