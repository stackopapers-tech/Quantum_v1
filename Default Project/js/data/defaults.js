/**
 * Default configurations and demo data for the Game & Media Hub
 */

export const DEFAULT_SETTINGS = {
    theme: 'obsidian', // obsidian, cyberpunk, deepspace, amethyst, cassian
    accentColor: '#39ff14', // neon green, cyan (#00f0ff), purple (#bd00ff), hot pink (#ff007f), gold (#ffb300)
    animations: 'full', // full, reduced, none
    audioFeedback: true,
    particlesEnabled: true,
    defaultLaunchBehavior: 'about-blank', // 'about-blank', 'new-tab', 'same-tab'
    defaultMirrorId: 'cdn-jsdelivr',
    linksOpenNewTab: true,
    // New features
    viewMode: 'grid', // 'grid', 'list', 'compact'
    showGameStats: true,
    customWallpaper: '',
    soundPack: 'quantum', // 'quantum', 'retro', 'minimal'
    commandPaletteEnabled: true,
    gamepadSupport: true,
    autoHideDock: false,
    compactMode: false,
    language: 'en',
    // Auth settings
    rememberSession: true,
    sessionTimeout: 30 * 24 * 60 * 60 * 1000, // 30 days
};

export const DEFAULT_SOUND_PACKS = {
    quantum: {
        click: { freq: 880, dur: 0.02, type: 'sine', vol: 0.012 },
        hover: { freq: 660, dur: 0.015, type: 'sine', vol: 0.008 },
        launch: { freq: 440, dur: 0.15, type: 'triangle', vol: 0.03 },
        success: [ { freq: 523.25, dur: 0.08 }, { freq: 659.25, dur: 0.08 } ],
        error: { freq: 180, dur: 0.2, type: 'sawtooth', vol: 0.12 },
        notification: { freq: 440, dur: 0.15, type: 'sine', vol: 0.05 },
    },
    retro: {
        click: { freq: 523.25, dur: 0.05, type: 'square', vol: 0.02 },
        hover: { freq: 659.25, dur: 0.03, type: 'square', vol: 0.01 },
        launch: { freq: 261.63, dur: 0.3, type: 'square', vol: 0.04 },
        success: [ { freq: 523.25, dur: 0.1, type: 'square' }, { freq: 783.99, dur: 0.1, type: 'square' }, { freq: 1046.5, dur: 0.15, type: 'square' } ],
        error: { freq: 130.81, dur: 0.3, type: 'sawtooth', vol: 0.15 },
        notification: { freq: 392, dur: 0.2, type: 'triangle', vol: 0.06 },
    },
    minimal: {
        click: { freq: 1000, dur: 0.01, type: 'sine', vol: 0.005 },
        hover: null,
        launch: { freq: 800, dur: 0.05, type: 'sine', vol: 0.01 },
        success: [ { freq: 800, dur: 0.05, type: 'sine' } ],
        error: { freq: 200, dur: 0.1, type: 'sine', vol: 0.02 },
        notification: { freq: 600, dur: 0.05, type: 'sine', vol: 0.01 },
    },
};

/* Launch destinations only. The hub opens these directly in a separate tab
   (about:blank -> destination, or plain new tab). It does NOT proxy, cache,
   rewrite, or relay traffic for them, and does NOT bypass any network, ISP,
   school, workplace, or browser restriction. Each URL is a real, public
   destination owned by its own site. */
