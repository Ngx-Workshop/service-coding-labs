/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TestResultDto = {
    name: string;
    suite: 'sample' | 'hidden';
    status: 'passed' | 'failed' | 'error' | 'timeout';
    durationMs: number;
    actual?: (string | number | boolean | Record<string, any>) | null;
    expected?: (string | number | boolean | Record<string, any>) | null;
    message?: string;
};

