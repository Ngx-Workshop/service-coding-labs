// hands_on_labs collection
export type ObjectIdString = string;

export type LabStatus = 'draft' | 'published' | 'archived';

export interface HandsOnLab {
  _id: ObjectIdString;

  // ownership / scoping
  workshopId: ObjectIdString; // which workshop this belongs to
  workshopDocumentGroupId?: ObjectIdString; // if you scope labs to a doc group

  // identity
  slug: string; // unique per workshopId (recommended)
  title: string;
  summary?: string;

  // categorization
  tags: string[];
  difficulty?: 'intro' | 'easy' | 'medium' | 'hard';
  estimatedMinutes?: number;

  // state
  status: LabStatus;

  // version pointers
  currentDraftVersionId?: ObjectIdString; // what admin is editing right now
  latestPublishedVersionId?: ObjectIdString; // what learners should get by default

  // audit
  createdAt: string; // ISO
  createdBy: ObjectIdString;
  updatedAt: string; // ISO
  updatedBy: ObjectIdString;

  archivedAt?: string;
  archivedBy?: ObjectIdString;
}
// hands_on_labs collection END

// hands_on_lab_versions collection
export type LabLanguage = 'typescript' | 'javascript'; // expand later

export type TestKind = 'io' | 'unit';

export type ComparatorKind =
  | 'deepEqual'
  | 'strictEqual'
  | 'numberTolerance'
  | 'stringNormalized'
  | 'custom';

export interface LabRunnerConfig {
  timeoutMs: number; // e.g. 2000
  memoryMb?: number; // if your runner supports it
  entryFnName?: string; // for IO-style: function to call (e.g. "solve" or "twoSum")
  nodeVersion?: string; // if relevant to your runner infra
}

export interface LabIOTestCase {
  _id: ObjectIdString;

  name: string;
  kind: 'io';

  // inputs & expected are JSON so you can support arrays/objects/etc.
  input: unknown;
  expected: unknown;

  comparator: {
    kind: ComparatorKind;
    // for numberTolerance
    tolerance?: number;
    // for stringNormalized
    normalizeWhitespace?: boolean;
    ignoreCase?: boolean;
    // for custom comparator (runner-defined)
    customComparatorId?: string;
  };
}

export interface LabUnitTestCase {
  _id: ObjectIdString;

  name: string;
  kind: 'unit';

  // test code, e.g. Jest/Vitest style
  testCode: string;

  framework?: 'jest' | 'vitest'; // optional if you only support one
}

export type LabTestCase = LabIOTestCase | LabUnitTestCase;

export interface HandsOnLabVersion {
  _id: ObjectIdString;

  labId: ObjectIdString;
  versionNumber: number; // 1,2,3...
  isDraft: boolean; // draft vs published version doc

  // content
  language: LabLanguage;

  promptMarkdown: string;
  hints?: string[]; // tiered hints

  starterCode: string;

  // optional publisher-only reference solution
  referenceSolution?: {
    code: string;
    notesMarkdown?: string;
  };

  // tests
  sampleTests: LabTestCase[]; // visible to learners
  hiddenTests: LabTestCase[]; // only used on submit/publish validation

  runner: LabRunnerConfig;

  // publishing
  publishedAt?: string;
  publishedBy?: ObjectIdString;

  // audit
  createdAt: string;
  createdBy: ObjectIdString;

  // optional: hash so you can detect identical versions
  contentHash?: string;
}
// hands_on_lab_versions collection END

// hands_on_lab_embeds collection
export interface HandsOnLabEmbedRef {
  _id: ObjectIdString;

  labId: ObjectIdString;
  workshopId: ObjectIdString;

  // where the lab is embedded
  workshopDocumentId: ObjectIdString;
  blockId: string; // Editor.js block id
  blockType: 'handsOnLab';

  // pin info (if pinned)
  pinnedVersionId?: ObjectIdString;

  // audit
  createdAt: string;
  createdBy: ObjectIdString;
}
// hands_on_lab_embeds collection END

// hands_on_lab_attempts collection
export type AttemptMode = 'run' | 'submit';

export interface LabTestResult {
  testId: ObjectIdString;
  name: string;
  kind: TestKind;

  passed: boolean;
  durationMs?: number;

  // store minimal info for learners; keep full logs separately if needed
  errorMessage?: string;
  expectedPreview?: unknown;
  actualPreview?: unknown;
}

export interface HandsOnLabAttempt {
  _id: ObjectIdString;

  labId: ObjectIdString;
  labVersionId: ObjectIdString; // pinned to the version they attempted
  workshopId: ObjectIdString;

  userId: ObjectIdString;

  mode: AttemptMode;
  language: LabLanguage;

  code: string;

  results: {
    passed: boolean;
    totalTests: number;
    passedTests: number;
    durationMs?: number;
    testResults: LabTestResult[];
  };

  createdAt: string;
}
// hands_on_lab_attempts collection END
