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
  calculatePrintConsumptionDefaults,
  parseBulkDelimitedText,
  canUserSwitchRole,
  canUserSendPrivateMessage,
  canUserViewChatMessage,
  extractMentionedEmployees,
} from './erpLogic.ts';
import { getTranslation, formatBdt } from './translations.ts';

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

test('calculatePrintConsumptionDefaults computes meters, fabric kg, heat press, ribbon and collars', () => {
  const res = calculatePrintConsumptionDefaults(30, 160);
  assert.equal(res.heatPressJerseyCount, 30);
  assert.equal(res.collarUsedPcs, 30);
  assert.equal(res.fabricUsedMeters, 40.5);
  assert.ok(res.printedMeters > res.fabricUsedMeters);
  assert.ok(res.fabricUsedKg > 10);
  assert.equal(res.ribbonUsedMeters, 13.5);
  assert.ok(res.ribbonUsedKg > 0.3);
});

test('parseBulkDelimitedText parses CSV and TSV rows accurately for bulk import', () => {
  const csv = `clientName,teamOrClub,totalQuantity,unitPrice\n"Dhaka Gladiators","Gladiators XI",25,18\n"Chittagong Kings","Kings FC",40,16.5`;
  const parsed = parseBulkDelimitedText(csv);
  assert.deepEqual(parsed.headers, ['clientName', 'teamOrClub', 'totalQuantity', 'unitPrice']);
  assert.equal(parsed.rows.length, 2);
  assert.equal(parsed.rows[0].clientName, 'Dhaka Gladiators');
  assert.equal(parsed.rows[1].totalQuantity, '40');
});

test('canUserSwitchRole strictly allows ONLY Owner and Manager to switch roles', () => {
  assert.equal(canUserSwitchRole('owner'), true);
  assert.equal(canUserSwitchRole('hr_manager'), true);
  assert.equal(canUserSwitchRole('marketing'), false);
  assert.equal(canUserSwitchRole('accountant'), false);
  assert.equal(canUserSwitchRole('print_factory'), false);
  assert.equal(canUserSwitchRole('sewing_factory'), false);
  assert.equal(canUserSwitchRole('floor_worker'), false);
});

test('canUserSendPrivateMessage allows Owner, Manager and Department Heads to send private messages', () => {
  assert.equal(canUserSendPrivateMessage('owner'), true);
  assert.equal(canUserSendPrivateMessage('hr_manager'), true);
  assert.equal(canUserSendPrivateMessage('accountant'), true);
  assert.equal(canUserSendPrivateMessage('floor_worker'), false);
});

test('canUserViewChatMessage enforces strict privacy for personal/invoice messages', () => {
  const privateInvoiceMsg = {
    isPrivate: true,
    senderEmployeeId: 'emp-1',
    senderName: 'Ridwanul Haque',
    recipientEmployeeIds: ['emp-10'],
    recipientEmployeeNames: ['Tanvir Mahmud'],
    mentionedEmployeeIds: ['emp-2'],
    mentionedEmployeeNames: ['Asifur Rahman'],
    relatedInvoiceAssignedEmployeeId: 'emp-10',
  };

  // Sender can view
  assert.equal(
    canUserViewChatMessage(privateInvoiceMsg, {
      employeeId: 'emp-1',
      employeeName: 'Ridwanul Haque',
      role: 'owner',
    }),
    true
  );

  // Direct recipient can view
  assert.equal(
    canUserViewChatMessage(privateInvoiceMsg, {
      employeeId: 'emp-10',
      employeeName: 'Tanvir Mahmud',
      role: 'accountant',
    }),
    true
  );

  // @Mentioned employee can view
  assert.equal(
    canUserViewChatMessage(privateInvoiceMsg, {
      employeeId: 'emp-2',
      employeeName: 'Asifur Rahman',
      role: 'marketing',
    }),
    true
  );

  // Unrelated employee MUST NOT view private personal/invoice message
  assert.equal(
    canUserViewChatMessage(privateInvoiceMsg, {
      employeeId: 'emp-6',
      employeeName: 'Kabir Hossain',
      role: 'floor_worker',
    }),
    false
  );
  assert.equal(
    canUserViewChatMessage(privateInvoiceMsg, {
      employeeId: 'emp-7',
      employeeName: 'Selim Mia',
      role: 'sewing_factory',
    }),
    false
  );
});

test('extractMentionedEmployees resolves @Employee_Name tokens to staff IDs and names', () => {
  const roster = [
    { id: 'emp-1', name: 'Ridwanul Haque' },
    { id: 'emp-10', name: 'Tanvir Mahmud' },
    { id: 'emp-5', name: 'Mizanur Rahman' },
  ];
  const res = extractMentionedEmployees(
    'Please check invoice #INV-2026-891 @Tanvir_Mahmud and confirm print roll with @Mizanur_Rahman',
    roster
  );
  assert.deepEqual(res.map((e) => e.id), ['emp-10', 'emp-5']);
  assert.deepEqual(res.map((e) => e.name), ['Tanvir Mahmud', 'Mizanur Rahman']);
});

test('getTranslation returns strictly clean English and formatBdt formats in BDT (৳)', () => {
  assert.equal(getTranslation('navDashboardTasks', 'en'), 'Dashboard & Tasks');
  assert.equal(getTranslation('navDashboardTasks', 'bn'), 'Dashboard & Tasks');
  assert.equal(formatBdt(12500), '৳12,500');
});
