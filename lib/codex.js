import {
    readCodexCredentials,
    resolveCodexPaths,
    writeCodexCredentials,
} from './credentials.js';
import {
    createRecord,
    decodeJwtPayload,
    formatTier,
    isJwtExpiringSoon,
    panelPercentFromLimits,
    parseResetsAt,
    percentToFraction,
    pickAccountEmail,
    toEpochMs,
} from './format.js';
import {HttpError, isCancelled} from './http.js';

const USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage';
const REFRESH_URL = 'https://auth.openai.com/oauth/token';
const CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann';
const REFRESH_MAX_AGE_MS = 8 * 24 * 60 * 60 * 1000;

export class CodexClient {
    constructor(http) {
        this._http = http;
    }

    async fetch(settings, {cancellable = null} = {}) {
        const paths = resolveCodexPaths(settings);
        let credentials = readCodexCredentials(paths);
        if (!credentials?.accessToken) {
            return createRecord('codex', 'Codex', {
                usageStatusText: 'Sign in to Codex',
                authHelpText: 'Install the Codex CLI and run `codex login`.',
            });
        }

        try {
            credentials = await this._maybeRefresh(credentials, cancellable);
            return await this._fetchUsage(credentials, cancellable);
        } catch (error) {
            if (error instanceof HttpError && error.authFailed) {
                try {
                    const refreshed = await this._refresh(credentials, cancellable);
                    return await this._fetchUsage(refreshed, cancellable);
                } catch (refreshError) {
                    if (isCancelled(refreshError))
                        throw refreshError;
                    return createRecord('codex', 'Codex', {
                        usageStatusText: 'Sign in to Codex',
                        authHelpText: 'Codex session expired. Run `codex login` again.',
                    });
                }
            }
            if (isCancelled(error))
                throw error;
            return createRecord('codex', 'Codex', {
                usageStatusText: 'Codex limits unavailable',
                authHelpText: error instanceof HttpError
                    ? error.message
                    : 'Could not reach Codex usage API.',
            });
        }
    }

    async _fetchUsage(credentials, cancellable) {
        const headers = {
            Authorization: `Bearer ${credentials.accessToken}`,
            Accept: 'application/json',
        };
        const accountId = credentials.accountId || accountIdFromToken(credentials.accessToken);
        if (accountId)
            headers['ChatGPT-Account-Id'] = accountId;

        const payload = await this._http.jsonGet(USAGE_URL, headers, cancellable);
        return buildCodexRecord(payload, credentials);
    }

    async _maybeRefresh(credentials, cancellable) {
        if (!credentials.refreshToken)
            return credentials;
        if (!shouldRefresh(credentials))
            return credentials;
        try {
            return await this._refresh(credentials, cancellable);
        } catch (error) {
            if (error instanceof HttpError && error.authFailed)
                throw error;
            return credentials;
        }
    }

    async _refresh(credentials, cancellable) {
        if (!credentials.refreshToken)
            throw new HttpError('Session expired', {status: 401, authFailed: true});

        const payload = await this._http.jsonPost(REFRESH_URL, {}, {
            client_id: CLIENT_ID,
            grant_type: 'refresh_token',
            refresh_token: credentials.refreshToken,
        }, cancellable);

        const accessToken = String(payload.access_token || '').trim();
        if (!accessToken)
            throw new HttpError('Session expired', {status: 401, authFailed: true});

        const nextRaw = {
            ...credentials.raw,
            tokens: {
                ...(credentials.raw?.tokens ?? {}),
                access_token: accessToken,
                refresh_token: payload.refresh_token || credentials.refreshToken,
                id_token: payload.id_token || credentials.raw?.tokens?.id_token,
                account_id: credentials.accountId || credentials.raw?.tokens?.account_id,
            },
            last_refresh: new Date().toISOString(),
        };
        writeCodexCredentials(credentials.path, nextRaw);
        return {
            ...credentials,
            accessToken,
            refreshToken: String(nextRaw.tokens.refresh_token || '').trim() || credentials.refreshToken,
            accountId: String(nextRaw.tokens.account_id || '').trim() || credentials.accountId,
            lastRefresh: nextRaw.last_refresh,
            idToken: String(nextRaw.tokens.id_token || '').trim() || credentials.idToken,
            email: pickAccountEmail(nextRaw.tokens.id_token, credentials.email),
            raw: nextRaw,
        };
    }
}

function shouldRefresh(credentials) {
    if (isJwtExpiringSoon(credentials.accessToken))
        return true;
    const last = toEpochMs(credentials.lastRefresh);
    return last !== null && Date.now() - last > REFRESH_MAX_AGE_MS;
}

function accountIdFromToken(token) {
    const payload = decodeJwtPayload(token);
    const auth = payload?.['https://api.openai.com/auth'];
    return String(auth?.chatgpt_account_id || payload?.chatgpt_account_id || '').trim() || null;
}

function planFromToken(token) {
    const payload = decodeJwtPayload(token);
    const auth = payload?.['https://api.openai.com/auth'];
    return formatTier(auth?.chatgpt_plan_type || payload?.chatgpt_plan_type || '');
}

function pickWindow(source, keys) {
    for (const key of keys) {
        const value = source?.[key];
        if (value && typeof value === 'object')
            return value;
    }
    return null;
}

function windowLimit(label, window) {
    if (!window)
        return null;
    let fraction = percentToFraction(window.used_percent ?? window.usedPercent);
    if (fraction < 0 && window.used_percent === undefined && window.usedPercent === undefined)
        fraction = 0;
    const resetAt = parseResetsAt(
        window.reset_at
        ?? window.resetAt
        ?? (window.reset_after_seconds !== undefined
            ? Date.now() + Number(window.reset_after_seconds) * 1000
            : null)
        ?? (window.resetAfterSeconds !== undefined
            ? Date.now() + Number(window.resetAfterSeconds) * 1000
            : null)
    );
    return {
        label,
        percent: fraction < 0 ? 0 : fraction,
        resetsAt: resetAt,
    };
}

function buildCodexRecord(payload, credentials) {
    const rate = payload?.rate_limit || payload?.rateLimits || payload || {};
    const primary = windowLimit('5-hour', pickWindow(rate, [
        'primary_window',
        'primary',
        'five_hour',
        'five_hour_limit',
        'five_hour_rate_limit',
        'fiveHour',
    ]));
    const weekly = windowLimit('Weekly', pickWindow(rate, [
        'secondary_window',
        'secondary',
        'weekly',
        'weekly_limit',
        'weekly_rate_limit',
    ]));
    const limits = [primary, weekly].filter(Boolean);
    const tier = formatTier(payload?.plan_type || payload?.planType) || planFromToken(credentials.accessToken);

    if (limits.length === 0) {
        return createRecord('codex', 'Codex', {
            tierLabel: tier,
            accountEmail: pickAccountEmail(credentials.email, credentials.idToken, credentials.accessToken),
            usageStatusText: 'Codex limits unavailable',
            authHelpText: 'Usage response did not include rate limits.',
        });
    }

    return createRecord('codex', 'Codex', {
        ready: true,
        signedIn: true,
        tierLabel: tier,
        accountEmail: pickAccountEmail(credentials.email, credentials.idToken, credentials.accessToken),
        limits,
        panelPercent: panelPercentFromLimits(limits),
    });
}
