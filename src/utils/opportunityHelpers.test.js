import {
    supportsDocuments,
    DOCUMENT_SUPPORTED_CATEGORIES,
    getDocumentUnavailableMessage,
    isActiveInternshipStatus,
    INACTIVE_INTERNSHIP_STATUSES,
} from './opportunityHelpers';

describe('opportunityHelpers', () => {
    describe('supportsDocuments', () => {
        it('returns true for internship category', () => {
            expect(supportsDocuments('internship')).toBe(true);
        });

        it('returns false for hackathon category', () => {
            expect(supportsDocuments('hackathon')).toBe(false);
        });
    });

    describe('DOCUMENT_SUPPORTED_CATEGORIES', () => {
        it('includes internship only', () => {
            expect(DOCUMENT_SUPPORTED_CATEGORIES).toEqual(['internship']);
        });
    });

    describe('getDocumentUnavailableMessage', () => {
        it('returns null when documents are supported', () => {
            expect(getDocumentUnavailableMessage('internship')).toBeNull();
        });

        it('returns explanation when documents are not supported', () => {
            expect(getDocumentUnavailableMessage('hackathon')).toMatch(/internship/i);
        });
    });

    describe('isActiveInternshipStatus', () => {
        it('treats applied and interviewed as active', () => {
            expect(isActiveInternshipStatus('applied')).toBe(true);
            expect(isActiveInternshipStatus('interviewed')).toBe(true);
            expect(isActiveInternshipStatus('shortlisted')).toBe(true);
        });

        it('treats rejected, selected, and ghosted as inactive', () => {
            INACTIVE_INTERNSHIP_STATUSES.forEach((status) => {
                expect(isActiveInternshipStatus(status)).toBe(false);
            });
        });
    });
});
