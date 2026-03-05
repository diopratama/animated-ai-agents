// ═══════════════════════════════════════════════════════
//  PIXEL ART ENGINE — Pixel Agents Style
// ═══════════════════════════════════════════════════════

const canvas = document.getElementById('pixelCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const W = canvas.width;
const H = canvas.height;
const MAP_COLS = Math.floor(W / TILE);
const MAP_ROWS = Math.floor(H / TILE);

const FLOOR_COL = {
    [TL.VOID]: '#0a0a14', [TL.WOOD]: '#8a6a42',
    [TL.BEIGE]: '#c8b898', [TL.BLUE]: '#2a4a70', [TL.CORR]: '#3a3a42',
};
const FLOOR_COL2 = {
    [TL.VOID]: '#0a0a14', [TL.WOOD]: '#7a5c38',
    [TL.BEIGE]: '#bfb090', [TL.BLUE]: '#254060', [TL.CORR]: '#343440',
};
const WALL_COL = {
    [TL.WOOD]:  { top: '#4a3020', side: '#3a2418' },
    [TL.BEIGE]: { top: '#9a8a78', side: '#8a7a6a' },
    [TL.BLUE]:  { top: '#1e3050', side: '#182840' },
    [TL.CORR]:  { top: '#2a2a30', side: '#222228' },
};

// ─── Tilemap ───

const ROOM_DEFS = [
    { col: 1,  row: 1, w: 8, h: 4, floor: TL.WOOD  },
    { col: 1,  row: 7, w: 8, h: 4, floor: TL.WOOD  },
    { col: 10, row: 1, w: 6, h: 5, floor: TL.BEIGE },
    { col: 17, row: 1, w: 5, h: 5, floor: TL.BEIGE },
    { col: 23, row: 1, w: 6, h: 5, floor: TL.BEIGE },
    { col: 23, row: 7, w: 6, h: 4, floor: TL.BLUE  },
];

function createTilemap() {
    const map = new Array(MAP_COLS * MAP_ROWS).fill(TL.CORR);
    for (const r of ROOM_DEFS) {
        for (let row = r.row; row < r.row + r.h; row++)
            for (let col = r.col; col < r.col + r.w; col++)
                if (row < MAP_ROWS && col < MAP_COLS)
                    map[row * MAP_COLS + col] = r.floor;
    }
    return map;
}
const tilemap = createTilemap();

// ─── Furniture ───

const FURN_META = {
    DESK:      { w: 2, h: 1, blocks: true  },
    BOOKSHELF: { w: 1, h: 1, blocks: true  },
    PLANT:     { w: 1, h: 1, blocks: true  },
    COOLER:    { w: 1, h: 1, blocks: true  },
    CHAIR:     { w: 1, h: 1, blocks: false },
};

const furniture = [
    { type: 'DESK', col: 2, row: 2 }, { type: 'CHAIR', col: 3, row: 3 },
    { type: 'DESK', col: 6, row: 2 }, { type: 'CHAIR', col: 7, row: 3 },
    { type: 'BOOKSHELF', col: 1, row: 1 }, { type: 'BOOKSHELF', col: 8, row: 1 },
    { type: 'PLANT', col: 1, row: 4 }, { type: 'PLANT', col: 8, row: 4 },

    { type: 'DESK', col: 2, row: 8 }, { type: 'CHAIR', col: 3, row: 9 },
    { type: 'DESK', col: 6, row: 8 }, { type: 'CHAIR', col: 7, row: 9 },
    { type: 'BOOKSHELF', col: 1, row: 7 }, { type: 'BOOKSHELF', col: 8, row: 7 },
    { type: 'PLANT', col: 1, row: 10 }, { type: 'PLANT', col: 8, row: 10 },

    { type: 'DESK', col: 12, row: 2 }, { type: 'CHAIR', col: 13, row: 3 },
    { type: 'PLANT', col: 10, row: 1 }, { type: 'PLANT', col: 15, row: 1 },

    { type: 'DESK', col: 18, row: 2 }, { type: 'CHAIR', col: 19, row: 3 },
    { type: 'PLANT', col: 17, row: 1 }, { type: 'PLANT', col: 21, row: 1 },

    { type: 'COOLER', col: 25, row: 2 },
    { type: 'PLANT', col: 23, row: 1 }, { type: 'PLANT', col: 28, row: 1 },

    { type: 'DESK', col: 24, row: 8 }, { type: 'CHAIR', col: 25, row: 9 },
    { type: 'BOOKSHELF', col: 23, row: 7 }, { type: 'BOOKSHELF', col: 28, row: 7 },
    { type: 'PLANT', col: 23, row: 10 }, { type: 'PLANT', col: 28, row: 10 },
];

const blockedTiles = new Set();
for (const f of furniture) {
    const def = FURN_META[f.type];
    if (def && def.blocks) {
        for (let r = 0; r < (def.h || 1); r++)
            for (let c = 0; c < (def.w || 1); c++)
                blockedTiles.add(`${f.col + c},${f.row + r}`);
    }
}

// ─── Character Sprite Generator ───

function spx(cx, x, y, w, h, col) {
    cx.fillStyle = col;
    cx.fillRect(x * 2, y * 2, w * 2, h * 2);
}

function drawCharShadow(cx) {
    cx.fillStyle = 'rgba(0,0,0,0.22)';
    cx.beginPath();
    cx.ellipse(16, 42, 10, 3, 0, 0, Math.PI * 2);
    cx.fill();
}

function makeFrame(drawFn) {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 48;
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
            spx(cx, 3, 0, 10, 3, p.hair);
            spx(cx, 3, 2, 10, 7, p.skin);
            spx(cx, 3, 0, 10, 4, p.hair);
            spx(cx, 5, 5, 2, 2, '#FFF'); spx(cx, 9, 5, 2, 2, '#FFF');
            spx(cx, 6, 5, 1, 1, '#222'); spx(cx, 10, 5, 1, 1, '#222');
            spx(cx, 6, 9, 4, 1, p.skin);
            spx(cx, 3, 10, 10, 4, p.shirt);
            spx(cx, 1, 10, 2, 5, p.skin);
            spx(cx, 13, 10, 2, 5, p.skin);
            spx(cx, 5 + ls, 14, 3, 5, p.pants);
            spx(cx, 8 - ls, 14, 3, 5, p.pants);
            spx(cx, 5 + ls, 19, 3, 2, p.shoes);
            spx(cx, 8 - ls, 19, 3, 2, p.shoes);
        });
    }
    return [frame(-1), frame(0), frame(1), frame(0)];
}

