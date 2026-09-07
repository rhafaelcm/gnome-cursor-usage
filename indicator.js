import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';

import {gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import {formatPercent} from './lib/format.js';
import {pickRecord} from './lib/providers.js';
import {createBox, loadUsageIcon} from './lib/ui.js';
import {UsagePopup} from './popup.js';

export const UsageIndicator = GObject.registerClass({
    GTypeName: 'CursorUsageIndicator',
}, class UsageIndicator extends PanelMenu.Button {
    _init(extension) {
        super._init(0.5, extension.metadata.name, false);
        this._extension = extension;

        this._box = createBox({
            vertical: false,
            style_class: 'panel-status-indicators-box cursor-usage-panel-box',
        });
        this.add_child(this._box);

        this._icon = new St.Icon({
            gicon: loadUsageIcon(extension),
            style_class: 'system-status-icon',
            icon_size: 16,
        });
        this._box.add_child(this._icon);

        this._label = new St.Label({
            text: '',
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'cursor-usage-panel-label',
        });
        this._box.add_child(this._label);

        this._popup = new UsagePopup(this, extension);
        this._state = null;
    }

    setState(state) {
        this._state = state;
        this._updatePanel(state);
        this._popup.setState(state);
    }

    _updatePanel(state) {
        const record = pickRecord(state, state?.activeProvider);
        const showPercentage = Boolean(state?.showPercentage);
        let text = '';

        if (showPercentage) {
            if (state?.loading && !record?.ready)
                text = '…';
            else if (record?.ready && record.panelPercent >= 0)
                text = formatPercent(record.panelPercent);
        }

        this._label.text = text;
        this._label.visible = showPercentage && text !== '';
        this.accessible_name = panelAccessibleName(state, record, text);
    }
});

function panelAccessibleName(state, record, text) {
    const name = record?.name || _('Gnome Cursor Usage');
    if (text)
        return `${name} ${text}`;
    if (record?.usageStatusText)
        return `${name}: ${record.usageStatusText}`;
    return name;
}
