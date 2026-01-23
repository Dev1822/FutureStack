const Joi = require('joi');

/**
 * Validation schema for creating a new opportunity
 */
const createOpportunitySchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .required()
        .messages({
            'string.empty': 'Title is required and cannot be empty',
            'string.min': 'Title must be at least 1 character long',
            'string.max': 'Title cannot exceed 200 characters',
            'any.required': 'Title is required'
        }),

    description: Joi.string()
        .trim()
        .max(5000)
        .allow(null, '')
        .optional()
        .messages({
            'string.max': 'Description cannot exceed 5000 characters'
        }),

    link: Joi.string()
        .trim()
        .uri({ scheme: ['http', 'https'] })
        .max(500)
        .allow(null, '')
        .optional()
        .messages({
            'string.uri': 'Link must be a valid URL (http or https)',
            'string.max': 'Link cannot exceed 500 characters'
        }),

    deadline: Joi.date()
        .iso()
        .allow(null)
        .optional()
        .messages({
            'date.format': 'Deadline must be a valid ISO date format'
        }),

    category: Joi.string()
        .valid('internship', 'hackathon')
        .allow(null)
        .optional()
        .messages({
            'any.only': 'Category must be either "internship" or "hackathon"'
        }),

    status: Joi.string()
        .valid('applied', 'interviewed', 'shortlisted', 'selected', 'rejected')
        .default('applied')
        .optional()
        .messages({
            'any.only': 'Status must be one of: applied, interviewed, shortlisted, selected, rejected'
        }),

    notes: Joi.string()
        .trim()
        .max(5000)
        .allow(null, '')
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 5000 characters'
        })
});

/**
 * Validation schema for updating an opportunity
 * All fields are optional for partial updates
 */
const updateOpportunitySchema = Joi.object({
    title: Joi.string()
        .trim()
        .min(1)
        .max(200)
        .optional()
        .messages({
            'string.empty': 'Title cannot be empty',
            'string.min': 'Title must be at least 1 character long',
            'string.max': 'Title cannot exceed 200 characters'
        }),

    description: Joi.string()
        .trim()
        .max(5000)
        .allow(null, '')
        .optional()
        .messages({
            'string.max': 'Description cannot exceed 5000 characters'
        }),

    link: Joi.string()
        .trim()
        .uri({ scheme: ['http', 'https'] })
        .max(500)
        .allow(null, '')
        .optional()
        .messages({
            'string.uri': 'Link must be a valid URL (http or https)',
            'string.max': 'Link cannot exceed 500 characters'
        }),

    deadline: Joi.date()
        .iso()
        .allow(null)
        .optional()
        .messages({
            'date.format': 'Deadline must be a valid ISO date format'
        }),

    category: Joi.string()
        .valid('internship', 'hackathon')
        .allow(null)
        .optional()
        .messages({
            'any.only': 'Category must be either "internship" or "hackathon"'
        }),

    status: Joi.string()
        .valid('applied', 'interviewed', 'shortlisted', 'selected', 'rejected')
        .optional()
        .messages({
            'any.only': 'Status must be one of: applied, interviewed, shortlisted, selected, rejected'
        }),

    notes: Joi.string()
        .trim()
        .max(5000)
        .allow(null, '')
        .optional()
        .messages({
            'string.max': 'Notes cannot exceed 5000 characters'
        })
}).min(1).messages({
    'object.min': 'At least one field must be provided for update'
});

/**
 * Validation schema for UUID parameters
 */
const idParamSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid opportunity ID format',
            'any.required': 'Opportunity ID is required'
        })
});

module.exports = {
    createOpportunitySchema,
    updateOpportunitySchema,
    idParamSchema
};
