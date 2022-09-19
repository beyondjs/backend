export interface IActionRequest {
    id: string;
    module: string;
    action: string;
    params: any[]
}

export class Action {
    readonly #error: string;
    get error() {
        return this.#error;
    }

    readonly #rq: IActionRequest;

    get id() {
        return this.#rq.id;
    }

    get module() {
        return this.#rq.module;
    }

    readonly #className: string;
    get className() {
        return this.#className;
    }

    readonly #method: string;
    get method() {
        return this.#method;
    }

    get params(): any[] {
        return this.#rq.params;
    }

    constructor(rq: IActionRequest) {
        if (!rq.id) {
            this.#error = 'Action id not set';
            return;
        } else if (typeof rq.module !== 'string') {
            this.#error = 'Module id is invalid or not set';
            return;
        } else if (typeof rq.action !== 'string' || !rq.action) {
            this.#error = 'Action is invalid or not set';
            return;
        } else if (rq.params !== undefined && !(rq.params instanceof Array)) {
            this.#error = 'Invalid parameters';
            return;
        }

        // The first element is the relative file (without its extension) where the actions class is implemented
        const [, className, method] = rq.action.split('//');
        if (!className || !method) {
            this.#error = `Invalid class "${className}" or method "${method}" specification`;
            return;
        }
        this.#className = className;
        this.#method = method;

        this.#rq = rq;
    }
}
