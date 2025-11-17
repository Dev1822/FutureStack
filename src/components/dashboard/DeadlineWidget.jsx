import React from 'react';
import { FaClock, FaExclamationTriangle } from 'react-icons/fa';
import Card from '../common/Card';
import { getDaysRemaining, isOverdue, formatDate } from '../../utils/dateHelpers';

const DeadlineWidget = ({ deadlines }) => {
  if (!deadlines || deadlines.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
          <FaClock className="mr-2 text-blue-400" />
          Upcoming Deadlines
        </h3>
        <p className="text-gray-400 text-center py-4">No upcoming deadlines</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
        <FaClock className="mr-2 text-blue-400" />
        Upcoming Deadlines
      </h3>
      <div className="space-y-3">
        {deadlines.map((opportunity) => {
          const daysRemaining = getDaysRemaining(opportunity.deadline);
          const overdue = isOverdue(opportunity.deadline);

          return (
            <div
              key={opportunity.id}
              className={`p-3 rounded-lg border-l-4 ${
                overdue
                  ? 'bg-red-900 bg-opacity-20 border-red-500'
                  : daysRemaining <= 3
                  ? 'bg-yellow-900 bg-opacity-20 border-yellow-500'
                  : 'bg-blue-900 bg-opacity-20 border-blue-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-white">{opportunity.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">
                    {formatDate(opportunity.deadline)}
                  </p>
                </div>
                <div className="ml-3 text-right">
                  {overdue ? (
                    <div className="flex items-center text-red-400">
                      <FaExclamationTriangle className="mr-1" size={14} />
                      <span className="text-sm font-semibold">Overdue</span>
                    </div>
                  ) : (
                    <span
                      className={`text-sm font-semibold ${
                        daysRemaining <= 3 ? 'text-yellow-400' : 'text-blue-400'
                      }`}
                    >
                      {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                    </span>
                  )}
                  <p className="text-xs text-gray-500 mt-1 capitalize">
                    {opportunity.category}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};

export default DeadlineWidget;
