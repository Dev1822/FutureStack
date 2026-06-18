/**
 * Derive opportunity pipeline fields from interview rounds.
 * @param {Array<{ round_number: number, round_type: string, result: string }>} rounds
 * @param {string} [existingStatus]
 * @returns {{ status?: string, current_round_number: number | null, rejected_round_number: number | null }}
 */
function deriveOpportunityFieldsFromRounds(rounds, existingStatus = 'applied') {
    const sorted = [...rounds].sort((a, b) => a.round_number - b.round_number);

    if (sorted.length === 0) {
        return {
            current_round_number: null,
            rejected_round_number: null
        };
    }

    const rejectedRound = sorted.find((round) => round.result === 'rejected');
    if (rejectedRound) {
        return {
            status: 'rejected',
            current_round_number: null,
            rejected_round_number: rejectedRound.round_number
        };
    }

    const pendingRound = sorted.find((round) => round.result === 'pending');
    if (pendingRound) {
        return {
            status: 'interviewed',
            current_round_number: pendingRound.round_number,
            rejected_round_number: null
        };
    }

    const lastRound = sorted[sorted.length - 1];
    if (lastRound.round_type === 'final' && lastRound.result === 'cleared') {
        return {
            status: 'selected',
            current_round_number: null,
            rejected_round_number: null
        };
    }

    const allComplete = sorted.every(
        (round) => round.result === 'cleared' || round.result === 'skipped'
    );

    if (allComplete) {
        return {
            status: sorted.length === 1 ? 'shortlisted' : 'interviewed',
            current_round_number: null,
            rejected_round_number: null
        };
    }

    return {
        status: existingStatus,
        current_round_number: null,
        rejected_round_number: null
    };
}

/**
 * Load rounds for an opportunity and patch derived fields on opportunities row.
 */
async function syncOpportunityFromRounds(supabase, opportunityId, userId) {
    const { data: opportunity, error: oppError } = await supabase
        .from('opportunities')
        .select('id, status')
        .eq('id', opportunityId)
        .eq('user_id', userId)
        .single();

    if (oppError) {
        throw oppError;
    }

    const { data: rounds, error: roundsError } = await supabase
        .from('opportunity_rounds')
        .select('round_number, round_type, result')
        .eq('opportunity_id', opportunityId)
        .eq('user_id', userId)
        .order('round_number', { ascending: true });

    if (roundsError) {
        throw roundsError;
    }

    const derived = deriveOpportunityFieldsFromRounds(rounds || [], opportunity.status);
    const patch = {
        current_round_number: derived.current_round_number,
        rejected_round_number: derived.rejected_round_number
    };

    if (derived.status !== undefined) {
        patch.status = derived.status;
    }

    const { data: updated, error: updateError } = await supabase
        .from('opportunities')
        .update(patch)
        .eq('id', opportunityId)
        .eq('user_id', userId)
        .select()
        .single();

    if (updateError) {
        throw updateError;
    }

    return updated;
}

module.exports = {
    deriveOpportunityFieldsFromRounds,
    syncOpportunityFromRounds
};
