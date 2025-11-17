import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();
  const [titleVisible, setTitleVisible] = useState(false);
  const [taglineVisible, setTaglineVisible] = useState(false);
  const [buttonVisible, setButtonVisible] = useState(false);

  useEffect(() => {
    // Staggered fade-in animation
    setTimeout(() => setTitleVisible(true), 300);
    setTimeout(() => setTaglineVisible(true), 500);
    setTimeout(() => setButtonVisible(true), 700);
  }, []);

  return (
    <div className="relative min-h-screen bg-black flex items-center justify-center px-4 overflow-hidden">
      {/* Subtle background glow - more visible */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-br from-purple-500/30 via-blue-500/25 to-pink-500/20 rounded-full filter blur-[100px]"></div>
      <div className="absolute top-1/3 left-1/3 w-[400px] h-[400px] bg-blue-600/20 rounded-full filter blur-[80px] animate-pulse"></div>
      
      {/* Hero Section */}
      <div className="relative z-10 text-center max-w-2xl mx-auto min-h-screen flex flex-col justify-center pt-8">
        {/* Title with staggered fade-in */}
        <h1 
          className={`text-6xl md:text-8xl font-extrabold text-white mb-8 tracking-tight transition-all duration-700 ${
            titleVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          FutureStack
        </h1>
        
        {/* Tagline with improved spacing and contrast */}
        <p 
          className={`text-2xl md:text-3xl text-gray-300 font-medium mb-6 tracking-wide transition-all duration-700 ${
            taglineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          Build your future, one opportunity at a time
        </p>
        
        {/* Description with better readability */}
        <p 
          className={`text-base md:text-lg text-gray-400 font-light mb-12 max-w-xl mx-auto leading-relaxed transition-all duration-700 ${
            taglineVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
        >
          Your all-in-one tracker for internships, hackathons, deadlines, and progress.
        </p>
        
        {/* Premium CTA Button with gradient and glow */}
        <div 
          className={`transition-all duration-700 ${
            buttonVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <button
            onClick={() => navigate('/dashboard')}
            className="relative w-full md:w-auto px-8 py-4 text-lg font-semibold text-black bg-white rounded-lg shadow-lg hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:bg-gray-100 transition-all duration-300 transform hover:scale-105"
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
