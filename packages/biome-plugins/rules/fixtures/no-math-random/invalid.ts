export const jitter = Math.random() * 100; // fires

export const pick = <A>(items: ReadonlyArray<A>) =>
	items[Math.floor(Math.random() * items.length)]; // fires
