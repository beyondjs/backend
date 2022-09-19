interface StackFrame {
    is: string,
    file: string,
    line: number,
    column: number
}

type Stack = StackFrame[];

export const ExecutionError = class {
    readonly #message: string;
    get message() {
        return this.#message;
    }

    readonly #stack: Stack;
    get stack() {
        return this.#stack;
    }

    constructor(message: string, stack: Stack) {
        this.#message = message;
        this.#stack = stack;
    }
};