function makeWalkUp(p) {
    function frame(ls) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            spx(cx, 3, 0, 10, 8, p.hair);
            spx(cx, 4, 7, 8, 2, p.skin);
            spx(cx, 3, 9, 10, 5, p.shirt);
            spx(cx, 1, 10, 2, 4, p.skin);
            spx(cx, 13, 10, 2, 4, p.skin);
            spx(cx, 5 + ls, 14, 3, 5, p.pants);
            spx(cx, 8 - ls, 14, 3, 5, p.pants);
            spx(cx, 5 + ls, 19, 3, 2, p.shoes);
            spx(cx, 8 - ls, 19, 3, 2, p.shoes);
        });
    }
    return [frame(-1), frame(0), frame(1), frame(0)];
}

function makeWalkRight(p) {
    function frame(ls) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            spx(cx, 5, 0, 7, 3, p.hair);
            spx(cx, 4, 2, 9, 7, p.skin);
            spx(cx, 4, 0, 9, 4, p.hair);
            spx(cx, 10, 5, 2, 2, '#FFF');
            spx(cx, 11, 5, 1, 1, '#222');
            spx(cx, 7, 9, 4, 1, p.skin);
            spx(cx, 4, 10, 8, 4, p.shirt);
            spx(cx, 12, 10, 2, 5, p.skin);
            spx(cx, 5, 14, 3, 5, p.pants);
            spx(cx, 8 + ls, 14, 3, 5, p.pants);
            spx(cx, 5, 19, 3, 2, p.shoes);
            spx(cx, 8 + ls, 19, 3, 2, p.shoes);
        });
    }
    return [frame(-1), frame(0), frame(1), frame(0)];
}

