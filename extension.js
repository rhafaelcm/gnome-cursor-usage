import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import {ClaudeClient} from './lib/claude.js';
import {CodexClient} from './lib/codex.js';
import {
    readClaudeCredentials,
    readCodexCredentials,
    readCursorCredentials,
    resolveClaudePaths,
    resolveCodexPaths,
    resolveCursorPaths,
} from './lib/credentials.js';
import {createRecord} from './lib/format.js';
import {HttpClient, isCancelled} from './lib/http.js';
import {CursorClient} from './lib/cursor.js';
import {startProviderLogin, startProviderLogout} from './lib/login.js';
import {isProviderId, listEnabledProviders, resolveActiveProvider} from './lib/providers.js';
import {UsageIndicator} from './indicator.js';

export default class CursorUsageExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._http = new HttpClient();
        this._cancellable = new Gio.Cancellable();
        this._cursorClient = new CursorClient(this._http);
        this._claudeClient = new ClaudeClient(this._http);
        this._codexClient = new CodexClient(this._http);
        this._timeoutId = 0;
        this._pollId = 0;
        this._logoutTimeoutId = 0;
        this._refreshing = false;
        this._lastFullRefresh = 0;
        this._cursor = createRecord('cursor', 'Cursor');
        this._claude = createRecord('claude', 'Claude Code');
        this._codex = createRecord('codex', 'Codex');

        this._indicator = new UsageIndicator(this);
        Main.panel.addToStatusArea(this.uuid, this._indicator);

        this._openId = this._indicator.menu.connect('open-state-changed', (_menu, open) => {
            if (open)
                this.refresh({full: true});
        });
        this._settingsId = this._settings.connect('changed', (_settings, key) => {
            this._onSettingsChanged(key);
        });

        this._pushState({loading: true});
        this.refresh({full: false});
        this._startTimer();
    }

    disable() {
        this._stopTimer();
        this._stopPoll();
        if (this._logoutTimeoutId) {
            GLib.source_remove(this._logoutTimeoutId);
            this._logoutTimeoutId = 0;
        }
        if (this._cancellable) {
            this._cancellable.cancel();
            this._cancellable = null;
        }
        if (this._indicator && this._openId) {
            this._indicator.menu.disconnect(this._openId);
            this._openId = 0;
        }
        if (this._settings && this._settingsId) {
            this._settings.disconnect(this._settingsId);
            this._settingsId = 0;
        }
        this._http?.destroy();
        this._http = null;
        const indicator = this._indicator;
        this._indicator = null;
        indicator?.destroy();
        this._cursorClient = null;
        this._claudeClient = null;
        this._codexClient = null;
        this._settings = null;
        this._cursor = null;
        this._claude = null;
        this._codex = null;
    }

    setActiveProvider(provider) {
        if (!isProviderId(provider))
            return;
        if (this._settings.get_string('active-provider') === provider) {
            this._pushState();
            return;
        }
        this._settings.set_string('active-provider', provider);
    }

    async refresh({full = false, force = false} = {}) {
        if (!this._settings || !this._cursorClient)
            return;
        if (this._refreshing)
            return;
        if (full && !force && Date.now() - this._lastFullRefresh < 30_000) {
            this._pushState();
            return;
        }

        this._refreshing = true;
        this._pushState({loading: true});
        const cancellable = this._cancellable;
        try {
            const tasks = [];
            if (this._settings.get_boolean('enable-cursor')) {
                tasks.push(this._cursorClient.fetch(this._settings, {full, cancellable})
                    .then(record => {
                        this._cursor = record;
                    }));
            } else {
                this._cursor = createRecord('cursor', 'Cursor');
            }

            if (this._settings.get_boolean('enable-claude')) {
                tasks.push(this._claudeClient.fetch(this._settings, {cancellable})
                    .then(record => {
                        this._claude = record;
                    }));
            } else {
                this._claude = createRecord('claude', 'Claude Code');
            }

            if (this._settings.get_boolean('enable-codex')) {
                tasks.push(this._codexClient.fetch(this._settings, {cancellable})
                    .then(record => {
                        this._codex = record;
                    }));
            } else {
                this._codex = createRecord('codex', 'Codex');
            }

            await Promise.all(tasks);
            if (full)
                this._lastFullRefresh = Date.now();
        } catch (error) {
            if (!isCancelled(error))
                console.warn(`[cursor-usage] refresh failed: ${error.message}`);
        } finally {
            this._refreshing = false;
            this._pushState({loading: false});
        }
    }

    async signIn(provider) {
        const result = startProviderLogin(provider);
        if (!result.started)
            return;
        await this._pollForLogin(provider);
    }

    async signOut(provider) {
        startProviderLogout(provider);
        this._lastFullRefresh = 0;
        if (this._logoutTimeoutId)
            GLib.source_remove(this._logoutTimeoutId);
        this._logoutTimeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
            this._logoutTimeoutId = 0;
            this.refresh({full: false, force: true});
            return GLib.SOURCE_REMOVE;
        });
    }

    _onSettingsChanged(key) {
        if (key === 'refresh-interval') {
            this._startTimer();
            return;
        }
        if (key === 'active-provider' || key === 'show-percentage') {
            this._pushState();
            return;
        }
        this._lastFullRefresh = 0;
        this.refresh({full: false, force: true});
    }

    _startTimer() {
        this._stopTimer();
        const interval = Math.max(60, this._settings.get_int('refresh-interval'));
        this._timeoutId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, interval, () => {
            this.refresh({full: false});
            return GLib.SOURCE_CONTINUE;
        });
    }

    _stopTimer() {
        if (this._timeoutId) {
            GLib.source_remove(this._timeoutId);
            this._timeoutId = 0;
        }
    }

    _stopPoll() {
        if (this._pollId) {
            GLib.source_remove(this._pollId);
            this._pollId = 0;
        }
    }

    async _pollForLogin(provider) {
        this._stopPoll();
        if (await this._hasCredentials(provider)) {
            this._lastFullRefresh = 0;
            await this.refresh({full: true, force: true});
            return;
        }

        let attempts = 0;
        await new Promise(resolve => {
            this._pollId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                attempts += 1;
                this._hasCredentials(provider).then(ready => {
                    if (!ready && attempts < 60)
                        return;
                    this._stopPoll();
                    this._lastFullRefresh = 0;
                    this.refresh({full: true, force: true});
                    resolve();
                }).catch(() => {
                    this._stopPoll();
                    resolve();
                });
                return GLib.SOURCE_CONTINUE;
            });
        });
    }

    async _hasCredentials(provider) {
        if (!this._settings)
            return false;
        if (provider === 'codex')
            return Boolean(readCodexCredentials(resolveCodexPaths(this._settings))?.accessToken);
        if (provider === 'claude')
            return Boolean(readClaudeCredentials(resolveClaudePaths(this._settings))?.accessToken);
        const credentials = await readCursorCredentials(resolveCursorPaths(this._settings));
        return Boolean(credentials?.accessToken);
    }

    _activeProvider() {
        return resolveActiveProvider(
            this._settings.get_string('active-provider'),
            listEnabledProviders({
                enableCursor: this._settings.get_boolean('enable-cursor'),
                enableClaude: this._settings.get_boolean('enable-claude'),
                enableCodex: this._settings.get_boolean('enable-codex'),
            })
        );
    }

    _pushState(extra = {}) {
        if (!this._indicator || !this._settings)
            return;
        this._indicator.setState({
            activeProvider: this._activeProvider(),
            enableCursor: this._settings.get_boolean('enable-cursor'),
            enableClaude: this._settings.get_boolean('enable-claude'),
            enableCodex: this._settings.get_boolean('enable-codex'),
            showPercentage: this._settings.get_boolean('show-percentage'),
            cursor: this._cursor,
            claude: this._claude,
            codex: this._codex,
            loading: Boolean(extra.loading),
            ...extra,
        });
    }
}
