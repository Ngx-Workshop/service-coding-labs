/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LabRunnerConfigDto } from './LabRunnerConfigDto';
import type { LabTestCaseDto } from './LabTestCaseDto';
import type { ReferenceSolutionDto } from './ReferenceSolutionDto';
export type HandsOnLabVersionMongo = {
    _id: string;
    labId: string;
    versionNumber: number;
    isDraft: boolean;
    language: 'typescript' | 'javascript';
    promptMarkdown: string;
    hints?: Array<string>;
    starterCode: string;
    referenceSolution?: ReferenceSolutionDto;
    sampleTests: Array<LabTestCaseDto>;
    hiddenTests: Array<LabTestCaseDto>;
    runner: LabRunnerConfigDto;
    publishedAt?: string;
    publishedBy?: string;
    createdAt: string;
    createdBy: string;
    contentHash?: string;
};

