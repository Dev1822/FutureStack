import { BrowserRouter as Router } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-white text-center">
            FutureStack Tracker
          </h1>
          <p className="text-gray-400 text-center mt-2">
            Track your internships and hackathons
          </p>
        </div>
      </div>
    </Router>
  );
}

export default App;
