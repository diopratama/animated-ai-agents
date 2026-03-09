/**
 * @file architecture_compliance.test.js
 * @description Verifies that the codebase complies with the architectural specifications in docs/architecture/
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Architecture Compliance: engine.js should implement cartToIso', () => {
    const enginePath = path.resolve('js/engine.js');
    const content = fs.readFileSync(enginePath, 'utf8');
    
    // Check if cartToIso function or logic exists
    const hasCartToIso = content.includes('cartToIso') || (content.includes('col - row') && content.includes('col + row'));
    
    assert.ok(hasCartToIso, 'engine.js is missing isometric coordinate transformation (cartToIso)');
});

test('Architecture Compliance: engine.js should use 64x32 tile dimensions for isometric', () => {
    const enginePath = path.resolve('js/engine.js');
    const content = fs.readFileSync(enginePath, 'utf8');
    
    // According to docs/architecture/isometric-office-system.md
    const hasIsoDimensions = content.includes('64') && content.includes('32');
    
    assert.ok(hasIsoDimensions, 'engine.js does not seem to use the specified 64x32 isometric tile dimensions');
});

test('Architecture Compliance: state.js should have ST.IDLE, ST.WALK, ST.TYPE', () => {
    const statePath = path.resolve('js/state.js');
    const content = fs.readFileSync(statePath, 'utf8');
    
    assert.ok(content.includes('ST = {'), 'state.js is missing ST constant');
    assert.ok(content.includes('IDLE'), 'state.js is missing IDLE state');
    assert.ok(content.includes('WALK'), 'state.js is missing WALK state');
    assert.ok(content.includes('TYPE'), 'state.js is missing TYPE state');
});
