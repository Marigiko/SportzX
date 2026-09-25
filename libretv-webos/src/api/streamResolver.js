export function resolveStream(stream) {
	if (!stream) return null;
	return stream.url || stream?.stream?.url || null;
}
