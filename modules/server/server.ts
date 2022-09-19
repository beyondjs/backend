import * as http from 'http';
import {Server, ServerOptions, Socket} from 'socket.io';
import {Connection} from './connection/connection';

// import {instrument} from '@socket.io/admin-ui';

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

    constructor(port: number) {
        const options: Partial<ServerOptions> = {
            serveClient: false,
            maxHttpBufferSize: 100000,
            cors: {
                origin: ["https://admin.socket.io"],
                credentials: true
            }
        };

        const server = http.createServer();
        const io = this.#server = new Server(server, options);

        // instrument(io, {auth: false});
        io.on('connection', this.#onConnection);

        server.listen(port);

        typeof process.send === 'function' && process.send({type: 'ready'});
    }
}
