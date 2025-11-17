import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './App.css';

// Components
import Navbar from './components/common/Navbar';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import InternshipList from './pages/InternshipList';
import HackathonList from './pages/HackathonList';
import AddOpportunity from './pages/AddOpportunity';
import EditOpportunity from './pages/EditOpportunity';
import StatusBoard from './pages/StatusBoard';
import Calendar from './pages/Calendar';
import Reports from './pages/Reports';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/internships" element={<InternshipList />} />
          <Route path="/hackathons" element={<HackathonList />} />
          <Route path="/add" element={<AddOpportunity />} />
          <Route path="/edit/:id" element={<EditOpportunity />} />
          <Route path="/status-board" element={<StatusBoard />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/reports" element={<Reports />} />
        </Routes>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </div>
    </Router>
  );
}

export default App;
