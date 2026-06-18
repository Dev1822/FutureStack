const express = require('express');
const { supabase } = require('../lib/supabase');
const { validate } = require('../middleware/validate');
const { syncOpportunityFromRounds } = require('../lib/syncOpportunityFromRounds');
const {
    createRoundSchema,
    updateRoundSchema,
    opportunityRoundParamsSchema,
    opportunityIdOnlyParamsSchema
} = require('../validation/rounds-schemas');

const router = express.Router({ mergeParams: true });

const isDatabaseUnavailableError = (error) => {
    const msg = String(error?.message || '').toLowerCase();
    return msg.includes('fetch failed') || msg.includes('network');
};

const handleRouteError = (res, action, error, defaultMessage) => {
    const unavailable = isDatabaseUnavailableError(error);

    console.error(`${action} error:`, {
        type: 'ROUTE_ERROR',
        service: 'supabase',
        unavailable,
        message: error?.message,
        code: error?.code,
        details: error?.details
    });

    if (unavailable) {
        return res.status(503).json({
            error: 'Service Unavailable',
            message: 'Database is currently unavailable. Please try again in a moment.'
        });
    }

    return res.status(500).json({ error: defaultMessage });
};

function logAudit(action, userId, resourceId = null, outcome = 'success', details = {}) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        type: 'AUDIT',
        action,
        userId,
        resourceId,
        outcome,
        details
    }));
}

async function verifyInternshipOpportunity(opportunityId, userId) {
    const { data, error } = await supabase
        .from('opportunities')
        .select('id, category')
        .eq('id', opportunityId)
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return { valid: false, status: 404, error: 'Opportunity not found' };
    }

    if (data.category !== 'internship') {
        return {
            valid: false,
            status: 400,
            error: 'Interview rounds are only available for internship opportunities'
        };
    }

    return { valid: true, data };
}

async function getNextRoundNumber(opportunityId, userId) {
    const { data, error } = await supabase
        .from('opportunity_rounds')
        .select('round_number')
        .eq('opportunity_id', opportunityId)
        .eq('user_id', userId)
        .order('round_number', { ascending: false })
        .limit(1);

    if (error) {
        throw error;
    }

    if (!data?.length) {
        return 1;
    }

    return data[0].round_number + 1;
}

/**
 * GET /api/opportunities/:opportunityId/rounds
 */
router.get('/', validate(opportunityIdOnlyParamsSchema, 'params'), async (req, res) => {
    try {
        const { opportunityId } = req.params;
        const userId = req.auth.internalUserId;

        const ownership = await verifyInternshipOpportunity(opportunityId, userId);
        if (!ownership.valid) {
            return res.status(ownership.status).json({ error: ownership.error });
        }

        const { data, error } = await supabase
            .from('opportunity_rounds')
            .select('*')
            .eq('opportunity_id', opportunityId)
            .eq('user_id', userId)
            .order('round_number', { ascending: true });

        if (error) throw error;

        res.json(data);
    } catch (error) {
        return handleRouteError(res, 'LIST_ROUNDS', error, 'Failed to fetch interview rounds');
    }
});

/**
 * POST /api/opportunities/:opportunityId/rounds
 */
router.post('/', validate(opportunityIdOnlyParamsSchema, 'params'), validate(createRoundSchema), async (req, res) => {
    try {
        const { opportunityId } = req.params;
        const userId = req.auth.internalUserId;
        const { round_number, round_type, scheduled_date, result, notes } = req.body;

        const ownership = await verifyInternshipOpportunity(opportunityId, userId);
        if (!ownership.valid) {
            return res.status(ownership.status).json({ error: ownership.error });
        }

        const assignedRoundNumber = round_number ?? await getNextRoundNumber(opportunityId, userId);

        const { data, error } = await supabase
            .from('opportunity_rounds')
            .insert({
                opportunity_id: opportunityId,
                user_id: userId,
                round_number: assignedRoundNumber,
                round_type,
                scheduled_date: scheduled_date || null,
                result: result || 'pending',
                notes: notes || null
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return res.status(409).json({ error: 'A round with this number already exists' });
            }
            throw error;
        }

        await syncOpportunityFromRounds(supabase, opportunityId, userId);

        logAudit('CREATE_ROUND', userId, data.id, 'success', {
            opportunity_id: opportunityId,
            round_number: assignedRoundNumber
        });

        res.status(201).json(data);
    } catch (error) {
        return handleRouteError(res, 'CREATE_ROUND', error, 'Failed to create interview round');
    }
});

/**
 * PATCH /api/opportunities/:opportunityId/rounds/:roundId
 */
router.patch(
    '/:roundId',
    validate(opportunityRoundParamsSchema, 'params'),
    validate(updateRoundSchema),
    async (req, res) => {
        try {
            const { opportunityId, roundId } = req.params;
            const userId = req.auth.internalUserId;

            const ownership = await verifyInternshipOpportunity(opportunityId, userId);
            if (!ownership.valid) {
                return res.status(ownership.status).json({ error: ownership.error });
            }

            const updateData = {};
            if (req.body.round_type !== undefined) updateData.round_type = req.body.round_type;
            if (req.body.scheduled_date !== undefined) updateData.scheduled_date = req.body.scheduled_date;
            if (req.body.result !== undefined) updateData.result = req.body.result;
            if (req.body.notes !== undefined) updateData.notes = req.body.notes;

            const { data, error } = await supabase
                .from('opportunity_rounds')
                .update(updateData)
                .eq('id', roundId)
                .eq('opportunity_id', opportunityId)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return res.status(404).json({ error: 'Round not found' });
                }
                throw error;
            }

            await syncOpportunityFromRounds(supabase, opportunityId, userId);

            logAudit('UPDATE_ROUND', userId, roundId, 'success', {
                opportunity_id: opportunityId,
                updatedFields: Object.keys(updateData)
            });

            res.json(data);
        } catch (error) {
            return handleRouteError(res, 'UPDATE_ROUND', error, 'Failed to update interview round');
        }
    }
);

/**
 * DELETE /api/opportunities/:opportunityId/rounds/:roundId
 */
router.delete('/:roundId', validate(opportunityRoundParamsSchema, 'params'), async (req, res) => {
    try {
        const { opportunityId, roundId } = req.params;
        const userId = req.auth.internalUserId;

        const ownership = await verifyInternshipOpportunity(opportunityId, userId);
        if (!ownership.valid) {
            return res.status(ownership.status).json({ error: ownership.error });
        }

        const { error, count } = await supabase
            .from('opportunity_rounds')
            .delete({ count: 'exact' })
            .eq('id', roundId)
            .eq('opportunity_id', opportunityId)
            .eq('user_id', userId);

        if (error) throw error;

        if (count === 0) {
            return res.status(404).json({ error: 'Round not found' });
        }

        await syncOpportunityFromRounds(supabase, opportunityId, userId);

        logAudit('DELETE_ROUND', userId, roundId, 'success', { opportunity_id: opportunityId });

        res.json({ success: true, message: 'Round deleted' });
    } catch (error) {
        return handleRouteError(res, 'DELETE_ROUND', error, 'Failed to delete interview round');
    }
});

module.exports = router;
