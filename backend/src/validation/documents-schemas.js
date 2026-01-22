const Joi = require('joi');

/**
 * Validation schema for creating a new document
 */
const createDocumentSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.empty': 'Document name is required',
            'string.min': 'Document name must be at least 1 character',
            'string.max': 'Document name cannot exceed 200 characters',
            'any.required': 'Document name is required'
        }),

    type: Joi.string()
        .valid('resume', 'cover_letter', 'portfolio', 'other')
        .required()
        .messages({
            'any.only': 'Type must be one of: resume, cover_letter, portfolio, other',
            'any.required': 'Document type is required'
        }),

    file_url: Joi.string()
        .trim()
        .uri({ scheme: ['http', 'https'] })
        .max(1000)
        .allow(null, '')
        .optional()
        .messages({
            'string.uri': 'File URL must be a valid URL (http or https)',
            'string.max': 'File URL cannot exceed 1000 characters'
        }),

    version: Joi.string()
        .trim()
        .max(50)
        .default('v1')
        .optional()
        .messages({
            'string.max': 'Version cannot exceed 50 characters'
        }),

    notes: Joi.string()
        .trim()
        .max(2000)
        .allow(null, '')
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 2000 characters'
        }),

    is_external: Joi.boolean()
        .default(false)
        .optional()
});

/**
 * Validation schema for updating a document
 */
const updateDocumentSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .optional()
        .messages({
            'string.empty': 'Document name cannot be empty',
            'string.min': 'Document name must be at least 1 character',
            'string.max': 'Document name cannot exceed 200 characters'
        }),

    type: Joi.string()
        .valid('resume', 'cover_letter', 'portfolio', 'other')
        .optional()
        .messages({
            'any.only': 'Type must be one of: resume, cover_letter, portfolio, other'
        }),

    file_url: Joi.string()
        .trim()
        .uri({ scheme: ['http', 'https'] })
        .max(1000)
        .allow(null, '')
        .optional()
        .messages({
            'string.uri': 'File URL must be a valid URL (http or https)',
            'string.max': 'File URL cannot exceed 1000 characters'
        }),

    version: Joi.string()
        .trim()
        .max(50)
        .optional()
        .messages({
            'string.max': 'Version cannot exceed 50 characters'
        }),

    notes: Joi.string()
        .trim()
        .max(2000)
        .allow(null, '')
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 2000 characters'
        }),

    is_external: Joi.boolean()
        .optional()
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for assigning document to opportunity
 */
const assignDocumentSchema = Joi.object({
    opportunity_id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid opportunity ID format',
            'any.required': 'Opportunity ID is required'
        })
});

/**
 * Validation schema for document ID parameter
 */
const documentIdParamSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid document ID format',
            'any.required': 'Document ID is required'
        })
});

/**
 * Validation schema for unassign (two UUIDs)
 */
const unassignDocumentParamsSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid document ID format',
            'any.required': 'Document ID is required'
        }),
    opportunityId: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid opportunity ID format',
            'any.required': 'Opportunity ID is required'
        })
});

/**
 * Validation schema for opportunity ID parameter (by-opportunity route)
 */
const opportunityIdParamSchema = Joi.object({
    opportunityId: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid opportunity ID format',
            'any.required': 'Opportunity ID is required'
        })
});

module.exports = {
    createDocumentSchema,
    updateDocumentSchema,
    assignDocumentSchema,
    documentIdParamSchema,
    unassignDocumentParamsSchema,
    opportunityIdParamSchema
};
