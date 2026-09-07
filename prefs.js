import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

import {
    readClaudeCredentials,
    readCodexCredentials,
    readCursorCredentials,
    resolveClaudePaths,
    resolveCodexPaths,
    resolveCursorPaths,
} from './lib/credentials.js';
import {
    claudeAuthHelp,
    codexAuthHelp,
    cursorAuthHelp,
    startClaudeLogin,
    startCodexLogin,
    startCursorLogin,
} from './lib/login.js';
import {PROVIDER_IDS} from './lib/providers.js';

export default class CursorUsagePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();
        const providerLabels = [_('Cursor'), _('Claude Code'), _('Codex')];
        window._settings = settings;
        window._cancelPolls = [];
        window.set_default_size(640, 780);

        const general = new Adw.PreferencesPage({
            title: _('General'),
            icon_name: 'preferences-system-symbolic',
        });
        window.add(general);

        const appearance = new Adw.PreferencesGroup({
            title: _('Appearance'),
            description: _('The extension follows the GNOME accent color and light or dark style.'),
        });
        general.add(appearance);

        const showPercentage = new Adw.SwitchRow({
            title: _('Show percentage on the panel'),
            subtitle: _('Display the active provider usage next to the icon'),
        });
        settings.bind('show-percentage', showPercentage, 'active', Gio.SettingsBindFlags.DEFAULT);
        appearance.add(showPercentage);

        const providers = new Adw.PreferencesGroup({
            title: _('Providers'),
        });
        general.add(providers);

        const enableCursor = new Adw.SwitchRow({
            title: _('Cursor'),
            subtitle: _('Show Cursor plan usage'),
        });
        settings.bind('enable-cursor', enableCursor, 'active', Gio.SettingsBindFlags.DEFAULT);
        providers.add(enableCursor);

        const enableClaude = new Adw.SwitchRow({
            title: _('Claude Code'),
            subtitle: _('Show Claude Code plan usage'),
        });
        settings.bind('enable-claude', enableClaude, 'active', Gio.SettingsBindFlags.DEFAULT);
        providers.add(enableClaude);

        const enableCodex = new Adw.SwitchRow({
            title: _('Codex'),
            subtitle: _('Show Codex plan usage'),
        });
        settings.bind('enable-codex', enableCodex, 'active', Gio.SettingsBindFlags.DEFAULT);
        providers.add(enableCodex);

        const combo = new Adw.ComboRow({
            title: _('Default provider'),
            subtitle: _('Shown in the panel and selected when the menu opens'),
            model: Gtk.StringList.new(providerLabels),
        });
        combo.selected = providerIndex(settings.get_string('active-provider'));
        combo.connect('notify::selected', () => {
            settings.set_string('active-provider', PROVIDER_IDS[combo.selected] || 'cursor');
        });
        const providerId = settings.connect('changed::active-provider', () => {
            combo.selected = providerIndex(settings.get_string('active-provider'));
        });
        window.connect('destroy', () => settings.disconnect(providerId));
        providers.add(combo);

        const refresh = new Adw.PreferencesGroup({
            title: _('Updates'),
        });
        general.add(refresh);

        const interval = new Adw.SpinRow({
            title: _('Refresh interval'),
            subtitle: _('Seconds between background updates'),
            adjustment: new Gtk.Adjustment({
                lower: 60,
                upper: 3600,
                step_increment: 30,
                page_increment: 60,
                value: settings.get_int('refresh-interval'),
            }),
        });
        settings.bind('refresh-interval', interval, 'value', Gio.SettingsBindFlags.DEFAULT);
        refresh.add(interval);

        const resetGroup = new Adw.PreferencesGroup({
            title: _('Reset'),
            description: _('Restore every extension setting to the defaults. Login files on disk are not deleted.'),
        });
        general.add(resetGroup);

        const resetRow = new Adw.ActionRow({
            title: _('Reset settings'),
            subtitle: _('Interval, providers, and credential path overrides'),
        });
        const resetButton = new Gtk.Button({
            label: _('Reset settings'),
            valign: Gtk.Align.CENTER,
        });
        resetButton.add_css_class('destructive-action');
        resetButton.connect('clicked', () => {
            confirmResetSettings(window, settings);
        });
        resetRow.add_suffix(resetButton);
        resetRow.activatable_widget = resetButton;
        resetGroup.add(resetRow);

        const accounts = new Adw.PreferencesPage({
            title: _('Accounts'),
            icon_name: 'system-users-symbolic',
        });
        window.add(accounts);

        const cursorGroup = new Adw.PreferencesGroup({
            title: _('Cursor'),
            description: `${cursorAuthHelp()} ${_('The extension reads the local Cursor token. Leave a path empty to use the default. Fill it only if Cursor is installed somewhere else.')}`,
        });
        accounts.add(cursorGroup);

        const cursorStatus = new Adw.ActionRow({
            title: _('Account'),
            subtitle: _('Checking…'),
        });
        const cursorButton = new Gtk.Button({
            label: _('Sign in'),
            valign: Gtk.Align.CENTER,
        });
        cursorButton.add_css_class('suggested-action');
        cursorButton.connect('clicked', () => {
            startCursorLogin();
            window._cancelPolls.push(pollUntil(async () => {
                return updateCursorStatus(settings, cursorStatus, cursorButton);
            }));
        });
        cursorStatus.add_suffix(cursorButton);
        cursorStatus.activatable_widget = cursorButton;
        cursorGroup.add(cursorStatus);

        const cursorDb = new Adw.EntryRow({
            title: _('Cursor state database'),
            tooltip_text: _('Token from the Cursor app. Default: ~/.config/Cursor/User/globalStorage/state.vscdb. Leave empty to use that path.'),
        });
        settings.bind('cursor-state-db', cursorDb, 'text', Gio.SettingsBindFlags.DEFAULT);
        cursorGroup.add(cursorDb);

        const cursorAuth = new Adw.EntryRow({
            title: _('cursor-agent auth.json'),
            tooltip_text: _('Token from `cursor-agent login`. Default: ~/.config/cursor/auth.json. Leave empty to use that path.'),
        });
        settings.bind('cursor-auth-json', cursorAuth, 'text', Gio.SettingsBindFlags.DEFAULT);
        cursorGroup.add(cursorAuth);

        const claudeGroup = new Adw.PreferencesGroup({
            title: _('Claude Code'),
            description: `${claudeAuthHelp()} ${_('The extension reads the local Claude Code token. Leave the path empty to use the default. Fill it only if Claude Code is installed somewhere else.')}`,
        });
        accounts.add(claudeGroup);

        const claudeStatus = new Adw.ActionRow({
            title: _('Account'),
            subtitle: _('Checking…'),
        });
        const claudeButton = new Gtk.Button({
            label: _('Sign in'),
            valign: Gtk.Align.CENTER,
        });
        claudeButton.add_css_class('suggested-action');
        claudeButton.connect('clicked', () => {
            startClaudeLogin();
            window._cancelPolls.push(pollUntil(() => {
                return Promise.resolve(updateClaudeStatus(settings, claudeStatus, claudeButton));
            }));
        });
        claudeStatus.add_suffix(claudeButton);
        claudeStatus.activatable_widget = claudeButton;
        claudeGroup.add(claudeStatus);

        const claudeAuth = new Adw.EntryRow({
            title: _('Claude credentials.json'),
            tooltip_text: _('Token from the Claude Code CLI. Default: ~/.claude/.credentials.json. Leave empty to use that path.'),
        });
        settings.bind('claude-auth-json', claudeAuth, 'text', Gio.SettingsBindFlags.DEFAULT);
        claudeGroup.add(claudeAuth);

        const codexGroup = new Adw.PreferencesGroup({
            title: _('Codex'),
            description: `${codexAuthHelp()} ${_('The extension reads the local Codex token. Leave the path empty to use the default. Fill it only if Codex is installed somewhere else.')}`,
        });
        accounts.add(codexGroup);

        const codexStatus = new Adw.ActionRow({
            title: _('Account'),
            subtitle: _('Checking…'),
        });
        const codexButton = new Gtk.Button({
            label: _('Sign in'),
            valign: Gtk.Align.CENTER,
        });
        codexButton.add_css_class('suggested-action');
        codexButton.connect('clicked', () => {
            startCodexLogin();
            window._cancelPolls.push(pollUntil(() => {
                return Promise.resolve(updateCodexStatus(settings, codexStatus, codexButton));
            }));
        });
        codexStatus.add_suffix(codexButton);
        codexStatus.activatable_widget = codexButton;
        codexGroup.add(codexStatus);

        const codexAuth = new Adw.EntryRow({
            title: _('Codex auth.json'),
            tooltip_text: _('Token from the Codex CLI. Default: ~/.codex/auth.json. Leave empty to use that path.'),
        });
        settings.bind('codex-auth-json', codexAuth, 'text', Gio.SettingsBindFlags.DEFAULT);
        codexGroup.add(codexAuth);

        updateCursorStatus(settings, cursorStatus, cursorButton);
        updateClaudeStatus(settings, claudeStatus, claudeButton);
        updateCodexStatus(settings, codexStatus, codexButton);

        const pathIds = ['cursor-state-db', 'cursor-auth-json', 'claude-auth-json', 'codex-auth-json'].map(key => {
            return settings.connect(`changed::${key}`, () => {
                updateCursorStatus(settings, cursorStatus, cursorButton);
                updateClaudeStatus(settings, claudeStatus, claudeButton);
                updateCodexStatus(settings, codexStatus, codexButton);
            });
        });
        window.connect('destroy', () => {
            for (const id of pathIds)
                settings.disconnect(id);
            for (const cancel of window._cancelPolls)
                cancel();
        });
    }
}

