// Prefer explicit env; otherwise, if running on React dev server (port 3000),
// default to backend on 8085 to avoid relying on a proxy.
const envUrl = process.env.REACT_APP_API_URL;
let fallback = '/api';
try {
	const loc = typeof window !== 'undefined' ? window.location : null;
	if (!envUrl && loc && loc.port === '3000') {
		fallback = 'http://localhost:8085';
	}
} catch {}

export const API_BASE = envUrl || fallback;
