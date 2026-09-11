import {readCursorCredentialCandidates, resolveCursorPaths} from './credentials.js';
import {
    addBucket,
    createRecord,
    emptyBucket,
    formatTier,
    localDateFromEpochMs,
    modelLabel,
    number,
    panelPercentFromLimits,
    parseResetsAt,
    percentToFraction,
    pickAccountEmail,
    recentDateStrings,
    toEpochMs,
    tokenTotal,
    trimModels,
} from './format.js';
import {HttpError, isCancelled} from './http.js';

const API_BASE = 'https://api2.cursor.sh/aiserver.v1.DashboardService';
const EVENTS_PAGE_SIZE = 200;
const EVENTS_MAX_PAGES = 12;

export class CursorClient {
    constructor(http) {
        this._http = http;
        this._cachedStats = null;
    }

    async fetch(settings, {full = false, cancellable = null} = {}) {
        const paths = resolveCursorPaths(settings);
        const candidates = await readCursorCredentialCandidates(paths);
        if (!candidates.length) {
            return createRecord('cursor', 'Cursor', {
                usageStatusText: 'Sign in to Cursor',
                authHelpText: 'Open Cursor and sign in, or run `cursor-agent login`.',
            });
        }

        let lastError = null;
        for (const credentials of candidates) {
            try {
                return await this._fetchWithCredentials(credentials, {full, cancellable});
            } catch (error) {
                if (isCancelled(error))
                    throw error;
                lastError = error;
                if (error instanceof HttpError && error.authFailed)
                    continue;
                return createRecord('cursor', 'Cursor', {
                    usageStatusText: 'Cursor limits unavailable',
                    authHelpText: error instanceof HttpError
                        ? error.message
                        : 'Could not reach Cursor usage API.',
                });
            }
        }

        if (lastError instanceof HttpError && lastError.authFailed) {
            return createRecord('cursor', 'Cursor', {
                usageStatusText: 'Sign in to Cursor',
                authHelpText: 'Cursor session expired. Open Cursor and sign in again, or run `cursor-agent login`.',
            });
        }
        return createRecord('cursor', 'Cursor', {
            usageStatusText: 'Cursor limits unavailable',
            authHelpText: lastError instanceof HttpError
                ? lastError.message
                : 'Could not reach Cursor usage API.',
        });
    }

    async _fetchWithCredentials(credentials, {full = false, cancellable = null} = {}) {
        const period = await this._post(credentials.accessToken, 'GetCurrentPeriodUsage', {}, cancellable);
        const tier = await this._fetchPlanTier(credentials.accessToken, credentials.membershipType, cancellable);
        const record = buildRateLimits(period, tier);
        record.accountEmail = pickAccountEmail(credentials.email);
        if (!full) {
            if (this._cachedStats)
                Object.assign(record, this._cachedStats);
            return record;
        }

        try {
            const {events, total} = await this._fetchEvents(credentials.accessToken, cancellable);
            const aggregated = await this._fetchAggregatedModels(credentials.accessToken, cancellable);
            const stats = buildStatsFromEvents(events, total, aggregated);
            this._cachedStats = stats;
            Object.assign(record, stats);
            record.ready = record.ready || hasChartStats(stats);
        } catch (error) {
            if (error instanceof HttpError && error.authFailed)
                throw error;
            if (isCancelled(error))
                throw error;
            if (this._cachedStats)
                Object.assign(record, this._cachedStats);
        }
        return record;
    }

    async _fetchPlanTier(accessToken, fallback, cancellable) {
        try {
            const payload = await this._post(accessToken, 'GetPlanInfo', {}, cancellable);
            const name = payload?.planInfo?.planName;
            if (name)
                return formatTier(name);
        } catch (error) {
            if (error instanceof HttpError && error.authFailed)
                throw error;
        }
        return formatTier(fallback);
    }

    async _fetchEvents(accessToken, cancellable) {
        const events = [];
        let total = 0;
        for (let page = 1; page <= EVENTS_MAX_PAGES; page++) {
            const payload = await this._post(accessToken, 'GetFilteredUsageEvents', {
                page,
                pageSize: EVENTS_PAGE_SIZE,
            }, cancellable);
            total = Math.max(total, number(payload?.totalUsageEventsCount));
            const batch = payload?.usageEventsDisplay;
            if (!Array.isArray(batch) || batch.length === 0)
                break;
            for (const entry of batch) {
                if (entry && typeof entry === 'object')
                    events.push(entry);
            }
            if (batch.length < EVENTS_PAGE_SIZE)
                break;
        }
        return {events, total: total || events.length};
    }

    async _fetchAggregatedModels(accessToken, cancellable) {
        try {
            const payload = await this._post(accessToken, 'GetAggregatedUsageEvents', {}, cancellable);
            const usage = {};
            for (const row of payload?.aggregations ?? []) {
                if (!row || typeof row !== 'object')
                    continue;
                const label = modelLabel(row.modelIntent || row.model);
                const bucket = usage[label] ?? emptyBucket();
                bucket.inputTokens += number(row.inputTokens);
                bucket.outputTokens += number(row.outputTokens);
                bucket.cacheReadInputTokens += number(row.cacheReadTokens || row.cacheReadInputTokens);
                bucket.cacheCreationInputTokens += number(row.cacheWriteTokens || row.cacheCreationInputTokens);
                usage[label] = bucket;
            }
            return usage;
        } catch (error) {
            if (error instanceof HttpError && error.authFailed)
                throw error;
            return {};
        }
    }

