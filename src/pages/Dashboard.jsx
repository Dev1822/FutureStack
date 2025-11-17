import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaClipboardList, FaPaperPlane, FaStar, FaCheckCircle, FaPlus, FaList } from 'react-icons/fa';
import StatsCard from '../components/dashboard/StatsCard';
import DeadlineWidget from '../components/dashboard/DeadlineWidget';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { opportunityService } from '../services/api';
import { isOverdue, getDaysRemaining } from '../utils/dateHelpers';

const Dashboard = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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

  // Calculate statistics
  const totalOpportunities = opportunities.length;
  const appliedCount = opportunities.filter(opp => opp.status === 'applied').length;
  const shortlistedCount = opportunities.filter(opp => opp.status === 'shortlisted').length;
  const selectedCount = opportunities.filter(opp => opp.status === 'selected').length;

  // Get upcoming deadlines (next 3, not overdue, sorted chronologically)
  const upcomingDeadlines = opportunities
    .filter(opp => !isOverdue(opp.deadline))
    .sort((a, b) => new Date(a.deadline) - new Date(b.deadline))
    .slice(0, 3);

  // Get overdue items
  const overdueItems = opportunities.filter(opp => isOverdue(opp.deadline));

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-white text-center">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Track your opportunities and upcoming deadlines</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatsCard
            title="Total Opportunities"
            value={totalOpportunities}
            icon={FaClipboardList}
            color="blue"
          />
          <StatsCard
            title="Applied"
            value={appliedCount}
            icon={FaPaperPlane}
            color="purple"
          />
          <StatsCard
            title="Shortlisted"
            value={shortlistedCount}
            icon={FaStar}
            color="yellow"
          />
          <StatsCard
            title="Selected"
            value={selectedCount}
            icon={FaCheckCircle}
            color="green"
          />
        </div>

        {/* Overdue Items Alert */}
        {overdueItems.length > 0 && (
          <Card className="p-6 mb-8 bg-red-900 bg-opacity-20 border-l-4 border-red-500">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-6 w-6 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-semibold text-red-400">
                  {overdueItems.length} Overdue {overdueItems.length === 1 ? 'Item' : 'Items'}
                </h3>
                <div className="mt-2 text-sm text-red-300">
                  <ul className="list-disc list-inside space-y-1">
                    {overdueItems.slice(0, 3).map(item => (
                      <li key={item.id}>
                        {item.title} - {Math.abs(getDaysRemaining(item.deadline))} days overdue
                      </li>
                    ))}
                    {overdueItems.length > 3 && (
                      <li className="text-red-400 font-medium">
                        and {overdueItems.length - 3} more...
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Upcoming Deadlines */}
        <div className="mb-8">
          <DeadlineWidget deadlines={upcomingDeadlines} />
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={() => navigate('/add')}
              className="flex items-center"
            >
              <FaPlus className="mr-2" />
              Add New Opportunity
            </Button>
            <Button
              onClick={() => navigate('/internships')}
              variant="secondary"
              className="flex items-center"
            >
              <FaList className="mr-2" />
              View All Internships
            </Button>
            <Button
              onClick={() => navigate('/hackathons')}
              variant="secondary"
              className="flex items-center"
            >
              <FaList className="mr-2" />
              View All Hackathons
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
