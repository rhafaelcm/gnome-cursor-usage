import GLib from 'gi://GLib';

const UNSAFE_LABEL = /[^A-Za-z0-9._:+/# \-]+/g;
const URLISH = /\b(?:https?|file|qrc|ftp):\/[^\s]*/gi;
const HTML_TAG = /<[^>]*>/g;

export function createRecord(id, name, overrides = {}) {
    return {
        id,
        name,
        ready: false,
        signedIn: false,
        tierLabel: '',
        accountEmail: '',
        usageStatusText: '',
        authHelpText: '',
        limits: [],
        recentDays: [],
        modelUsage: {},
        panelPercent: -1,
        updatedAt: new Date().toISOString(),
        ...overrides,
    };
}

export function number(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? Math.round(n) : 0;
}

export function clamp01(value) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return 0;
    return Math.min(1, Math.max(0, n));
}

export function percentToFraction(value) {
    if (value === null || value === undefined || value === '')
        return -1;
    const n = Number(value);
    if (!Number.isFinite(n))
        return -1;
    return n / 100;
}

export function formatPercent(fraction) {
    if (fraction === null || fraction === undefined || fraction < 0)
        return '—';
    return `${Math.round(fraction * 100)}%`;
}

export function formatTokens(value) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return '0';
    const abs = Math.abs(n);
    const trim = formatted => formatted.replace(/\.0$/, '');
    if (abs >= 1e9)
        return `${trim((n / 1e9).toFixed(1))}B`;
    if (abs >= 1e6)
        return `${trim((n / 1e6).toFixed(1))}M`;
    if (abs >= 1e3)
        return `${trim((n / 1e3).toFixed(1))}K`;
    return String(Math.round(n));
}

export function formatDuration(ms) {
    if (!Number.isFinite(ms) || ms <= 0)
        return 'soon';
    const total = Math.floor(ms / 1000);
    const days = Math.floor(total / 86400);
    const hours = Math.floor((total % 86400) / 3600);
    const minutes = Math.floor((total % 3600) / 60);
    if (days > 0)
        return `${days}d ${hours}h`;
    if (hours > 0)
        return `${hours}h ${minutes}m`;
    return `${Math.max(1, minutes)}m`;
}

export function toEpochMs(value) {
    if (value === null || value === undefined || value === '')
        return null;
    if (typeof value === 'number') {
        if (!Number.isFinite(value))
            return null;
        return Math.abs(value) >= 1e11 ? Math.round(value) : Math.round(value * 1000);
    }

    const text = String(value).trim();
    if (!text)
        return null;
    if (/^-?\d+(\.\d+)?$/.test(text))
        return toEpochMs(Number(text));

    try {
        const parsed = Date.parse(text.endsWith('Z') && !text.includes('+')
            ? text
            : text);
        return Number.isFinite(parsed) ? parsed : null;
    } catch {
        return null;
    }
}

export function parseResetsAt(value) {
    const ms = toEpochMs(value);
    if (ms === null)
        return '';
    try {
        return new Date(ms).toISOString();
    } catch {
        return '';
    }
}

export function formatReset(resetsAt) {
    const ms = toEpochMs(resetsAt);
    if (ms === null)
        return '';
    return `Resets in ${formatDuration(ms - Date.now())}`;
}

export function safeText(value, limit = 200, fallback = '') {
    let text = String(value ?? '');
    text = text.replace(HTML_TAG, ' ');
    text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, ' ');
    text = text.replaceAll('<', ' ').replaceAll('>', ' ');
    text = text.split(/\s+/).filter(Boolean).join(' ');
    if (!text)
        return fallback;
    if (text.length > limit)
        return `${text.slice(0, limit - 1)}…`;
    return text;
}

export function safeLabel(value, limit = 64, fallback = 'unknown') {
    let text = safeText(value, limit * 2, '');
    text = text.replace(URLISH, '');
    text = text.replace(UNSAFE_LABEL, ' ');
    text = text.split(/\s+/).filter(Boolean).join(' ');
    if (!text)
        return fallback;
    if (text.length > limit)
        return `${text.slice(0, limit - 1)}…`;
    return text;
}

export function formatTier(value) {
    const text = String(value ?? '').trim();
    if (!text)
        return '';
    const titled = text.replaceAll('_', ' ').split(/\s+/).filter(Boolean)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
        .join(' ');
    return safeLabel(titled, 32, '');
}

