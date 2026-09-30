/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type CreateLabDto = {
    workshopId: string;
    workshopDocumentGroupId?: string;
    slug: string;
    title: string;
    summary?: string;
    tags?: Array<string>;
    difficulty?: 'intro' | 'easy' | 'medium' | 'hard';
    estimatedMinutes?: number;
    status?: 'draft' | 'published' | 'archived';
    createdBy: string;
    updatedBy?: string;
};

