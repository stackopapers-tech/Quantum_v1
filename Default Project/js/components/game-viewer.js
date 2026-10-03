/**
 * GameViewer - In-page iframe game viewer (beats plain sidebar demos).
 *
 * Reference pattern (sidebar + <iframe allow="autoplay; fullscreen; gamepad">)
 * plus what the reference lacks:
 *   - CDN mirror probing + manual mirror switcher
 *   - Loading state with per-host progress
 *   - Fullscreen toggle, pop-out (stealth about:blank popup), close (Esc)
 *   - Blocked-frame fallback (X-Frame-Options/CSP cannot be bypassed,
 *     so viewer offers Pop-out / Open directly when the frame stays blank)
 *
 * JS-only overlay: no index.html changes required.
 */

import { probeFirstReachable } from './mirror-loader.js?v=2026.09.27-3';

let activeViewer = null;

function hostOf(url) {
    try { return new URL(url).hostname; } catch (e) { return url; }
}

export function closeGameViewer() {
    if (activeViewer) {
        activeViewer.close();
        activeViewer = null;
    }
}

/**
 * @param {Object} opts
 * @param {string} opts.title - Game name
 * @param {string} opts.url - Primary absolute URL
 * @param {string[]} [opts.mirrors] - Fallback mirror URLs (probed in order)
 * @param {Function} [opts.onPopOut] - Called when user clicks pop-out
 * @returns {{close: Function}}
 */
