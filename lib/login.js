import Gio from 'gi://Gio';
import GLib from 'gi://GLib';

export function findProgram(names) {
    for (const name of names) {
        const path = GLib.find_program_in_path(name);
        if (path)
            return path;
    }
    return null;
}

export function cursorLoginCommand() {
    const agent = findProgram(['cursor-agent', 'agent']);
    return agent ? [agent, 'login'] : null;
}

export function cursorLogoutCommand() {
    const agent = findProgram(['cursor-agent', 'agent']);
    return agent ? [agent, 'logout'] : null;
}

export function cursorIdeCommand() {
    const cursor = findProgram(['cursor']);
    return cursor ? [cursor] : null;
}

export function codexLoginCommand() {
    const codex = findProgram(['codex']);
    return codex ? [codex, 'login'] : null;
}

export function codexLogoutCommand() {
    const codex = findProgram(['codex']);
    return codex ? [codex, 'logout'] : null;
}

export function launchDetached(argv) {
    if (!argv?.length)
        return false;
    const launcher = new Gio.SubprocessLauncher({
        flags: Gio.SubprocessFlags.NONE,
    });
    launcher.spawnv(argv);
    return true;
}

export function openCursorIde() {
    const command = cursorIdeCommand();
    if (command)
        return launchDetached(command);
    try {
        Gio.AppInfo.launch_default_for_uri('cursor://', null);
        return true;
    } catch {
        return false;
    }
}

export function startCursorLogin() {
    const command = cursorLoginCommand();
    if (command)
        return {started: launchDetached(command), kind: 'cli'};
    if (openCursorIde())
        return {started: true, kind: 'ide'};
    return {started: false, kind: 'none'};
}

export function startCodexLogin() {
    const command = codexLoginCommand();
    if (command)
        return {started: launchDetached(command), kind: 'cli'};
    return {started: false, kind: 'none'};
}

export function startCursorLogout() {
    const command = cursorLogoutCommand();
    return command ? launchDetached(command) : false;
}

export function startCodexLogout() {
    const command = codexLogoutCommand();
    return command ? launchDetached(command) : false;
}

export function claudeLoginCommand() {
    const claude = findProgram(['claude']);
    return claude ? [claude, 'login'] : null;
}

export function claudeLogoutCommand() {
    const claude = findProgram(['claude']);
    return claude ? [claude, 'logout'] : null;
}

export function startClaudeLogin() {
    const command = claudeLoginCommand();
    if (command)
        return {started: launchDetached(command), kind: 'cli'};
    return {started: false, kind: 'none'};
}

export function startClaudeLogout() {
    const command = claudeLogoutCommand();
    return command ? launchDetached(command) : false;
}

export function cursorAuthHelp() {
    if (cursorLoginCommand())
        return 'A browser window should open. Finish signing in with cursor-agent, then return here.';
    if (cursorIdeCommand())
        return 'Sign in inside the Cursor app, then return here.';
    return 'Open Cursor and sign in, or install cursor-agent and run `cursor-agent login`.';
}

export function codexAuthHelp() {
    if (codexLoginCommand())
        return 'A browser window should open. Finish signing in with Codex, then return here.';
    return 'Install the Codex CLI and run `codex login`, then return here.';
}

export function claudeAuthHelp() {
    if (claudeLoginCommand())
        return 'A browser window should open. Finish signing in with Claude Code, then return here.';
    return 'Install the Claude Code CLI and run `claude login`, then return here.';
}

export function providerAuthHelp(provider) {
    if (provider === 'claude')
        return claudeAuthHelp();
    if (provider === 'codex')
        return codexAuthHelp();
    return cursorAuthHelp();
}

export function startProviderLogin(provider) {
    if (provider === 'claude')
        return startClaudeLogin();
    if (provider === 'codex')
        return startCodexLogin();
    return startCursorLogin();
}

export function startProviderLogout(provider) {
    if (provider === 'claude')
        return startClaudeLogout();
    if (provider === 'codex')
        return startCodexLogout();
    return startCursorLogout();
}
