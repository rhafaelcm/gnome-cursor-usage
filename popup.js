import Clutter from 'gi://Clutter';
import Pango from 'gi://Pango';
import St from 'gi://St';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

import {
    formatDayLabel,
    formatPercent,
    formatReset,
    formatTokens,
    tokenTotal,
} from './lib/format.js';
import {providerAuthHelp, providerLoginCommandText} from './lib/login.js';
import {listEnabledProviders, pickRecord} from './lib/providers.js';
import {createBar, createBox, loadUsageIcon} from './lib/ui.js';

export class UsagePopup {
    constructor(indicator, extension) {
        this._indicator = indicator;
        this._extension = extension;
        this._menu = indicator.menu;
        this._state = null;

        const section = new PopupMenu.PopupMenuSection();
        this._root = createBox({
            vertical: true,
            style_class: 'cursor-usage-popup',
            x_expand: true,
        });
        section.box.add_child(this._root);
        this._menu.addMenuItem(section);
        this._menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        this._refreshItem = this._menu.addAction(_('Refresh'), () => {
            this._extension.refresh({full: true, force: true});
        });
        this._signInItem = this._menu.addAction(_('Sign in'), () => {
            this._extension.signIn(this._state?.activeProvider);
        });
    }

    setState(state) {
        this._state = state;
        this._rebuild();
    }

    _rebuild() {
        this._root.destroy_all_children();
        const state = this._state;
        if (!state)
            return;

        const providers = listEnabledProviders(state);
        if (providers.length === 0) {
            this._addHeader(null);
            this._addStatus(_('No providers enabled'), _('Turn on Cursor, Claude, or Codex in Preferences.'));
            this._updateActions(null);
            return;
        }

        const record = pickRecord(state, state.activeProvider);
        this._addHeader(record);
        if (providers.length > 1)
            this._addTabs(state);

        if (state.loading && !record?.ready && !record?.signedIn && !record?.usageStatusText)
            this._addStatus(_('Updating…'), '');
        else if (record?.ready)
            this._addReady(record);
        else if (record?.signedIn)
            this._addStatus(record.usageStatusText || _('Signed in'), record.authHelpText || '');
        else
            this._addSignedOut(record, state.activeProvider);

        this._updateActions(record);
    }

    _addHeader(record) {
        const header = createBox({vertical: false, style_class: 'cursor-usage-header'});
        header.add_child(new St.Icon({
            gicon: loadUsageIcon(this._extension),
            icon_size: 28,
            y_align: Clutter.ActorAlign.CENTER,
        }));

        const text = createBox({
            vertical: true,
            style_class: 'cursor-usage-header-text',
            x_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
        });
        text.add_child(new St.Label({
            text: record?.name || _('Usage'),
            style_class: 'cursor-usage-title',
        }));
        text.add_child(ellipsizeLabel(headerSubtitle(record), {
            style_class: 'cursor-usage-subtitle',
            x_expand: true,
        }));
        header.add_child(text);
        header.add_child(this._settingsButton());
        this._root.add_child(header);
    }

    _settingsButton() {
        const button = new St.Button({
            style_class: 'button cursor-usage-settings-button',
            can_focus: true,
            reactive: true,
            y_align: Clutter.ActorAlign.CENTER,
            accessible_name: _('Settings'),
        });
        button.set_child(new St.Icon({
            icon_name: 'emblem-system-symbolic',
            style_class: 'popup-menu-icon',
            icon_size: 16,
        }));
        button.connect('clicked', () => {
            this._menu.close();
            this._extension.openPreferences();
        });
        return button;
    }

    _addTabs(state) {
        const tabs = createBox({vertical: false, style_class: 'cursor-usage-tabs'});
        if (state.enableCursor)
            tabs.add_child(this._tabButton(_('Cursor'), 'cursor', state.activeProvider === 'cursor'));
        if (state.enableClaude)
            tabs.add_child(this._tabButton(_('Claude'), 'claude', state.activeProvider === 'claude'));
        if (state.enableCodex)
            tabs.add_child(this._tabButton(_('Codex'), 'codex', state.activeProvider === 'codex'));
        this._root.add_child(tabs);
    }

    _tabButton(label, provider, checked) {
        const button = new St.Button({
            label,
            style_class: 'button cursor-usage-tab',
            can_focus: true,
            toggle_mode: true,
            checked,
            x_expand: true,
        });
        button.connect('clicked', () => {
            this._extension.setActiveProvider(provider);
        });
        return button;
    }

