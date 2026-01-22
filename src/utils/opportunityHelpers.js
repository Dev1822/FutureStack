/**
 * Opportunity helper utilities
 * Centralizes business rules related to opportunities
 */

/**
 * Checks if an opportunity category supports document attachments
 * Currently only 'internship' opportunities support document attachments
 * 
 * @param {string} category - The opportunity category (e.g., 'internship', 'hackathon')
 * @returns {boolean} - True if documents can be attached to this category
 */
export const supportsDocuments = (category) => {
    return category === 'internship';
};

/**
 * List of opportunity categories that support document attachments
 * Useful for UI messaging and validation
 */
export const DOCUMENT_SUPPORTED_CATEGORIES = ['internship'];

/**
 * Get a user-friendly message explaining why documents are not available
 * @param {string} category - The opportunity category
 * @returns {string|null} - Message explaining why documents aren't supported, or null if they are
 */
export const getDocumentUnavailableMessage = (category) => {
    if (supportsDocuments(category)) {
        return null;
    }
    return 'Document attachments are only available for internship opportunities.';
};
