import { useParams } from 'react-router-dom';

const EditOpportunity = () => {
  const { id } = useParams();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-white mb-6">Edit Opportunity</h1>
      <p className="text-gray-400">Editing opportunity ID: {id}</p>
      <p className="text-gray-400">Edit form coming soon...</p>
    </div>
  );
};

export default EditOpportunity;
