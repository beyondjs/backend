const EXPIRATION = (() => {
	if (!process.env.CACHE_EXPIRATION_TIME || isNaN(parseInt(process.env.CACHE_EXPIRATION_TIME))) return 60000;
	return parseInt(process.env.CACHE_EXPIRATION_TIME);
})();
export class Cache {
	#socketId: string;
	#cache: Map<string, any> = new Map();
	#times: { key: string; time: number }[] = [];
	#EXPIRATION = EXPIRATION; // 30 sec of expiration time

	constructor(socketId: string) {
		this.#socketId = socketId;
		setInterval(this.#clean, 1000);
	}

	#clean = () => {
		if (!this.#times.length) return;

		const expired = Date.now() - this.#EXPIRATION;
		let rq = this.#times[0];
		if (rq.time > expired) return;

		// Expire item
		this.#times.shift();
		this.#cache.delete(rq.key);
	};

	has(key: string): boolean {
		key = `${this.#socketId}.${key}`;
		return this.#cache.has(key);
	}

	get(key: string): any {
		key = `${this.#socketId}.${key}`;
		return this.#cache.get(key);
	}

	insert(key: string, value: any) {
		key = `${this.#socketId}.${key}`;
		if (this.#cache.has(key)) {
			console.error(`Cache key "${key}" already set`);
			this.update(key, value);
			return;
		}

		this.#cache.set(key, value);
		this.#times.push({ key: key, time: Date.now() });
	}

	update(key: string, value: any) {
		key = `${this.#socketId}.${key}`;
		if (!this.#cache.has(key)) {
			console.warn(`Cache key "${key}" not set`);
		}
		this.#cache.set(key, value);
	}
}
