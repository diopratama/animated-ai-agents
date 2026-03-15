// ═══════════════════════════════════════════════════════
//  PIXEL ART ENGINE — Isometric "Game Dev Story" Style
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;

// Isometric Constants
const ISO_OFFSET_X = W / 2;
const ISO_OFFSET_Y = 80;
const MAP_SIZE = 16;

const FLOOR_COL = {
    [TL.VOID]: '#0a0a14', [TL.WOOD]: '#8a6a42',
    [TL.BEIGE]: '#c8b898', [TL.BLUE]: '#2a4a70', [TL.CORR]: '#3a3a42',
};
const FLOOR_COL2 = {
    [TL.VOID]: '#0a0a14', [TL.WOOD]: '#7a5c38',
    [TL.BEIGE]: '#bfb090', [TL.BLUE]: '#254060', [TL.CORR]: '#343440',
};

// Isometric Math
function cartToIso(col, row) {
    return {
        x: ISO_OFFSET_X + (col - row) * (ISO_TILE_W / 2),
        y: ISO_OFFSET_Y + (col + row) * (ISO_TILE_H / 2)
    };
}

// ─── Tilemap ───

const ROOM_DEFS = [
    { col: 0, row: 0, w: 10, h: 10, floor: TL.BEIGE, name: 'WORKING AREA', wallSide: 'NW', wallIdx: 4 },
    { col: 10, row: 0, w: 6, h: 7, floor: TL.BLUE, name: 'GYM', wallSide: 'NE', wallIdx: 12 },
    { col: 10, row: 7, w: 6, h: 9, floor: TL.WOOD, name: 'PANTRY', wallSide: 'NE', wallIdx: 15 },
    { col: 0, row: 10, w: 10, h: 6, floor: TL.CORR, name: 'GAMING LOUNGE', wallSide: 'NW', wallIdx: 13 },
];

function createTilemap() {
    const map = new Array(MAP_SIZE * MAP_SIZE).fill(TL.VOID);
    for (const r of ROOM_DEFS) {
        for (let row = r.row; row < r.row + r.h; row++)
            for (let col = r.col; col < r.col + r.w; col++)
                if (row < MAP_SIZE && col < MAP_SIZE)
                    map[row * MAP_SIZE + col] = r.floor;
    }
    return map;
}
const tilemap = createTilemap();

// ─── Furniture ───

const FURN_META = {
    DESK_U: { w: 1, h: 1, blocks: true },
    DESK_D: { w: 1, h: 1, blocks: true },
    BOOKSHELF: { w: 1, h: 1, blocks: true },
    PLANT: { w: 1, h: 1, blocks: true },
    COOLER: { w: 1, h: 1, blocks: true },
    CHAIR: { w: 1, h: 1, blocks: false },
    VENDING: { w: 1, h: 1, blocks: true },
    ARCADE: { w: 1, h: 1, blocks: true },
    SOFA: { w: 1, h: 1, blocks: false },
    GYM_BENCH: { w: 1, h: 1, blocks: true },
    TREADMILL: { w: 1, h: 1, blocks: true },
    COFFEE: { w: 1, h: 1, blocks: true },
};

const furniture = [
    // --- Office: Face-to-Face Horizontal Banks ---
    // Row 1 agents (face DOWN), Desks at row 2
    { type: 'CHAIR', col: 2, row: 1 }, { type: 'DESK_D', col: 2, row: 2 },
    { type: 'CHAIR', col: 3, row: 1 }, { type: 'DESK_D', col: 3, row: 2 },
    { type: 'CHAIR', col: 4, row: 1 }, { type: 'DESK_D', col: 4, row: 2 },
    { type: 'CHAIR', col: 5, row: 1 }, { type: 'DESK_D', col: 5, row: 2 },
    { type: 'CHAIR', col: 6, row: 1 }, { type: 'DESK_D', col: 6, row: 2 },
    { type: 'CHAIR', col: 7, row: 1 }, { type: 'DESK_D', col: 7, row: 2 },

    // Row 4 agents (face UP), Desks at row 3
    { type: 'CHAIR', col: 2, row: 4 }, { type: 'DESK_U', col: 2, row: 3 },
    { type: 'CHAIR', col: 3, row: 4 }, { type: 'DESK_U', col: 3, row: 3 },
    { type: 'CHAIR', col: 4, row: 4 }, { type: 'DESK_U', col: 4, row: 3 },
    { type: 'CHAIR', col: 5, row: 4 }, { type: 'DESK_U', col: 5, row: 3 },
    { type: 'CHAIR', col: 6, row: 4 }, { type: 'DESK_U', col: 6, row: 3 },

    // --- Gym Area ---
    { type: 'TREADMILL', col: 11, row: 1 }, { type: 'TREADMILL', col: 12, row: 1 },
    { type: 'GYM_BENCH', col: 11, row: 3 }, { type: 'GYM_BENCH', col: 12, row: 3 },
    { type: 'COOLER', col: 14, row: 1 },

    // --- Pantry Area ---
    { type: 'COFFEE', col: 14, row: 8 },
    { type: 'VENDING', col: 14, row: 10 },
    { type: 'SOFA', col: 11, row: 12 }, { type: 'SOFA', col: 12, row: 12 },
    { type: 'PLANT', col: 10, row: 14 },

    // --- Gaming Lounge ---
    { type: 'ARCADE', col: 1, row: 13 }, { type: 'ARCADE', col: 2, row: 13 },
    { type: 'SOFA', col: 5, row: 13 }, { type: 'SOFA', col: 6, row: 13 },
    { type: 'PLANT', col: 8, row: 11 },

    // Generic Props
    { type: 'BOOKSHELF', col: 0, row: 1 }, { type: 'BOOKSHELF', col: 0, row: 2 },
    { type: 'BOOKSHELF', col: 0, row: 3 }, { type: 'BOOKSHELF', col: 0, row: 4 },
];

