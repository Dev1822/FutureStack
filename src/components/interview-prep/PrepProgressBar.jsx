/**
 * PrepProgressBar - Progress indicator for interview preparation
 * 
 * Features:
 * - Shows progress based on completed items
 * - Visual progress bar with percentage
 * - Category breakdown
 */
import React from 'react';
import { FaCheckCircle, FaCircle } from 'react-icons/fa';

const PrepProgressBar = ({ questions, topics, behavioral }) => {
    // Calculate progress for each category
    const questionsPrepared = questions.filter(q => q.is_prepared).length;
    const questionsTotal = questions.length;
    const questionsProgress = questionsTotal > 0 ? (questionsPrepared / questionsTotal) * 100 : 0;

    const topicsReviewed = topics.filter(t => t.is_reviewed).length;
    const topicsTotal = topics.length;
    const topicsProgress = topicsTotal > 0 ? (topicsReviewed / topicsTotal) * 100 : 0;

    const behavioralComplete = behavioral.filter(b => 
        b.situation && b.task && b.action && b.result
    ).length;
    const behavioralTotal = behavioral.length;
    const behavioralProgress = behavioralTotal > 0 ? (behavioralComplete / behavioralTotal) * 100 : 0;

    // Overall progress (weighted average)
    const totalItems = questionsTotal + topicsTotal + behavioralTotal;
    const completedItems = questionsPrepared + topicsReviewed + behavioralComplete;
    const overallProgress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;

    const getProgressColor = (progress) => {
        if (progress >= 75) return 'bg-green-500';
        if (progress >= 50) return 'bg-yellow-500';
        if (progress >= 25) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="bg-[#0A0A0A] rounded-xl p-4 border border-white/10">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">Preparation Progress</h3>
                <span className="text-sm font-bold text-white">{Math.round(overallProgress)}%</span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-4">
                <div
                    className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(overallProgress)}`}
                    style={{ width: `${overallProgress}%` }}
                />
            </div>

            {/* Category Breakdown */}
            <div className="grid grid-cols-3 gap-3">
                {/* Questions */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        {questionsTotal > 0 ? (
                            <FaCheckCircle className={questionsPrepared === questionsTotal ? 'text-green-400' : 'text-yellow-400'} size={12} />
                        ) : (
                            <FaCircle className="text-gray-600" size={12} />
                        )}
                        <span className="text-xs text-gray-400">Questions</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                        {questionsPrepared}/{questionsTotal}
                    </p>
                </div>

                {/* Topics */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        {topicsTotal > 0 ? (
                            <FaCheckCircle className={topicsReviewed === topicsTotal ? 'text-green-400' : 'text-yellow-400'} size={12} />
                        ) : (
                            <FaCircle className="text-gray-600" size={12} />
                        )}
                        <span className="text-xs text-gray-400">Topics</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                        {topicsReviewed}/{topicsTotal}
                    </p>
                </div>

                {/* Behavioral */}
                <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                        {behavioralTotal > 0 ? (
                            <FaCheckCircle className={behavioralComplete === behavioralTotal ? 'text-green-400' : 'text-yellow-400'} size={12} />
                        ) : (
                            <FaCircle className="text-gray-600" size={12} />
                        )}
                        <span className="text-xs text-gray-400">Behavioral</span>
                    </div>
                    <p className="text-sm font-medium text-white">
                        {behavioralComplete}/{behavioralTotal}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default PrepProgressBar;
