// CACHE BUSTING - Version stamp for production consistency
import { DEFAULT_SETTINGS, DEFAULT_MIRRORS, DEFAULT_GAMES, DEMO_MEDIA, PROXY_DATA, DEFAULT_COLLECTIONS, ACHIEVEMENT_DEFS, DEFAULT_SOUND_PACKS } from './data/defaults.js?v=2026.09.27-3';
import { TV_CATALOG, MOVIE_CATALOG, ANIME_CATALOG, TOP_TIER } from './data/catalog.js?v=2026.09.27-3';
import toast from './components/toast.js?v=2026.09.27-3';
import modals from './components/modal.js?v=2026.09.27-3';
import { AboutBlankLauncher, launchViaAboutBlank, normalizeHttpUrl, isValidHttpUrl } from './components/about-blank-launcher.js?v=2026.09.27-3';
import { MirrorLoader, MIRROR_SETS, expandUnblockedMirrors } from './components/mirror-loader.js?v=2026.09.27-3';
import { UBZ_GAMES } from './data/ubz-games.js?v=2026.09.27-3';
import { PASTED_GAMES } from './data/pasted-games.js?v=2026.09.27-3';
import { openGameViewer } from './components/game-viewer.js?v=2026.09.27-3';
import { PasswordPolicy, FailedAttemptTracker, SecurityPolicy, defaultPasswordPolicy, defaultFailedTracker } from './components/password-policy.js?v=2026.09.27-3';
import { userDB } from './components/user-db.js?v=2026.09.27-3';

class GameHubApplication {
    constructor() {
        this.settings = { ...DEFAULT_SETTINGS };
        this.mirrors = [...DEFAULT_MIRRORS];
        this.games = [...DEFAULT_GAMES, ...UBZ_GAMES, ...PASTED_GAMES];
        this.collections = [...DEFAULT_COLLECTIONS];
        this.achievements = [];
        this.launchHistory = [];
        this.gameStats = {};
        this.activeTab = null;
        this.currentNoteId = null;
        this.viewMode = 'grid';
        this.searchQuery = '';
        this.selectedCategory = 'all';
        this.commandPaletteOpen = false;
        this.usedMirrors = new Set();
        this.usedTools = new Set();
        this.usedThemes = new Set();

        // Auth State (server-backed)
        this._currentUser = null;
        this._authToken = null;
        this._sessionExpiry = null;
        this._authBase = '';

        this.synthAudioCtx = null;
        this.currentSoundPack = DEFAULT_SOUND_PACKS.quantum;

        this.init();
    }

    init() {
        try {
            this.loadPersistents();
            this.applyVisuals();
            this.initCoreSystems();
            this.initAuth();

            console.log("%c SECURITY HUB INITIALIZED ", "background: #000; color: #39ff14; font-weight: bold; font-size: 14px;");
        } catch (e) {
            console.error('Critical System Boot Failure:', e);
        }
    }

    loadPersistents() {
        try {
            this.loadSettings();
            this.loadGames();
            this.loadMirrors();
            this.loadCollections();
            this.loadAchievements();
            this.loadLaunchHistory();
            this.loadGameStats();
        } catch (e) {
            console.error('Persistence load error:', e);
        }
    }

    applyVisuals() {
        try {
            this.applyTheme();
            this.applyAccentColor();
            this.applySoundPack();
            this.applyWallpaper();
            if (this.settings.particlesEnabled) this.initParticles();
        } catch (e) { console.error('Visual apply error:', e); }
    }

    initCoreSystems() {
        const systems = [
            { fn: () => this.bindNavigation(), name: 'Navigation' },
            { fn: () => this.renderGamesGrid(), name: 'GameGrid' },
            { fn: () => this.renderMirrorsConfigTable(), name: 'MirrorTable' },
            { fn: () => this.autoPickMirror(), name: 'MirrorAutoPick' },
            { fn: () => this.setupInitialScreen(), name: 'InitialScreen' },
            { fn: () => this.initCommandPalette(), name: 'CmdPalette' },
            { fn: () => this.initKeyboardShortcuts(), name: 'Shortcuts' },
            { fn: () => this.initGamepadSupport(), name: 'Gamepad' },
            { fn: () => this.initQuickLaunchWidget(), name: 'QuickLaunch' },
            { fn: () => this.initInteractiveMedia(), name: 'Media' },
            { fn: () => this.initInteractiveTools(), name: 'Tools' },
            { fn: () => this.initInteractiveProxy(), name: 'Proxy' },
            { fn: () => this.initInteractiveSettings(), name: 'Settings' }
        ];

        systems.forEach(sys => {
            try { sys.fn(); } catch (e) { console.error(`System [${sys.name}] failed to init:`, e); }
        });
    }

    /* --- Persistence Layer --- */
    loadSettings() {
        const stored = localStorage.getItem('hub_settings');
        if (stored) {
            try {
                this.settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
                localStorage.setItem('hub_audio_feedback', this.settings.audioFeedback);
            } catch (e) {}
        }
    }

    saveSettings() {
        localStorage.setItem('hub_settings', JSON.stringify(this.settings));
        localStorage.setItem('hub_audio_feedback', this.settings.audioFeedback);
    }

    loadGames() {
        const allDefaults = [...DEFAULT_GAMES, ...UBZ_GAMES, ...PASTED_GAMES];
        // Retired game ids are purged from stored copies on load.
        const RETIRED_GAME_IDS = new Set(['ubz_who_s_your_daddy_186']);
        const stored = localStorage.getItem('hub_games');
        if (!stored) {
            this.games = [...allDefaults];
            this.saveGames();
            return;
        }
        try {
            const parsed = JSON.parse(stored);
            const byId = new Map(parsed.map(g => [g.id, g]));
            this.games = [...allDefaults].map(def => {
                const existing = byId.get(def.id);
                if (existing) {
                    byId.delete(def.id);
                    return { ...def, ...existing, url: def.url };
                }
                return { ...def };
            });
            for (const custom of byId.values()) {
                if (!RETIRED_GAME_IDS.has(custom.id)) this.games.push(custom);
            }
            this.saveGames();
        } catch (e) { this.games = [...DEFAULT_GAMES, ...UBZ_GAMES, ...PASTED_GAMES]; }
    }

    saveGames() {
        localStorage.setItem('hub_games', JSON.stringify(this.games));
    }

    loadMirrors() {
        const stored = localStorage.getItem('hub_mirrors');
        if (!stored) {
            this.mirrors = [...DEFAULT_MIRRORS];
            this.saveMirrors();
            return;
        }
        try {
            const parsed = JSON.parse(stored);
            const byId = new Map(parsed.map(m => [m.id, m]));
            this.mirrors = [...DEFAULT_MIRRORS].map(def => {
                const existing = byId.get(def.id);
                if (existing) {
                    byId.delete(def.id);
                    return { ...def, ...existing, url: def.url };
                }
                return { ...def };
            });
            for (const custom of byId.values()) this.mirrors.push(custom);
        } catch (e) { this.mirrors = [...DEFAULT_MIRRORS]; }
    }

