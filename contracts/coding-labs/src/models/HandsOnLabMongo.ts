/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type HandsOnLabMongo = {
    _id: string;
    workshopId: string;
    workshopDocumentGroupId?: string;
    slug: string;
    title: string;
    summary?: string;
    tags: Array<string>;
    difficulty?: 'intro' | 'easy' | 'medium' | 'hard';
    estimatedMinutes?: number;
    status: 'draft' | 'published' | 'archived';
    currentDraftVersionId?: string;
    latestPublishedVersionId?: string;
    createdAt: string;
    createdBy: string;
    updatedAt: string;
    updatedBy: string;
    archivedAt?: string;
    archivedBy?: string;
};

