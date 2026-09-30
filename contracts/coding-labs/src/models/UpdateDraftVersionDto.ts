/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LabRunnerConfigDto } from './LabRunnerConfigDto';
import type { LabTestCaseDto } from './LabTestCaseDto';
import type { ReferenceSolutionDto } from './ReferenceSolutionDto';
export type UpdateDraftVersionDto = {
    language?: 'typescript' | 'javascript';
    promptMarkdown?: string;
    hints?: Array<string>;
    starterCode?: string;
    referenceSolution?: ReferenceSolutionDto;
    sampleTests?: Array<LabTestCaseDto>;
    hiddenTests?: Array<LabTestCaseDto>;
    runner?: LabRunnerConfigDto;
    contentHash?: string;
    createdBy?: string;
    /**
     * Hash from the loaded draft; prevents stale overwrites
     */
    expectedContentHash: string;
};