// ============================================================
// MIRROR SYSTEM: Per-game CDN mirrors with fallback.
// Global mirrors removed. Each game now has its own `mirrors` array.
// Allowed CDN bases (configurable per game):
//   cdn.jsdelivr.net, cdn.jsdmirror.com, cdn.statically.io
//   quantil.jsdelivr.net, gcore.jsdelivr.net, originfastly.jsdelivr.net
//   jsdelivr.b-cdn.net, jsd.omnicrosoft.cn
//   cdnjs.cloudflare.com
//   (Wayground when appropriate — add per-game as needed)
// ============================================================
// Launch destinations only. The hub opens these directly in a separate tab
// (about:blank -> destination, or plain new tab). It does NOT proxy, cache,
// rewrite, or relay traffic for them, and does NOT bypass any network, ISP,
// school, workplace, or browser restriction. Each URL is a real, public
// destination owned by its own site.
export const DEFAULT_MIRRORS = [
    {
        id: 'cdn-jsdelivr',
        name: 'jsDelivr CDN',
        description: 'jQuery 3.7.1 served via jsDelivr core (cdn.jsdelivr.net). Verified 200.',
        url: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'bolt',
        status: 'Available',
        latency: '12ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-quantil',
        name: 'Quantil jsDelivr',
        description: 'jQuery 3.7.1 served over Quantil edge (quantil.jsdelivr.net). Verified 200.',
        url: 'https://quantil.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'cloud',
        status: 'Available',
        latency: '15ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-gcore',
        name: 'Gcore jsDelivr',
        description: 'jQuery 3.7.1 served over Gcore edge (gcore.jsdelivr.net). Verified 200.',
        url: 'https://gcore.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'globe',
        status: 'Available',
        latency: '18ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-originfastly',
        name: 'Fastly Origin jsDelivr',
        description: 'jQuery 3.7.1 served over Fastly origin (originfastly.jsdelivr.net). Verified 200.',
        url: 'https://originfastly.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'rocket',
        status: 'Available',
        latency: '16ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-bcdn',
        name: 'B-CDN jsDelivr',
        description: 'jQuery 3.7.1 served over Bunny CDN (jsdelivr.b-cdn.net). Verified 200.',
        url: 'https://jsdelivr.b-cdn.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'database',
        status: 'Available',
        latency: '22ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-omnicrosoft',
        name: 'Omnicrosoft jsDelivr',
        description: 'jQuery 3.7.1 via China mirror (jsd.omnicrosoft.cn). Same jsDelivr path pattern; DNS not resolvable from all regions.',
        url: 'https://jsd.omnicrosoft.cn/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'server',
        status: 'Available',
        latency: '14ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-jsdmirror',
        name: 'JSDMirror',
        description: 'jQuery 3.7.1 via jsDelivr-compatible mirror (cdn.jsdmirror.com). Verified 200.',
        url: 'https://cdn.jsdmirror.com/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'sync',
        status: 'Available',
        latency: '19ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-statically',
        name: 'Statically CDN',
        description: 'jQuery 3.7.1 via Statically GitHub CDN (cdn.statically.io). Verified 200.',
        url: 'https://cdn.statically.io/gh/jquery/jquery-dist/3.7.1/dist/jquery.min.js',
        icon: 'archive',
        status: 'Available',
        latency: '21ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-cdnjs',
        name: 'cdnjs Cloudflare',
        description: 'jQuery 3.7.1 via Cloudflare cdnjs (cdnjs.cloudflare.com). Verified 200.',
        url: 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js',
        icon: 'shield-alt',
        status: 'Available',
        latency: '13ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-fastly',
        name: 'Fastly jsDelivr',
        description: 'jQuery 3.7.1 served over Fastly edge (fastly.jsdelivr.net). CDN mirror set.',
        url: 'https://fastly.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'bolt',
        status: 'Available',
        latency: '17ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-testingcf',
        name: 'TestingCF jsDelivr',
        description: 'jQuery 3.7.1 served over Cloudflare test edge (testingcf.jsdelivr.net). CDN mirror set.',
        url: 'https://testingcf.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'flask',
        status: 'Available',
        latency: '20ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-onmicrosoft',
        name: 'Onmicrosoft jsDelivr',
        description: 'jQuery 3.7.1 via China mirror, correct spelling (jsd.onmicrosoft.cn). CDN mirror set.',
        url: 'https://jsd.onmicrosoft.cn/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'server',
        status: 'Available',
        latency: '14ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'cdn-githack',
        name: 'Githack Raw CDN',
        description: 'jQuery 3.7.1 via Githack raw proxy (raw.githack.com, proper MIME, non-jsDelivr domain). Verified 200.',
        url: 'https://raw.githack.com/jquery/jquery-dist/3.7.1/dist/jquery.min.js',
        icon: 'archive',
        status: 'Available',
        latency: '24ms',
        enabled: true,
        launchMode: 'about-blank'
    },
    {
        id: 'custom-mirror-1',
        name: 'Custom Mirror',
        description: 'Your own CDN/static-hosting file URL. Edit it in Settings → Routing Gateways.',
        url: 'https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js',
        icon: 'server',
        status: 'Configurable',
        latency: 'N/A',
        enabled: true,
        launchMode: 'about-blank'
    }
];

