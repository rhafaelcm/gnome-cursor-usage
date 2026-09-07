import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

const MAX_LOCAL_JSON_BYTES = 256_000;

export function expandUserPath(path) {
    const text = String(path ?? '').trim();
    if (!text)
        return '';
    if (text === '~')
        return GLib.get_home_dir();
    if (text.startsWith('~/'))
        return GLib.build_filenamev([GLib.get_home_dir(), text.slice(2)]);
    if (text.startsWith('$HOME/'))
        return GLib.build_filenamev([GLib.get_home_dir(), text.slice(6)]);
    return text;
}

export function defaultCursorStateDb() {
    return GLib.build_filenamev([
        GLib.get_user_config_dir(),
        'Cursor',
        'User',
        'globalStorage',
        'state.vscdb',
    ]);
}

export function defaultCursorAuthJson() {
    return GLib.build_filenamev([
        GLib.get_user_config_dir(),
        'cursor',
        'auth.json',
    ]);
}

export function defaultCodexAuthJsons() {
    return [
        GLib.build_filenamev([GLib.get_home_dir(), '.codex', 'auth.json']),
        GLib.build_filenamev([GLib.get_user_config_dir(), 'codex', 'auth.json']),
    ];
}

export function defaultClaudeAuthJsons() {
    const paths = [];
    const configDir = GLib.getenv('CLAUDE_CONFIG_DIR');
    if (configDir)
        paths.push(GLib.build_filenamev([configDir, '.credentials.json']));
    paths.push(GLib.build_filenamev([GLib.get_home_dir(), '.claude', '.credentials.json']));
    paths.push(GLib.build_filenamev([GLib.get_user_config_dir(), 'claude', '.credentials.json']));
    return paths;
}

export function resolveCursorPaths(settings) {
    const stateDb = expandUserPath(settings?.get_string('cursor-state-db')) || defaultCursorStateDb();
    const authJson = expandUserPath(settings?.get_string('cursor-auth-json')) || defaultCursorAuthJson();
    return {stateDb, authJson};
}

export function resolveCodexPaths(settings) {
    const override = expandUserPath(settings?.get_string('codex-auth-json'));
    return override ? [override] : defaultCodexAuthJsons();
}

export function resolveClaudePaths(settings) {
    const override = expandUserPath(settings?.get_string('claude-auth-json'));
    return override ? [override] : defaultClaudeAuthJsons();
}

export function isRegularFile(path) {
    if (!path)
        return false;
    const file = Gio.File.new_for_path(path);
    try {
        return file.query_file_type(Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS, null) === Gio.FileType.REGULAR;
    } catch {
        return false;
    }
}

export function readLocalFile(path, limit = MAX_LOCAL_JSON_BYTES) {
    if (!isRegularFile(path))
        return null;
    const file = Gio.File.new_for_path(path);
    try {
        const info = file.query_info(
            'standard::size',
            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
            null
        );
        if (info.get_size() > limit)
            return null;
        const [ok, contents] = file.load_contents(null);
        if (!ok || !contents)
            return null;
        return new TextDecoder().decode(contents);
    } catch {
        return null;
    }
}