const blockedTiles = new Set();
for (const f of furniture) {
    const def = FURN_META[f.type];
    if (def && def.blocks) {
        blockedTiles.add(`${f.col},${f.row}`);
    }
}

// ─── Character Sprite Generator ───

function spx(cx, x, y, w, h, col) {
    cx.fillStyle = col;
    cx.fillRect(x * 2, y * 2, w * 2, h * 2);
}

function drawCharShadow(cx) {
    cx.fillStyle = 'rgba(0,0,0,0.15)';
    cx.beginPath();
    cx.ellipse(16, 42, 10, 4, 0, 0, Math.PI * 2);
    cx.fill();
}

function makeFrame(drawFn) {
    const c = document.createElement('canvas');
    c.width = 30; c.height = 46;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    drawFn(cx);
    return c;
}

function flipCanvas(src) {
    const c = document.createElement('canvas');
    c.width = src.width; c.height = src.height;
    const cx = c.getContext('2d');
    cx.translate(c.width, 0);
    cx.scale(-1, 1);
    cx.drawImage(src, 0, 0);
    return c;
}

function makeWalkDown(p) {
    function frame(ls) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            // Hair
            spx(cx, 3, 0, 9, 3, p.hair);
            spx(cx, 3, 0, 9, 2, p.hair);
            // Face
            spx(cx, 3, 2, 9, 7, p.skin);
            // Eyes
            spx(cx, 4, 5, 2, 2, '#FFF'); spx(cx, 9, 5, 2, 2, '#FFF');
            spx(cx, 5, 5, 1, 1, '#111'); spx(cx, 10, 5, 1, 1, '#111');
            // Shirt
            spx(cx, 2, 9, 11, 4, p.shirt);
            spx(cx, 1, 10, 2, 5, p.skin); // Arms
            spx(cx, 12, 10, 2, 5, p.skin);
            // Legs
            spx(cx, 4 + ls, 13, 3, 6, p.pants);
            spx(cx, 8 - ls, 13, 3, 6, p.pants);
            spx(cx, 4 + ls, 19, 3, 2, p.shoes);
            spx(cx, 8 - ls, 19, 3, 2, p.shoes);
        });
    }
    return [frame(-1), frame(0), frame(1), frame(0)];
}

function makeWalkUp(p) {
    function frame(ls) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            // Hair
            spx(cx, 3, 0, 9, 8, p.hair);
            spx(cx, 4, 7, 7, 2, p.skin);
            // Shirt
            spx(cx, 2, 9, 11, 5, p.shirt);
            spx(cx, 1, 10, 2, 4, p.skin);
            spx(cx, 12, 10, 2, 4, p.skin);
            // Legs
            spx(cx, 4 + ls, 14, 3, 5, p.pants);
            spx(cx, 8 - ls, 14, 3, 5, p.pants);
            spx(cx, 4 + ls, 19, 3, 2, p.shoes);
            spx(cx, 8 - ls, 19, 3, 2, p.shoes);
        });
    }
    return [frame(-1), frame(0), frame(1), frame(0)];
}

function makeWalkRight(p) {
    function frame(ls) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            // Hair
            spx(cx, 4, 0, 6, 3, p.hair);
            spx(cx, 4, 0, 7, 2, p.hair);
            // Face
            spx(cx, 4, 2, 8, 7, p.skin);
            spx(cx, 9, 5, 2, 2, '#FFF'); spx(cx, 10, 5, 1, 1, '#111');
            // Shirt
            spx(cx, 4, 9, 8, 5, p.shirt);
            spx(cx, 11, 10, 2, 5, p.skin);
            // Legs
            spx(cx, 4, 14, 3, 5, p.pants);
            spx(cx, 7 + ls, 14, 3, 5, p.pants);
            spx(cx, 4, 19, 3, 2, p.shoes);
            spx(cx, 7 + ls, 19, 3, 2, p.shoes);
        });
    }
    return [frame(-1), frame(0), frame(1), frame(0)];
}

function makeTypeDown(p) {
    function frame(ao) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            // Head
            spx(cx, 3, 0, 9, 3, p.hair);
            spx(cx, 3, 2, 9, 7, p.skin);
            spx(cx, 4, 5, 2, 2, '#FFF'); spx(cx, 9, 5, 2, 2, '#FFF');
            spx(cx, 5, 5, 1, 1, '#111'); spx(cx, 10, 5, 1, 1, '#111');
            // Shirt
            spx(cx, 2, 9, 11, 4, p.shirt);
            // Hands on table
            spx(cx, 2 + ao, 12, 3, 3, p.skin);
            spx(cx, 10 - ao, 12, 3, 3, p.skin);
            // Sitting
            spx(cx, 3, 14, 9, 3, p.pants);
            spx(cx, 3, 17, 3, 2, p.shoes); spx(cx, 9, 17, 3, 2, p.shoes);
        });
    }
    return [frame(0), frame(1)];
}

