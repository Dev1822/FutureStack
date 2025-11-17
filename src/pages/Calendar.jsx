import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { opportunityService } from '../services/api';
import { getDaysRemaining } from '../utils/dateHelpers';
import Modal from '../components/common/Modal';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { FaBriefcase, FaCode, FaCalendarAlt, FaClock } from 'react-icons/fa';

const CalendarPage = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedDateOpportunities, setSelectedDateOpportunities] = useState([]);

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);
      const data = await opportunityService.getAll();
      setOpportunities(data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
      toast.error('Failed to load opportunities');
    } finally {
      setLoading(false);
    }
  };

  // Parse deadline dates and create a map of dates with opportunities
  const deadlineMap = {};
  opportunities.forEach(opp => {
    if (opp.deadline) {
      const dateKey = new Date(opp.deadline).toDateString();
      if (!deadlineMap[dateKey]) {
        deadlineMap[dateKey] = [];
      }
      deadlineMap[dateKey].push(opp);
    }
  });

  // Function to mark dates with deadlines
  const tileContent = ({ date, view }) => {
    if (view === 'month') {
      const dateKey = date.toDateString();
      const oppsOnDate = deadlineMap[dateKey];

      if (oppsOnDate && oppsOnDate.length > 0) {
        // Count internships and hackathons
        const internships = oppsOnDate.filter(opp => opp.category === 'internship').length;
        const hackathons = oppsOnDate.filter(opp => opp.category === 'hackathon').length;

        return (
          <div className="flex justify-center items-center gap-1 mt-1">
            {internships > 0 && (
              <div className="w-2 h-2 bg-blue-500 rounded-full" title={`${internships} internship(s)`} />
            )}
            {hackathons > 0 && (
              <div className="w-2 h-2 bg-green-500 rounded-full" title={`${hackathons} hackathon(s)`} />
            )}
          </div>
        );
      }
    }
    return null;
  };

  // Handle date click
  const handleDateClick = (date) => {
    setSelectedDate(date);
    const dateKey = date.toDateString();
    const oppsOnDate = deadlineMap[dateKey] || [];
    
    if (oppsOnDate.length > 0) {
      setSelectedDateOpportunities(oppsOnDate);
      setShowModal(true);
    }
  };

  // Get status badge color
  const getStatusColor = (status) => {
    const colors = {
      applied: 'bg-blue-500',
      shortlisted: 'bg-yellow-500',
      interviewed: 'bg-purple-500',
      selected: 'bg-green-500',
      rejected: 'bg-red-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-white text-lg">Loading calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Calendar</h1>
          <p className="text-sm sm:text-base text-gray-400">View all your deadlines in calendar format</p>
        </div>

        {/* Legend */}
        <Card className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-gray-300 text-sm">Internship Deadline</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-gray-300 text-sm">Hackathon Deadline</span>
            </div>
            <div className="flex items-center gap-2">
              <FaCalendarAlt className="text-gray-400" />
              <span className="text-gray-300 text-sm">Click on a date to view opportunities</span>
            </div>
          </div>
        </Card>

        {/* Calendar */}
        <Card className="p-6">
          <div className="calendar-container">
            <Calendar
              onChange={handleDateClick}
              value={selectedDate}
              tileContent={tileContent}
              className="custom-calendar"
            />
          </div>
        </Card>

        {/* Summary Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FaCalendarAlt className="text-blue-400 text-2xl" />
              <div>
                <p className="text-gray-400 text-sm">Total Deadlines</p>
                <p className="text-white text-2xl font-bold">{opportunities.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FaBriefcase className="text-blue-400 text-2xl" />
              <div>
                <p className="text-gray-400 text-sm">Internship Deadlines</p>
                <p className="text-white text-2xl font-bold">
                  {opportunities.filter(opp => opp.category === 'internship').length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FaCode className="text-green-400 text-2xl" />
              <div>
                <p className="text-gray-400 text-sm">Hackathon Deadlines</p>
                <p className="text-white text-2xl font-bold">
                  {opportunities.filter(opp => opp.category === 'hackathon').length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Modal for selected date opportunities */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={`Opportunities on ${selectedDate.toLocaleDateString()}`}
          className="max-w-2xl"
        >
          <div className="space-y-4">
            {selectedDateOpportunities.map(opp => (
              <div
                key={opp.id}
                className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-gray-500 transition-colors"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-white mb-1">{opp.title}</h4>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${
                          opp.category === 'internship' ? 'bg-blue-600' : 'bg-green-600'
                        }`}
                      >
                        {opp.category === 'internship' ? (
                          <span className="flex items-center gap-1">
                            <FaBriefcase size={10} />
                            Internship
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <FaCode size={10} />
                            Hackathon
                          </span>
                        )}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium text-white ${getStatusColor(
                          opp.status
                        )}`}
                      >
                        {opp.status.charAt(0).toUpperCase() + opp.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-gray-300 text-sm">
                    <FaClock size={12} />
                    <span>{getDaysRemaining(opp.deadline)} days</span>
                  </div>
                </div>

                {opp.description && (
                  <p className="text-gray-300 text-sm mb-2">{opp.description}</p>
                )}

                {opp.link && (
                  <a
                    href={opp.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 text-sm underline"
                  >
                    View Opportunity →
                  </a>
                )}

                {opp.notes && (
                  <div className="mt-2 pt-2 border-t border-gray-600">
                    <p className="text-gray-400 text-xs">
                      <span className="font-semibold">Notes:</span> {opp.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button onClick={() => setShowModal(false)} variant="secondary">
              Close
            </Button>
          </div>
        </Modal>
      </div>

      {/* Custom Calendar Styles */}
      <style jsx>{`
        .calendar-container {
          display: flex;
          justify-content: center;
        }

        :global(.custom-calendar) {
          width: 100%;
          max-width: 100%;
          background: transparent;
          border: none;
          color: white;
          font-family: inherit;
        }

        :global(.custom-calendar .react-calendar__navigation) {
          display: flex;
          margin-bottom: 1rem;
        }

        :global(.custom-calendar .react-calendar__navigation button) {
          color: white;
          background: #374151;
          border: 1px solid #4b5563;
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          font-size: 1rem;
          font-weight: 600;
          transition: all 0.2s;
        }

        :global(.custom-calendar .react-calendar__navigation button:hover:not(:disabled)) {
          background: #4b5563;
          border-color: #6b7280;
        }

        :global(.custom-calendar .react-calendar__navigation button:disabled) {
          opacity: 0.5;
          cursor: not-allowed;
        }

        :global(.custom-calendar .react-calendar__month-view__weekdays) {
          text-align: center;
          font-weight: 600;
          font-size: 0.875rem;
          color: #9ca3af;
          margin-bottom: 0.5rem;
        }

        :global(.custom-calendar .react-calendar__month-view__weekdays__weekday) {
          padding: 0.5rem;
        }

        :global(.custom-calendar .react-calendar__month-view__weekdays__weekday abbr) {
          text-decoration: none;
        }

        :global(.custom-calendar .react-calendar__tile) {
          background: #1f2937;
          border: 1px solid #374151;
          color: white;
          padding: 0.75rem;
          font-size: 0.875rem;
          border-radius: 0.375rem;
          margin: 2px;
          transition: all 0.2s;
          cursor: pointer;
          min-height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
        }

        :global(.custom-calendar .react-calendar__tile:hover:not(:disabled)) {
          background: #374151;
          border-color: #4b5563;
        }

        :global(.custom-calendar .react-calendar__tile--active) {
          background: #3b82f6 !important;
          border-color: #2563eb !important;
        }

        :global(.custom-calendar .react-calendar__tile--now) {
          background: #1e3a5f;
          border-color: #3b82f6;
        }

        :global(.custom-calendar .react-calendar__tile--now:hover) {
          background: #2d4a6f;
        }

        :global(.custom-calendar .react-calendar__month-view__days__day--neighboringMonth) {
          color: #6b7280;
          opacity: 0.5;
        }

        :global(.custom-calendar .react-calendar__tile:disabled) {
          opacity: 0.3;
          cursor: not-allowed;
        }

        @media (max-width: 640px) {
          :global(.custom-calendar .react-calendar__tile) {
            padding: 0.5rem;
            font-size: 0.75rem;
            min-height: 50px;
          }

          :global(.custom-calendar .react-calendar__navigation button) {
            padding: 0.375rem 0.75rem;
            font-size: 0.875rem;
          }
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