export function readLocalJson(path) {
    const raw = readLocalFile(path);
    if (raw === null)
        return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export function writeJsonAtomic(path, value) {
    const file = Gio.File.new_for_path(path);
    const body = `${JSON.stringify(value, null, 2)}\n`;
    file.replace_contents(
        body,
        null,
        false,
        Gio.FileCreateFlags.REPLACE_DESTINATION | Gio.FileCreateFlags.PRIVATE,
        null
    );
}

export async function readSqliteItems(dbPath, keys) {
    const sqlite = GLib.find_program_in_path('sqlite3');
    if (!sqlite || !isRegularFile(dbPath) || !keys?.length)
        return {};

    const list = keys.map(key => `'${String(key).replaceAll("'", "''")}'`).join(', ');
    const query = `SELECT key, value FROM ItemTable WHERE key IN (${list});`;
    const proc = Gio.Subprocess.new(
        [sqlite, '-readonly', '-noheader', '-batch', '-separator', '\t', dbPath, query],
        Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
    );
    const [stdout] = await proc.communicate_utf8_async(null, null);
    if (!proc.get_successful() || !stdout)
        return {};

    const result = {};
    for (const line of stdout.split('\n')) {
        const trimmed = line.trimEnd();
        if (!trimmed)
            continue;
        const tab = trimmed.indexOf('\t');
        if (tab === -1)
            continue;
        const key = trimmed.slice(0, tab);
        const value = trimmed.slice(tab + 1).trim();
        if (key && value)
            result[key] = value;
    }
    return result;
}

export async function readCursorCredentials(paths) {
    const stateDb = paths?.stateDb || defaultCursorStateDb();
    const authJson = paths?.authJson || defaultCursorAuthJson();

    const fromDb = await readCursorFromStateDb(stateDb);
    if (fromDb?.accessToken)
        return fromDb;

    const fromJson = readCursorFromAuthJson(authJson);
    if (fromJson?.accessToken)
        return fromJson;

    return null;
}

async function readCursorFromStateDb(stateDb) {
    try {
        const items = await readSqliteItems(stateDb, [
            'cursorAuth/accessToken',
            'cursorAuth/stripeMembershipType',
        ]);
        const accessToken = String(items['cursorAuth/accessToken'] ?? '').trim();
        if (!accessToken)
            return null;
        return {
            accessToken,
            membershipType: String(items['cursorAuth/stripeMembershipType'] ?? '').trim() || null,
            source: 'ide',
            path: stateDb,
        };
    } catch {
        return null;
    }
}

function readCursorFromAuthJson(authJson) {
    const payload = readLocalJson(authJson);
    if (!payload)
        return null;
    const accessToken = String(payload.accessToken || payload.token || '').trim();
    if (!accessToken)
        return null;
    return {
        accessToken,
        membershipType: String(
            payload.membershipType
            || payload.stripeMembershipType
            || payload.subscriptionTier
            || ''
        ).trim() || null,
        source: 'agent',
        path: authJson,
    };
}

export function readCodexCredentials(paths) {
    const candidates = Array.isArray(paths) && paths.length
        ? paths
        : defaultCodexAuthJsons();

    for (const path of candidates) {
        const payload = readLocalJson(path);
        if (!payload)
            continue;
        const tokens = payload.tokens && typeof payload.tokens === 'object'
            ? payload.tokens
            : payload;
        const accessToken = String(tokens.access_token || tokens.accessToken || payload.access_token || '').trim();
        if (!accessToken)
            continue;
        return {
            accessToken,
            refreshToken: String(tokens.refresh_token || tokens.refreshToken || '').trim() || null,
            accountId: String(tokens.account_id || tokens.accountId || payload.account_id || '').trim() || null,
            lastRefresh: String(payload.last_refresh || payload.lastRefresh || '').trim() || null,
            source: 'codex',
            path,
            raw: payload,
        };
    }
    return null;
}

export function writeCodexCredentials(path, raw) {
    if (!path || !raw)
        return;
    writeJsonAtomic(path, raw);
}

export function readClaudeCredentials(paths) {
    const candidates = Array.isArray(paths) && paths.length
        ? paths
        : defaultClaudeAuthJsons();

    for (const path of candidates) {
        const payload = readLocalJson(path);
        if (!payload)
            continue;
        const oauth = payload.claudeAiOauth && typeof payload.claudeAiOauth === 'object'
            ? payload.claudeAiOauth
            : payload;
        const accessToken = String(oauth.accessToken || oauth.access_token || payload.accessToken || '').trim();
        if (!accessToken)
            continue;
        return {
            accessToken,
            refreshToken: String(oauth.refreshToken || oauth.refresh_token || '').trim() || null,
            expiresAt: Number(oauth.expiresAt || oauth.expires_at || 0) || 0,
            subscriptionType: String(oauth.subscriptionType || oauth.subscription_type || '').trim() || null,
            rateLimitTier: String(oauth.rateLimitTier || oauth.rate_limit_tier || '').trim() || null,
            source: 'claude',
            path,
            raw: payload,
        };
    }
    return null;
}

export function writeClaudeCredentials(path, raw) {
    if (!path || !raw)
        return;
    writeJsonAtomic(path, raw);
}
