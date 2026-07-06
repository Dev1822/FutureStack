const { buildInterviewPipelineAnalytics } = require('../../src/lib/interviewPipelineAnalytics');

describe('buildInterviewPipelineAnalytics', () => {
    it('returns empty pipeline stats when there are no internships', () => {
        expect(
            buildInterviewPipelineAnalytics(
                [{ id: 'h1', title: 'Hack', category: 'hackathon', status: 'applied' }],
                []
            )
        ).toMatchObject({
            internshipCount: 0,
            rejectedCount: 0,
            rejections: []
        });
    });

    it('describes rejection at round 1 with round type', () => {
        const result = buildInterviewPipelineAnalytics(
            [
                {
                    id: 'i1',
                    title: 'Acme Intern',
                    category: 'internship',
                    status: 'rejected',
                    rejected_round_number: 1
                }
            ],
            [
                {
                    opportunity_id: 'i1',
                    round_number: 1,
                    round_type: 'resume_shortlisted',
                    result: 'rejected'
                }
            ]
        );

        expect(result.rejectedCount).toBe(1);
        expect(result.rejections[0]).toMatchObject({
            roundNumber: 1,
            roundType: 'resume_shortlisted',
            roundTypeLabel: 'Round 1 · Resume Shortlisted',
            clearedRoundsBeforeRejection: 0
        });
        expect(result.rejectionByRoundType[0]).toMatchObject({
            roundType: 'resume_shortlisted',
            count: 1
        });
    });

    it('aggregates rejections by round number and type', () => {
        const result = buildInterviewPipelineAnalytics(
            [
                {
                    id: 'i1',
                    title: 'A',
                    category: 'internship',
                    status: 'rejected',
                    rejected_round_number: 2
                },
                {
                    id: 'i2',
                    title: 'B',
                    category: 'internship',
                    status: 'rejected',
                    rejected_round_number: 2
                }
            ],
            [
                {
                    opportunity_id: 'i1',
                    round_number: 1,
                    round_type: 'oa',
                    result: 'cleared'
                },
                {
                    opportunity_id: 'i1',
                    round_number: 2,
                    round_type: 'technical',
                    result: 'rejected'
                },
                {
                    opportunity_id: 'i2',
                    round_number: 2,
                    round_type: 'technical',
                    result: 'rejected'
                }
            ]
        );

        expect(result.averageRoundsBeforeRejection).toBe(2);
        expect(result.rejectionByRoundNumber).toEqual([{ roundNumber: 2, count: 2 }]);
        expect(result.rejectionByRoundType[0]).toMatchObject({
            roundType: 'technical',
            count: 2
        });
    });

    it('builds funnel metrics by round type and stage reach by round number', () => {
        const result = buildInterviewPipelineAnalytics(
            [
                { id: 'i1', title: 'A', category: 'internship', status: 'interviewed' },
                { id: 'i2', title: 'B', category: 'internship', status: 'rejected', rejected_round_number: 2 },
            ],
            [
                { opportunity_id: 'i1', round_number: 1, round_type: 'oa', result: 'cleared' },
                { opportunity_id: 'i1', round_number: 2, round_type: 'technical', result: 'pending' },
                { opportunity_id: 'i2', round_number: 1, round_type: 'oa', result: 'cleared' },
                { opportunity_id: 'i2', round_number: 2, round_type: 'technical', result: 'rejected' },
            ]
        );

        expect(result.funnelByRoundType).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ roundType: 'oa', reached: 2, cleared: 2, rejected: 0 }),
                expect.objectContaining({ roundType: 'technical', reached: 2, cleared: 0, rejected: 1 }),
            ])
        );
        expect(result.stageReachByRoundNumber).toEqual([
            { roundNumber: 1, reached: 2, stillActive: 0 },
            { roundNumber: 2, reached: 2, stillActive: 1 },
        ]);
    });
});
