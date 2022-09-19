import {Action, IActionRequest} from './action';
import {bridges} from '../../bridges';
import type {Socket} from 'socket.io';

declare const bimport: (resource: string, version?: number) => Promise<any>;

export class Executor {
    #socket: Socket;

    constructor(socket: Socket) {
        this.#socket = socket;
    }

    /**
     * Execute an action
     *
     * @param rq
     * @return {Promise<{response: (*)}|{error: module.exports.error}>}
     */
    async execute(rq: IActionRequest) {
        const action = new Action(rq);
        if (action.error) return {error: action.error};

        const {module, className, method} = action;
        const {errors, classes} = await bridges.get(module);
        if (errors?.length) {
            throw new Error(`Errors found getting module "${module}" bridges: ${JSON.stringify(errors)}`);
        }
        if (!classes) {
            throw new Error(`Module "${module}" does not expose an actions bridge`);
        }

        if (!classes.has(className)) {
            throw new Error(`Module "${module}" does not expose a class "${className}"`);
        }
        const methods = new Map(classes.get(className));

        if (!methods.has(method)) {
            throw new Error(`Module "${module}" does not expose a class ` +
                `"${className}" with a "${method}" method`);
        }

        // Import the bundle
        let bundle;
        try {
            bundle = await bimport(module);
        } catch (exc) {
            throw new Error(`Error loading bundle "${module}": ${exc.message}`);
        }

        const Class = bundle[className];
        if (typeof Class !== 'function') {
            throw new Error(`Bridge "${module}" does not expose a valid class "${className}", it is not a function`);
        }
        if (!Class.prototype.hasOwnProperty(method)) {
            throw new Error(`Class "${className}" of bridge "${module}" does not expose a method "${method}"`);
        }

        const object = new Class(this.#socket);
        if (typeof object[method] !== 'function') {
            throw new Error(`Class "${className}" of bridge "${module}" ` +
                `does not expose a method "${method}", it is not a function`);
        }

        return await object[method](...rq.params);
    }
}
