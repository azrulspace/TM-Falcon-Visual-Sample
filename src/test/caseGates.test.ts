import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isVerificationSaved,
  isFindingsSubmitted,
  isFindingsDraftSaved,
  isClosureFormComplete,
  getClosureGates,
  areClosureGatesMet,
  getCaseTabState,
} from '../lib/caseGates.ts';
import type { FalconCase } from '../types/cases.ts';

const baseMockCase: FalconCase = {
  id: 'CAS-0007',
  sourceEventId: 'EVT-0257',
  title: 'Incident on CBL-005: Monkey near cable',
  status: 'Open',
  assignee: null,
  assigneeType: 'unassigned',
  createdAt: '2026-10-21T10:11:00+08:00',
  lastUpdatedAt: '2026-10-21T10:11:00+08:00',
  closedAt: null,
  verification: {
    checkedItems: [],
    notes: '',
  },
  fieldFindings: {
    findingsSummary: '',
    equipmentUsed: '',
    actionTaken: '',
    photos: [],
  },
  closure: {
    rootCause: '',
    resolutionNotes: '',
    followUpRequired: false,
  },
  activities: [
    {
      id: 'act-7-1',
      type: 'created',
      text: 'Created from EVT-0257',
      actor: 'Admin',
      timestamp: '2026-10-21T10:11:00+08:00',
    },
  ],
};

test('caseGates: isVerificationSaved evaluates truthfully from saved timestamps only', () => {
  assert.equal(isVerificationSaved(baseMockCase), false);

  const savedCase: FalconCase = {
    ...baseMockCase,
    verification: {
      ...baseMockCase.verification,
      lastSavedAt: '2026-10-21T11:00:00+08:00',
      lastSavedBy: 'Ahmad Syukri',
      verifiedBy: 'Ahmad Syukri',
    },
  };
  assert.equal(isVerificationSaved(savedCase), true);
});

test('caseGates: isFindingsSubmitted requires explicit submission', () => {
  assert.equal(isFindingsSubmitted(baseMockCase), false);

  // Draft save does not equal submitted
  const draftCase: FalconCase = {
    ...baseMockCase,
    fieldFindings: {
      ...baseMockCase.fieldFindings,
      findingsSummary: 'Inspected pole AST-002, bracket secured.',
      lastSavedAt: '2026-10-21T11:30:00+08:00',
    },
  };
  assert.equal(isFindingsSubmitted(draftCase), false);
  assert.equal(isFindingsDraftSaved(draftCase), true);

  const submittedCase: FalconCase = {
    ...baseMockCase,
    fieldFindings: {
      ...baseMockCase.fieldFindings,
      findingsSummary: 'Inspected pole AST-002, bracket secured.',
      isSubmitted: true,
      submittedBy: 'Zulhilmi',
      submittedAt: '2026-10-21T11:45:00+08:00',
    },
  };
  assert.equal(isFindingsSubmitted(submittedCase), true);
  assert.equal(isFindingsDraftSaved(submittedCase), false);
});

test('caseGates: isClosureFormComplete requires both root cause and resolution summary', () => {
  assert.equal(isClosureFormComplete(null), false);
  assert.equal(isClosureFormComplete({ rootCause: '', resolutionNotes: '' }), false);
  assert.equal(isClosureFormComplete({ rootCause: 'Wildlife disturbance', resolutionNotes: '' }), false);
  assert.equal(
    isClosureFormComplete({
      rootCause: 'Wildlife disturbance',
      resolutionNotes: 'Secured cable ties and cleared monkey interference.',
    }),
    true
  );
});