function makeTypeUp(p) {
    function frame(ao) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            spx(cx, 3, 0, 9, 8, p.hair);
            spx(cx, 4, 7, 7, 2, p.skin);
            spx(cx, 2, 9, 11, 5, p.shirt);
            spx(cx, 2 + ao, 11, 3, 4, p.skin);
            spx(cx, 10 - ao, 11, 3, 4, p.skin);
            spx(cx, 3, 14, 9, 3, p.pants);
            spx(cx, 3, 17, 3, 2, p.shoes); spx(cx, 9, 17, 3, 2, p.shoes);
        });
    }
    return [frame(0), frame(1)];
}

function makeCharSprites(palette) {
    const wd = makeWalkDown(palette);
    const wu = makeWalkUp(palette);
    const wr = makeWalkRight(palette);
    const wl = wr.map(flipCanvas);
    const td = makeTypeDown(palette);
    const tu = makeTypeUp(palette);
    return {
        walk: { [DIR.DOWN]: wd, [DIR.UP]: wu, [DIR.RIGHT]: wr, [DIR.LEFT]: wl },
        type: { [DIR.DOWN]: td, [DIR.UP]: tu, [DIR.RIGHT]: td, [DIR.LEFT]: flipCanvas(td[0]) },
    };
}

// ─── Furniture Sprites ───

function makeIsoDesk(dir) {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 64;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;

    // Metal Legs
    cx.fillStyle = '#4b5563';
    cx.fillRect(12, 34, 2, 16);
    cx.fillRect(50, 18, 2, 16);
    cx.fillRect(31, 42, 2, 16);

    // Table Top (Light Gray)
    cx.fillStyle = '#f3f4f6';
    cx.beginPath();
    cx.moveTo(32, 28); cx.lineTo(64, 12); cx.lineTo(32, -4); cx.lineTo(0, 12);
    cx.closePath(); cx.fill();

    // Edge (Depth)
    cx.fillStyle = '#d1d5db';
    cx.beginPath();
    cx.moveTo(0, 12); cx.lineTo(32, 28); cx.lineTo(32, 34); cx.lineTo(0, 18);
    cx.closePath(); cx.fill();
    cx.fillStyle = '#9ca3af';
    cx.beginPath();
    cx.moveTo(32, 28); cx.lineTo(64, 12); cx.lineTo(64, 18); cx.lineTo(32, 34);
    cx.closePath(); cx.fill();

    if (dir === DIR.UP) { // Monitor at top-left/top-right edges, faces bottom-left
        // Monitor Stand
        cx.fillStyle = '#111827';
        cx.fillRect(24, 6, 4, 4);
        // Monitor Screen
        cx.fillStyle = '#111827';
        cx.beginPath();
        cx.moveTo(10, 8); cx.lineTo(34, 20); cx.lineTo(34, 5); cx.lineTo(10, -7);
        cx.closePath(); cx.fill();
        // Screen Glow
        cx.fillStyle = '#374151';
        cx.beginPath();
        cx.moveTo(12, 8); cx.lineTo(32, 18); cx.lineTo(32, 6); cx.lineTo(12, -4);
        cx.closePath(); cx.fill();
        // Keyboard
        cx.fillStyle = '#374151';
        cx.fillRect(22, 20, 12, 6);
    } else { // dir === DIR.DOWN
        // Monitor Stand
        cx.fillStyle = '#111827';
        cx.fillRect(38, 6, 4, 4);
        // Monitor Screen
        cx.fillStyle = '#111827';
        cx.beginPath();
        cx.moveTo(56, 8); cx.lineTo(32, 20); cx.lineTo(32, 5); cx.lineTo(56, -7);
        cx.closePath(); cx.fill();
        // Screen Glow
        cx.fillStyle = '#374151';
        cx.beginPath();
        cx.moveTo(54, 8); cx.lineTo(34, 18); cx.lineTo(34, 6); cx.lineTo(54, -4);
        cx.closePath(); cx.fill();
        // Keyboard
        cx.fillStyle = '#374151';
        cx.fillRect(34, 20, 12, 6);
    }

    return c;
}

function makeIsoBookshelf() {
    const c = document.createElement('canvas');
    c.width = 48; c.height = 80;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;

    // Back Panel
    cx.fillStyle = '#4b3621';
    cx.fillRect(4, 0, 40, 80);

    // Shelves
    cx.fillStyle = '#6b4423';
    for (let i = 0; i < 4; i++) {
        cx.fillRect(4, 16 + i * 16, 40, 2);
    }

    // Books
    const cols = ['#cc4444', '#4488cc', '#44aa66', '#aa55cc', '#ccaa33'];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 6; j++) {
            if (Math.random() < 0.8) {
                cx.fillStyle = cols[(i + j) % cols.length];
                cx.fillRect(8 + j * 6, 6 + i * 16, 5, 10);
            }
        }
    }
    return c;
}

