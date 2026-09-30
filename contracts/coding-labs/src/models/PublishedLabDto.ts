/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LabTestCaseDto } from './LabTestCaseDto';
export type PublishedLabDto = {
    labId: string;
    versionId: string;
    versionNumber: number;
    title: string;
    difficulty?: 'intro' | 'easy' | 'medium' | 'hard';
    language: 'javascript' | 'typescript';
    promptMarkdown: string;
    hints: Array<string>;
    starterCode: string;
    sampleTests: Array<LabTestCaseDto>;
    entryFnName?: string;
};

