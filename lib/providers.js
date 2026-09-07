export const PROVIDER_IDS = ['cursor', 'claude', 'codex'];

export function isProviderId(value) {
    return PROVIDER_IDS.includes(value);
}

export function pickRecord(state, provider) {
    if (!state)
        return null;
    if (provider === 'claude')
        return state.claude;
    if (provider === 'codex')
        return state.codex;
    return state.cursor;
}

export function listEnabledProviders(state) {
    const providers = [];
    if (state?.enableCursor)
        providers.push('cursor');
    if (state?.enableClaude)
        providers.push('claude');
    if (state?.enableCodex)
        providers.push('codex');
    return providers;
}

export function resolveActiveProvider(active, enabled) {
    if (enabled.includes(active))
        return active;
    return enabled[0] || 'cursor';
}