function makeIsoPlant() {
    const c = document.createElement('canvas');
    c.width = 30; c.height = 50;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;

    // Pot
    cx.fillStyle = '#a16207'; cx.fillRect(8, 32, 14, 12);
    // Tree Trunk
    cx.fillStyle = '#422006'; cx.fillRect(13, 26, 4, 8);
    // Leaves (Layered)
    cx.fillStyle = '#064e3b';
    cx.beginPath(); cx.arc(15, 20, 12, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#065f46';
    cx.beginPath(); cx.arc(10, 16, 8, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#10b981';
    cx.beginPath(); cx.arc(18, 12, 6, 0, Math.PI * 2); cx.fill();

    return c;
}

function makeIsoCoffee() {
    const c = document.createElement('canvas');
    c.width = 30; c.height = 30;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#111'; cx.fillRect(8, 12, 14, 14); // Machine
    cx.fillStyle = '#444'; cx.fillRect(10, 4, 10, 8);   // Top
    cx.fillStyle = '#fff'; cx.fillRect(12, 18, 6, 6);   // Cup
    return c;
}

function makeIsoArcade() {
    const c = document.createElement('canvas');
    c.width = 40; c.height = 70;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#4f46e5'; cx.fillRect(4, 0, 32, 70); // Cabinet
    cx.fillStyle = '#ffd700'; cx.fillRect(4, 0, 32, 8);  // Marquee
    cx.fillStyle = '#000'; cx.fillRect(8, 12, 24, 20);   // Screen
    // Joystick/Buttons
    cx.fillStyle = '#ef4444'; cx.fillRect(12, 38, 4, 4);
    cx.fillStyle = '#fff'; cx.fillRect(24, 38, 4, 4);
    return c;
}

function makeIsoSofa() {
    const c = document.createElement('canvas');
    c.width = 50; c.height = 40;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#1e3a8a'; cx.fillRect(0, 15, 50, 20); // Base
    cx.fillStyle = '#1e40af'; cx.fillRect(0, 0, 50, 15);  // Back
    cx.fillStyle = '#1e3a8a'; cx.fillRect(0, 10, 8, 15);  // Arm L
    cx.fillStyle = '#1e3a8a'; cx.fillRect(42, 10, 8, 15); // Arm R
    return c;
}

function makeIsoGymBench() {
    const c = document.createElement('canvas');
    c.width = 40; c.height = 30;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#1f2937'; cx.fillRect(4, 10, 32, 12); // Padding
    cx.fillStyle = '#64748b'; cx.fillRect(6, 22, 2, 8);   // Leg
    cx.fillRect(32, 22, 2, 8);
    // Barbell on rack if we wanted, but let's keep it simple
    return c;
}

function makeIsoTreadmill() {
    const c = document.createElement('canvas');
    c.width = 40; c.height = 50;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#334155'; cx.fillRect(4, 30, 32, 16); // Belt base
    cx.fillStyle = '#1e293b'; cx.fillRect(6, 30, 28, 14); // Belt
    cx.fillStyle = '#64748b'; cx.fillRect(6, 4, 2, 30);   // Handle L
    cx.fillRect(32, 4, 2, 30);
    cx.fillRect(6, 4, 28, 4); // Control panel
    return c;
}

function makeIsoCooler() {
    const c = document.createElement('canvas');
    c.width = 30; c.height = 60;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;

    cx.fillStyle = '#e2e8f0'; cx.fillRect(4, 20, 22, 36); // Body
    cx.fillStyle = '#3b82f6'; cx.fillRect(6, 4, 18, 16);  // Jug
    cx.fillStyle = '#1d4ed8'; cx.fillRect(10, 8, 10, 10); // Water

    return c;
}

function makeIsoVending() {
    const c = document.createElement('canvas');
    c.width = 44; c.height = 76;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;

    cx.fillStyle = '#b91c1c'; cx.fillRect(0, 0, 44, 76); // Cabinet
    cx.fillStyle = '#111'; cx.fillRect(6, 10, 32, 44);   // Glass
    cx.fillStyle = '#444'; cx.fillRect(6, 58, 32, 12);   // Dispenser

    // Glowing drinks
    for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 4; j++) {
            cx.fillStyle = ['#fbbf24', '#4ade80', '#f87171'][j % 3];
            cx.fillRect(10 + i * 8, 14 + j * 10, 4, 6);
        }
    }

    return c;
}

function makeChairSprite() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 40;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;

    // Swivel Base
    cx.fillStyle = '#374151';
    cx.fillRect(10, 32, 12, 2);
    cx.fillRect(15, 26, 2, 6);

    // Cushion
    cx.fillStyle = '#1f2937';
    cx.fillRect(6, 18, 20, 10);

    // Armrests
    cx.fillStyle = '#111827';
    cx.fillRect(4, 16, 4, 8);
    cx.fillRect(24, 16, 4, 8);

    // Backrest (Rounded)
    cx.fillStyle = '#374151';
    cx.beginPath();
    cx.roundRect(6, 4, 20, 14, 4);
    cx.fill();

    return c;
}

const FURN_SPRITES = {
    DESK_U: makeIsoDesk(DIR.UP), DESK_D: makeIsoDesk(DIR.DOWN),
    BOOKSHELF: makeIsoBookshelf(), PLANT: makeIsoPlant(),
    COOLER: makeIsoCooler(), CHAIR: makeChairSprite(),
    VENDING: makeIsoVending(), ARCADE: makeIsoArcade(),
    SOFA: makeIsoSofa(), GYM_BENCH: makeIsoGymBench(),
    TREADMILL: makeIsoTreadmill(), COFFEE: makeIsoCoffee(),
};

// ─── BFS Pathfinding ───

function isWalkable(col, row, blocked) {
    if (col < 0 || row < 0 || col >= MAP_SIZE || row >= MAP_SIZE) return false;
    if (tilemap[row * MAP_SIZE + col] === TL.VOID) return false;
    return !(blocked && blocked.has(`${col},${row}`));
}

