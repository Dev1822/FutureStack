// Page for creating a brand new opportunity
// - Wraps the reusable OpportunityForm and wires it to the API service
// - On success, redirects user back to dashboard
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import OpportunityForm from '../components/opportunities/OpportunityForm';
import Button from '../components/common/Button';
import { opportunityService } from '../services/api';

const AddOpportunity = () => {
  const navigate = useNavigate(); 

  // Called by OpportunityForm when user submits a VALID form
  // formData contains all fields: title, description, deadline, etc.
  const handleSubmit = async (formData) => { // formData received from OpportunityForm
    try {
      await opportunityService.create(formData);
      toast.success('Opportunity added successfully!'); 
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating opportunity:', error);
      toast.error('Failed to add opportunity. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate(-1); // Navigate back to previous page
  };

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-[#0A0A0A] rounded-xl shadow-lg p-6 sm:p-8 border border-white/10">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-white/10 pb-2">
            Add New Opportunity
          </h2>

          <OpportunityForm onSubmit={handleSubmit} isEdit={false} />

          <div className="mt-6 pt-4 border-t border-white/10">
            <button
              onClick={handleCancel}
              className="w-full px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors text-sm font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddOpportunity;
