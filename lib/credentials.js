import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {pickAccountEmail} from './format.js';

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

export function defaultAnthropicCredentialJson() {
    return GLib.build_filenamev([
        GLib.get_user_config_dir(),
        'anthropic',
        'credentials',
        'default.json',
    ]);
}

export function defaultClaudeUserJson() {
    const configDir = GLib.getenv('CLAUDE_CONFIG_DIR');
    if (configDir)
        return GLib.build_filenamev([configDir, '.claude.json']);
    return GLib.build_filenamev([GLib.get_home_dir(), '.claude.json']);
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

export async function isRegularFile(path) {
    if (!path)
        return false;
    const file = Gio.File.new_for_path(path);
    try {
        const info = await queryFileInfo(file, 'standard::type');
        return info.get_file_type() === Gio.FileType.REGULAR;
    } catch {
        return false;
    }
}

export async function readLocalFile(path, limit = MAX_LOCAL_JSON_BYTES) {
    if (!path)
        return null;
    const file = Gio.File.new_for_path(path);
    try {
        const info = await queryFileInfo(file, 'standard::type,standard::size');
        if (info.get_file_type() !== Gio.FileType.REGULAR || info.get_size() > limit)
            return null;
        const contents = await loadFileContents(file);
        if (!contents || contents.length > limit)
            return null;
        return new TextDecoder().decode(contents);
    } catch {
        return null;
    }
}

export async function readLocalJson(path) {
    const raw = await readLocalFile(path);
    if (raw === null)
        return null;
    try {
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
}

export async function writeJsonAtomic(path, value) {
    const file = Gio.File.new_for_path(path);
    const body = `${JSON.stringify(value, null, 2)}\n`;
    const bytes = new GLib.Bytes(new TextEncoder().encode(body));
    await replaceFileContents(file, bytes);
}

function queryFileInfo(file, attributes) {
    return new Promise((resolve, reject) => {
        file.query_info_async(
            attributes,
            Gio.FileQueryInfoFlags.NOFOLLOW_SYMLINKS,
            GLib.PRIORITY_DEFAULT,
            null,
            (_file, result) => {
                try {
                    resolve(file.query_info_finish(result));
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

function loadFileContents(file) {
    return new Promise((resolve, reject) => {
        file.load_contents_async(null, (_file, result) => {
            try {
                resolve(file.load_contents_finish(result)[1]);
            } catch (error) {
                reject(error);
            }
        });
    });
}

function replaceFileContents(file, bytes) {
    return new Promise((resolve, reject) => {
        file.replace_contents_bytes_async(
            bytes,
            null,
            false,
            Gio.FileCreateFlags.REPLACE_DESTINATION | Gio.FileCreateFlags.PRIVATE,
            null,
            (_file, result) => {
                try {
                    resolve(file.replace_contents_finish(result));
                } catch (error) {
                    reject(error);
                }
            }
        );
    });
}

const PYTHON_READ_ITEMS = [
    'import json, sqlite3, sys',
    'db = sys.argv[1]',
    'keys = json.loads(sys.argv[2])',
    'con = sqlite3.connect("file:" + db + "?mode=ro", uri=True)',
    'query = "SELECT key, value FROM ItemTable WHERE key IN (%s)" % (",".join("?" * len(keys)))',
    'for key, value in con.execute(query, keys):',
    '    if value is None:',
    '        continue',
    '    text = value.decode("utf-8", "replace") if isinstance(value, (bytes, bytearray)) else str(value)',
    '    print("%s\\t%s" % (key, text.replace("\\n", " ").replace("\\t", " ")))',
].join('\n');

function findProgram(name) {
    return GLib.find_program_in_path(name) || '';
}

export async function readSqliteItems(dbPath, keys) {
    if (!keys?.length || !await isRegularFile(dbPath))
        return {};
    return querySqliteItems(dbPath, keys);
}

async function querySqliteItems(dbPath, keys) {
    const sqlite = findProgram('sqlite3');
    if (sqlite) {
        const items = await querySqliteItemsCli(sqlite, dbPath, keys);
        if (Object.keys(items).length)
            return items;
    }
    return querySqliteItemsPython(dbPath, keys);
}

async function querySqliteItemsCli(sqlite, dbPath, keys) {
    const list = keys.map(key => `'${String(key).replaceAll("'", "''")}'`).join(', ');
    const query = `SELECT key, value FROM ItemTable WHERE key IN (${list});`;
    const targets = [sqliteFileUri(dbPath), dbPath];
    for (const target of targets) {
        try {
            const proc = Gio.Subprocess.new(
                [sqlite, '-readonly', '-noheader', '-batch', '-separator', '\t', target, query],
                Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            );
            const stdout = await communicateUtf8(proc);
            if (!proc.get_successful() || !stdout)
                continue;
            const result = parseSqliteRows(stdout);
            if (Object.keys(result).length)
                return result;
        } catch {
            // Try the next sqlite open mode.
        }
    }
    return {};
}

async function querySqliteItemsPython(dbPath, keys) {
    const python = findProgram('python3');
    if (!python)
        return {};
    try {
        const proc = Gio.Subprocess.new(
            [python, '-c', PYTHON_READ_ITEMS, dbPath, JSON.stringify(keys)],
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
        );
        const stdout = await communicateUtf8(proc);
        if (!proc.get_successful() || !stdout)
            return {};
        return parseSqliteRows(stdout);
    } catch {
        return {};
    }
}

async function communicateUtf8(proc) {
    try {
        return stdoutFromCommunicate(await proc.communicate_utf8_async(null, null));
    } catch {
        return stdoutFromCommunicate(await new Promise((resolve, reject) => {
            proc.communicate_utf8_async(null, null, (_source, result) => {
                try {
                    resolve(proc.communicate_utf8_finish(result));
                } catch (error) {
                    reject(error);
                }
            });
        }));
    }
}

function stdoutFromCommunicate(result) {
    if (typeof result === 'string')
        return result;
    if (!Array.isArray(result))
        return '';
    if (typeof result[0] === 'string')
        return result[0];
    if (typeof result[1] === 'string')
        return result[1];
    return '';
}

function parseSqliteRows(stdout) {
    const result = {};
    for (const line of stdout.split('\n')) {
        const trimmed = line.trimEnd();
        if (!trimmed)
            continue;
        const tab = trimmed.indexOf('\t');
        if (tab === -1)
            continue;
        const key = trimmed.slice(0, tab);
        const value = unwrapStoredValue(trimmed.slice(tab + 1));
        if (key && value)
            result[key] = value;
    }
    return result;
}

function sqliteFileUri(path) {
    return `file:${path}?mode=ro`;
}

function unwrapStoredValue(value) {
    const text = String(value ?? '').trim();
    if (text.startsWith('"') && text.endsWith('"')) {
        try {
            const parsed = JSON.parse(text);
            if (typeof parsed === 'string' && parsed.trim())
                return parsed.trim();
        } catch {
            // Keep the original text when it is not JSON.
        }
    }
    return text;
}

export async function readCursorCredentialCandidates(paths) {
    const stateDb = paths?.stateDb || defaultCursorStateDb();
    const authJson = paths?.authJson || defaultCursorAuthJson();
    const candidates = [];
    const seen = new Set();
    const add = credentials => {
        const token = credentials?.accessToken;
        if (!token || seen.has(token))
            return;
        seen.add(token);
        candidates.push(credentials);
    };
    const [fromDb, fromAgent] = await Promise.all([
        readCursorFromStateDb(stateDb),
        readCursorFromAuthJson(authJson),
    ]);
    const email = pickAccountEmail(fromDb?.email, fromAgent?.email);
    add(withAccountEmail(fromDb, email));
    add(withAccountEmail(fromAgent, email));
    return candidates;
}

export async function readCursorCredentials(paths) {
    const candidates = await readCursorCredentialCandidates(paths);
    return candidates[0] ?? null;
}

async function readCursorFromStateDb(stateDb) {
    try {
        const items = await readSqliteItems(stateDb, [
            'cursorAuth/accessToken',
            'cursorAuth/stripeMembershipType',
            'cursorAuth/cachedEmail',
            'cursorAuth/cachedScopedProfile',
        ]);
        const accessToken = unwrapStoredValue(items['cursorAuth/accessToken']);
        if (!accessToken)
            return null;
        return {
            accessToken,
            membershipType: unwrapStoredValue(items['cursorAuth/stripeMembershipType']) || null,
            email: pickAccountEmail(
                unwrapStoredValue(items['cursorAuth/cachedEmail']),
                unwrapStoredValue(items['cursorAuth/cachedScopedProfile'])
            ),
            source: 'ide',
            path: stateDb,
        };
    } catch {
        return null;
    }
}

function withAccountEmail(credentials, email) {
    if (!credentials)
        return null;
    if (!email || credentials.email)
        return credentials;
    return {...credentials, email};
}

async function readCursorFromAuthJson(authJson) {
    const payload = await readLocalJson(authJson);
    if (!payload)
        return null;
    const accessToken = unwrapStoredValue(payload.accessToken || payload.token);
    if (!accessToken)
        return null;
    return {
        accessToken,
        membershipType: unwrapStoredValue(
            payload.membershipType
            || payload.stripeMembershipType
            || payload.subscriptionTier
            || ''
        ) || null,
        email: pickAccountEmail(payload),
        source: 'agent',
        path: authJson,
    };
}

export async function readCodexCredentials(paths) {
    const candidates = Array.isArray(paths) && paths.length
        ? paths
        : defaultCodexAuthJsons();

    for (const path of candidates) {
        const payload = await readLocalJson(path);
        if (!payload)
            continue;
        const tokens = payload.tokens && typeof payload.tokens === 'object'
            ? payload.tokens
            : payload;
        const accessToken = String(tokens.access_token || tokens.accessToken || payload.access_token || '').trim();
        if (!accessToken)
            continue;
        const idToken = String(tokens.id_token || tokens.idToken || payload.id_token || '').trim();
        return {
            accessToken,
            idToken: idToken || null,
            refreshToken: String(tokens.refresh_token || tokens.refreshToken || '').trim() || null,
            accountId: String(tokens.account_id || tokens.accountId || payload.account_id || '').trim() || null,
            lastRefresh: String(payload.last_refresh || payload.lastRefresh || '').trim() || null,
            email: pickAccountEmail(idToken, accessToken, tokens, payload),
            source: 'codex',
            path,
            raw: payload,
        };
    }
    return null;
}

export async function writeCodexCredentials(path, raw) {
    if (!path || !raw)
        return;
    await writeJsonAtomic(path, raw);
}

export async function readClaudeCredentials(paths, {allowApi = true} = {}) {
    const profileEmail = await readClaudeProfileEmail();
    const planCredentials = await readClaudePlanCredentials(paths, profileEmail);
    if (planCredentials || !allowApi)
        return planCredentials;
    return readClaudeApiCredentials(profileEmail);
}

async function readClaudePlanCredentials(paths, profileEmail) {
    const candidates = Array.isArray(paths) && paths.length
        ? paths
        : defaultClaudeAuthJsons();
    for (const path of candidates) {
        const payload = await readLocalJson(path);
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
            expiresAt: normalizeExpiryMs(oauth.expiresAt || oauth.expires_at),
            subscriptionType: String(oauth.subscriptionType || oauth.subscription_type || '').trim() || null,
            rateLimitTier: String(oauth.rateLimitTier || oauth.rate_limit_tier || '').trim() || null,
            email: pickAccountEmail(oauth, payload, profileEmail),
            source: 'claude',
            path,
            raw: payload,
        };
    }
    return null;
}

async function readClaudeApiCredentials(profileEmail) {
    const path = defaultAnthropicCredentialJson();
    const payload = await readLocalJson(path);
    if (!payload)
        return null;
    const accessToken = String(payload.access_token || payload.accessToken || '').trim();
    if (!accessToken)
        return null;
    return {
        accessToken,
        refreshToken: String(payload.refresh_token || payload.refreshToken || '').trim() || null,
        expiresAt: normalizeExpiryMs(payload.expires_at || payload.expiresAt),
        email: pickAccountEmail(payload.account_email, payload, profileEmail),
        source: 'claude-api',
        scope: String(payload.scope || '').trim() || null,
        path,
        raw: payload,
    };
}

async function readClaudeProfileEmail() {
    const payload = await readLocalJson(defaultClaudeUserJson());
    return pickAccountEmail(payload?.oauthAccount, payload);
}

function normalizeExpiryMs(value) {
    const exp = Number(value || 0);
    if (!Number.isFinite(exp) || exp <= 0)
        return 0;
    return exp < 1e12 ? exp * 1000 : exp;
}

export async function writeClaudeCredentials(path, raw) {
    if (!path || !raw)
        return;
    await writeJsonAtomic(path, raw);
}