export function modelLabel(raw) {
    const text = safeLabel(raw, 64);
    if (text.toLowerCase() === 'default' || text.toLowerCase() === 'auto')
        return 'Auto';
    return text;
}

export function dateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function recentDateStrings(days = 7) {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    for (let offset = days - 1; offset >= 0; offset--) {
        const date = new Date(today);
        date.setDate(today.getDate() - offset);
        dates.push(dateString(date));
    }
    return dates;
}

export function localDateFromEpochMs(ms) {
    try {
        return dateString(new Date(ms));
    } catch {
        return dateString(new Date());
    }
}

export function formatDayLabel(isoDate) {
    const today = dateString(new Date());
    if (isoDate === today)
        return 'Today';
    const [year, month, day] = isoDate.split('-').map(Number);
    if (!year || !month || !day)
        return isoDate;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString(undefined, {weekday: 'short'});
}

export function emptyBucket() {
    return {
        inputTokens: 0,
        outputTokens: 0,
        cacheReadInputTokens: 0,
        cacheCreationInputTokens: 0,
    };
}

export function tokenTotal(bucket) {
    if (!bucket)
        return 0;
    return number(bucket.inputTokens)
        + number(bucket.outputTokens)
        + number(bucket.cacheReadInputTokens)
        + number(bucket.cacheCreationInputTokens);
}

export function addBucket(dst, src) {
    const incoming = src ?? emptyBucket();
    for (const key of Object.keys(emptyBucket()))
        dst[key] = number(dst[key]) + number(incoming[key]);
}

export function trimModels(usage, max = 24) {
    const entries = Object.entries(usage ?? {});
    if (entries.length <= max)
        return usage ?? {};
    entries.sort((a, b) => tokenTotal(b[1]) - tokenTotal(a[1]));
    return Object.fromEntries(entries.slice(0, max));
}

export function panelPercentFromLimits(limits) {
    if (!Array.isArray(limits) || limits.length === 0)
        return -1;
    const first = limits.find(item => item && item.percent >= 0);
    return first ? clamp01(first.percent) : -1;
}

export function decodeJwtPayload(token) {
    if (!token || typeof token !== 'string')
        return null;
    const parts = token.split('.');
    if (parts.length < 2)
        return null;
    let payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (payload.length % 4)
        payload += '=';
    try {
        return JSON.parse(decodeBase64(payload));
    } catch {
        return null;
    }
}

function decodeBase64(text) {
    if (globalThis.atob) {
        const binary = globalThis.atob(text);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++)
            bytes[i] = binary.charCodeAt(i);
        return new TextDecoder().decode(bytes);
    }
    const bytes = GLib.base64_decode(text);
    return new TextDecoder().decode(bytes);
}

export function jwtExpiryMs(token) {
    const payload = decodeJwtPayload(token);
    const exp = Number(payload?.exp);
    return Number.isFinite(exp) && exp > 0 ? exp * 1000 : 0;
}

export function isJwtExpiringSoon(token, leadMs = 5 * 60 * 1000) {
    const exp = jwtExpiryMs(token);
    return exp > 0 && exp - Date.now() < leadMs;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function pickAccountEmail(...sources) {
    for (const source of sources) {
        const email = extractAccountEmail(source);
        if (email)
            return email;
    }
    return '';
}

function extractAccountEmail(source) {
    if (!source)
        return '';
    if (typeof source === 'string') {
        const text = source.trim();
        if (EMAIL_RE.test(text))
            return text;
        if (text.startsWith('"') && text.endsWith('"')) {
            try {
                return extractAccountEmail(JSON.parse(text));
            } catch {
                return '';
            }
        }
        if (text.startsWith('{')) {
            try {
                return extractAccountEmail(JSON.parse(text));
            } catch {
                return '';
            }
        }
        return extractAccountEmail(decodeJwtPayload(text));
    }
    if (typeof source !== 'object')
        return '';
    const candidates = [
        source.email,
        source.account_email,
        source.emailAddress,
        source.account?.email,
        source.user?.email,
        source.profile?.email,
        source.oauthAccount?.emailAddress,
        source['https://api.openai.com/profile']?.email,
    ];
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && EMAIL_RE.test(candidate.trim()))
            return candidate.trim();
    }
    return '';
}