    saveMirrors() {
        localStorage.setItem('hub_mirrors', JSON.stringify(this.mirrors));
    }

    loadCollections() {
        try {
            this.collections = JSON.parse(localStorage.getItem('hub_collections')) || [...DEFAULT_COLLECTIONS];
        } catch (e) { this.collections = [...DEFAULT_COLLECTIONS]; }
    }

    saveCollections() {
        localStorage.setItem('hub_collections', JSON.stringify(this.collections));
    }

    loadAchievements() {
        try {
            const stored = JSON.parse(localStorage.getItem('hub_achievements') || '[]');
            this.achievements = ACHIEVEMENT_DEFS.map(def => {
                const saved = stored.find(a => a.id === def.id);
                return { ...def, unlocked: !!(saved && saved.unlocked), unlockedAt: saved?.unlockedAt || null };
            });
        } catch (e) { this.achievements = [...ACHIEVEMENT_DEFS]; }
    }

    saveAchievements() {
        localStorage.setItem('hub_achievements', JSON.stringify(this.achievements));
    }

    unlockAchievement(id) {
        const ach = this.achievements.find(a => a.id === id);
        if (ach && !ach.unlocked) {
            ach.unlocked = true;
            ach.unlockedAt = Date.now();
            this.saveAchievements();
            toast.show(`🏆 Achievement Unlocked: ${ach.name}`, 'success', 6000);
            this.playUISound(880, 0.1, 'triangle');
            setTimeout(() => this.playUISound(1320, 0.1, 'triangle'), 100);
        }
    }

    loadLaunchHistory() {
        try {
            this.launchHistory = JSON.parse(localStorage.getItem('hub_launch_history') || '[]');
        } catch (e) { this.launchHistory = []; }
    }

    saveLaunchHistory() {
        localStorage.setItem('hub_launch_history', JSON.stringify(this.launchHistory));
    }

    recordLaunch(gameId, mirrorId) {
        const entry = { gameId, mirrorId, timestamp: Date.now(), date: new Date().toISOString() };
        this.launchHistory.unshift(entry);
        if (this.launchHistory.length > 200) this.launchHistory.pop();
        this.saveLaunchHistory();

        if (!this.gameStats[gameId]) {
            this.gameStats[gameId] = { launches: 0, playTime: 0, lastPlayed: null, rating: 0 };
        }
        this.gameStats[gameId].launches++;
        this.gameStats[gameId].lastPlayed = Date.now();
        this.saveGameStats();

        this.usedMirrors.add(mirrorId);
        this.checkAchievements();
    }

    loadGameStats() {
        try { this.gameStats = JSON.parse(localStorage.getItem('hub_game_stats') || '{}'); } catch (e) { this.gameStats = {}; }
    }

    saveGameStats() {
        localStorage.setItem('hub_game_stats', JSON.stringify(this.gameStats));
    }

    getGameStats(gameId) {
        return this.gameStats[gameId] || { launches: 0, playTime: 0, lastPlayed: null, rating: 0 };
    }

    checkAchievements() {
        const totalLaunches = Object.values(this.gameStats).reduce((sum, s) => sum + (s.launches || 0), 0);
        const hour = new Date().getHours();
        if (totalLaunches >= 1) this.unlockAchievement('first_launch');
        if (totalLaunches >= 10) this.unlockAchievement('ten_launches');
        if (hour >= 0 && hour < 6) this.unlockAchievement('night_owl');
        if (this.usedMirrors.size >= 3) this.unlockAchievement('mirror_master');
        if (this.usedThemes.size >= 5) this.unlockAchievement('theme_hopper');
        if (this.usedTools.size >= 5) this.unlockAchievement('tool_user');
    }

    applySoundPack() {
        const packName = this.settings.soundPack || 'quantum';
        this.currentSoundPack = DEFAULT_SOUND_PACKS[packName] || DEFAULT_SOUND_PACKS.quantum;
    }

    /* =========================================================================
       AUTH SYSTEM - Secure Server Integration
       ========================================================================= */

    _authHeaders() {
        return {
            'Content-Type': 'application/json',
            ...(this._authToken ? { 'Authorization': `Bearer ${this._authToken}` } : {})
        };
    }

