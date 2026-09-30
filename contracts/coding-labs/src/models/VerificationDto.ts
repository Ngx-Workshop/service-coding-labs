/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { TestResultDto } from './TestResultDto';
export type VerificationDto = {
    passed: boolean;
    contentHash: string;
    totalTests: number;
    passedTests: number;
    durationMs: number;
    results: Array<TestResultDto>;
};