    _addSignedOut(record, provider) {
        const help = record?.authHelpText || providerAuthHelp(provider);
        this._addStatus(record?.usageStatusText || _('Not signed in'), help);
        const command = providerLoginCommandText(provider);
        if (command)
            this._addCopyableCommand(command);
    }

    _addCopyableCommand(command) {
        const label = new St.Label({
            text: command,
            style_class: 'cursor-usage-hint cursor-usage-command',
            x_expand: true,
        });
        label.clutter_text.line_wrap = true;
        label.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
        label.clutter_text.selectable = true;
        this._root.add_child(label);
    }

    _addStatus(title, subtitle) {
        const box = createBox({vertical: true, style_class: 'cursor-usage-status'});
        box.add_child(new St.Label({text: title, style_class: 'cursor-usage-title'}));
        if (subtitle) {
            const hint = new St.Label({
                text: subtitle,
                style_class: 'cursor-usage-hint',
                x_expand: true,
            });
            hint.clutter_text.line_wrap = true;
            hint.clutter_text.ellipsize = Pango.EllipsizeMode.NONE;
            box.add_child(hint);
        }
        this._root.add_child(box);
    }

    _addReady(record) {
        if (record.limits?.length) {
            this._sectionLabel(_('Limits'));
            for (const limit of record.limits)
                this._addLimit(limit);
        }

        if (record.id === 'cursor') {
            const days = record.recentDays ?? [];
            if (days.some(day => (day.messageCount ?? 0) > 0)) {
                this._sectionLabel(_('Tokens by day'));
                this._addDayChart(days);
            }
            const models = Object.entries(record.modelUsage ?? {});
            if (models.length) {
                this._sectionLabel(_('Tokens by model'));
                this._addModelList(models);
            }
        }
    }

    _sectionLabel(text) {
        this._root.add_child(new St.Label({
            text: text.toUpperCase(),
            style_class: 'cursor-usage-section-label',
        }));
    }

    _addLimit(limit) {
        const box = createBox({vertical: true, style_class: 'cursor-usage-limit'});
        const head = createBox({vertical: false, style_class: 'cursor-usage-row', x_expand: true});
        head.add_child(ellipsizeLabel(limit.label, {x_expand: true}));
        head.add_child(new St.Label({
            text: formatPercent(limit.percent),
            style_class: 'cursor-usage-metric',
        }));
        box.add_child(head);
        box.add_child(createBar(limit.percent));
        const reset = formatReset(limit.resetsAt);
        if (reset) {
            box.add_child(new St.Label({
                text: reset,
                style_class: 'cursor-usage-hint',
            }));
        }
        this._root.add_child(box);
    }

    _addDayChart(days) {
        const max = Math.max(1, ...days.map(day => day.messageCount ?? 0));
        for (const day of days) {
            const row = createBox({vertical: false, style_class: 'cursor-usage-row', x_expand: true});
            row.add_child(new St.Label({
                text: formatDayLabel(day.date),
                style_class: 'cursor-usage-day-label',
            }));
            row.add_child(createBar((day.messageCount ?? 0) / max));
            row.add_child(new St.Label({
                text: formatTokens(day.messageCount ?? 0),
                style_class: 'cursor-usage-metric',
            }));
            this._root.add_child(row);
        }
    }

    _addModelList(models) {
        models.sort((a, b) => tokenTotal(b[1]) - tokenTotal(a[1]));
        const max = Math.max(1, ...models.map(([, bucket]) => tokenTotal(bucket)));
        for (const [name, bucket] of models) {
            const total = tokenTotal(bucket);
            const row = createBox({vertical: false, style_class: 'cursor-usage-row', x_expand: true});
            row.add_child(ellipsizeLabel(name, {x_expand: true}));
            row.add_child(createBar(total / max));
            row.add_child(new St.Label({
                text: formatTokens(total),
                style_class: 'cursor-usage-metric',
            }));
            this._root.add_child(row);
        }
    }

    _updateActions(record) {
        this._refreshItem.visible = Boolean(record);
        this._signInItem.visible = Boolean(record) && !record.ready && !record.signedIn;
    }
}

function headerSubtitle(record) {
    if (!record?.ready && !record?.signedIn)
        return _('Not signed in');
    const tier = String(record.tierLabel || '').trim();
    const email = String(record.accountEmail || '').trim();
    if (tier && email)
        return `${tier} · ${email}`;
    if (tier)
        return tier;
    if (email)
        return email;
    return _('Signed in');
}

function ellipsizeLabel(text, params = {}) {
    const label = new St.Label({text, ...params});
    label.clutter_text.ellipsize = Pango.EllipsizeMode.END;
    label.clutter_text.single_line_mode = true;
    return label;
}