test('caseGates: getClosureGates returns 3 gates with reasons and link target tabs', () => {
  const gates = getClosureGates(baseMockCase);
  assert.equal(gates.length, 3);
  assert.equal(gates[0].id, 'verification');
  assert.equal(gates[0].passed, false);
  assert.equal(gates[0].tabKey, 'verification');

  assert.equal(gates[1].id, 'findings');
  assert.equal(gates[1].passed, false);
  assert.equal(gates[1].tabKey, 'field_findings');

  assert.equal(gates[2].id, 'closure_fields');
  assert.equal(gates[2].passed, false);
  assert.equal(gates[2].tabKey, 'closure');

  assert.equal(areClosureGatesMet(baseMockCase), false);
});

test('caseGates: areClosureGatesMet passes only when all prerequisites are met', () => {
  const readyCase: FalconCase = {
    ...baseMockCase,
    verification: {
      lastSavedAt: '2026-10-21T11:00:00+08:00',
      verifiedBy: 'Ahmad Syukri',
      passCriteria: true,
    },
    fieldFindings: {
      findingsSummary: 'Bracket tightened',
      isSubmitted: true,
      submittedBy: 'Zulhilmi',
      submittedAt: '2026-10-21T11:45:00+08:00',
    },
    closure: {
      rootCause: 'Wildlife disturbance',
      resolutionNotes: 'Hardware reinforced.',
      followUpRequired: false,
    },
  };

  assert.equal(areClosureGatesMet(readyCase), true);
});

test('caseGates: getCaseTabState maps tab states with truthful text and icons', () => {
  // 1. Overview: no chip
  assert.equal(getCaseTabState('overview', baseMockCase).label, null);

  // 2. Verification: unverified vs verified
  assert.equal(getCaseTabState('verification', baseMockCase).label, 'Not verified');
  const verifiedCase: FalconCase = {
    ...baseMockCase,
    verification: {
      lastSavedAt: '2026-10-21T11:00:00+08:00',
      verifiedBy: 'Ahmad Syukri',
    },
  };
  assert.equal(getCaseTabState('verification', verifiedCase).label, 'Verified by Ahmad Syukri');

  // 3. Field findings: Not submitted -> Draft saved -> Submitted
  assert.equal(getCaseTabState('field_findings', baseMockCase).label, 'Not submitted');
  const draftCase: FalconCase = {
    ...baseMockCase,
    fieldFindings: {
      findingsSummary: 'Inspecting cable',
      lastSavedAt: '2026-10-21T11:20:00+08:00',
    },
  };
  assert.equal(getCaseTabState('field_findings', draftCase).label, 'Draft saved');
  const submittedCase: FalconCase = {
    ...baseMockCase,
    fieldFindings: {
      findingsSummary: 'Cable cleared',
      isSubmitted: true,
      submittedBy: 'Farhan Malik',
      submittedAt: '2026-10-21T11:50:00+08:00',
    },
  };
  assert.equal(getCaseTabState('field_findings', submittedCase).label, 'Submitted by Farhan Malik');

  // 4. Closure: Not ready -> Ready to close -> Closed
  assert.equal(getCaseTabState('closure', baseMockCase).label, 'Not ready');
  const closedCase: FalconCase = {
    ...baseMockCase,
    status: 'Closed',
    closedAt: '2026-10-21T12:00:00+08:00',
  };
  assert.equal(getCaseTabState('closure', closedCase).label, 'Closed');

  // 5. Activity: entry count
  assert.equal(getCaseTabState('activity', baseMockCase).label, '1');
});

test('caseGates: closure tab state shows Ready to close when prerequisites pass', () => {
  const readyCase: FalconCase = {
    ...baseMockCase,
    verification: {
      lastSavedAt: '2026-10-21T11:00:00+08:00',
      verifiedBy: 'Ahmad Syukri',
      passCriteria: true,
    },
    fieldFindings: {
      findingsSummary: 'Cable cleared and bracket restored.',
      isSubmitted: true,
      submittedBy: 'Zulhilmi',
      submittedAt: '2026-10-21T11:30:00+08:00',
    },
  };

  assert.equal(getCaseTabState('closure', readyCase).label, 'Ready to close');
  assert.equal(getCaseTabState('closure', readyCase).variant, 'success');
});

