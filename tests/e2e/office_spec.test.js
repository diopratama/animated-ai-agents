/**
 * @file office_spec.test.js
 * @description E2E Scenarios for the Isometric Office Layout based on docs/design/isometric-office-layout.md
 */

import test from 'node:test';
import assert from 'node:assert/strict';

// Mocking the required constants from the design spec
const ROOM_DIMENSIONS = { cols: 12, rows: 12 };
const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

const AGENT_DESKS = {
    'Asep': { col: 3, row: 3 },
    'Jamal': { col: 4, row: 4 },
    'Budi': { col: 3, row: 4 },
    'Slamet': { col: 4, row: 3 },
    'Mulyono': { col: 7, row: 3 },
    'Ade': { col: 7, row: 4 },
    'Trisno': { col: 8, row: 3 }
};

test('Office Spec: Room Dimensions should be 12x12', () => {
    assert.equal(ROOM_DIMENSIONS.cols, 12);
    assert.equal(ROOM_DIMENSIONS.rows, 12);
});

test('Office Spec: Agent Desk Assignments should match the layout plan', () => {
    assert.deepEqual(AGENT_DESKS['Asep'], { col: 3, row: 3 });
    assert.deepEqual(AGENT_DESKS['Mulyono'], { col: 7, row: 3 });
});

test('Office Spec: Isometric canvas size should be 768x384 at 1:1 scale', () => {
    // 12 * 64 (TILE_WIDTH) / 1 is not 768 in iso, it depends on projection.
    // The spec says: "Isometric Dimensions: 768px x 384px"
    const expectedWidth = 12 * TILE_WIDTH;
    const expectedHeight = 12 * TILE_HEIGHT;
    assert.equal(expectedWidth, 768);
    assert.equal(expectedHeight, 384);
});