function makeTypeDown(p) {
    function frame(ao) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            spx(cx, 3, 0, 10, 3, p.hair);
            spx(cx, 3, 2, 10, 7, p.skin);
            spx(cx, 3, 0, 10, 4, p.hair);
            spx(cx, 5, 5, 2, 2, '#FFF'); spx(cx, 9, 5, 2, 2, '#FFF');
            spx(cx, 6, 5, 1, 1, '#222'); spx(cx, 10, 5, 1, 1, '#222');
            spx(cx, 6, 9, 4, 1, p.skin);
            spx(cx, 3, 10, 10, 4, p.shirt);
            spx(cx, 1 + ao, 12, 2, 3, p.skin);
            spx(cx, 13 - ao, 12, 2, 3, p.skin);
            spx(cx, 4, 14, 8, 3, p.pants);
            spx(cx, 4, 17, 3, 2, p.shoes);
            spx(cx, 9, 17, 3, 2, p.shoes);
        });
    }
    return [frame(0), frame(1)];
}

function makeTypeUp(p) {
    function frame(ao) {
        return makeFrame(cx => {
            drawCharShadow(cx);
            spx(cx, 3, 0, 10, 8, p.hair);
            spx(cx, 4, 7, 8, 2, p.skin);
            spx(cx, 3, 9, 10, 5, p.shirt);
            spx(cx, 1 + ao, 11, 2, 4, p.skin);
            spx(cx, 13 - ao, 11, 2, 4, p.skin);
            spx(cx, 4, 14, 8, 3, p.pants);
            spx(cx, 4, 17, 3, 2, p.shoes);
            spx(cx, 9, 17, 3, 2, p.shoes);
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
    const tr = td;
    const tl = td.map(flipCanvas);
    return {
        walk: { [DIR.DOWN]: wd, [DIR.UP]: wu, [DIR.RIGHT]: wr, [DIR.LEFT]: wl },
        type: { [DIR.DOWN]: td, [DIR.UP]: tu, [DIR.RIGHT]: tr, [DIR.LEFT]: tl },
    };
}

// ─── Furniture Sprites ───

function makeDeskSprite() {
    const c = document.createElement('canvas');
    c.width = 64; c.height = 32;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#8B6914'; cx.fillRect(0, 8, 64, 12);
    cx.fillStyle = '#A07818'; cx.fillRect(2, 10, 60, 8);
    cx.fillStyle = '#6B4E0A';
    cx.fillRect(4, 20, 6, 10); cx.fillRect(54, 20, 6, 10);
    cx.fillStyle = '#0d1b2a'; cx.fillRect(22, 0, 20, 10);
    cx.fillStyle = '#2266aa'; cx.fillRect(24, 2, 16, 6);
    cx.fillStyle = '#4facfe';
    cx.fillRect(26, 3, 8, 1); cx.fillRect(26, 5, 12, 1); cx.fillRect(26, 7, 6, 1);
    cx.fillStyle = '#333'; cx.fillRect(30, 10, 4, 4);
    return c;
}

function makeBookshelfSprite() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 48;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#5c4033'; cx.fillRect(0, 0, 32, 48);
    cx.fillStyle = '#6b5040'; cx.fillRect(2, 2, 28, 44);
    cx.fillStyle = '#5c4033';
    cx.fillRect(0, 14, 32, 3); cx.fillRect(0, 28, 32, 3);
    cx.fillStyle = '#cc4444'; cx.fillRect(4, 3, 4, 10);
    cx.fillStyle = '#4488cc'; cx.fillRect(9, 4, 4, 9);
    cx.fillStyle = '#44aa66'; cx.fillRect(14, 3, 3, 10);
    cx.fillStyle = '#aa55cc'; cx.fillRect(18, 5, 4, 8);
    cx.fillStyle = '#ccaa33'; cx.fillRect(23, 3, 4, 10);
    cx.fillStyle = '#ff8844'; cx.fillRect(4, 18, 5, 9);
    cx.fillStyle = '#5588cc'; cx.fillRect(10, 17, 4, 10);
    cx.fillStyle = '#cc6688'; cx.fillRect(15, 19, 3, 8);
    cx.fillStyle = '#66ccaa'; cx.fillRect(19, 17, 4, 10);
    cx.fillStyle = '#7a6a5a';
    cx.fillRect(5, 33, 10, 10); cx.fillRect(18, 35, 8, 8);
    return c;
}

function makePlantSprite() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#a06040'; cx.fillRect(10, 20, 12, 10);
    cx.fillStyle = '#8a5030'; cx.fillRect(8, 18, 16, 4);
    cx.fillStyle = '#2d6a4f';
    cx.beginPath(); cx.ellipse(16, 12, 10, 10, 0, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#3d8a6f';
    cx.beginPath(); cx.ellipse(12, 10, 5, 5, 0, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.ellipse(20, 8, 4, 4, 0, 0, Math.PI * 2); cx.fill();
    return c;
}

function makeCoolerSprite() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 48;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#ccc'; cx.fillRect(6, 16, 20, 28);
    cx.fillStyle = '#e0e0e0'; cx.fillRect(8, 18, 16, 24);
    cx.fillStyle = '#6699cc'; cx.fillRect(10, 0, 12, 18);
    cx.fillStyle = '#88bbee'; cx.fillRect(12, 2, 8, 14);
    cx.fillStyle = '#666'; cx.fillRect(18, 30, 6, 3);
    cx.fillStyle = '#4488cc'; cx.fillRect(24, 29, 4, 5);
    cx.fillStyle = '#999';
    cx.fillRect(8, 44, 4, 4); cx.fillRect(20, 44, 4, 4);
    return c;
}

function makeChairSprite() {
    const c = document.createElement('canvas');
    c.width = 32; c.height = 32;
    const cx = c.getContext('2d');
    cx.imageSmoothingEnabled = false;
    cx.fillStyle = '#4a3060'; cx.fillRect(6, 10, 20, 16);
    cx.fillStyle = '#5a4070'; cx.fillRect(8, 12, 16, 12);
    cx.fillStyle = '#4a3060'; cx.fillRect(8, 4, 16, 8);
    cx.fillStyle = '#3a2050'; cx.fillRect(10, 6, 12, 4);
    cx.fillStyle = '#333';
    cx.fillRect(6, 26, 4, 4); cx.fillRect(22, 26, 4, 4);
    cx.fillRect(6, 10, 4, 4); cx.fillRect(22, 10, 4, 4);
    return c;
}

const FURN_SPRITES = {
    DESK: makeDeskSprite(), BOOKSHELF: makeBookshelfSprite(),
    PLANT: makePlantSprite(), COOLER: makeCoolerSprite(), CHAIR: makeChairSprite(),
};

// ─── BFS Pathfinding ───

function isWalkable(col, row, blocked) {
    if (col < 0 || row < 0 || col >= MAP_COLS || row >= MAP_ROWS) return false;
    if (tilemap[row * MAP_COLS + col] === TL.VOID) return false;
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
    for (let r = 0; r < MAP_ROWS; r++)
        for (let c = 0; c < MAP_COLS; c++)
            if (isWalkable(c, r, blocked)) tiles.push({ col: c, row: r });
    const far = tiles.filter(t => Math.abs(t.col - curC) + Math.abs(t.row - curR) > 3);
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
                ch.x = ch.tileCol * TILE; ch.y = ch.tileRow * TILE;
                ch.path.shift(); ch.moveProgress = 0;
                if (ch.isActive && ch.seatCol != null && !(ch.tileCol === ch.seatCol && ch.tileRow === ch.seatRow)) {
                    const ub = new Set(blockedTiles);
                    ub.delete(`${ch.seatCol},${ch.seatRow}`);
                    ch.path = findPath(ch.tileCol, ch.tileRow, ch.seatCol, ch.seatRow, ub);
                }
            } else {
                const fx = ch.tileCol * TILE, fy = ch.tileRow * TILE;
                const tx = next.col * TILE, ty = next.row * TILE;
                ch.x = fx + (tx - fx) * ch.moveProgress;
                ch.y = fy + (ty - fy) * ch.moveProgress;
            }
            break;
        }
    }
}

