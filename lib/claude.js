import {
    readClaudeCredentials,
    resolveClaudePaths,
    writeClaudeCredentials,
} from './credentials.js';
import {
    createRecord,
    formatTier,
    isJwtExpiringSoon,
    panelPercentFromLimits,
    parseResetsAt,
    percentToFraction,
} from './format.js';
import {HttpError, isCancelled} from './http.js';

const USAGE_URL = 'https://api.anthropic.com/api/oauth/usage';
const PROFILE_URL = 'https://api.anthropic.com/api/oauth/profile';
const REFRESH_URL = 'https://platform.claude.com/v1/oauth/token';
const CLIENT_ID = '9d1c250a-e61b-44d9-88ed-5944d1962f5e';
const SCOPE = 'user:profile user:inference user:sessions:claude_code user:mcp_servers user:file_upload';
const USER_AGENT = 'claude-code/2.1.80';
const EXPIRY_LEAD_MS = 5 * 60 * 1000;

export class ClaudeClient {
    constructor(http) {
        this._http = http;
    }

    async fetch(settings, {cancellable = null} = {}) {
        const paths = resolveClaudePaths(settings);
        let credentials = readClaudeCredentials(paths);
        if (!credentials?.accessToken) {
            return createRecord('claude', 'Claude Code', {
                usageStatusText: 'Sign in to Claude Code',
                authHelpText: 'Install the Claude Code CLI and run `claude login`.',
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
                    return createRecord('claude', 'Claude Code', {
                        usageStatusText: 'Sign in to Claude Code',
                        authHelpText: 'Claude session expired. Run `claude login` again.',
                    });
                }
            }
            if (isCancelled(error))
                throw error;
            return createRecord('claude', 'Claude Code', {
                usageStatusText: 'Claude limits unavailable',
                authHelpText: error instanceof HttpError
                    ? error.rateLimited
                        ? 'Usage API rate limited. Try again in a few minutes.'
                        : error.message
                    : 'Could not reach Claude usage API.',
            });
        }
    }

    async _fetchUsage(credentials, cancellable) {
        const payload = await this._http.jsonGet(USAGE_URL, usageHeaders(credentials.accessToken), cancellable);
        let tier = formatTier(credentials.subscriptionType || credentials.rateLimitTier);
        try {
            const profile = await this._http.jsonGet(
                PROFILE_URL,
                usageHeaders(credentials.accessToken),
                cancellable
            );
            tier = formatTier(profile?.organization?.organization_type
                || profile?.organizationType
                || profile?.subscriptionType
                || profile?.account?.subscriptionType)
                || tier;
        } catch (error) {
            if (error instanceof HttpError && error.authFailed)
                throw error;
        }
        return buildClaudeRecord(payload, tier);
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
        const latest = readClaudeCredentials([credentials.path]) || credentials;
        if (latest.accessToken && latest.accessToken !== credentials.accessToken && !shouldRefresh(latest))
            return latest;
        if (!latest.refreshToken)
            throw new HttpError('Session expired', {status: 401, authFailed: true});

        let payload;
        try {
            payload = await this._http.jsonPost(REFRESH_URL, {
                'Content-Type': 'application/json',
            }, {
                grant_type: 'refresh_token',
                refresh_token: latest.refreshToken,
                client_id: CLIENT_ID,
                scope: SCOPE,
            }, cancellable);
        } catch (error) {
            const reread = readClaudeCredentials([credentials.path]);
            if (reread?.accessToken && reread.accessToken !== latest.accessToken)
                return reread;
            throw error;
        }

        const accessToken = String(payload.access_token || '').trim();
        if (!accessToken)
            throw new HttpError('Session expired', {status: 401, authFailed: true});

        const expiresIn = Number(payload.expires_in);
        const expiresAt = Number.isFinite(expiresIn) && expiresIn > 0
            ? Date.now() + expiresIn * 1000
            : Date.now() + 3600 * 1000;
        const refreshToken = String(payload.refresh_token || '').trim() || latest.refreshToken;
        const nextRaw = {
            ...latest.raw,
            claudeAiOauth: {
                ...(latest.raw?.claudeAiOauth ?? {}),
                accessToken,
                refreshToken,
                expiresAt,
            },
        };
        writeClaudeCredentials(latest.path, nextRaw);
        return {
            ...latest,
            accessToken,
            refreshToken,
            expiresAt,
            raw: nextRaw,
        };
    }
}

function usageHeaders(accessToken) {
    return {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'User-Agent': USER_AGENT,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'oauth-2025-04-20',
    };
}

function shouldRefresh(credentials) {
    const exp = Number(credentials.expiresAt);
    if (Number.isFinite(exp) && exp > 0)
        return exp - Date.now() < EXPIRY_LEAD_MS;
    return isJwtExpiringSoon(credentials.accessToken, EXPIRY_LEAD_MS);
}

function windowLimit(label, window) {
    if (!window || typeof window !== 'object')
        return null;
    const fraction = percentToFraction(
        window.utilization ?? window.used_percentage ?? window.usedPercent
    );
    if (fraction < 0)
        return null;
    return {
        label,
        percent: fraction,
        resetsAt: parseResetsAt(window.resets_at ?? window.resetsAt),
    };
}

function buildClaudeRecord(payload, tierLabel) {
    const extra = payload?.extra_usage || payload?.extraUsage;
    const limits = [
        windowLimit('5-hour', payload?.five_hour ?? payload?.fiveHour),
        windowLimit('Weekly', payload?.seven_day ?? payload?.sevenDay),
        windowLimit('Weekly Opus', payload?.seven_day_opus ?? payload?.sevenDayOpus),
        windowLimit('Weekly Sonnet', payload?.seven_day_sonnet ?? payload?.sevenDaySonnet),
    ].filter(Boolean);

    if (extra?.is_enabled && extra.utilization !== null && extra.utilization !== undefined) {
        const extraLimit = windowLimit('Extra usage', extra);
        if (extraLimit)
            limits.push(extraLimit);
    }

    if (limits.length === 0) {
        return createRecord('claude', 'Claude Code', {
            tierLabel,
            usageStatusText: 'Claude limits unavailable',
            authHelpText: 'Usage response did not include rate limits.',
        });
    }

    return createRecord('claude', 'Claude Code', {
        ready: true,
        signedIn: true,
        tierLabel,
        limits,
        panelPercent: panelPercentFromLimits(limits),
    });
}