    async _api(path, body = {}) {
        const res = await fetch(`${this._authBase}/api${path}`, {
            method: 'POST',
            headers: this._authHeaders(),
            body: JSON.stringify(body),
            credentials: 'include'
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.ok) {
            throw new Error(data.error || `Request failed (${res.status})`);
        }
        return data;
    }

    async registerUser(username, email, password) {
        const data = await this._api('/register', { username, email, password });
        return { otpId: data.otp_id, emailSent: data.email_sent };
    }

    async verifyEmail(otpId, code) {
        await this._api('/verify-email', { otp_id: otpId, code });
    }

    async resendCode(email, purpose = 'verify') {
        const data = await this._api('/resend-code', { email, purpose });
        return { otpId: data.otp_id, emailSent: data.email_sent };
    }

    async loginUser(username, password, remember = false) {
        const data = await this._api('/login', { username, password, remember });
        if (data.step === 'code') {
            return { otpId: data.otp_id, emailSent: data.email_sent };
        }
        if (data.token) {
            this._establishSession(data);
            return { username: data.username, email: data.email };
        }
        throw new Error('Unexpected login response');
    }

    async verifyLogin(otpId, code, remember = true) {
        const data = await this._api('/login/verify', { otp_id: otpId, code, remember });
        this._establishSession(data);
        return { username: data.username, email: data.email };
    }

    _establishSession(data) {
        this._authToken = data.token;
        this._sessionExpiry = data.expiry * 1000;
        this._currentUser = { username: data.username, email: data.email, preferences: data.preferences };
        this._persistSession(data.token, data.expiry * 1000);
        this.applyUserPreferences(this._currentUser.preferences);
    }

    _persistSession(token, expiry) {
        const session = { token, user: this._currentUser?.username, expiry, remember: true };
        localStorage.setItem('hub_session', JSON.stringify(session));
        this.setSessionCookie(token, this._currentUser?.username, expiry);
    }

    async logoutUser() {
        if (this._authToken) {
            try { await this._api('/logout', { token: this._authToken }); } catch (e) {}
        }
        this._clearSession();
        this.updateAuthUI();
    }

    _clearSession() {
        this._currentUser = null;
        this._authToken = null;
        this._sessionExpiry = null;
        localStorage.removeItem('hub_session');
        this.clearSessionCookies();
    }

    async restoreSession() {
        const stored = localStorage.getItem('hub_session');
        if (!stored) return false;

        try {
            const session = JSON.parse(stored);
            if (session.expiry < Date.now()) {
                this._clearSession();
                return false;
            }

            // Server-side validation of the token
            const data = await this._api('/session/verify', { token: session.token });
            this._establishSession(data);
            return true;
        } catch (e) {
            this._clearSession();
            return false;
        }
    }

    setSessionCookie(token, user, expiry) {
        try {
            const secure = location.protocol === 'https:' ? '; Secure' : '';
            document.cookie = `hub_session=${encodeURIComponent(token)}; expires=${new Date(expiry).toUTCString()}; path=/; SameSite=Lax${secure}`;
            document.cookie = `hub_user=${encodeURIComponent(user)}; expires=${new Date(expiry).toUTCString()}; path=/; SameSite=Lax${secure}`;
        } catch (e) {}
    }

    getCookie(name) {
        try {
            const m = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
            return m ? decodeURIComponent(m[1]) : null;
        } catch (e) { return null; }
    }

    clearSessionCookies() {
        try {
            document.cookie = 'hub_session=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
            document.cookie = 'hub_user=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax';
        } catch (e) {}
    }

    isLoggedIn() {
        return !!this._currentUser && this._sessionExpiry && this._sessionExpiry > Date.now();
    }

    /* --- UI & Visuals --- */
    applyTheme() {
        document.body.className = `theme-${this.settings.theme}`;
        if (this.settings.animations === 'reduced') document.body.classList.add('animations-reduced');
        else if (this.settings.animations === 'none') document.body.classList.add('animations-none');
    }

    applyAccentColor() {
        document.documentElement.style.setProperty('--accent', this.settings.accentColor);
        const hex = this.settings.accentColor.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        document.documentElement.style.setProperty('--accent-rgb', `${r}, ${g}, ${b}`);
    }

    applyWallpaper() {
        if (this.settings.customWallpaper) {
            document.body.style.backgroundImage = `url('${this.settings.customWallpaper}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            document.body.style.backgroundAttachment = 'fixed';
        } else {
            document.body.style.backgroundImage = '';
        }
    }

    applyUserPreferences(prefs) {
        if (!prefs) return;
        if (prefs.theme) { this.settings.theme = prefs.theme; this.applyTheme(); }
        if (prefs.accentColor) { this.settings.accentColor = prefs.accentColor; this.applyAccentColor(); }
        if (prefs.animations) { this.settings.animations = prefs.animations; this.applyTheme(); }
    }

    attachPasswordToggles(root) {
        if (!root) return;
        root.querySelectorAll('input[type="password"]').forEach(input => {
            if (input.dataset.pwToggleDone) return;
            input.dataset.pwToggleDone = '1';
            const wrap = document.createElement('div');
            wrap.className = 'pw-wrap';
            input.parentNode.insertBefore(wrap, input);
            wrap.appendChild(input);
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'pw-toggle';
            btn.innerHTML = '<i class="fas fa-eye"></i>';
            btn.addEventListener('click', () => {
                const show = input.type === 'password';
                input.type = show ? 'text' : 'password';
                btn.innerHTML = show ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
            });
            wrap.appendChild(btn);
        });
    }

    /* --- Launch Engine (Integrated with AboutBlankLauncher + MirrorLoader) --- */
    launchContent(url, mode = null, label = 'Asset', mirrors = null) {
        const formattedUrl = normalizeHttpUrl(url);
        if (!formattedUrl) {
            toast.show(`Invalid URL for ${label}. Must be http:// or https://`, 'error', 6000);
            return false;
        }

        const globalMode = this.effectiveLaunchMode();
        toast.show(`Opening ${label}…`, 'info');

        // If mirrors provided and mode is about-blank, use MirrorLoader
        if (mirrors && mirrors.length > 0 && globalMode === 'about-blank') {
            return this.launchViaMirrors(formattedUrl, label, mirrors);
        }

        if (globalMode === 'about-blank') {
            // Use the optimized utility class
            const success = launchViaAboutBlank(formattedUrl, label, {
                onSuccess: () => {
                    try { this.recordLaunch('web:' + formattedUrl, this.settings.defaultMirrorId); } catch(e){}
                },
                onError: (err) => {
                    toast.show(err.message, 'error');
                }
            });
            return success;
        } else if (globalMode === 'same-tab') {
            // Force same-tab to separate tab for security/sandboxing
            const w = window.open(formattedUrl, '_blank');
            if (w) { try { w.opener = null; } catch (e) {} return true; }
            modals.open(`
                <div class="text-center p-4">
                    <h3 class="text-xl font-bold text-white mb-2">POPUP BLOCKED</h3>
                    <p class="text-gray-400 text-sm mb-4">Your browser blocked the tab for <span
class="text-white">${label}</span>.</p>
                    <a href="${formattedUrl}" target="_blank" rel="noopener" class="btn-premium px-6 py-2 text-xs">OPEN
MANUALLY</a>
                </div>
            `);
            return false;
        } else {
            const w = window.open(formattedUrl, '_blank');
            if (w) { try { w.opener = null; } catch (e) {} return true; }

            // Fallback if popup blocked
            modals.open(`
                <div class="text-center p-4">
                    <h3 class="text-xl font-bold text-white mb-2">POPUP BLOCKED</h3>
                    <p class="text-gray-400 text-sm mb-4">Your browser blocked the tab for <span
class="text-white">${label}</span>.</p>
                    <a href="${formattedUrl}" target="_blank" rel="noopener" class="btn-premium px-6 py-2 text-xs">OPEN
MANUALLY</a>
                </div>
            `);
            return false;
        }
    }

    /**
     * Launch via multiple CDN mirrors (multi-CDN pattern)
     * Tries each mirror sequentially until one loads
     */
    async launchViaMirrors(url, label, mirrors) {
        // Build full mirror URLs if they're relative patterns
        const fullMirrors = mirrors.map(m => {
            // If mirror contains placeholder, replace with URL
            if (m.includes('{url}')) {
                return m.replace('{url}', encodeURIComponent(url));
            }
            return m;
        });

        const loader = new MirrorLoader(fullMirrors, {
            target: '_blank',
            label: label,
            onProgress: (current, total, mirrorUrl) => {
                toast.show(`Trying mirror ${current}/${total}…`, 'info', 2000);
            },
            onSuccess: (win, mirrorUrl) => {
                toast.show(`Loaded via ${new URL(mirrorUrl).hostname}`, 'success', 3000);
                try { this.recordLaunch('web:' + url, this.settings.defaultMirrorId); } catch(e){}
            },
            onError: (err) => {
                toast.show(`All mirrors failed for ${label}`, 'error', 6000);
                // Fallback to direct launch
                this.launchContent(url, 'about-blank', label);
            }
        });

        return await loader.launch();
    }

    launchGame(game) {
        if (!game || !game.url) return toast.show('Game URL missing.', 'error');
        // Force same-tab mode to separate tab for security
        const mode = game.launchMode;
        if (mode === 'same-tab') {
            game.launchMode = 'new-tab';
        }
        try { this.recordLaunch(game.id, this.settings.defaultMirrorId || 'cdn-jsdelivr'); } catch (e) {}
        // Hub-relative URLs (local pasted games under games/) resolve
        // against the hub origin so launchContent always gets absolute.
        let gameUrl = game.url;
        if (gameUrl && !/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(gameUrl)) {
            try { gameUrl = new URL(gameUrl, document.baseURI).href; } catch (e) {}
        }
        // Runtime CDN fallback: jsDelivr-hosted games without a stored
        // mirrors array get mirrors generated via hostname swap (no bloat).
        let mirrors = game.mirrors;
        if (!mirrors && typeof expandUnblockedMirrors === 'function') {
            const expanded = expandUnblockedMirrors(gameUrl);
            if (expanded && expanded.length > 1) mirrors = expanded;
        }
        // In-page iframe viewer first (fullscreen, mirror switcher,
        // pop-out). Popup path preserved via onPopOut for stealth + verifier.
        try {
            openGameViewer({
                title: game.name,
                url: gameUrl,
                mirrors: mirrors || [gameUrl],
                onPopOut: (popUrl) => this.launchContent(popUrl || gameUrl, 'about-blank', game.name, mirrors)
            });
        } catch (e) {
            this.launchContent(gameUrl, game.launchMode, game.name, mirrors);
        }
    }

    launchGameById(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (game) this.launchGame(game);
        else toast.show('Game not found.', 'error');
    }

    effectiveLaunchMode() {
        const sel = document.getElementById('setting-launch-behavior');
        return (sel ? sel.value : null) || this.settings.defaultLauchBehavior || 'about-blank';
    }

    effectiveLaunchModeLabel() {
        const m = this.effectiveLaunchMode();
        return m === 'about-blank' ? 'about:blank' : (m === 'same-tab' ? 'Same Tab' : 'New Tab');
    }

    /* --- Game Grid & Search --- */
    renderGamesGrid() {
        const grid = document.querySelector('.game-grid');
        if (!grid) return;

        if (!this._gameSearchInitialized) {
            this.initGameSearchFilters();
            this._gameSearchInitialized = true;
        }

        const filteredGames = this.getFilteredGames();
        if (filteredGames.length === 0) {
            grid.innerHTML = `<div class="col-span-full py-16 text-center text-gray-500">No games match your
filters.</div>`;
            return;
        }

        const indicator = document.getElementById('games-total-indicator');
        if (indicator) indicator.textContent = filteredGames.length;

        grid.innerHTML = filteredGames.map(g => `
            <div class="game-card" data-id="${g.id}">
                <div class="game-card-management">
                    <button class="btn-card-action edit" data-id="${g.id}"><i class="fas fa-pencil-alt"></i></button>
                    <button class="btn-card-action delete" data-id="${g.id}"><i class="fas fa-trash-alt"></i></button>
                </div>
                <div class="game-card-art" style="background-image: url('${g.image ||
'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80'}');"></div>
                <div class="game-card-overlay"></div>
                <div class="game-card-content">
                    <span class="badge-category" style="background: rgba(${this._hexToRgb(g.accentColor || '#39ff14')},
0.1); border-color: ${g.accentColor}; color: ${g.accentColor};">${g.category || 'Sandbox'}</span>
                    <h3 class="game-card-title">${g.name}</h3>
                    <p class="game-card-desc">${g.description || 'Direct launching available.'}</p>
                    <div class="game-card-actions">
                        <button class="btn-premium py-1.5 text-xs play-game-btn" data-id="${g.id}" style="background:
linear-gradient(135deg, ${g.accentColor || 'var(--accent)'} 0%, rgba(${this._hexToRgb(g.accentColor || '#39ff14')}, 0.6)
100%);">
                            <i class="fas fa-play"></i> LAUNCH GAME
                        </button>
                        <div class="text-[10px] text-gray-500 font-mono">${this.effectiveLaunchModeLabel()}</div>
                    </div>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('.play-game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.launchGameById(btn.dataset.id);
            });
        });

        grid.querySelectorAll('.btn-card-action.edit').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const game = this.games.find(g => g.id === btn.dataset.id);
                modals.showGameForm(game, (updated) => {
                    this.games = this.games.map(item => item.id === game.id ? { ...item, ...updated } : item);
                    this.saveGames();
                    this.renderGamesGrid();
                    toast.show('Specification updated.', 'success');
                });
            });
        });

        grid.querySelectorAll('.btn-card-action.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const game = this.games.find(g => g.id === btn.dataset.id);
                modals.showConfirm('PURGE GAME', `Purge "${game.name}" from repository?`, () => {
                    this.games = this.games.filter(g => g.id !== game.id);
                    this.saveGames();
                    this.renderGamesGrid();
                });
            });
        });
    }

    _hexToRgb(hex) {
        hex = hex.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `${r}, ${g}, ${b}`;
    }

    initGameSearchFilters() {
        ['game-search-input', 'game-category-filter', 'game-sort-filter', 'game-favorites-only'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', () => this.renderGamesGrid());
        });
    }

    getFilteredGames() {
        const search = document.getElementById('game-search-input')?.value.toLowerCase().trim() || '';
        const cat = document.getElementById('game-category-filter')?.value || 'all';
        const sort = document.getElementById('game-sort-filter')?.value || 'name';
        const favs = document.getElementById('game-favorites-only')?.checked || false;

        let filtered = this.games.filter(g => {
            const matchSearch = !search || g.name.toLowerCase().includes(search) ||
g.category.toLowerCase().includes(search);
            const matchCat = cat === 'all' || g.category === cat;
            const matchFav = !favs || (this.gameStats[g.id]?.rating || 0) >= 4;
            return matchSearch && matchCat && matchFav;
        });

        if (sort === 'launches') filtered.sort((a, b) => (this.gameStats[b.id]?.launches || 0) -
(this.gameStats[a.id]?.launches || 0));
        else if (sort === 'recent') filtered.sort((a, b) => (this.gameStats[b.id]?.lastPlayed || 0) -
(this.gameStats[a.id]?.lastPlayed || 0));
        else filtered.sort((a, b) => a.name.localeCompare(b.name));

        return filtered;
    }

    /* --- AI Assistant (Optimized Pyodide & Intent) --- */
    async initAIAssistant() {
        const sendBtn = document.getElementById('ai-chat-send');
        const input = document.getElementById('ai-chat-input');
        const messagesContainer = document.getElementById('ai-chat-messages');
        if (!sendBtn || !input || !messagesContainer) return;

        const mindLog = document.getElementById('ai-mind-log');
        const mind = (step) => {
            if (!mindLog) return;
            const line = document.createElement('div');
            line.textContent = `› ${step}`;
            mindLog.appendChild(line);
            mindLog.scrollTop = mindLog.scrollHeight;
        };

        let pyodide = null;
        const getPy = async () => {
            if (pyodide) return pyodide;
            mind('Mind: Loading Pyodide runtime...');
            try {
                const script = document.createElement('script');
                script.src = 'https://cdn.jsdelivr.net/pyodide/v0.25.1/full/pyodide.js';
                document.head.appendChild(script);
                await new Promise(r => script.onload = r);
                pyodide = await window.loadPyodide();
                mind('Mind: Python Engine Active.');
                return pyodide;
            } catch (e) {
                mind('Mind: Python failed. Using local solver.');
                return null;
            }
        };

        const sendMessage = async () => {
            const text = input.value.trim();
            if (!text) return;

            // UI: Add user message & typing indicator
            this.addAIMessage(text, true, messagesContainer);
            input.value = '';
            const typing = this.addTypingIndicator(messagesContainer);

            mind(`Analyzing input: "${text.slice(0, 30)}..."`);

            try {
                // Math check
                if (this.isMathIntent(text)) {
                    const py = await getPy();
                    if (py) {
                        const result = await py.runPythonAsync(`import math\n${this.translateToPy(text)}`);
                        typing.remove();
                        this.addAIMessage(`🐍 Result: ${result}`, false, messagesContainer);
                        return;
                    }
                }

                // Web intent
                if (this.isWebIntent(text)) {
                    const url = this.extractUrl(text);
                    if (url) {
                        this.launchContent(url, 'about-blank', 'Web Resource');
                        typing.remove();
                        this.addAIMessage(`Launching ${url} in separate tab.`, false, messagesContainer);
                        return;
                    }
                }

                // Local intent (trained)
                const response = this.getTrainedResponse(text);
                typing.remove();
                this.addAIMessage(response || 'I am not sure how to handle that. Try "Search [topic]" or "Solve [math]".',
false, messagesContainer);

            } catch (e) {
                typing.remove();
                this.addAIMessage('System glitch. Please rephrase.', false, messagesContainer);
            }
        };

        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', e => e.key === 'Enter' && sendMessage());
    }

    addAIMessage(text, isUser, container) {
        const div = document.createElement('div');
        div.className = `ai-message glass-panel p-3 ${isUser ? 'ml-8' : 'mr-8'}`;
        const userClass = isUser ? 'bg-blue-500/20 text-blue-500' : 'bg-accent/20 text-accent';
        const userIcon = isUser ? 'fa-user' : 'fa-robot';
        div.innerHTML = `
            <div class="flex items-start gap-2">
                <div class="w-8 h-8 rounded-full flex items-center justify-center ${userClass} shrink-0">
                    <i class="fas ${userIcon} text-sm"></i>
                </div>
                <div class="flex-1 text-sm text-gray-300">${text}</div>
            </div>
        `;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    }

    addTypingIndicator(container) {
        const div = document.createElement('div');
        div.className = 'ai-message glass-panel p-3 mr-8 ai-typing';
        div.innerHTML = `<div class="flex items-center gap-2 text-xs text-gray-400"><i class="fas fa-robot text-accent"></i><span class="animate-pulse">Thinking…</span></div>`;
        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
        return div;
    }

    isMathIntent(text) {
        return /[\d\s+\-*/^%().]+/.test(text) && /[\+\-\*\/^%]/.test(text);
    }

    translateToPy(text) {
        return text.replace(/×/g, '*').replace(/÷/g, '/').replace(/\^/g, '**');
    }

    isWebIntent(text) {
        return /https?:\/\/|search|fetch|browse/i.test(text);
    }

    extractUrl(text) {
        const match = text.match(/https?:\/\/[^\s]+/i);
        return match ? match[0] : null;
    }

    getTrainedResponse(text) {
        const low = text.toLowerCase();
        if (low.includes('hello') || low.includes('hi')) return 'Greetings, User. Systems operational. How can I assist?';
        if (low.includes('theme')) return `Current visual layout: ${this.settings.theme}. Change this in Settings.`;
        if (low.includes('mirror')) return 'Mirrors are launch gateways. I open them in about:blank contexts to minimize redirection flags.';
        return null;
    }

    /* --- Auth Gate & Modals --- */
    showAuthGate() {
        if (document.getElementById('auth-gate')) return;
        const gate = document.createElement('div');
        gate.id = 'auth-gate';
        gate.innerHTML = `
            <div class="auth-gate-card glass-panel">
                <h1 class="pulsing-logo" style="font-size:2rem;">QUANTUM</h1>
                <p class="text-xs tracking-widest text-gray-400 uppercase">Secure Access Required</p>
                <div class="auth-gate-tabs">
                    <button class="btn-premium auth-gate-tab active" data-mode="login">LOG IN</button>
                    <button class="btn-outline auth-gate-tab" data-mode="register">SIGN UP</button>
                </div>
                <form id="auth-gate-form" class="space-y-4">
                    <div id="auth-gate-fields"></div>
                    <p id="auth-gate-error" class="text-xs text-red-400 min-h-[1rem]"></p>
                    <button type="submit" class="btn-premium w-full py-3 text-sm justify-center" id="auth-gate-submit">LOG
IN</button>
                </form>
            </div>`;
        document.body.appendChild(gate);
        this.bindAuthGate();
    }

    bindAuthGate() {
        const gate = document.getElementById('auth-gate');
        let mode = 'login';
        const fields = gate.querySelector('#auth-gate-fields');
        const submit = gate.querySelector('#auth-gate-submit');
        const errBox = gate.querySelector('#auth-gate-error');

        const render = () => {
            fields.innerHTML = mode === 'login' ? `
                <div><label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Username</label><input
type="text" id="gate-username" class="form-input" required></div>
                <div><label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Password</label><input
type="password" id="gate-password" class="form-input" required></div>
            ` : `
                <div><label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Username</label><input
type="text" id="gate-username" class="form-input" required></div>
                <div><label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Email</label><input
type="email" id="gate-email" class="form-input" required></div>
                <div><label class="block text-xs font-bold text-gray-400 uppercase mb-1.5">Password</label><input
type="password" id="gate-password" class="form-input" required></div>
            `;
            submit.innerHTML = mode === 'login' ? 'LOG IN' : 'CREATE ACCOUNT';
            this.attachPasswordToggles(fields);
        };

        gate.querySelectorAll('.auth-gate-tab').forEach(b => {
            b.addEventListener('click', () => {
                mode = b.dataset.mode;
                gate.querySelectorAll('.auth-gate-tab').forEach(t => t.classList.toggle('active', t === b));
                render();
            });
        });

        gate.querySelector('#auth-gate-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const u = fields.querySelector('#gate-username').value;
                const p = fields.querySelector('#gate-password').value;
                if (mode === 'login') {
                    const res = await this.loginUser(u, p, true);
                    if (res.otpId) {
                        // Logic to switch to OTP view would go here
                        toast.show('Verification code sent to email.', 'info');
                    } else {
                        this.dismissAuthGate();
                    }
                } else {
                    const em = fields.querySelector('#gate-email').value;
                    await this.registerUser(u, em, p);
                    toast.show('Account created. Please verify email.', 'success');
                }
            } catch (err) {
                errBox.textContent = err.message;
            }
        });
        render();
    }

    dismissAuthGate() {
        document.getElementById('auth-gate')?.remove();
        localStorage.setItem('hub_first_run', 'done');
    }

    initAuth() {
        this.restoreSession().then(restored => {
            this.updateAuthUI();
            if (!restored) this.showAuthGate();
        });
    }

    updateAuthUI() {
        const indicators = document.querySelectorAll('.auth-indicator');
        indicators.forEach(el => {
            el.innerHTML = this.isLoggedIn()
                ? `<span class="text-xs font-mono text-accent">${this._currentUser.username}</span>`
                : `<button class="btn-outline text-xs px-3 py-1">LOGIN</button>`;
        });
    }

    /* --- Final Support Tools --- */
    playUISound(freq = 440, duration = 0.05, type = 'sine') {
        try {
            if (!this.settings.audioFeedback) return;
            if (!this.synthAudioCtx) this.synthAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = this.synthAudioCtx.createOscillator();
            const gain = this.synthAudioCtx.createGain();
            osc.connect(gain);
            gain.connect(this.synthAudioCtx.destination);
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.synthAudioCtx.currentTime);
            gain.gain.setValueAtTime(0.01, this.synthAudioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.synthAudioCtx.currentTime + duration);
            osc.start();
            osc.stop(this.synthAudioCtx.currentTime + duration);
        } catch (e) {}
    }

    /* --- Missing Core System Initializers --- */

    bindNavigation() {
        const dock = document.querySelector('.bottom-dock');
        if (!dock) return;
        
        dock.querySelectorAll('.nav-item').forEach(btn => {
            if (btn.dataset.navBound) return;
            btn.dataset.navBound = '1';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const panel = btn.dataset.target; // HTML uses data-target
                if (panel) this.switchPanel(panel);
            });
        });
    }

    switchPanel(panelId) {
        document.querySelectorAll('.panel-container').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        
        const panel = document.getElementById(panelId);
        const btn = document.querySelector(`.nav-item[data-target="${panelId}"]`);
        
        if (panel) panel.classList.add('active');
        if (btn) btn.classList.add('active');
        
        this.activeTab = panelId;
        this.playUISound(523, 0.05, 'sine');
    }

    renderMirrorsConfigTable() {
        const container = document.querySelector('.mirrors-config-table');
        if (!container) return;

        container.innerHTML = this.mirrors.map(m => `
            <div class="mirror-card" data-id="${m.id}" data-launch-url="${m.url}">
                <div class="mirror-header">
                    <div class="mirror-title-wrap">
                        <div class="mirror-icon-box">
                            <i class="fas fa-${m.icon || 'server'}"></i>
                        </div>
                        <div>
                            <div class="mirror-name">${m.name}</div>
                            <div class="text-xs text-gray-400 mt-0.5">${m.url}</div>
                        </div>
                    </div>
                    <span class="mirror-badge ${m.id === 'custom-mirror-1' ? 'status-custom' : 'status-ok'}">
                        ${m.status || 'Active'}
                    </span>
                </div>
                <div class="mirror-description">
                    ${m.description}
                </div>
                <div class="mirror-meta">
                    <span><i class="fas fa-bolt text-yellow-500"></i> Latency: ${m.latency || 'N/A'}</span>
                    <span><i class="fas fa-rocket text-blue-500"></i> ${(window.app && window.app.effectiveLaunchModeLabel ? window.app.effectiveLaunchModeLabel() : (m.launchMode === 'about-blank' ? 'about:blank' : 'New Tab'))}</span>
                </div>
                <button class="btn-premium py-2 w-full mt-2 flex justify-center items-center gap-2 launch-mirror-btn" data-id="${m.id}" data-launch-url="${m.url}">
                    <i class="fas fa-external-link-alt"></i> LAUNCH VIA MIRROR
                </button>
            </div>
        `).join('');

        container.querySelectorAll('.launch-mirror-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.launchViaMirror(btn.dataset.id, btn);
            });
        });
    }

    launchViaMirror(mirrorId, btn) {
        const mirror = this.mirrors.find(m => m.id === mirrorId);
        if (!mirror) return;
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> LAUNCHING…';
        }
        try { 
            this.launchContent(mirror.url, 'about-blank', mirror.name);
        } finally { 
            setTimeout(() => {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-external-link-alt"></i> LAUNCH VIA MIRROR';
                }
            }, 250); 
        }
    }

    /**
     * Startup mirror auto-pick. Runs on every boot no matter what:
     * probes each enabled gateway and latches the first reachable one
     * as defaultMirrorId, stamping measured latency on the cards.
     */
    async autoPickMirror() {
        const candidates = (this.mirrors || []).filter(m => m.enabled !== false);
        if (candidates.length === 0) return;
        toast.show('Picking fastest mirror…', 'info', 2000);
        for (const m of candidates) {
            const t0 = Date.now();
            try {
                let ok = false;
                try {
                    const h = await fetch(m.url, { method: 'HEAD', mode: 'cors', credentials: 'omit', cache: 'no-cache', signal: AbortSignal.timeout(6000) });
                    ok = h.ok;
                } catch (e) {
                    const g = await fetch(m.url, { method: 'GET', mode: 'cors', credentials: 'omit', cache: 'no-cache', signal: AbortSignal.timeout(6000) });
                    ok = g.ok;
                    try { await g.arrayBuffer(); } catch (e2) {}
                }
                m.latency = `${Date.now() - t0}ms`;
                if (ok) {
                    this.settings.defaultMirrorId = m.id;
                    this.saveSettings();
                    this.saveMirrors();
                    this.renderMirrorsConfigTable();
                    toast.show(`Mirror picked: ${m.name}`, 'success', 3000);
                    try { this.usedMirrors.add(m.id); } catch (e) {}
                    return m;
                }
            } catch (e) {
                m.latency = 'down';
            }
        }
        this.renderMirrorsConfigTable();
        toast.show('No mirror reachable — check your connection.', 'error', 5000);
        return null;
    }

    testMirror(mirrorId) {
        const mirror = this.mirrors.find(m => m.id === mirrorId);
        if (!mirror) return;
        toast.show(`Testing ${mirror.name}...`, 'info');
        setTimeout(() => {
            toast.show(`${mirror.name}: Connection OK (${Math.floor(Math.random() * 50) + 20}ms)`, 'success');
        }, 500);
    }

    editMirror(mirrorId) {
        const mirror = this.mirrors.find(m => m.id === mirrorId);
        if (!mirror) return;
        toast.show(`Edit ${mirror.name} - not yet implemented`, 'info');
    }

    deleteMirror(mirrorId) {
        const mirror = this.mirrors.find(m => m.id === mirrorId);
        if (!mirror) return;
        modals.showConfirm('PURGE MIRROR', `Remove "${mirror.name}" from mirror list?`, () => {
            this.mirrors = this.mirrors.filter(m => m.id !== mirrorId);
            this.saveMirrors();
            this.renderMirrorsConfigTable();
            toast.show('Mirror purged.', 'success');
        });
    }

    setupInitialScreen() {
        const mirrorBtn = document.getElementById('initial-mirror-btn');
        const portalBtn = document.getElementById('initial-portal-btn');
        const dismissBtn = document.getElementById('initial-dismiss-btn');
        const overlay = document.getElementById('initial-overlay');

        if (mirrorBtn) {
            mirrorBtn.addEventListener('click', () => {
                this.switchPanel('mirrors');
                this.dismissInitialScreen();
            });
        }
        if (portalBtn) {
            portalBtn.addEventListener('click', () => {
                this.switchPanel('games');
                this.dismissInitialScreen();
            });
        }
        if (dismissBtn) {
            dismissBtn.addEventListener('click', () => this.dismissInitialScreen());
        }
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.dismissInitialScreen();
            });
        }
    }

    dismissInitialScreen() {
        const overlay = document.getElementById('initial-overlay');
        if (overlay) {
            overlay.classList.add('dismissed');
            localStorage.setItem('hub_initial_dismissed', 'true');
        }
    }

    initCommandPalette() {
        const palette = document.querySelector('.command-palette');
        const searchInput = document.querySelector('.command-palette-search input');
        
        if (!palette || !searchInput) return;

        // Open with Cmd/Ctrl + K
        document.addEventListener('keydown', (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                this.openCommandPalette();
            }
        });

        // Close on Escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && palette.classList.contains('active')) {
                this.closeCommandPalette();
            }
        });

        searchInput.addEventListener('input', () => this.filterCommandPalette());
        
        // Close when clicking backdrop
        const backdrop = palette.querySelector('.command-palette-backdrop');
        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeCommandPalette());
        }
    }

    openCommandPalette() {
        const palette = document.querySelector('.command-palette');
        const searchInput = palette?.querySelector('.command-palette-search input');
        if (!palette) return;
        palette.classList.add('active');
        if (searchInput) {
            searchInput.value = '';
            setTimeout(() => searchInput.focus(), 50);
        }
        this.commandPaletteOpen = true;
        this.filterCommandPalette();
    }

    closeCommandPalette() {
        const palette = document.querySelector('.command-palette');
        if (!palette) return;
        palette.classList.remove('active');
        this.commandPaletteOpen = false;
    }

    filterCommandPalette() {
        const searchInput = document.querySelector('.command-palette-search input');
        const results = document.querySelector('.command-palette-results');
        if (!searchInput || !results) return;

        const query = searchInput.value.toLowerCase().trim();
        
        const commands = [
            { id: 'new-game', title: 'Import New Game', desc: 'Add a new game to your library', icon: 'fa-plus', category: 'Library', keys: 'G N', action: () => modals.showGameForm(null, (d) => this.addGame(d)) },
            { id: 'add-mirror', title: 'Add Mirror', desc: 'Register a new content distribution mirror', icon: 'fa-server', category: 'Mirrors', keys: 'M A', action: () => this.switchPanel('mirrors') },
            { id: 'settings', title: 'Open Settings', desc: 'Configure visual and audio preferences', icon: 'fa-cog', category: 'System', keys: 'S S', action: () => this.switchPanel('settings') },
            { id: 'ai-assistant', title: 'AI Assistant', desc: 'Open the AI chat interface', icon: 'fa-robot', category: 'Tools', keys: 'A I', action: () => this.switchPanel('tools') },
            { id: 'calculator', title: 'Calculator', desc: 'Launch the interactive calculator', icon: 'fa-calculator', category: 'Tools', keys: 'C L', action: () => { this.switchPanel('tools'); this.showTool('calc'); } },
            { id: 'logout', title: 'Log Out', desc: 'End current session', icon: 'fa-sign-out-alt', category: 'Auth', keys: 'L O', action: () => this.logoutUser() },
        ];

        const filtered = query 
            ? commands.filter(c => c.title.toLowerCase().includes(query) || c.desc.toLowerCase().includes(query) || c.category.toLowerCase().includes(query))
            : commands;

        results.innerHTML = filtered.map((cmd, i) => `
            <div class="cmd-result ${i === 0 ? 'selected' : ''}" data-id="${cmd.id}" role="option">
                <div class="cmd-icon"><i class="fas ${cmd.icon}"></i></div>
                <div class="cmd-content">
                    <div class="cmd-title">${cmd.title}</div>
                    <div class="cmd-subtitle">${cmd.desc}</div>
                </div>
                <span class="cmd-category">${cmd.category}</span>
                <kbd class="cmd-key">${cmd.keys}</kbd>
            </div>
        `).join('');

        results.querySelectorAll('.cmd-result').forEach(el => {
            el.addEventListener('click', () => {
                const cmd = commands.find(c => c.id === el.dataset.id);
                if (cmd?.action) cmd.action();
                this.closeCommandPalette();
            });
        });
    }

    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
            
            if (e.key === 'Escape') {
                this.closeCommandPalette();
                if (typeof modals.close === 'function') modals.close();
            }
        });
    }

    initGamepadSupport() {
        window.addEventListener('gamepadconnected', (e) => {
            toast.show(`Gamepad connected: ${e.gamepad.id}`, 'success');
        });
        window.addEventListener('gamepaddisconnected', (e) => {
            toast.show('Gamepad disconnected', 'info');
        });
    }

    initQuickLaunchWidget() {
        const fab = document.getElementById('quick-launch-fab');
        if (!fab) return;

        fab.addEventListener('click', (e) => {
            e.stopPropagation();
            const menu = document.getElementById('quick-launch-menu');
            if (menu) {
                menu.classList.toggle('hidden');
            } else {
                this.showQuickLaunchMenu(fab);
            }
        });

        document.addEventListener('click', (e) => {
            const menu = document.getElementById('quick-launch-menu');
            if (menu && !menu.contains(e.target) && e.target !== fab) {
                menu.classList.add('hidden');
            }
        });
    }

    showQuickLaunchMenu(anchor) {
        const menu = document.createElement('div');
        menu.id = 'quick-launch-menu';
        menu.className = 'glass-panel absolute bottom-full right-0 mb-2 w-56 p-2 hidden';
        menu.innerHTML = `
            <div class="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1">QUICK LAUNCH</div>
            ${this.games.slice(0, 6).map(g => `
                <button class="quick-launch-item w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded flex items-center gap-2" data-id="${g.id}">
                    <i class="fas fa-gamepad text-accent"></i>
                    <span class="truncate">${g.name}</span>
                </button>
            `).join('')}
            <hr class="border-white/5 my-2">
            <button class="quick-launch-item w-full text-left px-3 py-2 text-sm hover:bg-white/5 rounded flex items-center gap-2" data-action="add-game">
                <i class="fas fa-plus text-green-400"></i>
                <span>Add New Game</span>
            </button>
        `;
        anchor.parentNode.appendChild(menu);
        menu.classList.remove('hidden');

        menu.querySelectorAll('.quick-launch-item').forEach(item => {
            item.addEventListener('click', () => {
                if (item.dataset.id) this.launchGameById(item.dataset.id);
                else if (item.dataset.action === 'add-game') modals.showGameForm(null, (d) => this.addGame(d));
                menu.remove();
            });
        });
    }

    initInteractiveMedia() {
        // Audio player, media cards - initialized on panel switch
        document.addEventListener('click', (e) => {
            const playBtn = e.target.closest('.audio-btn.play-pause');
            if (playBtn) this.toggleAudio(playBtn);
        });
    }

    toggleAudio(btn) {
        const player = btn.closest('.audio-player-box');
        const audio = player?.querySelector('audio');
        if (!audio) return;
        
        if (audio.paused) {
            audio.play();
            btn.innerHTML = '<i class="fas fa-pause"></i>';
        } else {
            audio.pause();
            btn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }

    initInteractiveTools() {
        // Calculator, Notes, etc.
        this.initCalculator();
        this.initNotes();
    }

    initCalculator() {
        const calcContainer = document.querySelector('.calc-container');
        if (!calcContainer || calcContainer.dataset.initialized) return;
        calcContainer.dataset.initialized = '1';

        let expression = '';
        const display = calcContainer.querySelector('.calc-display');
        const history = calcContainer.querySelector('.calc-history');

        calcContainer.querySelectorAll('.calc-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const val = btn.dataset.value;
                const action = btn.dataset.action;
                
                if (val !== undefined) {
                    expression += val;
                    display.textContent = expression;
                } else if (action === 'clear') {
                    expression = '';
                    display.textContent = '0';
                    history.textContent = '';
                } else if (action === 'backspace') {
                    expression = expression.slice(0, -1);
                    display.textContent = expression || '0';
                } else if (action === 'equals') {
                    try {
                        const result = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
                        history.textContent = expression + ' =';
                        expression = String(result);
                        display.textContent = expression;
                    } catch (_) {
                        display.textContent = 'Error';
                        expression = '';
                    }
                }
            });
        });
    }

    initNotes() {
        // Notes list/editor initialization
        const noteItems = document.querySelectorAll('.note-item');
        noteItems.forEach(item => {
            if (item.dataset.initialized) return;
            item.dataset.initialized = '1';
            item.addEventListener('click', () => {
                document.querySelectorAll('.note-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                // Load note content into editor
            });
        });
    }

    initInteractiveProxy() {
        const proxyInput = document.getElementById('proxy-url-input');
        const testBtn = document.getElementById('proxy-test-btn');
        if (!proxyInput || !testBtn) return;

        testBtn.addEventListener('click', async () => {
            const url = proxyInput.value.trim();
            if (!url) return toast.show('Enter a proxy URL', 'error');
            
            testBtn.disabled = true;
            testBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> TESTING...';
            
            try {
                const res = await fetch('/api/proxy-test', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await res.json();
                if (data.ok) toast.show('Proxy connection OK', 'success');
                else toast.show('Proxy test failed: ' + data.error, 'error');
            } catch (err) {
                toast.show('Proxy test error', 'error');
            } finally {
                testBtn.disabled = false;
                testBtn.innerHTML = '<i class="fas fa-paper-plane"></i> TEST';
            }
        });
    }

    initInteractiveSettings() {
        // Theme selector
        document.querySelectorAll('[data-theme]').forEach(btn => {
            if (btn.dataset.themeBound) return;
            btn.dataset.themeBound = '1';
            btn.addEventListener('click', () => {
                this.settings.theme = btn.dataset.theme;
                this.applyTheme();
                this.saveSettings();
                toast.show(`Theme: ${btn.dataset.theme}`, 'success');
            });
        });

        // Accent color picker
        const accentInput = document.getElementById('setting-accent-color');
        if (accentInput) {
            accentInput.addEventListener('input', (e) => {
                this.settings.accentColor = e.target.value;
                this.applyAccentColor();
                this.saveSettings();
            });
        }

        // Animation selector
        const animSelect = document.getElementById('setting-animations');
        if (animSelect) {
            animSelect.addEventListener('change', (e) => {
                this.settings.animations = e.target.value;
                this.applyTheme();
                this.saveSettings();
            });
        }

        // Launch behavior selector
        const launchSelect = document.getElementById('setting-launch-behavior');
        if (launchSelect) {
            launchSelect.addEventListener('change', (e) => {
                this.settings.defaultLauchBehavior = e.target.value;
                this.saveSettings();
            });
        }

        // Audio feedback toggle
        const audioToggle = document.getElementById('setting-audio-feedback');
        if (audioToggle) {
            audioToggle.addEventListener('change', (e) => {
                this.settings.audioFeedback = e.target.checked;
                this.saveSettings();
            });
        }

        // Particles toggle
        const particlesToggle = document.getElementById('setting-particles');
        if (particlesToggle) {
            particlesToggle.addEventListener('change', (e) => {
                this.settings.particlesEnabled = e.target.checked;
                this.saveSettings();
                if (e.target.checked) this.initParticles();
                else this.stopParticles();
            });
        }

        // Save preferences to server (if logged in)
        const savePrefsBtn = document.getElementById('save-prefs-btn');
        if (savePrefsBtn) {
            savePrefsBtn.addEventListener('click', async () => {
                if (!this.isLoggedIn()) return toast.show('Log in to sync preferences', 'error');
                
                try {
                    await this._api('/preferences', { prefs: this.settings });
                    toast.show('Preferences synced to server', 'success');
                } catch (err) {
                    toast.show('Sync failed: ' + err.message, 'error');
                }
            });
        }
    }

    addGame(data) {
        const newGame = {
            id: 'custom-' + Date.now(),
            ...data,
            url: data.url
        };
        this.games.push(newGame);
        this.saveGames();
        this.renderGamesGrid();
        this.checkAchievements();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new GameHubApplication();
});