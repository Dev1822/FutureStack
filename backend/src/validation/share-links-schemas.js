const Joi = require('joi');

const tokenPattern = /^[A-Za-z0-9_-]{32,128}$/;

const shareFieldsSchema = Joi.object({
    status: Joi.boolean().default(true),
    rounds: Joi.boolean().default(true),
    rejectedRound: Joi.boolean().default(true),
    dateApplied: Joi.boolean().default(true),
    description: Joi.boolean().default(true),
    deadline: Joi.boolean().default(true),
    applicationLink: Joi.boolean().default(true),
}).default({
    status: true,
    rounds: true,
    rejectedRound: true,
    dateApplied: true,
    description: true,
    deadline: true,
    applicationLink: true,
});

const createShareLinkSchema = Joi.object({
    opportunityIds: Joi.array()
        .items(Joi.string().uuid())
        .max(100)
        .unique()
        .optional()
        .messages({
            'array.max': 'You can share up to 100 opportunities at a time',
            'array.unique': 'Opportunity selections must be unique',
        }),
    fields: shareFieldsSchema,
    expiry: Joi.string()
        .valid('24h', '7d', 'permanent')
        .default('7d')
        .messages({
            'any.only': 'Expiry must be one of: 24h, 7d, permanent',
        }),
    passcode: Joi.string()
        .pattern(/^\d{4}$/)
        .optional()
        .messages({
            'string.pattern.base': 'Passcode must be exactly 4 digits',
        }),
});

const shareIdParamSchema = Joi.object({
    id: Joi.string()
        .uuid()
        .required()
        .messages({
            'string.uuid': 'Invalid share link ID format',
            'any.required': 'Share link ID is required',
        }),
});

const publicTokenParamSchema = Joi.object({
    token: Joi.string()
        .pattern(tokenPattern)
        .required()
        .messages({
            'string.pattern.base': 'Invalid share link token',
            'any.required': 'Share link token is required',
        }),
});

const verifyPasscodeSchema = Joi.object({
    passcode: Joi.string()
        .pattern(/^\d{4}$/)
        .required()
        .messages({
            'string.pattern.base': 'Passcode must be exactly 4 digits',
            'any.required': 'Passcode is required',
        }),
});

module.exports = {
    createShareLinkSchema,
    publicTokenParamSchema,
    shareIdParamSchema,
    verifyPasscodeSchema,
};
