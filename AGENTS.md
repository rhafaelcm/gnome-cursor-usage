# Repository guidance

This repository contains a GNOME Shell extension targeting the Shell versions declared in
`metadata.json`. Changes must follow the official EGO review guidelines and the GNOME
JavaScript best practices:

- https://gjs.guide/extensions/review-guidelines/review-guidelines.html
- https://gjs.guide/extensions/review-guidelines/best-practices.html

## Checks and guaranteed APIs

- Call guaranteed GNOME, GJS, JavaScript, and class methods directly. Do not add
  `typeof method === 'function'`, optional method calls, or compatibility probes for APIs
  supported by the declared Shell versions.
- Do not guard normal lifecycle calls such as `connect()`, `disconnect()`, `destroy()`, `abort()`, or `GLib.Source.remove()` with exception handling.
- Validate values that cross a real trust boundary: provider API responses, credential files, decoded tokens, user-entered paths, nullable settings values, and optional provider records.
- Optional property access is appropriate for external or genuinely nullable data. It must not be used to hide an uncertain internal contract.
- Keep compatibility decisions explicit and update `metadata.json` when the supported Shell range changes.

## Exception handling

- Add `try/catch` only around operations that can fail during expected execution, including
  asynchronous file I/O finish calls, network requests, subprocess launches, URI launches,
  and parsing untrusted JSON, JWT, or date values.
- Do not wrap code merely to suppress programming errors. Let internal contract violations remain visible.
- A catch block must have an intentional outcome: translate an external failure into extension
  state, try a documented fallback, rethrow cancellation or authentication errors, or reject an
  asynchronous wrapper.
- Never add empty cleanup catches around guaranteed lifecycle methods.

## GNOME Shell lifecycle and I/O

- Keep `enable()` and `disable()` close together and make the owning class remove its timers, disconnect its signals, cancel work, destroy its UI, and release references.
- Remove an existing GLib source immediately before replacing it. Store source and signal IDs and clear them after removal.
- Use asynchronous Gio APIs in Shell code. Synchronous file reads such as `Gio.File.load_contents()` and `GLib.file_get_contents()` are not allowed.
- Keep modules shared by Shell and Preferences free of Shell-only or Preferences-only UI imports.
- Keep every source line at or below 200 characters.

## Internationalization

- `system` is the default language setting. Unsupported system locales must fall back to English.
- Keep manual translation selection local to the extension. Do not change the process locale or locale-related environment variables because the GNOME Shell process is shared.
- Add every new user-facing string to all supported catalogs in `lib/i18n.js`. Product names and command or file names may remain unchanged.

## Verification

Before committing a release, run:

```sh
git diff --check
find . -name '*.js' -not -path './.git/*' -print0 | xargs -0 -n1 node --check
glib-compile-schemas --strict schemas
awk 'length($0) > 200 {print FILENAME ":" FNR ":" length($0)}' extension.js prefs.js popup.js indicator.js lib/*.js
rg -n 'load_contents\(|file_get_contents\(|typeof .*function|\?\.\s*\(' --glob '*.js' .
rg -n "=== ['\"]function['\"]|!== ['\"]function['\"]" --glob '*.js' .
./install.sh pack
unzip -t gnome-cursor-usage@rhafaelcm.github.io.shell-extension.zip
```

Also exercise language selection and provider refresh behavior when those areas change. Confirm
that `metadata.json`, the HTTP user agent, and the generated ZIP all contain the intended release
version.