function findPath(sc, sr, ec, er, blocked) {
    if (sc === ec && sr === er) return [];
    if (!isWalkable(ec, er, blocked)) return [];
    const key = (c, r) => `${c},${r}`;
    const sk = key(sc, sr), ek = key(ec, er);
    const visited = new Set([sk]);
    const parent = new Map();
    const queue = [{ c: sc, r: sr }];
    const dirs = [{ dc: 0, dr: -1 }, { dc: 0, dr: 1 }, { dc: -1, dr: 0 }, { dc: 1, dr: 0 }];
    while (queue.length) {
        const { c, r } = queue.shift();
        for (const { dc, dr } of dirs) {
            const nc = c + dc, nr = r + dr, nk = key(nc, nr);
            if (visited.has(nk) || !isWalkable(nc, nr, blocked)) continue;
            visited.add(nk);
            parent.set(nk, key(c, r));
            if (nk === ek) {
                const path = [];
                let cur = ek;
                while (cur !== sk) {
                    const [pc, pr] = cur.split(',').map(Number);
                    path.unshift({ col: pc, row: pr });
                    cur = parent.get(cur);
                }
                return path;
            }
            queue.push({ c: nc, r: nr });
        }
    }
    return [];
}

function randomWalkable(blocked, curC, curR) {
    const tiles = [];
    for (let r = 0; r < MAP_SIZE; r++)
        for (let c = 0; c < MAP_SIZE; c++)
            if (isWalkable(c, r, blocked)) tiles.push({ col: c, row: r });
    const far = tiles.filter(t => Math.abs(t.col - curC) + Math.abs(t.row - curR) > 2);
    const pool = far.length > 0 ? far : tiles;
    return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
}

// ─── Character FSM ───

function updateCharacter(ch, dt) {
    switch (ch.fsmState) {
        case ST.TYPE: {
            ch.frameTimer += dt;
            if (ch.frameTimer >= TYPE_FRAME_DUR) {
                ch.frameTimer -= TYPE_FRAME_DUR;
                ch.frame = (ch.frame + 1) % 2;
            }
            if (!ch.isActive) {
                ch.seatTimer -= dt;
                if (ch.seatTimer <= 0) {
                    ch.fsmState = ST.IDLE;
                    ch.frame = 0;
                    ch.wanderTimer = randRange(WANDER_MIN, WANDER_MAX);
                    ch.wanderCount = 0;
                    ch.wanderLimit = randInt(WANDER_MOVES_MIN, WANDER_MOVES_MAX);
                }
            }
            break;
        }
        case ST.IDLE: {
            if (ch.isActive && ch.seatCol != null) {
                const ub = new Set(blockedTiles);
                ub.delete(`${ch.seatCol},${ch.seatRow}`);
                ch.path = findPath(ch.tileCol, ch.tileRow, ch.seatCol, ch.seatRow, ub);
                if (ch.path.length > 0) {
                    ch.fsmState = ST.WALK;
                    ch.moveProgress = 0; ch.frame = 0; ch.frameTimer = 0;
                } else if (ch.tileCol === ch.seatCol && ch.tileRow === ch.seatRow) {
                    ch.fsmState = ST.TYPE;
                    ch.dir = ch.seatDir; ch.frame = 0;
                    ch.seatTimer = randRange(SEAT_REST_MIN, SEAT_REST_MAX);
                }
                break;
            }
            ch.wanderTimer -= dt;
            if (ch.wanderTimer <= 0) {
                let target = null;
                if (ch.wanderCount >= ch.wanderLimit && ch.seatCol != null) {
                    const ub = new Set(blockedTiles);
                    ub.delete(`${ch.seatCol},${ch.seatRow}`);
                    ch.path = findPath(ch.tileCol, ch.tileRow, ch.seatCol, ch.seatRow, ub);
                    ch.returningToSeat = true;
                } else {
                    target = randomWalkable(blockedTiles, ch.tileCol, ch.tileRow);
                    if (target) ch.path = findPath(ch.tileCol, ch.tileRow, target.col, target.row, blockedTiles);
                    ch.returningToSeat = false;
                    ch.wanderCount++;
                }
                if (ch.path && ch.path.length > 0) {
                    ch.fsmState = ST.WALK;
                    ch.moveProgress = 0; ch.frame = 0; ch.frameTimer = 0;
                } else {
                    ch.wanderTimer = randRange(WANDER_MIN, WANDER_MAX);
                }
            }
            break;
        }
        case ST.WALK: {
            ch.frameTimer += dt;
            if (ch.frameTimer >= WALK_FRAME_DUR) {
                ch.frameTimer -= WALK_FRAME_DUR;
                ch.frame = (ch.frame + 1) % 4;
            }
            if (!ch.path || ch.path.length === 0) {
                if (ch.tileCol === ch.seatCol && ch.tileRow === ch.seatRow && (ch.isActive || ch.returningToSeat)) {
                    ch.fsmState = ST.TYPE; ch.dir = ch.seatDir; ch.frame = 0;
                    ch.seatTimer = randRange(SEAT_REST_MIN, SEAT_REST_MAX);
                } else {
                    ch.fsmState = ST.IDLE;
                    ch.wanderTimer = randRange(WANDER_MIN, WANDER_MAX);
                }
                break;
            }
            const next = ch.path[0];
            const dx = next.col - ch.tileCol, dy = next.row - ch.tileRow;
            if (Math.abs(dx) >= Math.abs(dy)) ch.dir = dx > 0 ? DIR.RIGHT : DIR.LEFT;
            else ch.dir = dy > 0 ? DIR.DOWN : DIR.UP;

            ch.moveProgress += (WALK_SPEED / TILE) * dt;
            if (ch.moveProgress >= 1) {
                ch.tileCol = next.col; ch.tileRow = next.row;
                ch.path.shift(); ch.moveProgress = 0;
            }
            const fx = ch.tileCol, fy = ch.tileRow;
            const tx = next ? next.col : fx, ty = next ? next.row : fy;
            ch.x = fx + (tx - fx) * ch.moveProgress;
            ch.y = fy + (ty - fy) * ch.moveProgress;
            break;
        }
    }
}

