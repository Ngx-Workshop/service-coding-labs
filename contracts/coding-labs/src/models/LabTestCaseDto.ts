/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ComparatorDto } from './ComparatorDto';
export type LabTestCaseDto = {
    _id?: string;
    name: string;
    kind: 'io' | 'unit';
    input?: (string | number | boolean | Record<string, any>) | null;
    expected?: (string | number | boolean | Record<string, any>) | null;
    comparator?: ComparatorDto;
    testCode?: string;
    framework?: 'jest' | 'vitest';
};