    _post(accessToken, path, body, cancellable) {
        return this._http.jsonPost(`${API_BASE}/${path}`, {
            Authorization: `Bearer ${accessToken}`,
            'Connect-Protocol-Version': '1',
        }, body, cancellable);
    }
}

function buildRateLimits(payload, tierLabel) {
    if (!payload || typeof payload !== 'object') {
        return createRecord('cursor', 'Cursor', {
            usageStatusText: 'Cursor limits unavailable',
            authHelpText: 'Usage response was not a JSON object.',
            tierLabel: formatTier(tierLabel),
        });
    }

    const plan = payload.planUsage;
    if (!plan || typeof plan !== 'object') {
        return createRecord('cursor', 'Cursor', {
            usageStatusText: 'Cursor limits unavailable',
            authHelpText: 'Usage response did not include plan usage.',
            tierLabel: formatTier(tierLabel),
        });
    }

    const resetAt = parseResetsAt(payload.billingCycleEnd);
    const membership = formatTier(tierLabel) || formatTier(payload.membershipType);
    let totalPercent = percentToFraction(plan.totalPercentUsed);
    let autoPercent = percentToFraction(plan.autoPercentUsed);
    let apiPercent = percentToFraction(plan.apiPercentUsed);
    if (autoPercent < 0 && plan.autoPercentUsed === undefined)
        autoPercent = 0;
    if (apiPercent < 0 && plan.apiPercentUsed === undefined)
        apiPercent = 0;

    const limits = [];
    if (totalPercent >= 0)
        limits.push({label: 'Included total', percent: totalPercent, resetsAt: resetAt});
    if (autoPercent >= 0)
        limits.push({label: 'Cursor Models', percent: autoPercent, resetsAt: resetAt});
    if (apiPercent >= 0)
        limits.push({label: 'Other Models', percent: apiPercent, resetsAt: resetAt});

    if (limits.length === 0) {
        return createRecord('cursor', 'Cursor', {
            usageStatusText: 'Cursor limits unavailable',
            authHelpText: 'Usage response did not include rate limits.',
            tierLabel: membership,
        });
    }

    return createRecord('cursor', 'Cursor', {
        ready: true,
        signedIn: true,
        limits,
        tierLabel: membership,
        panelPercent: panelPercentFromLimits(limits),
    });
}

function eventTokenUsage(event) {
    const usage = event?.tokenUsage && typeof event.tokenUsage === 'object'
        ? event.tokenUsage
        : {};
    const bucket = emptyBucket();
    bucket.inputTokens = number(usage.inputTokens);
    bucket.outputTokens = number(usage.outputTokens);
    bucket.cacheReadInputTokens = number(usage.cacheReadTokens || usage.cacheReadInputTokens);
    bucket.cacheCreationInputTokens = number(usage.cacheWriteTokens || usage.cacheCreationInputTokens);
    return bucket;
}

function buildStatsFromEvents(events, reportedTotal, aggregatedModels) {
    const today = recentDateStrings(1)[0];
    const recentDates = recentDateStrings(7);
    const recent = Object.fromEntries(recentDates.map(day => [day, {date: day, messageCount: 0}]));
    const modelUsage = {};
    const activeDates = new Set();

    for (const event of events) {
        const ms = toEpochMs(event.timestamp);
        if (ms === null)
            continue;
        const day = localDateFromEpochMs(ms);
        const bucket = eventTokenUsage(event);
        const total = tokenTotal(bucket);
        const label = modelLabel(event.model || event.modelIntent);

        if (total > 0) {
            activeDates.add(day);
            if (!modelUsage[label])
                modelUsage[label] = emptyBucket();
            addBucket(modelUsage[label], bucket);
            if (recent[day])
                recent[day].messageCount += total;
        }
    }

    let usage = modelUsage;
    if (Object.keys(usage).length === 0 && aggregatedModels) {
        usage = {};
        for (const [name, bucket] of Object.entries(aggregatedModels)) {
            if (tokenTotal(bucket) > 0)
                usage[name] = {...bucket};
        }
    }

    return {
        recentDays: recentDates.map(day => recent[day]),
        modelUsage: trimModels(usage, 5),
        hasLocalStats: activeDates.size > 0 || Object.keys(usage).length > 0,
        totalPrompts: Math.max(reportedTotal, events.length),
        todayPrompts: today ? (recent[today]?.messageCount ? 1 : 0) : 0,
    };
}

function hasChartStats(stats) {
    return Boolean(stats?.hasLocalStats)
        || Object.keys(stats?.modelUsage ?? {}).length > 0
        || (stats?.recentDays ?? []).some(day => number(day.messageCount) > 0);
}
