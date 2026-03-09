// ═══════════════════════════════════════════════════════
//  SHARED STATE & CONSTANTS
// ═══════════════════════════════════════════════════════

const ST = { IDLE: 0, WALK: 1, TYPE: 2 };
const DIR = { DOWN: 0, LEFT: 1, RIGHT: 2, UP: 3 };
const TL = { VOID: 0, WOOD: 1, BEIGE: 2, BLUE: 3, CORR: 4 };

const TILE = 32;
const SITTING_OFFSET = 6;

const WALK_SPEED = 96;
const WALK_FRAME_DUR = 0.15;
const TYPE_FRAME_DUR = 0.3;
const WANDER_MIN = 3;
const WANDER_MAX = 12;
const WANDER_MOVES_MIN = 3;
const WANDER_MOVES_MAX = 6;
const SEAT_REST_MIN = 20;
const SEAT_REST_MAX = 45;
const MAX_DT = 0.1;

const API_BASE = window.location.origin;

const PALETTES = [
    { skin: '#FFCC99', hair: '#553322', shirt: '#a29bfe', pants: '#4a3060', shoes: '#222' },
    { skin: '#DEB887', hair: '#2c3e50', shirt: '#74b9ff', pants: '#2d3436', shoes: '#333' },
    { skin: '#FFCC99', hair: '#922b21', shirt: '#fd9644', pants: '#1a252f', shoes: '#222' },
    { skin: '#FFCC99', hair: '#e91e63', shirt: '#ff6584', pants: '#7b2d8b', shoes: '#222' },
    { skin: '#DEB887', hair: '#0a3622', shirt: '#55efc4', pants: '#064a2d', shoes: '#333' },
    { skin: '#FFCC99', hair: '#1a1a3a', shirt: '#00cec9', pants: '#2d3436', shoes: '#222' },
    { skin: '#DEB887', hair: '#4a1010', shirt: '#e74c3c', pants: '#1a1a2e', shoes: '#333' },
    { skin: '#FFCC99', hair: '#6a0dad', shirt: '#c084fc', pants: '#3b0764', shoes: '#222' },
    { skin: '#DEB887', hair: '#1a1a3a', shirt: '#2dd4bf', pants: '#134e4a', shoes: '#333' },
    { skin: '#FFCC99', hair: '#b91c1c', shirt: '#f472b6', pants: '#831843', shoes: '#222' },
    { skin: '#DEB887', hair: '#854d0e', shirt: '#fbbf24', pants: '#451a03', shoes: '#333' },
];

function randRange(a, b) { return a + Math.random() * (b - a); }
function randInt(a, b) { return Math.floor(randRange(a, b + 1)); }

function agentById(agentId) {
    return AGENTS.find((a) => a.id === agentId);
}

function escHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
}

const AGENTS = [
    {
        id: 'arch', name: 'Architect', charName: 'Asep', emoji: '🏛️',
        color: '#a29bfe', glowColor: 'rgba(162,155,254,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 3, tileRow: 3, seatCol: 3, seatRow: 3, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 5 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 0,
    },
    {
        id: 'db', name: 'DB Designer', charName: 'Jamal', emoji: '🗄️',
        color: '#74b9ff', glowColor: 'rgba(116,185,255,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 7, tileRow: 3, seatCol: 7, seatRow: 3, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 3 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 1,
    },
    {
        id: 'be', name: 'Backend Dev', charName: 'Budi', emoji: '⚙️',
        color: '#fd9644', glowColor: 'rgba(253,150,68,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 3, tileRow: 9, seatCol: 3, seatRow: 9, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 4 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 2,
    },
    {
        id: 'fe', name: 'Frontend Dev', charName: 'Slamet', emoji: '🎨',
        color: '#ff6584', glowColor: 'rgba(255,101,132,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 13, tileRow: 3, seatCol: 13, seatRow: 3, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 6 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 3,
    },
    {
        id: 'qa', name: 'QA Engineer', charName: 'Mulyono', emoji: '🧪',
        color: '#55efc4', glowColor: 'rgba(85,239,196,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 25, tileRow: 9, seatCol: 25, seatRow: 9, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 7 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 4,
    },
    {
        id: 'devops', name: 'DevOps Engineer', charName: 'Ade', emoji: '🐳',
        color: '#00cec9', glowColor: 'rgba(0,206,201,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 19, tileRow: 3, seatCol: 19, seatRow: 3, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 8 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 5,
    },
    {
        id: 'sec', name: 'Security Engineer', charName: 'Trisno', emoji: '🔒',
        color: '#e74c3c', glowColor: 'rgba(231,76,60,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 7, tileRow: 9, seatCol: 7, seatRow: 9, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 9 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 6,
    },
    {
        id: 'uxr', name: 'UX Researcher', charName: 'Dewi', emoji: '🔬',
        color: '#c084fc', glowColor: 'rgba(192,132,252,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 12, tileRow: 9, seatCol: 12, seatRow: 9, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 4 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 7,
    },
    {
        id: 'uxa', name: 'UX Architect', charName: 'Rizki', emoji: '🏗️',
        color: '#2dd4bf', glowColor: 'rgba(45,212,191,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 25, tileRow: 3, seatCol: 25, seatRow: 3, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 5 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 8,
    },
    {
        id: 'uid', name: 'UI Designer', charName: 'Putri', emoji: '🖌️',
        color: '#f472b6', glowColor: 'rgba(244,114,182,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 16, tileRow: 9, seatCol: 16, seatRow: 9, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 6 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 9,
    },
    {
        id: 'ipe', name: 'Image Prompt Engineer', charName: 'Fajar', emoji: '📸',
        color: '#fbbf24', glowColor: 'rgba(251,191,36,',
        statusText: 'Idle', state: 'idle', bubble: '',
        fsmState: ST.IDLE, dir: DIR.DOWN,
        tileCol: 27, tileRow: 3, seatCol: 27, seatRow: 3, seatDir: DIR.UP,
        x: 0, y: 0, path: [], moveProgress: 0,
        frame: 0, frameTimer: 0,
        wanderTimer: 7 + Math.random() * 5,
        wanderCount: 0, wanderLimit: randInt(3, 6),
        seatTimer: 0, isActive: false, returningToSeat: false,
        sprites: null, paletteIdx: 10,
    },
];

const DEFAULT_PORTAL_NAME = 'AGENTS CORPORATION';
let portalName = DEFAULT_PORTAL_NAME;
let pipelineRunning = false;
let pipelineAgentIds = [];
let pipelineAwaitingDesign = false;
let activeAgentIdx = -1;
let globalTick = 0;
let particles = [];
let lastFrameTime = 0;
let selectedModel = '';

const enabledAgents = new Set();
let socket = null;
let authModeInitialized = false;
let latestAuthHealth = null;
