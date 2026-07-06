/**
 * Joi validation schemas for the AI resume checker routes.
 */

'use strict';

const Joi = require('joi');

/**
 * Validates the :id param (document UUID) for both POST and GET.
 */
const documentIdParamSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid document ID format',
            'any.required': 'Document ID is required',
        }),
});

module.exports = { documentIdParamSchema };