// ─── Init ───

function initAgents() {
    AGENTS.forEach(a => {
        a.sprites = makeCharSprites(PALETTES[a.paletteIdx]);
        a.x = a.tileCol;
        a.y = a.tileRow;
    });
}

// ─── Particles ───

function spawnParticles(agent, count) {
    const iso = cartToIso(agent.x, agent.y);
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        particles.push({
            x: iso.x, y: iso.y - 20,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 2,
            life: 1, decay: 0.01 + Math.random() * 0.02,
            color: agent.color, size: 2 + Math.random() * 4,
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life -= p.decay; });
}

function drawParticles() {
    particles.forEach(p => {
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    });
    ctx.globalAlpha = 1;
}

// ─── Connection Lines ───

function drawConnections() {
    if (activeAgentIdx < 1) return;
    const from = AGENTS[activeAgentIdx - 1], to = AGENTS[activeAgentIdx];
    const t = (globalTick % 60) / 60;
    const fIso = cartToIso(from.x, from.y), tIso = cartToIso(to.x, to.y);
    const fx = fIso.x, fy = fIso.y - 16, tx = tIso.x, ty = tIso.y - 16;
    ctx.setLineDash([4, 6]);
    ctx.strokeStyle = from.color; ctx.globalAlpha = 0.4; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(tx, ty); ctx.stroke();
    ctx.globalAlpha = 1; ctx.setLineDash([]);
    ctx.fillStyle = from.color; ctx.shadowColor = from.color; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(fx + (tx - fx) * t, fy + (ty - fy) * t, 3, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
}

// ─── Speech Bubble ───

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function drawBubble(ctx, agent) {
    if (!agent.bubble) return;
    const iso = cartToIso(agent.x, agent.y);
    const cx = iso.x, cy = iso.y - 48;
    const text = agent.bubble;
    ctx.font = 'bold 9px Inter';
    const tw = ctx.measureText(text).width;
    const bw = tw + 16, bh = 22;
    const bx = cx - bw / 2, by = cy - bh - 14;
    const dotFrame = (globalTick >> 3) % 3;
    for (let i = 0; i <= 2; i++) {
        ctx.fillStyle = `rgba(255,255,255,${i === dotFrame ? 1 : 0.3})`;
        ctx.beginPath(); ctx.arc(cx - 6 + i * 6, cy - 8, 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(20,20,48,0.92)';
    roundRect(ctx, bx, by, bw, bh, 6); ctx.fill();
    ctx.strokeStyle = agent.color; ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, bw, bh, 6); ctx.stroke();
    ctx.fillStyle = 'rgba(20,20,48,0.92)';
    ctx.beginPath();
    ctx.moveTo(cx - 4, cy - 14); ctx.lineTo(cx + 4, cy - 14); ctx.lineTo(cx, cy - 10);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8e8ff'; ctx.font = '9px Inter';
    ctx.textBaseline = 'middle'; ctx.textAlign = 'center';
    ctx.fillText(text, cx, by + bh / 2);
    ctx.textAlign = 'left';
}

// ─── Name Labels ───

function drawNameLabel(ctx, agent) {
    const iso = cartToIso(agent.x, agent.y);
    const cx = iso.x;
    const footY = iso.y + 4;

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    ctx.font = 'bold 8px "Press Start 2P"';
    ctx.fillStyle = agent.color;
    ctx.fillText(agent.charName, cx, footY + 2);

    ctx.font = '7px Inter';
    ctx.fillStyle = 'rgba(200,200,240,0.7)';
    ctx.fillText(agent.name, cx, footY + 13);

    ctx.textAlign = 'left';
}

function drawRoomLabels(ctx) {
    ROOM_DEFS.forEach(r => {
        if (!r.wallSide) return;

        const iso = r.wallSide === 'NW' ? cartToIso(0, r.wallIdx) : cartToIso(r.wallIdx, 0);
        const wallH = 80;
        const signH = 14;
        const signW = 40;
        const groundY = iso.y + ISO_TILE_H / 2;
        const signBaseY = groundY - 50; // Height on wall

        ctx.save();
        
        // Isometric wall vectors: 
        // NW wall (Left) goes along (-32, -16) from the bottom-left point
        // NE wall (Right) goes along (32, -16) from the bottom-right point
        
        ctx.font = 'bold 7px "Press Start 2P"';
        const tw = ctx.measureText(r.name).width;
        const bw = tw + 10;
        const bh = 14;

        if (r.wallSide === 'NW') {
            const x = iso.x - 20, y = signBaseY;
            // Frame
            ctx.fillStyle = '#9ca3af';
            ctx.beginPath();
            ctx.moveTo(x + 1, y - 1);
            ctx.lineTo(x - bw / 2 - 1, y + bh / 4 - 1);
            ctx.lineTo(x - bw / 2 - 1, y + bh + bh / 4 + 1);
            ctx.lineTo(x + 1, y + bh + 1);
            ctx.closePath(); ctx.fill();

            // Plate
            ctx.fillStyle = '#f3f4f6';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x - bw / 2, y + bh / 4);
            ctx.lineTo(x - bw / 2, y + bh + bh / 4);
            ctx.lineTo(x, y + bh);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#111827';
            ctx.textAlign = 'center';
            ctx.fillText(r.name, x - bw / 4, y + bh / 2 + 3);
        } else {
            const x = iso.x + 20, y = signBaseY;
            // Frame
            ctx.fillStyle = '#9ca3af';
            ctx.beginPath();
            ctx.moveTo(x - 1, y - 1);
            ctx.lineTo(x + bw / 2 + 1, y + bh / 4 - 1);
            ctx.lineTo(x + bw / 2 + 1, y + bh + bh / 4 + 1);
            ctx.lineTo(x - 1, y + bh + 1);
            ctx.closePath(); ctx.fill();

            // Plate
            ctx.fillStyle = '#f3f4f6';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + bw / 2, y + bh / 4);
            ctx.lineTo(x + bw / 2, y + bh + bh / 4);
            ctx.lineTo(x, y + bh);
            ctx.closePath(); ctx.fill();

            ctx.fillStyle = '#111827';
            ctx.textAlign = 'center';
            ctx.fillText(r.name, x + bw / 4, y + bh / 2 + 3);
        }
        
        ctx.restore();
    });
}