const RESET_SETTING_KEYS = [
    'refresh-interval',
    'show-percentage',
    'active-provider',
    'enable-cursor',
    'enable-claude',
    'enable-codex',
    'cursor-state-db',
    'cursor-auth-json',
    'claude-auth-json',
    'codex-auth-json',
];

function providerIndex(value) {
    const index = PROVIDER_IDS.indexOf(value);
    return index >= 0 ? index : 0;
}

function resetExtensionSettings(settings) {
    for (const key of RESET_SETTING_KEYS)
        settings.reset(key);
}

function confirmResetSettings(window, settings) {
    const heading = _('Reset settings?');
    const body = _('Restore the default refresh interval, providers, and credential paths. Login files on disk are not deleted.');
    const onResponse = response => {
        if (response === 'reset')
            resetExtensionSettings(settings);
    };

    if (Adw.AlertDialog) {
        const dialog = new Adw.AlertDialog({
            heading,
            body,
        });
        dialog.add_response('cancel', _('Cancel'));
        dialog.add_response('reset', _('Reset'));
        dialog.set_response_appearance('reset', Adw.ResponseAppearance.DESTRUCTIVE);
        dialog.set_default_response('cancel');
        dialog.set_close_response('cancel');
        dialog.connect('response', (_dialog, response) => onResponse(response));
        dialog.present(window);
        return;
    }

    const dialog = new Adw.MessageDialog({
        transient_for: window,
        modal: true,
        heading,
        body,
    });
    dialog.add_response('cancel', _('Cancel'));
    dialog.add_response('reset', _('Reset'));
    dialog.set_response_appearance('reset', Adw.ResponseAppearance.DESTRUCTIVE);
    dialog.set_default_response('cancel');
    dialog.set_close_response('cancel');
    dialog.connect('response', (_dialog, response) => onResponse(response));
    dialog.present();
}

