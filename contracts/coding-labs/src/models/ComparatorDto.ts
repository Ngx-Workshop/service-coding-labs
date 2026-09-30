/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ComparatorDto = {
    kind: 'deepEqual' | 'strictEqual' | 'numberTolerance' | 'stringNormalized' | 'custom';
    tolerance?: number;
    normalizeWhitespace?: boolean;
    ignoreCase?: boolean;
    customComparatorId?: string;
};

