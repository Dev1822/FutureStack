const express = require('express');
const { supabase } = require('../lib/supabase');
const { validate } = require('../middleware/validate');
const { createOpportunitySchema, updateOpportunitySchema, idParamSchema } = require('../validation/schemas');

const router = express.Router();

/**
 * Audit logging helper
 * Note: Avoids logging user-supplied content (titles, descriptions) to prevent
 * sensitive data exposure in logs. Only logs action type, user ID, resource ID, and metadata.
 * Note: Custom error messages from Joi schemas (defined in schemas.js) will be properly
 * propagated through the validation middleware to the client.
 */
function logAudit(action, userId, resourceId = null, outcome = 'success', details = {}) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'AUDIT',
        action,
        userId,
        resourceId,
        outcome, // success or failure
        details // Metadata only, no user content
    }));
}

/**
 * GET /api/opportunities
 * Get all opportunities for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('opportunities')
            .select('*')
            .eq('user_id', req.auth.internalUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        console.error('Error fetching opportunities:', error.message);
        res.status(500).json({ error: 'Failed to fetch opportunities' });
    }
});

/**
 * GET /api/opportunities/:id
 * Get a single opportunity by ID
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { data, error } = await supabase
            .from('opportunities')
            .select('*')
            .eq('id', id)
            .eq('user_id', req.auth.internalUserId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Opportunity not found' });
            }
            throw error;
        }

        res.json(data);
    } catch (error) {
        console.error('Error fetching opportunity:', error.message);
        res.status(500).json({ error: 'Failed to fetch opportunity' });
    }
});

/**
 * POST /api/opportunities
 * Create a new opportunity
 */
router.post('/', validate(createOpportunitySchema), async (req, res) => {
    try {
        const { title, description, link, deadline, category, status, notes } = req.body;

        const { data, error } = await supabase
            .from('opportunities')
            .insert({
                user_id: req.auth.internalUserId,
                title,
                description: description || null,
                link: link || null,
                deadline: deadline || null,
                category: category || null,
                status: status || 'applied',
                notes: notes || null
            })
            .select()
            .single();

        if (error) throw error;

        // Audit log (metadata only, no user content)
        logAudit('CREATE_OPPORTUNITY', req.auth.internalUserId, data.id, 'success', {
            category: data.category
        });

        res.status(201).json(data);
    } catch (error) {
        console.error('Error creating opportunity:', error.message);
        res.status(500).json({ error: 'Failed to create opportunity' });
    }
});

/**
 * Shared handler for PUT and PATCH operations
 */
const updateHandler = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, link, deadline, category, status, notes } = req.body;

        // Build update object with only provided fields
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (link !== undefined) updateData.link = link;
        if (deadline !== undefined) updateData.deadline = deadline;
        if (category !== undefined) updateData.category = category;
        if (status !== undefined) updateData.status = status;
        if (notes !== undefined) updateData.notes = notes;

        const { data, error } = await supabase
            .from('opportunities')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.auth.internalUserId)
            .select()
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return res.status(404).json({ error: 'Opportunity not found' });
            }
            throw error;
        }

        // Audit log (metadata only, no user content)
        logAudit('UPDATE_OPPORTUNITY', req.auth.internalUserId, id, 'success', {
            updatedFields: Object.keys(updateData),
            fieldCount: Object.keys(updateData).length
        });

        res.json(data);
    } catch (error) {
        console.error('Error updating opportunity:', error.message);
        res.status(500).json({ error: 'Failed to update opportunity' });
    }
};

/**
 * PUT /api/opportunities/:id
 * Update an existing opportunity
 */
router.put('/:id', validate(idParamSchema, 'params'), validate(updateOpportunitySchema), updateHandler);

/**
 * PATCH /api/opportunities/:id
 * Partial update (same as PUT for compatibility)
 */
router.patch('/:id', validate(idParamSchema, 'params'), validate(updateOpportunitySchema), updateHandler);

/**
 * DELETE /api/opportunities/:id
 * Delete an opportunity
 */
router.delete('/:id', validate(idParamSchema, 'params'), async (req, res) => {
    try {
        const { id } = req.params;

        const { error, count } = await supabase
            .from('opportunities')
            .delete({ count: 'exact' })
            .eq('id', id)
            .eq('user_id', req.auth.internalUserId);

        if (error) throw error;

        if (count === 0) {
            return res.status(404).json({ error: 'Opportunity not found' });
        }

        // Audit log
        logAudit('DELETE_OPPORTUNITY', req.auth.internalUserId, id, 'success');

        res.json({ success: true, message: 'Opportunity deleted' });
    } catch (error) {
        console.error('Error deleting opportunity:', error.message);
        res.status(500).json({ error: 'Failed to delete opportunity' });
    }
});

module.exports = router;
