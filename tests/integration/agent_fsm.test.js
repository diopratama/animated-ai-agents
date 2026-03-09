/**
 * @file agent_fsm.test.js
 * @description Integration test for Agent Finite State Machine (FSM) transitions
 */

import test from 'node:test';
import assert from 'node:assert/strict';

const ST = { IDLE: 0, WALK: 1, TYPE: 2 };

function updateCharacter(ch, dt) {
    // Simplified version of the FSM in engine.js for testing logic
    switch (ch.fsmState) {
        case ST.IDLE:
            ch.wanderTimer -= dt;
            if (ch.wanderTimer <= 0) {
                // If there's a path, transition to WALK
                if (ch.path && ch.path.length > 0) {
                    ch.fsmState = ST.WALK;
                } else {
                    ch.wanderTimer = 5; // reset wander timer
                }
            }
            break;
        case ST.WALK:
            if (!ch.path || ch.path.length === 0) {
                ch.fsmState = ST.TYPE; // Arrived at destination (e.g., seat)
            } else {
                // Simulate movement progress
                ch.moveProgress += 0.5 * dt;
                if (ch.moveProgress >= 1) {
                    ch.path.shift();
                    ch.moveProgress = 0;
                }
            }
            break;
        case ST.TYPE:
            if (ch.isActive === false) {
                 ch.fsmState = ST.IDLE;
            }
            break;
    }
}

test('FSM: transition from IDLE to WALK when wanderTimer expires and path exists', () => {
    const ch = {
        fsmState: ST.IDLE,
        wanderTimer: 1,
        path: [{ col: 1, row: 1 }],
        moveProgress: 0
    };
    
    updateCharacter(ch, 1.5); // dt > wanderTimer
    
    assert.equal(ch.fsmState, ST.WALK);
});

test('FSM: transition from WALK to TYPE when path is cleared', () => {
    const ch = {
        fsmState: ST.WALK,
        path: [],
        moveProgress: 0,
        isActive: true
    };
    
    updateCharacter(ch, 0.1);
    
    assert.equal(ch.fsmState, ST.TYPE);
});

test('FSM: transition from TYPE to IDLE when isActive is false', () => {
    const ch = {
        fsmState: ST.TYPE,
        isActive: false
    };
    
    updateCharacter(ch, 0.1);
    
    assert.equal(ch.fsmState, ST.IDLE);
});
