/**
 * MirrorLoader - Multi-CDN fallback loader
 * 
 * Tries multiple jsDelivr/CDN mirrors sequentially until one succeeds,
 * then injects the HTML into a new window via document.write().
 * 
 * Usage:
 *   const loader = new MirrorLoader(mirrorsArray);
 *   await loader.launchInNewWindow();
 * 
 * @param {string[]} mirrors - Array of mirror URLs (tried in order)
 * @param {Object} options
 *   @param {string} options.target - '_blank' (default) or window name
 *   @param {Function} options.onProgress - Callback(i, total, url) during attempts
 *   @param {Function} options.onSuccess - Callback(win) when loaded
 *   @param {Function} options.onError - Callback(err) when all fail
 */
export class MirrorLoader {
    constructor(mirrors, options = {}) {
        this.mirrors = mirrors || [];
        this.target = options.target || '_blank';
        this.timeoutMs = options.timeoutMs || 10000;
        this.cacheKey = options.cacheKey || 'hub_working_cdn';
        this._label = options.label || 'Game';
        this.onProgress = options.onProgress || (() => {});
        this.onSuccess = options.onSuccess || (() => {});
        this.onError = options.onError || (() => {});
        this._aborted = false;
        this._win = null;
    }

    /**
     * Abort any in-progress loading
     */
    abort() {
        this._aborted = true;
    }

