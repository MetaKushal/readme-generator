// ─── localStorage keys ────────────────────────────────────────────────────────
const SESSION_KEY = 'readmeai_session';
const HISTORY_KEY = 'readmeai_history';

// ─── Session (in-memory state between navigations, cleared on page reload) ───

export function saveSession(data) {
    try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(data)); } catch (_) {}
}

export function loadSession() {
    try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)) || null; } catch (_) { return null; }
}

// ─── History (persists in localStorage across reloads) ───────────────────────

export function saveToHistory(repoUrl, readmeContent) {
    try {
        const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        const filtered = existing.filter(h => h.repoUrl !== repoUrl);
        const newEntry = {
            id: Date.now(),
            repo: repoUrl.replace(/^https?:\/\/github\.com\//, ''),
            repoUrl,
            time: new Date().toISOString(),
            readme: readmeContent,
        };
        localStorage.setItem(HISTORY_KEY, JSON.stringify([newEntry, ...filtered].slice(0, 20)));
    } catch (_) {}
}

export function loadHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch (_) { return []; }
}

export function deleteFromHistory(id) {
    try {
        const existing = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        localStorage.setItem(HISTORY_KEY, JSON.stringify(existing.filter(h => h.id !== id)));
    } catch (_) {}
}
