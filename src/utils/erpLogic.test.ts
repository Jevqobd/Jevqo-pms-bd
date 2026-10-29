/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateOrderTotals,
  calculateFabricConsumption,
  canTransitionStage,
  getStageLocation,
  parseRosterInput,
} from './erpLogic.ts';

test('calculateOrderTotals accurately computes totals, due balance and status', () => {
  const result = calculateOrderTotals(50, 15, 300, true);
  assert.equal(result.totalQuantity, 50);
  assert.equal(result.totalAmount, 750);
  assert.equal(result.advanceAmount, 300);
  assert.equal(result.dueAmount, 450);
  assert.equal(result.paymentStatus, 'verified');

  // Full payment test
  const fullResult = calculateOrderTotals(20, 25, 500, false);
  assert.equal(fullResult.paymentStatus, 'paid_in_full');
  assert.equal(fullResult.dueAmount, 0);

  // Unverified advance
  const pendingResult = calculateOrderTotals(10, 20, 100, false);
  assert.equal(pendingResult.paymentStatus, 'pending');
});

test('calculateFabricConsumption computes correct meterage, paper and ink', () => {
  const sizes = { S: 5, M: 10, L: 15, XL: 10 };
  const reqs = calculateFabricConsumption(sizes);

  assert.ok(reqs.fabricMeters > 40, 'Fabric meters should be calculated with waste margin');
  assert.ok(reqs.transferPaperMeters >= reqs.fabricMeters, 'Paper meters must cover fabric');
  assert.ok(reqs.inkEstimatedMl > 0, 'Ink estimate must be positive');
  assert.equal(reqs.suggestedRollCount, 1);
});

test('stage location mapping assigns correct physical factory', () => {
  assert.equal(getStageLocation('draft'), 'head_office');
  assert.equal(getStageLocation('paper_printed'), 'print_factory');
  assert.equal(getStageLocation('fabric_dispatched'), 'dispatched');
  assert.equal(getStageLocation('cutting_sewing'), 'sewing_factory');
});

test('canTransitionStage enforces department role boundaries', () => {
  // Super Admin can do any transition
  assert.equal(canTransitionStage('paper_printed', 'heat_press_done', 'owner'), true);

  // Print Factory can do print -> heat press
  assert.equal(canTransitionStage('paper_printed', 'heat_press_done', 'print_factory'), true);

  // Print Factory cannot bypass to sewing cutting
  assert.equal(canTransitionStage('paper_printed', 'cutting_sewing', 'print_factory'), false);

  // Sewing Factory can receive fabric
  assert.equal(canTransitionStage('fabric_dispatched', 'fabric_received', 'sewing_factory'), true);
});

test('parseRosterInput correctly parses jersey lines into players and size breakdown', () => {
  const sample = `
    10 - Lionel Messi - L
    7 | CR7 | M
    #8 Bruno Fernandes XL
    Neymar Jr 10 L
  `;
  const parsed = parseRosterInput(sample);
  assert.equal(parsed.roster.length, 4);
  assert.equal(parsed.sizeBreakdown.L, 2);
  assert.equal(parsed.sizeBreakdown.M, 1);
  assert.equal(parsed.sizeBreakdown.XL, 1);
  assert.equal(parsed.roster[0].name, 'Lionel Messi');
  assert.equal(parsed.roster[0].number, '10');
  assert.equal(parsed.roster[0].size, 'L');
});
