import test from 'node:test';
import assert from 'node:assert/strict';

const TILE_WIDTH = 64;
const TILE_HEIGHT = 32;

function cartToIso(col, row) {
  const x = (col - row) * (TILE_WIDTH / 2);
  const y = (col + row) * (TILE_HEIGHT / 2);
  return { x, y };
}

test('cartToIso (0,0)', () => {
  const { x, y } = cartToIso(0, 0);
  assert.equal(x, 0);
  assert.equal(y, 0);
});

test('cartToIso (1,0)', () => {
  const { x, y } = cartToIso(1, 0);
  assert.equal(x, 32);
  assert.equal(y, 16);
});

test('cartToIso (0,1)', () => {
  const { x, y } = cartToIso(0, 1);
  assert.equal(x, -32);
  assert.equal(y, 16);
});

test('cartToIso (1,1)', () => {
  const { x, y } = cartToIso(1, 1);
  assert.equal(x, 0);
  assert.equal(y, 32);
});

test('cartToIso (2,1)', () => {
  const { x, y } = cartToIso(2, 1);
  assert.equal(x, 32);
  assert.equal(y, 48);
});