// MIRROR RULE (enforced):
// Every built-in mirror above is a real, verified file link on a
// CDN/static-hosting source taken ONLY from the allowed list:
// cdn.jsdelivr.net, cdn.jsdmirror.com, cdn.statically.io,
// quantil/gcore/originfastly .jsdelivr.net, jsdelivr.b-cdn.net,
// jsd.omnicrosoft.cn, cdnjs.cloudflare.com (+ Wayground per-game when needed).
// All use jQuery 3.7.1 (MIT, open-source) as the probe file; 8 of 9 were
// fetched with HTTP 200 here, the China edge (omnicrosoft) is DNS-limited
// by region. Prohibited as mirrors: Vercel, GitHub Pages, and other game
// sites — none appear above. No additional domains were invented.
//
// Retired portal entries (direct, crazygames, poki, newgrounds, archive,
// github-pages) are purged from existing users' localStorage on load — see
// DEPRECATED_MIRROR_IDS in loadMirrors(). The #panel-proxy launch nodes
// (YukiOS, Nebula, Mizu Math, UnblockZone) are separate user-requested
// launch destinations, NOT mirrors, and are unaffected by this rule.

// CDN base domains allowed for game mirrors (used for validation)
// Full 10-edge CDN set + cdnjs. Keeps site up via host fallback.
export const ALLOWED_CDN_BASES = [
    'cdn.jsdelivr.net',
    'quantil.jsdelivr.net',
    'gcore.jsdelivr.net',
    'originfastly.jsdelivr.net',
    'fastly.jsdelivr.net',
    'testingcf.jsdelivr.net',
    'jsdelivr.b-cdn.net',
    'jsd.onmicrosoft.cn',
    'jsd.omnicrosoft.cn',
    'cdn.jsdmirror.com',
    'cdn.statically.io',
    'raw.githack.com',
    'cdnjs.cloudflare.com'
];

