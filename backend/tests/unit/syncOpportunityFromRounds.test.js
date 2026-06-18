const { deriveOpportunityFieldsFromRounds } = require('../../src/lib/syncOpportunityFromRounds');

describe('deriveOpportunityFieldsFromRounds', () => {
    it('returns null round pointers when there are no rounds', () => {
        expect(deriveOpportunityFieldsFromRounds([], 'applied')).toEqual({
            current_round_number: null,
            rejected_round_number: null
        });
    });

    it('marks rejected at the failing round', () => {
        expect(
            deriveOpportunityFieldsFromRounds([
                { round_number: 1, round_type: 'oa', result: 'cleared' },
                { round_number: 2, round_type: 'technical', result: 'rejected' }
            ])
        ).toEqual({
            status: 'rejected',
            current_round_number: null,
            rejected_round_number: 2
        });
    });

    it('marks interviewed when a round is pending', () => {
        expect(
            deriveOpportunityFieldsFromRounds([
                { round_number: 1, round_type: 'oa', result: 'cleared' },
                { round_number: 2, round_type: 'technical', result: 'pending' }
            ])
        ).toEqual({
            status: 'interviewed',
            current_round_number: 2,
            rejected_round_number: null
        });
    });

    it('marks selected when final round is cleared', () => {
        expect(
            deriveOpportunityFieldsFromRounds([
                { round_number: 1, round_type: 'technical', result: 'cleared' },
                { round_number: 2, round_type: 'final', result: 'cleared' }
            ])
        ).toEqual({
            status: 'selected',
            current_round_number: null,
            rejected_round_number: null
        });
    });
});