// ─── Init ───

function initAgents() {
    AGENTS.forEach(a => {
        a.sprites = makeCharSprites(PALETTES[a.paletteIdx]);
        a.x = a.tileCol * TILE;
        a.y = a.tileRow * TILE;
    });
}

// ─── Particles ───

function spawnParticles(agent, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        particles.push({
            x: agent.x + 16, y: agent.y + 8,
            vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1,
            life: 1, decay: 0.015 + Math.random() * 0.02,
            color: agent.color, size: 2 + Math.random() * 3,
        });
    }
}

function updateParticles() {
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.04; p.life -= p.decay; });
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
    const fx = from.x + 16, fy = from.y + 16, tx = to.x + 16, ty = to.y + 16;
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
    const cx = agent.x + 16, cy = agent.y - 16;
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
    const cx = agent.x + 16;
    const footY = agent.fsmState === ST.TYPE ? agent.y + SITTING_OFFSET + 16 : agent.y + 32;

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

function draw() {
    ctx.fillStyle = '#0a0a14';
    ctx.fillRect(0, 0, W, H);

    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            const t = tilemap[r * MAP_COLS + c];
            if (t === TL.VOID) continue;
            ctx.fillStyle = (c + r) % 2 === 0 ? FLOOR_COL[t] : FLOOR_COL2[t];
            ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
        }
    }

    for (const rm of ROOM_DEFS) {
        const wc = WALL_COL[rm.floor] || WALL_COL[TL.CORR];
        const sx = rm.col * TILE, sy = rm.row * TILE;
        const sw = rm.w * TILE, sh = rm.h * TILE;
        ctx.fillStyle = wc.top;
        ctx.fillRect(sx, sy, sw, 4);
        ctx.fillStyle = wc.side;
        ctx.fillRect(sx, sy, 3, sh);
        ctx.fillRect(sx + sw - 3, sy, 3, sh);
        ctx.fillRect(sx, sy + sh - 3, sw, 3);
    }

    const drawables = [];
    for (const f of furniture) {
        const spr = FURN_SPRITES[f.type];
        if (!spr) continue;
        drawables.push({ kind: 'f', sprite: spr, x: f.col * TILE, y: f.row * TILE, zY: f.row * TILE + spr.height });
    }
    for (const ch of AGENTS) {
        const spr = getCharSprite(ch);
        if (!spr) continue;
        const sy = ch.fsmState === ST.TYPE ? ch.y - 16 + SITTING_OFFSET : ch.y - 16;
        drawables.push({ kind: 'c', agent: ch, sprite: spr, x: ch.x, y: sy, zY: ch.y + TILE + 0.5 });
    }
    drawables.sort((a, b) => a.zY - b.zY);

    for (const d of drawables) {
        if (d.kind === 'c') {
            const a = d.agent;
            if (a.state === 'working' || a.fsmState === ST.TYPE) {
                const gr = 20 + Math.sin(globalTick * 0.1) * 5;
                const grad = ctx.createRadialGradient(a.x + 16, a.y + 24, 0, a.x + 16, a.y + 24, gr);
                grad.addColorStop(0, a.glowColor + '0.3)');
                grad.addColorStop(1, a.glowColor + '0)');
                ctx.fillStyle = grad;
                ctx.fillRect(a.x + 16 - gr, a.y + 24 - gr, gr * 2, gr * 2);
            }
        }
        ctx.drawImage(d.sprite, d.x, d.y);
    }

    if (pipelineRunning) drawConnections();
    drawParticles();
    for (const ch of AGENTS) drawNameLabel(ctx, ch);
    for (const ch of AGENTS) { if (ch.bubble) drawBubble(ctx, ch); }

    if (!pipelineRunning && activeAgentIdx >= AGENTS.length) {
        ctx.fillStyle = 'rgba(7,7,16,0.75)';
        roundRect(ctx, W / 2 - 120, H / 2 - 30, 240, 60, 10); ctx.fill();
        ctx.strokeStyle = '#43e97b'; ctx.lineWidth = 2;
        roundRect(ctx, W / 2 - 120, H / 2 - 30, 240, 60, 10); ctx.stroke();
        ctx.fillStyle = '#43e97b';
        ctx.font = 'bold 14px "Press Start 2P"'; ctx.textAlign = 'center';
        ctx.fillText('BUILD DONE!', W / 2, H / 2 + 6);
        ctx.font = '11px Inter'; ctx.fillStyle = '#a0a0c0';
        ctx.fillText('Ready to ship', W / 2, H / 2 + 24);
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