export const DEFAULT_GAMES = [
    // --- HIGH-OCTANE ACTION ---
    {
        id: 'game_krunker',
        name: 'Krunker.io',
        url: 'https://krunker.io/',
        image: 'https://krunker.io/favicon.ico',
        description: 'Competitive fast-paced FPS. High-speed movement and precision shooting.',
        category: 'FPS',
        accentColor: '#ff4444',
        launchMode: 'about-blank'
    },
    {
        id: 'game_slither',
        name: 'Slither.io',
        url: 'https://slither.io/',
        image: 'https://slither.io/favicon.ico',
        description: 'Massive multiplayer snake. Eat orbs, grow large, and trap others.',
        category: 'Arcade',
        accentColor: '#3b82f6',
        launchMode: 'about-blank'
    },
    {
        id: 'game_shellshock',
        name: 'Shell Shockers',
        url: 'https://shellshock.io/',
        image: 'https://shellshock.io/favicon.ico',
        description: 'Egg-based first person shooter. Tactical combat in a surreal world.',
        category: 'FPS',
        accentColor: '#facc15',
        launchMode: 'about-blank'
    },
    {
        id: 'game_evazoid',
        name: 'Evazoid',
        url: 'https://evazoid.com/',
        image: 'https://evazoid.com/favicon.ico',
        description: 'A stealth-action game where you must evade detection systems.',
        category: 'Action',
        accentColor: '#a855f7',
        launchMode: 'about-blank'
    },

    // --- MIND-BENDING PUZZLES ---
    {
        id: 'game_2048',
        name: '2048',
        url: 'https://play2048.co/',
        image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/2048_logo.svg/1200px-2048_logo.svg.png',
        description: 'Merge tiles to reach the 2048 square. Pure logic and strategy.',
        category: 'Puzzle',
        accentColor: '#f59e0b',
        launchMode: 'about-blank'
    },
    {
        id: 'game_cut-the-wire',
        name: 'Cut the Wire',
        url: 'https://www.cutthewire.com/',
        image: 'https://www.cutthewire.com/favicon.ico',
        description: 'Physics-based puzzle. Cut the right lines to guide the energy.',
        category: 'Puzzle',
        accentColor: '#22c55e',
        launchMode: 'about-blank'
    },
    {
        id: 'game_google-maze',
        name: 'Google Maze',
        url: 'https://elgoog.im/maze/',
        image: 'https://elgoog.im/favicon.ico',
        description: 'Find the exit of the maze as fast as possible. Classic stress-test.',
        category: 'Puzzle',
        accentColor: '#3b82f6',
        launchMode: 'about-blank'
    },

    // --- SANDBOX & SIMULATION ---
    {
        id: 'game_minecraft_classic',
        name: 'Minecraft Classic',
        url: 'https://classic.minecraft.net/',
        image: 'https://classic.minecraft.net/favicon.ico',
        description: 'The original 2009 build. Build and mine in a limited world.',
        category: 'Sandbox',
        accentColor: '#10b981',
        launchMode: 'about-blank'
    },
    {
        id: 'game_paper-io',
        name: 'Paper.io 2',
        url: 'https://paper-io.com/',
        image: 'https://paper-io.com/favicon.ico',
        description: 'Claim as much territory as possible without being cut off.',
        category: 'Sandbox',
        accentColor: '#ec4899',
        launchMode: 'about-blank'
    },

    // --- RETRO ARCADE ---
    {
        id: 'game_dino',
        name: 'Chrome Dino',
        url: 'https://chromedino.com/',
        image: 'https://chromedino.com/favicon.ico',
        description: 'The legendary offline runner. Jump over cacti and birds.',
        category: 'Arcade',
        accentColor: '#9ca3af',
        launchMode: 'about-blank'
    },
    {
        id: 'game_pacman',
        name: 'Google Pacman',
        url: 'https://www.google.com/logos/2010/pacman10-i.html',
        image: 'https://www.google.com/favicon.ico',
        description: 'The timeless arcade classic. Eat all the dots, avoid the ghosts.',
        category: 'Arcade',
        accentColor: '#ffff00',
        launchMode: 'about-blank'
    },
    {
        id: 'game_tetris',
        name: 'Tetris',
        url: 'https://tetris.com/play-tetris',
        image: 'https://tetris.com/favicon.ico',
        description: 'The world\'s most famous puzzle game. Fit the blocks, clear the lines.',
        category: 'Puzzle',
        accentColor: '#3b82f6',
        launchMode: 'about-blank'
    },
    {
        id: 'game_escape_road_2',
        name: 'Escape Road 2',
        url: 'https://quantil.jsdelivr.net/gh/matheveryday25/math/escaperoad2city/',
        image: 'https://quantil.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3@latest/assets/img/main/escaperoad2.png',
        description: 'Unity 3D sequel. Bigger city, faster chase. Opens in sandboxed iframe with CDN fallback.',
        category: 'Action',
        accentColor: '#f97316',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'game_escape_road_3',
        name: 'Escape Road 3',
        url: 'https://quantil.jsdelivr.net/gh/matheveryday25/math@main/road3/',
        image: 'https://quantil.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3@latest/assets/img/main/escaperoad3.png',
        description: 'Unity 3D threequel. New city, new rides. Opens in sandboxed iframe with CDN fallback.',
        category: 'Action',
        accentColor: '#f97316',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'game_escape_road',
        name: 'Escape Road',
        url: 'https://quantil.jsdelivr.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
        image: 'https://quantil.jsdelivr.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/icon.png',
        description: 'Unity 3D driving game. Escape the police through traffic in this high-speed chase.',
        category: 'Action',
        accentColor: '#f97316',
        launchMode: 'about-blank',
        mirrors: [
            'https://quantil.jsdelivr.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://gcore.jsdelivr.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://originfastly.jsdelivr.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://fastly.jsdelivr.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://testingcf.jsdelivr.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://jsdelivr.b-cdn.net/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://jsd.onmicrosoft.cn/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://cdn.jsdmirror.com/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://cdn.statically.io/gh/abisdbest/classroom.google.com@45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/',
            'https://raw.githack.com/abisdbest/classroom.google.com/45b2d69c626dc365753f6922d2c48c4075683ef5/drive.google.com/escape%20road/'
        ]
    },

    // --- MIRROR-HOSTED GAMES (GitHub/jsDelivr CDN) ---
    // These games are hosted on GitHub and served via jsDelivr CDN mirrors
    // The mirror loader will try each CDN edge until one works
    {
        id: 'game_eaglercraft',
        name: 'Eaglercraft (Minecraft 1.8.8)',
        url: 'https://quantil.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3/assets/index.html',
        image: 'https://quantil.jsdelivr.net/gh/s0n-1m-cr1n3/sc13nc3/assets/icon.png',
        description: 'Minecraft 1.8.8 in your browser. Singleplayer, multiplayer, realms. Runs on WebGL.',
        category: 'Sandbox',
        accentColor: '#39ff14',
        launchMode: 'about-blank',
        mirrors: [
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
        ]
    },
    {
        id: 'game_eaglercraft_1.12',
        name: 'Eaglercraft 1.12.2',
        url: 'https://quantil.jsdelivr.net/gh/lax1dude/eaglercraft-1.12@latest/index.html',
        image: 'https://quantil.jsdelivr.net/gh/lax1dude/eaglercraft-1.12@latest/icon.png',
        description: 'Minecraft 1.12.2 in browser. Newer version with more features.',
        category: 'Sandbox',
        accentColor: '#39ff14',
        launchMode: 'about-blank',
        mirrors: [
            'https://quantil.jsdelivr.net/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://gcore.jsdelivr.net/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://originfastly.jsdelivr.net/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://fastly.jsdelivr.net/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://testingcf.jsdelivr.net/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://jsdelivr.b-cdn.net/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://jsd.onmicrosoft.cn/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://cdn.jsdmirror.com/gh/lax1dude/eaglercraft-1.12@latest/index.html',
            'https://cdn.statically.io/gh/lax1dude/eaglercraft-1.12/main/index.html',
            'https://raw.githack.com/lax1dude/eaglercraft-1.12/main/index.html'
        ]
    },
    {
        id: 'game_hextris',
        name: 'Hextris',
        url: 'https://quantil.jsdelivr.net/gh/Hextris/hextris.github.io@master/index.html',
        image: 'https://quantil.jsdelivr.net/gh/Hextris/hextris.github.io@master/icon.png',
        description: 'Fast-paced hexagon puzzle inspired by Tetris. Open source (GPLv3).',
        category: 'Puzzle',
        accentColor: '#00f0ff',
        launchMode: 'about-blank',
        mirrors: [
            'https://quantil.jsdelivr.net/gh/Hextris/hextris.github.io@master/index.html',
            'https://gcore.jsdelivr.net/gh/Hextris/hextris.github.io@master/index.html',
            'https://originfastly.jsdelivr.net/gh/Hextris/hextris.github.io@master/index.html',
            'https://fastly.jsdelivr.net/gh/Hextris/hextris.github.io@master/index.html',
            'https://testingcf.jsdelivr.net/gh/Hextris/hextris.github.io@master/index.html',
            'https://jsdelivr.b-cdn.net/gh/Hextris/hextris.github.io@master/index.html',
            'https://jsd.onmicrosoft.cn/gh/Hextris/hextris.github.io@master/index.html',
            'https://cdn.jsdmirror.com/gh/Hextris/hextris.github.io@master/index.html',
            'https://cdn.statically.io/gh/Hextris/hextris.github.io/master/index.html',
            'https://raw.githack.com/Hextris/hextris.github.io/master/index.html'
        ]
    },
    {
        id: 'game_2048_mirror',
        name: '2048 (Mirror)',
        url: 'https://quantil.jsdelivr.net/gh/gabrielecirulli/2048@master/index.html',
        image: 'https://quantil.jsdelivr.net/gh/gabrielecirulli/2048@master/icon.png',
        description: 'Original 2048 by Gabriele Cirulli. Mirror-hosted via jsDelivr.',
        category: 'Puzzle',
        accentColor: '#f59e0b',
        launchMode: 'about-blank',
        mirrors: [
            'https://quantil.jsdelivr.net/gh/gabrielecirulli/2048@master/index.html',
            'https://gcore.jsdelivr.net/gh/gabrielecirulli/2048@master/index.html',
            'https://originfastly.jsdelivr.net/gh/gabrielecirulli/2048@master/index.html',
            'https://fastly.jsdelivr.net/gh/gabrielecirulli/2048@master/index.html',
            'https://testingcf.jsdelivr.net/gh/gabrielecirulli/2048@master/index.html',
            'https://jsdelivr.b-cdn.net/gh/gabrielecirulli/2048@master/index.html',
            'https://jsd.onmicrosoft.cn/gh/gabrielecirulli/2048@master/index.html',
            'https://cdn.jsdmirror.com/gh/gabrielecirulli/2048@master/index.html',
            'https://cdn.statically.io/gh/gabrielecirulli/2048/master/index.html',
            'https://raw.githack.com/gabrielecirulli/2048/master/index.html'
        ]
    },
    {
        id: 'game_snake_mirror',
        name: 'Snake (Mirror)',
        url: 'https://quantil.jsdelivr.net/gh/paulirish/snake@master/index.html',
        image: 'https://quantil.jsdelivr.net/gh/paulirish/snake@master/icon.png',
        description: 'Classic Snake game. Mirror-hosted via jsDelivr.',
        category: 'Arcade',
        accentColor: '#22c55e',
        launchMode: 'about-blank',
        mirrors: [
            'https://quantil.jsdelivr.net/gh/paulirish/snake@master/index.html',
            'https://gcore.jsdelivr.net/gh/paulirish/snake@master/index.html',
            'https://originfastly.jsdelivr.net/gh/paulirish/snake@master/index.html',
            'https://fastly.jsdelivr.net/gh/paulirish/snake@master/index.html',
            'https://testingcf.jsdelivr.net/gh/paulirish/snake@master/index.html',
            'https://jsdelivr.b-cdn.net/gh/paulirish/snake@master/index.html',
            'https://jsd.onmicrosoft.cn/gh/paulirish/snake@master/index.html',
            'https://cdn.jsdmirror.com/gh/paulirish/snake@master/index.html',
            'https://cdn.statically.io/gh/paulirish/snake/master/index.html',
            'https://raw.githack.com/paulirish/snake/master/index.html'
        ]
    },
    // --- GAME PORTALS (from pasted Gamesites directory; verified live) ---
    // Dead links from that list (DNS gone, 404, or cert-blocked) were skipped:
    // Unblockify, Lioxryt, Zatoga, Internet Archive, School Heaven,
    // MathGames66, ABC Games, Modern Method, Skool, Odd Games, SHS Games.
    {
        id: 'portal_3kh0',
        name: '3kh0',
        url: 'https://3kh0.github.io/',
        image: '',
        description: 'Game portal. Opens in sandboxed iframe with direct-open fallback.',
        category: 'Portal',
        accentColor: '#3b82f6',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'portal_pringles',
        name: 'Pringles',
        url: 'https://ellieeet123.github.io/',
        image: '',
        description: 'Game portal. Opens in sandboxed iframe with direct-open fallback.',
        category: 'Portal',
        accentColor: '#facc15',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'portal_outred',
        name: 'OutRed Games',
        url: 'https://outred.github.io/',
        image: '',
        description: 'Game portal. Opens in sandboxed iframe with direct-open fallback.',
        category: 'Portal',
        accentColor: '#ff4444',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'portal_gba',
        name: 'Gba Online',
        url: 'https://gba.js.org/',
        image: '',
        description: 'Game portal. Opens in sandboxed iframe with direct-open fallback.',
        category: 'Portal',
        accentColor: '#22c55e',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'portal_webretro',
        name: 'Web Retro',
        url: 'https://binbashbanana.github.io/webretro/',
        image: '',
        description: 'Retro emulator portal. Opens in sandboxed iframe with direct-open fallback.',
        category: 'Portal',
        accentColor: '#a855f7',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'portal_bidoofery',
        name: 'Bidoofery',
        url: 'https://bidoofery.github.io/',
        image: '',
        description: 'Game portal. Opens in sandboxed iframe with direct-open fallback.',
        category: 'Portal',
        accentColor: '#ec4899',
        launchMode: 'about-blank',
        iframeOnly: true
    },
    {
        id: 'portal_retro_games',
        name: 'Retro Games',
        url: 'https://theooofficial.github.io/myRETROGAMES/',
        image: '',
        description: 'Retro game portal. Opens in sandboxed iframe with direct-open fallback.',
        category: 'Portal',
        accentColor: '#f97316',
        launchMode: 'about-blank',
        iframeOnly: true
    }
];

