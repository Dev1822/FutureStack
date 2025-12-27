const express = require('express');
const { supabase } = require('../lib/supabase');

const router = express.Router();

// Helper to avoid toFixed + parseFloat conversions
const roundToOneDecimal = (num) => Math.round(num * 10) / 10;

/**
 * GET /api/analytics
 * Get analytics data for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.auth.internalUserId;

        // Get all opportunities for the user
        const { data: opportunities, error } = await supabase
            .from('opportunities')
            .select('status, category, created_at')
            .eq('user_id', userId);

        if (error) throw error;

        // Calculate status counts
        const statusCounts = {
            applied: 0,
            interviewed: 0,
            shortlisted: 0,
            selected: 0,
            rejected: 0
        };

        // Calculate category counts
        const categoryCounts = {
            internship: 0,
            hackathon: 0
        };

        opportunities.forEach(opp => {
            if (opp.status && statusCounts.hasOwnProperty(opp.status)) {
                statusCounts[opp.status]++;
            }
            if (opp.category && categoryCounts.hasOwnProperty(opp.category)) {
                categoryCounts[opp.category]++;
            }
        });

        // Calculate conversion rates
        const totalApplied = opportunities.length;
        const totalSelected = statusCounts.selected;
        const totalRejected = statusCounts.rejected;
        const totalInProgress = statusCounts.applied + statusCounts.interviewed + statusCounts.shortlisted;

        const conversionRate = totalApplied > 0
            ? roundToOneDecimal((totalSelected / totalApplied) * 100)
            : 0;

        const rejectionRate = totalApplied > 0
            ? roundToOneDecimal((totalRejected / totalApplied) * 100)
            : 0;

        // Monthly breakdown (last 6 months)
        const now = new Date();
        const monthlyData = [];
        for (let i = 5; i >= 0; i--) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

            const monthOpps = opportunities.filter(opp => {
                const created = new Date(opp.created_at);
                return created >= monthStart && created <= monthEnd;
            });

            monthlyData.push({
                month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
                count: monthOpps.length
            });
        }

        res.json({
            total: totalApplied,
            statusCounts,
            categoryCounts,
            metrics: {
                conversionRate: conversionRate,
                rejectionRate: rejectionRate,
                inProgress: totalInProgress,
                successRate: (totalSelected + totalRejected) > 0
                    ? roundToOneDecimal((totalSelected / (totalSelected + totalRejected)) * 100)
                    : null  // No completed opportunities yet
            },
            monthlyBreakdown: monthlyData
        });
    } catch (error) {
        console.error('Error fetching analytics:', error.message);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

module.exports = router;
