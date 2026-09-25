export function fetchWithTimeout(url, options = {}, timeout = 15000) {
	const controller = new AbortController();
	const id = setTimeout(() => controller.abort(), timeout);
	return fetch(url, {...options, signal: controller.signal}).finally(() => clearTimeout(id));
}