export const DEMO_MEDIA = {
    movies: [
        { title: 'Tears of Steel', year: '2026', duration: '12m', genre: 'Sci-Fi', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4', thumb: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?q=80&w=400' },
        { title: 'Sintel Fantasy', year: '2025', duration: '15m', genre: 'Adventure', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', thumb: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=400' },
        { title: 'Big Buck Bunny', year: '2024', duration: '10m', genre: 'Comedy', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', thumb: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=400' },
        { title: 'Elephants Dream', year: '2024', duration: '11m', genre: 'Sci-Fi', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', thumb: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400' },
        { title: 'For Bigger Blazes', year: '2025', duration: '1m', genre: 'Action', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', thumb: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=400' },
        { title: 'For Bigger Escapes', year: '2025', duration: '1m', genre: 'Adventure', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', thumb: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400' },
        { title: 'For Bigger Fun', year: '2025', duration: '1m', genre: 'Comedy', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', thumb: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?q=80&w=400' },
        { title: 'For Bigger Joyrides', year: '2025', duration: '1m', genre: 'Action', url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', thumb: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=400' }
    ],
    tv: [
        { title: 'Cyberpunk: Edgerunners Spec', season: 'S1', episodes: '10 Ep', rating: '9.8', thumb: 'https://images.unsplash.com/photo-1563089145-599997674d42?q=80&w=400' },
        { title: 'The Witcher Web Chronicles', season: 'S2', episodes: '8 Ep', rating: '8.9', thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=400' },
        { title: 'Retro Gaming Rewind', season: 'S5', episodes: '12 Ep', rating: '9.2', thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400' },
        { title: 'Neon Grid Racers', season: 'S1', episodes: '6 Ep', rating: '8.7', thumb: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400' },
        { title: 'Pixel Architects', season: 'S3', episodes: '9 Ep', rating: '9.0', thumb: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=400' },
        { title: 'Synthwave Nights', season: 'S2', episodes: '7 Ep', rating: '8.5', thumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400' }
    ],
    music: [
        { title: 'SoundHelix Track 1', artist: 'SoundHelix', duration: '6:12', file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', thumb: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=200' },
        { title: 'SoundHelix Track 2', artist: 'SoundHelix', duration: '7:04', file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', thumb: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?q=80&w=200' },
        { title: 'SoundHelix Track 3', artist: 'SoundHelix', duration: '5:44', file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', thumb: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=200' },
        { title: 'SoundHelix Track 4', artist: 'SoundHelix', duration: '6:30', file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', thumb: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=200' },
        { title: 'SoundHelix Track 5', artist: 'SoundHelix', duration: '5:54', file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', thumb: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?q=80&w=200' },
        { title: 'SoundHelix Track 6', artist: 'SoundHelix', duration: '6:21', file: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3', thumb: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=200' }
    ],
    podcasts: [
        { title: 'Decentralized Future', host: 'Alex Sterling', duration: '45m', thumb: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?q=80&w=200' },
        { title: 'Indie Dev Space', host: 'Mia Chen', duration: '32m', thumb: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?q=80&w=200' },
        { title: 'Pixel Talk Weekly', host: 'Jordan Blake', duration: '58m', thumb: 'https://images.unsplash.com/photo-1589902869114-7b3b1a5d3e5e?q=80&w=200' },
        { title: 'Speedrun Stories', host: 'Casey Rivers', duration: '41m', thumb: 'https://images.unsplash.com/photo-1560253023-3ec5d502959f?q=80&w=200' },
        { title: 'Synth & Circuits', host: 'Nova Reed', duration: '36m', thumb: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=200' },
        { title: 'Open Source Hour', host: 'Dev Patel', duration: '52m', thumb: 'https://images.unsplash.com/photo-1618401471353-b98af9a5850c?q=80&w=200' }
    ],
    favorites: [
        { title: 'Minecraft Classic', type: 'Game', id: 'game-3' },
        { title: 'Tears of Steel', type: 'Media', id: 'movie-1' }
    ]
};

export const PROXY_DATA = {
    resources: [
        { name: 'MDN Web Docs', url: 'https://developer.mozilla.org', desc: 'Legitimate open resources for web technology and browser behaviors.', cat: 'Dev Tools' },
        { name: 'JSONPlaceholder API', url: 'https://jsonplaceholder.typicode.com', desc: 'Free online REST API for testing and prototyping network requests.', cat: 'APIs' },
        { name: 'DevDocs.io', url: 'https://devdocs.io', desc: 'Fast, offline-capable developer documentation viewer combining multiple APIs.', cat: 'Dev Tools' },
        { name: 'Postman Learning', url: 'https://learning.postman.com', desc: 'Interactive lessons on HTTP requests, methods, headers, and status codes.', cat: 'Debugging' }
    ]
};

// Demo collections for games
export const DEFAULT_COLLECTIONS = [
    { id: 'coll_favorites', name: 'Favorites', color: '#ff007f', icon: 'heart', gameIds: [] },
    { id: 'coll_retro', name: 'Retro Arcade', color: '#00f0ff', icon: 'gamepad', gameIds: [] },
    { id: 'coll_sandbox', name: 'Sandbox Worlds', color: '#39ff14', icon: 'cube', gameIds: [] },
];

// Achievements definitions
export const ACHIEVEMENT_DEFS = [
    { id: 'first_launch', name: 'First Contact', desc: 'Launch your first game', icon: 'rocket', hidden: false },
    { id: 'ten_launches', name: 'Frequent Flyer', desc: 'Launch games 10 times', icon: 'plane', hidden: false },
    { id: 'add_five_games', name: 'Curator', desc: 'Add 5 games to your library', icon: 'plus-circle', hidden: false },
    { id: 'night_owl', name: 'Night Owl', desc: 'Launch a game after midnight', icon: 'moon', hidden: false },
    { id: 'mirror_master', name: 'Mirror Master', desc: 'Use 3 different mirrors', icon: 'shield-alt', hidden: false },
    { id: 'theme_hopper', name: 'Chameleon', desc: 'Try all 5 themes', icon: 'palette', hidden: false },
    { id: 'tool_user', name: 'Tinkerer', desc: 'Use 5 different tools', icon: 'tools', hidden: false },
    { id: 'collection_builder', name: 'Organizer', desc: 'Create a custom collection', icon: 'folder-plus', hidden: false },
];


