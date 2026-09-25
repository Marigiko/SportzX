export function fetchEvents(baseUrl) {
	return fetch(`${baseUrl}/events.json`).then(r => r.json());
}
export function fetchCategories(baseUrl) {
	return fetch(`${baseUrl}/eventCats.json`).then(r => r.json());
}