export function openGameViewer(opts) {
    closeGameViewer();

    const title = opts.title || 'Game';
    const primary = opts.url;
    const mirrors = (opts.mirrors && opts.mirrors.length > 0) ? opts.mirrors : [primary];
    const onPopOut = typeof opts.onPopOut === 'function' ? opts.onPopOut : null;

    const safeTitle = String(title).replace(/</g, '&lt;');

    const overlay = document.createElement('div');
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', safeTitle);
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:1rem;font-family:system-ui,sans-serif;';

    const box = document.createElement('div');
    box.style.cssText = 'background:#0b0d12;border:1px solid #39ff14;border-radius:12px;width:min(1100px,100%);height:min(720px,92vh);display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,0.6);';

    const bar = document.createElement('div');
    bar.style.cssText = 'display:flex;align-items:center;gap:8px;padding:10px 12px;background:#111;border-bottom:1px solid #222;color:#39ff14;font:12px monospace;flex-shrink:0;';

    const nameEl = document.createElement('span');
    nameEl.style.cssText = 'font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;';
    nameEl.textContent = title;

    const mirrorSel = document.createElement('select');
    mirrorSel.setAttribute('aria-label', 'Mirror host');
    mirrorSel.style.cssText = 'margin-left:8px;background:#000;color:#39ff14;border:1px solid #333;border-radius:4px;font:11px monospace;padding:4px;max-width:220px;';
    mirrors.forEach((m, i) => {
        const o = document.createElement('option');
        o.value = String(i);
        o.textContent = `${i === 0 ? '★ ' : ''}${hostOf(m)}`;
        mirrorSel.appendChild(o);
    });

    const btn = (label, titleAttr) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = label;
        b.title = titleAttr || label;
        b.style.cssText = 'background:transparent;color:#888;border:1px solid #333;border-radius:4px;font:11px monospace;padding:5px 10px;cursor:pointer;white-space:nowrap;';
        return b;
    };

    const fsBtn = btn('⛶ Fullscreen', 'Toggle fullscreen');
    const popBtn = btn('↗ Pop-out', 'Open in stealth about:blank popup');
    const openBtn = btn('Open directly', 'Open game URL in a new tab');
    const closeBtn = btn('✕ Close', 'Close viewer (Esc)');

    const spacer = document.createElement('span');
    spacer.style.cssText = 'flex:1;';

    bar.appendChild(nameEl);
    bar.appendChild(mirrorSel);
    bar.appendChild(spacer);
    bar.appendChild(fsBtn);
    if (onPopOut) bar.appendChild(popBtn);
    bar.appendChild(openBtn);
    bar.appendChild(closeBtn);

    const stage = document.createElement('div');
    stage.style.cssText = 'position:relative;flex:1;background:#000;min-height:0;';

    const loading = document.createElement('div');
    loading.style.cssText = 'position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#39ff14;font:13px monospace;';
    loading.innerHTML = '<div class="gv-spinner"></div><div class="gv-status">Probing mirrors…</div>';
    const style = document.createElement('style');
    style.textContent = '.gv-spinner{border:3px solid #1a1a3a;border-top-color:#39ff14;border-radius:50%;width:40px;height:40px;animation:gvspin 1s linear infinite}@keyframes gvspin{to{transform:rotate(360deg)}}';

    const frame = document.createElement('iframe');
    frame.setAttribute('allow', 'autoplay; fullscreen; gamepad');
    frame.setAttribute('allowfullscreen', '');
    frame.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-pointer-lock allow-fullscreen');
    frame.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;border:0;background:#000;display:none;';

    const hint = document.createElement('div');
    hint.style.cssText = 'position:absolute;left:0;right:0;bottom:0;display:none;gap:8px;align-items:center;justify-content:center;padding:6px;background:rgba(0,0,0,0.8);color:#888;font:11px monospace;';
    hint.innerHTML = '<span>Blank screen? This site blocks framing (X-Frame-Options/CSP).</span>';

    const hintPop = btn('Pop-out instead', 'Open in popup');
    hint.appendChild(hintPop);

    stage.appendChild(loading);
    stage.appendChild(frame);
    stage.appendChild(hint);
    box.appendChild(bar);
    box.appendChild(stage);
    overlay.appendChild(box);
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    const statusEl = loading.querySelector('.gv-status');
    let closed = false;

    function setStatus(msg) {
        if (statusEl) statusEl.textContent = msg;
    }

    function showFrame(url, idx) {
        if (closed) return;
        frame.src = url;
        frame.style.display = 'block';
        loading.style.display = 'none';
        mirrorSel.value = String(idx);
        // Framing blocks are not reliably detectable cross-origin;
        // surface the fallback hint in case the frame stays blank.
        setTimeout(() => {
            if (!closed) hint.style.display = 'flex';
        }, 6000);
    }

    async function load() {
        setStatus(`Probing ${mirrors.length} mirror(s)…`);
        const found = await probeFirstReachable(mirrors, {
            onProbe: (i, total, u) => setStatus(`Trying ${hostOf(u)} (${i + 1}/${total})…`)
        });
        if (closed) return;
        if (found) {
            showFrame(found.url, found.index);
        } else {
            setStatus('All mirrors failed. Use Pop-out or Open directly.');
            hint.style.display = 'flex';
        }
    }

    mirrorSel.addEventListener('change', () => {
        const i = parseInt(mirrorSel.value, 10) || 0;
        frame.style.display = 'none';
        loading.style.display = 'flex';
        hint.style.display = 'none';
        setStatus(`Loading ${hostOf(mirrors[i])}…`);
        showFrame(mirrors[i], i);
    });

    fsBtn.addEventListener('click', () => {
        try {
            if (!document.fullscreenElement) box.requestFullscreen();
            else document.exitFullscreen();
        } catch (e) {}
    });

    function doPopOut() {
        const url = mirrors[parseInt(mirrorSel.value, 10) || 0];
        api.close();
        if (onPopOut) onPopOut(url);
        else window.open(url, '_blank', 'noopener');
    }
    if (onPopOut) popBtn.addEventListener('click', doPopOut);
    hintPop.addEventListener('click', doPopOut);

    openBtn.addEventListener('click', () => {
        const a = document.createElement('a');
        a.href = mirrors[parseInt(mirrorSel.value, 10) || 0];
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        a.remove();
    });

    function onKey(e) {
        if (e.key === 'Escape') api.close();
    }
    document.addEventListener('keydown', onKey);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) api.close();
    });

    const api = {
        close() {
            if (closed) return;
            closed = true;
            document.removeEventListener('keydown', onKey);
            try {
                if (document.fullscreenElement) document.exitFullscreen();
            } catch (e) {}
            try { frame.src = 'about:blank'; } catch (e) {}
            overlay.remove();
            style.remove();
            if (activeViewer === api) activeViewer = null;
        }
    };
    closeBtn.addEventListener('click', () => api.close());

    activeViewer = api;
    load();
    return api;
}

export default { openGameViewer, closeGameViewer };