// ─── Rendering ───

function getCharSprite(ch) {
    if (!ch.sprites) return null;
    if (ch.fsmState === ST.TYPE) {
        const tf = ch.sprites.type[ch.dir] || ch.sprites.type[DIR.DOWN];
        return tf ? tf[ch.frame % tf.length] : null;
    }
    const wf = ch.sprites.walk[ch.dir] || ch.sprites.walk[DIR.DOWN];
    if (ch.fsmState === ST.WALK) return wf[ch.frame % wf.length];
    return wf[1];
}

function drawEnvironment() {
    // 1. Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#020617');
    sky.addColorStop(0.5, '#0f172a');
    sky.addColorStop(1, '#1e293b');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // 2. Distant City Silhouettes
    const cityY = 320;
    const bldgs = [
        { x: -50, w: 120, h: 220, c: '#0f172a' },
        { x: 100, w: 90, h: 300, c: '#020617' },
        { x: 220, w: 150, h: 180, c: '#1e293b' },
        { x: 420, w: 80, h: 260, c: '#0f172a' },
        { x: 550, w: 140, h: 150, c: '#1e293b' },
        { x: 750, w: 100, h: 280, c: '#020617' },
    ];

    bldgs.forEach(b => {
        ctx.fillStyle = b.c;
        ctx.fillRect(b.x, cityY - b.h, b.w, b.h);

        // Window Lights
        ctx.fillStyle = 'rgba(251, 191, 36, 0.15)';
        for (let r = 0; r < b.h / 20; r++) {
            for (let col = 0; col < b.w / 15; col++) {
                if ((r + col + b.x) % 7 === 0) {
                    ctx.fillRect(b.x + 10 + col * 15, cityY - b.h + 10 + r * 20, 6, 8);
                }
            }
        }
    });

    // 3. Isometric Ground Plane (City Street level)
    const gSize = 40;
    const gOffS = -10;
    ctx.fillStyle = '#1e1b4b'; // Deep city ground

    // Draw a huge isometric slab
    const p1 = cartToIso(gOffS, gOffS);
    const p2 = cartToIso(gSize, gOffS);
    const p3 = cartToIso(gSize, gSize);
    const p4 = cartToIso(gOffS, gSize);

    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x + ISO_TILE_W / 2, p2.y + ISO_TILE_H / 2);
    ctx.lineTo(p3.x, p3.y + ISO_TILE_H);
    ctx.lineTo(p4.x - ISO_TILE_W / 2, p4.y + ISO_TILE_H / 2);
    ctx.closePath();
    ctx.fill();

    // Road Markings (Simple lines)
    ctx.strokeStyle = '#312e81';
    ctx.setLineDash([20, 40]);
    ctx.beginPath();
    const rStart = cartToIso(14, -10);
    const rEnd = cartToIso(14, 40);
    ctx.moveTo(rStart.x, rStart.y); ctx.lineTo(rEnd.x, rEnd.y);
    ctx.stroke();
    ctx.setLineDash([]);
}

