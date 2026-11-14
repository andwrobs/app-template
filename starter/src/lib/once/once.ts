/** Wraps a factory so it runs on the first call and returns that result afterwards. */
export function once<T>(build: () => T): () => T {
	let built: { value: T } | undefined;
	return () => {
		built ??= { value: build() };
		return built.value;
	};
}
