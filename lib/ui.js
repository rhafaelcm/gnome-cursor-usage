import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';
import St from 'gi://St';

import {clamp01} from './format.js';

export function createBox({vertical = false, ...params} = {}) {
    return new St.BoxLayout({
        ...params,
        orientation: vertical
            ? Clutter.Orientation.VERTICAL
            : Clutter.Orientation.HORIZONTAL,
    });
}

export function loadUsageIcon(extension) {
    const file = extension.dir.get_child('icons').get_child('cursor-usage-symbolic.svg');
    return Gio.FileIcon.new(file);
}

export function createBar(fraction) {
    const track = createBox({
        vertical: false,
        style_class: 'cursor-usage-bar-track',
        x_expand: true,
        y_align: Clutter.ActorAlign.CENTER,
    });
    const fill = new St.Widget({
        style_class: 'cursor-usage-bar-fill',
        y_expand: true,
    });
    track.add_child(fill);

    const apply = () => {
        const width = track.get_width();
        const value = clamp01(fraction);
        fill.set_width(width > 0 && value > 0
            ? Math.max(2, Math.round(width * value))
            : 0);
    };

    track.connect('notify::width', apply);
    return track;
}