function draw() {
    drawEnvironment();

    // Draw Floor
    for (let r = 0; r < MAP_SIZE; r++) {
        for (let c = 0; c < MAP_SIZE; c++) {
            const t = tilemap[r * MAP_SIZE + c];
            if (t === TL.VOID) continue;
            const iso = cartToIso(c, r);

            // Tile base
            ctx.fillStyle = (c + r) % 2 === 0 ? FLOOR_COL[t] : FLOOR_COL2[t];
            ctx.beginPath();
            ctx.moveTo(iso.x, iso.y);
            ctx.lineTo(iso.x + ISO_TILE_W / 2, iso.y + ISO_TILE_H / 2);
            ctx.lineTo(iso.x, iso.y + ISO_TILE_H);
            ctx.lineTo(iso.x - ISO_TILE_W / 2, iso.y + ISO_TILE_H / 2);
            ctx.closePath();
            ctx.fill();

            // Tile outline (isometric grid)
            ctx.strokeStyle = 'rgba(0,0,0,0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
    }

    // Draw Walls
    for (let i = 0; i < MAP_SIZE; i++) {
        const wallH = 80;
        // NW Wall (Left side)
        const isoL = cartToIso(0, i);
        ctx.fillStyle = i % 4 === 0 ? '#4a4a55' : '#3a3a45';
        ctx.beginPath();
        ctx.moveTo(isoL.x - ISO_TILE_W / 2, isoL.y + ISO_TILE_H / 2);
        ctx.lineTo(isoL.x - ISO_TILE_W / 2, isoL.y + ISO_TILE_H / 2 - wallH);
        ctx.lineTo(isoL.x, isoL.y - wallH);
        ctx.lineTo(isoL.x, isoL.y);
        ctx.closePath(); ctx.fill();

        // NE Wall (Right side)
        const isoR = cartToIso(i, 0);
        ctx.fillStyle = i % 4 === 0 ? '#5a5a65' : '#4a4a55';
        ctx.beginPath();
        ctx.moveTo(isoR.x + ISO_TILE_W / 2, isoR.y + ISO_TILE_H / 2);
        ctx.lineTo(isoR.x + ISO_TILE_W / 2, isoR.y + ISO_TILE_H / 2 - wallH);
        ctx.lineTo(isoR.x, isoR.y - wallH);
        ctx.lineTo(isoR.x, isoR.y);
        ctx.closePath(); ctx.fill();

        // Window Details
        if (i === 3 || i === 8 || i === 12 || i === 15) {
            // NW Window
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.moveTo(isoL.x - 25, isoL.y - 65);
            ctx.lineTo(isoL.x - 5, isoL.y - 55);
            ctx.lineTo(isoL.x - 5, isoL.y - 25);
            ctx.lineTo(isoL.x - 25, isoL.y - 35);
            ctx.closePath(); ctx.fill();

            // NE Window
            ctx.fillStyle = '#1e3a8a';
            ctx.beginPath();
            ctx.moveTo(isoR.x + 25, isoR.y - 65);
            ctx.lineTo(isoR.x + 5, isoR.y - 55);
            ctx.lineTo(isoR.x + 5, isoR.y - 25);
            ctx.lineTo(isoR.x + 25, isoR.y - 35);
            ctx.closePath(); ctx.fill();
        }
    }

    const drawables = [];
    for (const f of furniture) {
        const spr = FURN_SPRITES[f.type];
        if (!spr) continue;
        const iso = cartToIso(f.col, f.row);
        drawables.push({
            kind: 'f', sprite: spr,
            x: iso.x - spr.width / 2,
            y: iso.y + ISO_TILE_H - spr.height,
            zY: f.col + f.row
        });
    }
    for (const ch of AGENTS) {
        const spr = getCharSprite(ch);
        if (!spr) continue;
        const iso = cartToIso(ch.x, ch.y);
        const sy = ch.fsmState === ST.TYPE ? iso.y - 28 + SITTING_OFFSET : iso.y - 28;
        drawables.push({
            kind: 'c', agent: ch, sprite: spr,
            x: iso.x - 15, y: sy,
            zY: ch.x + ch.y
        });
    }
    // Sort by Z (sum of col and row) for correct isometric overlap
    drawables.sort((a, b) => a.zY - b.zY);

    for (const d of drawables) {
        if (d.kind === 'c') {
            const a = d.agent;
            const iso = cartToIso(a.x, a.y);
            if (a.state === 'working' || a.fsmState === ST.TYPE) {
                const gr = 20 + Math.sin(globalTick * 0.1) * 5;
                const grad = ctx.createRadialGradient(iso.x, iso.y + 16, 0, iso.x, iso.y + 16, gr);
                grad.addColorStop(0, a.glowColor + '0.25)');
                grad.addColorStop(1, a.glowColor + '0)');
                ctx.fillStyle = grad;
                ctx.fillRect(iso.x - gr, iso.y + 16 - gr, gr * 2, gr * 2);

                if (a.state === 'working' && globalTick % 3 === 0) {
                    spawnParticles(a, 2);
                }
            }
        }
        ctx.drawImage(d.sprite, d.x, d.y);
    }

    if (pipelineRunning) drawConnections();
    drawRoomLabels(ctx);
    drawParticles();
    for (const ch of AGENTS) drawNameLabel(ctx, ch);
    for (const ch of AGENTS) { if (ch.bubble) drawBubble(ctx, ch); }

    if (!pipelineRunning && activeAgentIdx >= AGENTS.length) {
        ctx.fillStyle = 'rgba(7,7,16,0.9)';
        roundRect(ctx, W / 2 - 130, H / 2 - 35, 260, 70, 10); ctx.fill();
        ctx.strokeStyle = '#43e97b'; ctx.lineWidth = 3;
        roundRect(ctx, W / 2 - 130, H / 2 - 35, 260, 70, 10); ctx.stroke();
        ctx.fillStyle = '#43e97b';
        ctx.font = 'bold 14px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('MISSION COMPLETE!', W / 2, H / 2 + 6);
        ctx.font = '10px "Press Start 2P"'; ctx.fillStyle = '#a0a0c0';
        ctx.fillText('Ready for Deploy', W / 2, H / 2 + 28);
        ctx.textAlign = 'left';
    }
}

// ─── Game Loop ───

function loop(timestamp) {
    const dt = lastFrameTime === 0 ? 0 : Math.min((timestamp - lastFrameTime) / 1000, MAX_DT);
    lastFrameTime = timestamp;
    globalTick++;
    for (const ch of AGENTS) updateCharacter(ch, dt);
    updateParticles();
    draw();
    requestAnimationFrame(loop);
}