    /**
     * Launch the first working mirror in a new window
     * @returns {Promise<boolean>} true if any mirror loaded
     */
    async launch() {
        if (this.mirrors.length === 0) {
            throw new Error('No mirrors provided');
        }

        const ordered = this._orderByCache(this.mirrors);
        const failures = [];

        // '_self' = reference behavior (write into current document).
        // '_blank' (default) = stealth popup, opened synchronously to dodge blockers.
        const isSelf = this.target === '_self';
        let win = null;
        if (!isSelf) {
            win = window.open('about:blank', '_blank');
            if (!win) {
                throw new Error('Popup blocked - cannot open window');
            }
            this._win = win;
            this._showLoading(win, 0, ordered.length, 'Initializing...');
        }

        for (let i = 0; i < ordered.length; i++) {
            if (this._aborted) break;

            const url = ordered[i];
            let host = url;
            try { host = new URL(url).hostname; } catch (e) {}
            this.onProgress(i + 1, ordered.length, url);
            if (win) this._showLoading(win, i + 1, ordered.length, `Trying ${host} (${i + 1}/${ordered.length})...`);

            try {
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), this.timeoutMs);
                let resp;
                try {
                    resp = await fetch(url, {
                        method: 'GET',
                        mode: 'cors',
                        credentials: 'omit',
                        cache: 'no-cache',
                        signal: ctrl.signal
                    });
                } finally {
                    clearTimeout(t);
                }

                if (!resp.ok) {
                    throw new Error(`HTTP ${resp.status}`);
                }

                const html = await resp.text();
                if (!html || html.length < 50) {
                    throw new Error('Empty response');
                }

                this._rememberHost(url);
                // Iframe-only: every game renders inside a sandboxed iframe.
                // Direct src (not fetched HTML) keeps relative asset paths working.
                const shell = this._getIframeHTML(url, this._label);
                if (isSelf) {
                    document.open();
                    document.write(shell);
                    document.close();
                    this.onSuccess(null, url);
                } else {
                    win.document.open();
                    win.document.write(shell);
                    win.document.close();
                    this._showSuccess(win, url);
                    this.onSuccess(win, url);
                }
                return true;

            } catch (err) {
                failures.push(`${host}: ${(err && err.message) || 'failed'}`);
            }
        }

        // All mirrors failed
        const msg = `All mirrors failed to load (${failures.length}/${ordered.length})`;
        if (win) this._showError(win, msg, failures);
        this.onError(new Error(msg));
        return false;
    }

    _orderByCache(mirrors) {
        try {
            const cached = localStorage.getItem(this.cacheKey);
            if (!cached) return mirrors;
            const idx = mirrors.findIndex(m => {
                try { return new URL(m).hostname === cached; } catch (e) { return false; }
            });
            if (idx <= 0) return mirrors;
            return [mirrors[idx], ...mirrors.slice(0, idx), ...mirrors.slice(idx + 1)];
        } catch (e) {
            return mirrors;
        }
    }

    _rememberHost(url) {
        try {
            localStorage.setItem(this.cacheKey, new URL(url).hostname);
        } catch (e) {}
    }

    /**
     * Inject loading UI into the target window
     */
    _showLoading(win, current, total, message) {
        try {
            win.document.open();
            win.document.write(this._getLoadingHTML(current, total, message));
            win.document.close();
        } catch (e) {
            // Window might be closed or cross-origin
        }
    }

    _showSuccess(win, url) {
        try {
            // Optionally inject a small success indicator
            if (win.document.body) {
                const badge = win.document.createElement('div');
                badge.style.cssText = 'position:fixed;top:10px;right:10px;z-index:9999;padding:8px 12px;background:#22c55e;color:#000;border-radius:6px;font:12px monospace;';
                badge.textContent = `Loaded: ${new URL(url).hostname}`;
                win.document.body.appendChild(badge);
                setTimeout(() => badge.remove(), 3000);
            }
        } catch (e) {}
    }

    _showError(win, message) {
        try {
            win.document.open();
            win.document.write(this._getErrorHTML(message));
            win.document.close();
        } catch (e) {}
    }

    _getLoadingHTML(current, total, message) {
        const percent = Math.round((current / total) * 100);
        const safe = String(message).replace(/</g, '&lt;');
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Loading...</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font:14px 'Segoe UI',sans-serif;background:#0b0d12;color:#39ff14;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center}
.loader{text-align:center}
.bar{width:300px;height:6px;background:#1a1a3a;border-radius:3px;overflow:hidden;margin:20px auto}
.fill{height:100%;background:#39ff14;width:${percent}%;transition:width 0.3s}
.spinner{border:3px solid #1a1a3a;border-top-color:#39ff14;border-radius:50%;width:40px;height:40px;margin:0 auto 20px;animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.mirrors{font:11px monospace;color:#666;margin-top:10px}
.cancel{margin-top:16px;padding:8px 16px;background:transparent;color:#666;border:1px solid #333;border-radius:6px;font:12px monospace;cursor:pointer}
</style></head>
<body><div class="loader">
<div class="spinner"></div>
<div class="bar"><div class="fill"></div></div>
<p>${safe}</p>
<p class="mirrors">Mirror ${current}/${total} (${percent}%)</p>
<button class="cancel" onclick="window.close()">Cancel</button>
</div></body></html>`;
    }

    _getIframeHTML(url, label = 'Game') {
        const safeUrl = String(url).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
        const safeLabel = String(label).replace(/</g, '&lt;');
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${safeLabel}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{height:100%;background:#000;overflow:hidden}
iframe{position:fixed;inset:0;width:100%;height:100%;border:0;background:#000}
.topbar{position:fixed;top:0;left:0;right:0;z-index:9999;display:flex;align-items:center;gap:10px;padding:6px 12px;background:rgba(0,0,0,.75);color:#39ff14;font:12px monospace}
.topbar a{color:#39ff14}
.topbar button{margin-left:auto;background:transparent;color:#888;border:1px solid #333;border-radius:4px;font:11px monospace;padding:4px 10px;cursor:pointer}
.wrap{position:fixed;inset:0;padding-top:28px;box-sizing:border-box}
</style></head>
<body>
<div class="topbar"><span>${safeLabel}</span><a href="${safeUrl}" target="_blank" rel="noopener">Open directly</a><button onclick="window.close()">Close</button></div>
<div class="wrap"><iframe src="${safeUrl}" sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen" allowfullscreen allow="fullscreen; gamepad; autoplay"></iframe></div>
</body></html>`;
    }

    _getErrorHTML(message, failures = []) {
        const safe = String(message).replace(/</g, '&lt;');
        const list = failures.slice(0, 10).map(f => `<li>${String(f).replace(/</g, '&lt;')}</li>`).join('');
        return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Load Failed</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font:14px 'Segoe UI',sans-serif;background:#0b0d12;color:#ff4444;height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:20px}
.error{max-width:500px}
ul{text-align:left;font:11px monospace;color:#666;max-height:120px;overflow:auto;margin:10px 0}
button{margin-top:20px;padding:12px 24px;background:#39ff14;color:#000;border:none;border-radius:6px;font:bold 14px monospace;cursor:pointer}
button:hover{background:#22c55e}
</style></head>
<body><div class="error">
<h2 style="margin-bottom:10px">⚠ Failed to Load</h2>
<p style="color:#888;margin-bottom:10px">${safe}</p>
<ul>${list}</ul>
<p style="color:#666;font-size:12px">All CDN mirrors failed. The game may be unavailable or blocked.</p>
<button onclick="window.close()">Close Window</button>
</div></body></html>`;
    }
}

/**
 * Pre-defined mirror sets for common CDN patterns
 * Full 10-edge set keeps the site up via host fallback.
 * expandFromQuantil() preserves path + @version by hostname swap,
 * translating @version per host (statically/githack need branch form).
 *
 * Verified live: jsdelivr-family + jsdmirror accept @latest bare;
 * cdn.statically.io REQUIRES branch form (@latest 404s);
 * cdn.staticdelivr.com 404s even with @main (dropped);
 * raw.githack.com serves proper MIME with branch/tag form.
 */
export const UNBLOCKED_HOSTS = [
    'quantil.jsdelivr.net',
    'gcore.jsdelivr.net',
    'originfastly.jsdelivr.net',
    'fastly.jsdelivr.net',
    'testingcf.jsdelivr.net',
    'jsdelivr.b-cdn.net',
    'jsd.onmicrosoft.cn',
    'cdn.jsdmirror.com',
    'cdn.statically.io',
    'raw.githack.com'
];

// Hosts that speak native jsDelivr /gh/user/repo@version/path (or bare).
const JSDELIVR_HOSTS = new Set([
    'quantil.jsdelivr.net',
    'gcore.jsdelivr.net',
    'originfastly.jsdelivr.net',
    'fastly.jsdelivr.net',
    'testingcf.jsdelivr.net',
    'jsdelivr.b-cdn.net',
    'jsd.onmicrosoft.cn',
    'cdn.jsdmirror.com'
]);

/**
 * Split a jsDelivr gh URL into { user, repo, version, path }.
 * version is '' when the URL has no @version (bare = default branch).
 */
export function splitGhUrl(ghUrl) {
    const m = String(ghUrl).match(/^https:\/\/[^/]+\/gh\/([^/]+)\/([^/@]+)(?:@([^/]+))?\/(.*)$/);
    if (!m) return null;
    return { user: m[1], repo: m[2], version: m[3] || '', path: m[4] };
}

/**
 * Map a jsDelivr @version token to a plain branch/tag for hosts that
 * need branch form (statically, githack). 'latest'/'' -> 'main',
 * commit hashes and branch/tag names pass through untouched.
 */
export function branchOf(version) {
    if (!version || version === 'latest') return 'main';
    return version;
}

function buildForHost(host, parts) {
    const { user, repo, version, path } = parts;
    if (JSDELIVR_HOSTS.has(host)) {
        return `https://${host}/gh/${user}/${repo}${version ? '@' + version : ''}/${path}`;
    }
    if (host === 'cdn.statically.io') {
        return `https://cdn.statically.io/gh/${user}/${repo}/${branchOf(version)}/${path}`;
    }
    if (host === 'raw.githack.com') {
        return `https://raw.githack.com/${user}/${repo}/${branchOf(version)}/${path}`;
    }
    return null;
}

export function expandUnblockedMirrors(quantilUrl) {
    const parts = splitGhUrl(quantilUrl);
    if (!parts) {
        try {
            const u = new URL(quantilUrl);
            if (!u.hostname.endsWith('.jsdelivr.net') && !u.hostname.startsWith('cdn.')) return [quantilUrl];
        } catch (e) {
            return [quantilUrl];
        }
        return [quantilUrl];
    }
    return UNBLOCKED_HOSTS.map(h => buildForHost(h, parts)).filter(Boolean);
}

export const MIRROR_SETS = {
    jsdelivr: (user, repo, path = 'index.html', version = 'main') => [
        `https://quantil.jsdelivr.net/gh/${user}/${repo}@${version}/${path}`,
        `https://gcore.jsdelivr.net/gh/${user}/${repo}@${version}/${path}`,
        `https://originfastly.jsdelivr.net/gh/${user}/${repo}@${version}/${path}`,
        `https://fastly.jsdelivr.net/gh/${user}/${repo}@${version}/${path}`,
        `https://testingcf.jsdelivr.net/gh/${user}/${repo}@${version}/${path}`,
        `https://jsdelivr.b-cdn.net/gh/${user}/${repo}@${version}/${path}`,
        `https://jsd.onmicrosoft.cn/gh/${user}/${repo}@${version}/${path}`,
        `https://cdn.jsdmirror.com/gh/${user}/${repo}@${version}/${path}`,
        `https://cdn.statically.io/gh/${user}/${repo}/${version}/${path}`,
        `https://raw.githack.com/${user}/${repo}/${version}/${path}`
    ],

    // For GitHub-hosted game mirrors.
    // version 'latest' is jsDelivr-only; statically/githack get branch form.
    github: (repo = 's0n-1m-cr1n3/sc13nc3', path = 'assets/index.html', version = 'main') => [
        `https://quantil.jsdelivr.net/gh/${repo}@${version}/${path}`,
        `https://gcore.jsdelivr.net/gh/${repo}@${version}/${path}`,
        `https://originfastly.jsdelivr.net/gh/${repo}@${version}/${path}`,
        `https://fastly.jsdelivr.net/gh/${repo}@${version}/${path}`,
        `https://testingcf.jsdelivr.net/gh/${repo}@${version}/${path}`,
        `https://jsdelivr.b-cdn.net/gh/${repo}@${version}/${path}`,
        `https://jsd.onmicrosoft.cn/gh/${repo}@${version}/${path}`,
        `https://cdn.jsdmirror.com/gh/${repo}@${version}/${path}`,
        `https://cdn.statically.io/gh/${repo}/${version}/${path}`,
        `https://raw.githack.com/${repo}/${version}/${path}`
    ],
};

/**
 * Site bootstrap mirror list (multi-CDN pattern).
 * NOTE: the original reference list ended with statically @main and
 * staticdelivr /main/ forms — both 404 live, so they are stored here
 * in their working translated forms (branch path / githack).
 */
export const UNBLOCKED_SITE_MIRRORS = [
    'https://quantil.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://gcore.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://originfastly.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://fastly.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://testingcf.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://jsdelivr.b-cdn.net/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://jsd.onmicrosoft.cn/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://cdn.jsdmirror.com/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
    'https://cdn.statically.io/gh/s0n-1m-cr1n3/sc13nc3/main/assets/index.html',
    'https://raw.githack.com/s0n-1m-cr1n3/sc13nc3/main/assets/index.html'
];

/**
 * Probe mirrors and return the first reachable one without opening windows.
 * Used by the in-page viewer so the iframe src is set to a working host.
 * @param {string[]} mirrors
 * @param {Object} options - { timeoutMs, onProbe(i, total, url) }
 * @returns {Promise<{url: string, index: number} | null>}
 */
export async function probeFirstReachable(mirrors, options = {}) {
    const timeoutMs = options.timeoutMs || 10000;
    const onProbe = options.onProbe || (() => {});
    for (let i = 0; i < mirrors.length; i++) {
        onProbe(i, mirrors.length, mirrors[i]);
        try {
            const ctrl = new AbortController();
            const t = setTimeout(() => ctrl.abort(), timeoutMs);
            let resp;
            try {
                resp = await fetch(mirrors[i], {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'omit',
                    cache: 'no-cache',
                    signal: ctrl.signal
                });
            } finally {
                clearTimeout(t);
            }
            if (!resp.ok) continue;
            const html = await resp.text();
            if (!html || html.length < 50) continue;
            return { url: mirrors[i], index: i };
        } catch (e) {
            // try next
        }
    }
    return null;
}

/**
 * Convenience function: launch a game via mirror fallback
 * @param {string[]} mirrors - Mirror URLs
 * @param {Object} options - Same as MirrorLoader constructor
 * @returns {Promise<Window|null>} The opened window or null if failed
 */
export async function launchViaMirrors(mirrors, options = {}) {
    const loader = new MirrorLoader(mirrors, options);
    const success = await loader.launch();
    return success ? loader._win : null;
}

export default MirrorLoader;