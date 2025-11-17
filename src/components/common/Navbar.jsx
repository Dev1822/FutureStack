import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/internships', label: 'Internships' },
    { path: '/hackathons', label: 'Hackathons' },
    { path: '/status-board', label: 'Status Board' },
    { path: '/calendar', label: 'Calendar' },
    { path: '/reports', label: 'Reports' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="backdrop-blur-sm bg-black/40 text-white border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand with improved typography */}
          <Link 
            to="/" 
            className="text-xl font-semibold tracking-tight text-white hover:text-blue-400 transition-colors"
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            FutureStack
          </Link>

          {/* Desktop Navigation with improved spacing */}
          <div className="hidden md:flex gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-200 ${
                  isActive(link.path)
                    ? 'text-white font-semibold'
                    : 'text-gray-300 hover:text-white'
                }`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Toggle menu"
          >
            {isOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation with improved touch targets */}
      {isOpen && (
        <div className="md:hidden bg-black/60 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block py-3 px-4 rounded-md text-base font-medium transition-colors ${
                  isActive(link.path)
                    ? 'bg-blue-600/20 text-blue-400 font-semibold'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`}
                style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
