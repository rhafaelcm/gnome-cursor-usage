import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Soup from 'gi://Soup';

import {formatMessage, gettext as _} from './i18n.js';

const MAX_RESPONSE_BYTES = 1_000_000;

export class HttpError extends Error {
    constructor(message, {status = 0, authFailed = false, rateLimited = false} = {}) {
        super(message);
        this.name = 'HttpError';
        this.status = status;
        this.authFailed = authFailed;
        this.rateLimited = rateLimited;
    }
}

export class HttpClient {
    constructor() {
        this._session = new Soup.Session({
            timeout: 30,
            user_agent: 'gnome-cursor-usage/1.5.0',
        });
    }

    destroy() {
        this._session.abort();
        this._session = null;
    }

    jsonGet(url, headers = {}, cancellable = null) {
        return this._send('GET', url, headers, null, cancellable);
    }

    jsonPost(url, headers = {}, body = {}, cancellable = null) {
        return this._send('POST', url, {
            'Content-Type': 'application/json',
            ...headers,
        }, JSON.stringify(body), cancellable);
    }

    async _send(method, url, headers, bodyText, cancellable) {
        if (!this._session)
            throw new HttpError(_('HTTP client was destroyed'));

        const message = Soup.Message.new(method, url);
        if (!message)
            throw new HttpError(_('Invalid request URL'));

        message.set_flags(message.get_flags() | Soup.MessageFlags.NO_REDIRECT);

        for (const [name, value] of Object.entries(headers)) {
            if (value === null || value === undefined || value === '')
                continue;
            if (name.toLowerCase() === 'user-agent')
                message.request_headers.replace(name, String(value));
            else
                message.request_headers.append(name, String(value));
        }

        if (bodyText !== null) {
            const bytes = new TextEncoder().encode(bodyText);
            const contentType = headers['Content-Type'] || 'application/json';
            message.set_request_body_from_bytes(contentType, GLib.Bytes.new(bytes));
        }

        let raw;
        try {
            raw = await this._session.send_and_read_async(
                message,
                GLib.PRIORITY_DEFAULT,
                cancellable
            );
        } catch (error) {
            if (cancellable && cancellable.is_cancelled())
                throw error;
            throw new HttpError(_('Could not reach the usage API'));
        }

        const status = message.get_status();
        if (status >= 300 && status < 400)
            throw new HttpError(_('Usage API returned an unexpected redirect'), {status});
        if (status === 401 || status === 403)
            throw new HttpError(_('Session expired'), {status, authFailed: true});
        if (status === 429)
            throw new HttpError(_('Usage API rate limited'), {status, rateLimited: true});
        if (status < 200 || status >= 300)
            throw new HttpError(formatMessage('Usage API returned HTTP {status}', {status}), {status});

        const size = raw.get_size();
        if (size > MAX_RESPONSE_BYTES)
            throw new HttpError(_('Usage API response was too large'), {status});

        const text = decodeBytes(raw);
        if (!text)
            return {};

        try {
            return JSON.parse(text);
        } catch {
            throw new HttpError(_('Could not parse usage response'), {status});
        }
    }
}

export function isCancelled(error) {
    return Boolean(
        error instanceof GLib.Error
            && error.matches(Gio.IOErrorEnum, Gio.IOErrorEnum.CANCELLED)
        || /cancel/i.test(String(error?.message ?? ''))
    );
}

function decodeBytes(bytes) {
    const data = bytes.get_data();
    if (data.length === 0)
        return '';
    return new TextDecoder().decode(data);
}
