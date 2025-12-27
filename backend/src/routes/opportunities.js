const express = require('express');
const { supabase } = require('../lib/supabase');

const router = express.Router();

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
router.post('/', async (req, res) => {
    try {
        const { title, description, link, deadline, category, status, notes } = req.body;

        // Validation
        if (!title || !title.trim()) {
            return res.status(400).json({ error: 'Title is required and cannot be empty' });
        }

        if (category && !['internship', 'hackathon'].includes(category)) {
            return res.status(400).json({ error: 'Category must be internship or hackathon' });
        }

        if (status && !['applied', 'interviewed', 'shortlisted', 'selected', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

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

        // Validation
        if (title !== undefined && (title === null || !title.trim())) {
            return res.status(400).json({ error: 'Title cannot be empty' });
        }

        if (category && !['internship', 'hackathon'].includes(category)) {
            return res.status(400).json({ error: 'Category must be internship or hackathon' });
        }

        if (status && !['applied', 'interviewed', 'shortlisted', 'selected', 'rejected'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

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
router.put('/:id', updateHandler);

/**
 * PATCH /api/opportunities/:id
 * Partial update (same as PUT for compatibility)
 */
router.patch('/:id', updateHandler);

/**
 * DELETE /api/opportunities/:id
 * Delete an opportunity
 */
router.delete('/:id', async (req, res) => {
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

        res.json({ success: true, message: 'Opportunity deleted' });
    } catch (error) {
        console.error('Error deleting opportunity:', error.message);
        res.status(500).json({ error: 'Failed to delete opportunity' });
    }
});

module.exports = router;