async function updateCursorStatus(settings, row, button) {
    try {
        const credentials = await readCursorCredentials(resolveCursorPaths(settings));
        if (credentials?.accessToken) {
            row.subtitle = credentials.source === 'ide'
                ? _('Signed in with the Cursor app')
                : _('Signed in with cursor-agent');
            button.label = _('Refresh login');
            return true;
        }
    } catch {
        // Fall through to the signed-out copy.
    }
    row.subtitle = _('Not signed in');
    button.label = _('Sign in');
    return false;
}

function updateClaudeStatus(settings, row, button) {
    const credentials = readClaudeCredentials(resolveClaudePaths(settings));
    if (credentials?.accessToken) {
        row.subtitle = _('Signed in with the Claude Code CLI');
        button.label = _('Refresh login');
        return true;
    }
    row.subtitle = _('Not signed in');
    button.label = _('Sign in');
    return false;
}

function updateCodexStatus(settings, row, button) {
    const credentials = readCodexCredentials(resolveCodexPaths(settings));
    if (credentials?.accessToken) {
        row.subtitle = _('Signed in with the Codex CLI');
        button.label = _('Refresh login');
        return true;
    }
    row.subtitle = _('Not signed in');
    button.label = _('Sign in');
    return false;
}

function pollUntil(callback) {
    let attempts = 0;
    let cancelled = false;
    let sourceId = 0;
    const tick = () => {
        if (cancelled)
            return;
        Promise.resolve(callback()).then(done => {
            if (cancelled || done)
                return;
            attempts += 1;
            if (attempts >= 60)
                return;
            sourceId = GLib.timeout_add_seconds(GLib.PRIORITY_DEFAULT, 2, () => {
                sourceId = 0;
                tick();
                return GLib.SOURCE_REMOVE;
            });
        }).catch(() => {});
    };
    tick();
    return () => {
        cancelled = true;
        if (sourceId) {
            GLib.source_remove(sourceId);
            sourceId = 0;
        }
    };
}
