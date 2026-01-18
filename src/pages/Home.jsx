import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiActivity, FiBriefcase, FiCode, FiArrowRight, FiGithub, FiLinkedin, FiTwitter } from 'react-icons/fi';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/clerk-react';
import SEO from '../components/seo/SEO';

const Home = () => {
  const navigate = useNavigate();

  useEffect(() => {
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500 selection:text-white overflow-x-hidden">
      <SEO
        title={null}
        description="Free opportunity tracker for students and developers. Organize job applications, track internship stages, never miss hackathon deadlines. Kanban boards, calendar view, and PDF reports."
        keywords="job tracker, internship tracker, hackathon tracker, application tracker, career tracker, job application organizer, student tools, developer tools, opportunity tracker"
        canonical="/"
      />
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-black via-transparent to-transparent" />

        {/* Subtle Glows */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-white/5 rounded-full blur-[120px]" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
              <span className="font-bold text-black text-xl">F</span>
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              FutureTracker
            </span>
          </div>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="https://github.com/Venkat-Kolasani/FutureStack" target="_blank" rel="noreferrer" className="hover:text-white transition-colors">GitHub</a>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <SignedOut>
              {/* Sign In hidden on mobile - users can use hero CTA */}
              <SignInButton mode="modal">
                <button className="hidden sm:block px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-black text-xs sm:text-sm font-semibold rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 sm:px-5 sm:py-2.5 bg-white text-black text-xs sm:text-sm font-semibold rounded-full hover:bg-gray-200 transition-all transform hover:scale-105 active:scale-95"
              >
                Launch App
              </button>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      {/* Hero Section */}
      <main className="relative z-10 min-h-screen flex flex-col justify-center pt-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight">
              Build Your Future, <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-400">
                One Opportunity at a Time
              </span>
            </h1>

            <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              The all-in-one workspace for students and developers to track internships,
              manage hackathons, and visualize career progress.
            </p>

            <div className="flex items-center justify-center gap-4">
              <SignedOut>
                <SignUpButton mode="modal">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                  >
                    Get Started Free
                    <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-8 py-4 border border-white/20 hover:border-white/40 text-white rounded-xl font-semibold text-lg transition-all"
                  >
                    Sign In
                  </motion.button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard')}
                  className="px-8 py-4 bg-white hover:bg-gray-100 text-black rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2 group shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
                >
                  Go to Dashboard
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </SignedIn>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Stats/Social Proof */}
      <div id="about" className="mt-20 border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          {[
            { label: 'Organized', value: '100%' },
            { label: 'Missed Deadlines', value: '0' },
            { label: 'Opportunities', value: '∞' },
          ].map((stat, index) => (
            <div key={index}>
              <div className="text-5xl md:text-6xl font-bold text-white mb-2">{stat.value}</div>
              <div className="text-sm text-gray-400 font-medium tracking-wide">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features Grid */}
      <div id="features" className="max-w-7xl mx-auto mt-32">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Everything you need to succeed</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Stop using spreadsheets. FutureTracker gives you a powerful, dedicated environment
            to manage your career growth.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: <FiBriefcase className="w-6 h-6 text-white" />,
              title: "Internship Tracker",
              desc: "Keep track of applications, deadlines, and interview stages in one organized board.",
              gradient: "from-white/10 to-white/5"
            },
            {
              icon: <FiCode className="w-6 h-6 text-white" />,
              title: "Hackathon Manager",
              desc: "Manage teams, project ideas, and submission deadlines for your next hackathon.",
              gradient: "from-white/10 to-white/5"
            },
            {
              icon: <FiActivity className="w-6 h-6 text-white" />,
              title: "Progress Analytics",
              desc: "Visualize your application rates and success metrics with beautiful charts.",
              gradient: "from-white/10 to-white/5"
            }
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all duration-300 hover:-translate-y-1"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-500`} />
              <div className="relative z-10">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Footer */}
      <footer className="border-t border-white/10 bg-black mt-32">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-white rounded-md flex items-center justify-center">
                <span className="font-bold text-black text-xs">F</span>
              </div>
              <span className="font-bold text-gray-300">FutureTracker</span>
            </div>

            <div className="flex gap-6">
              <a href="https://github.com/Venkat-Kolasani/FutureStack" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><FiGithub className="w-5 h-5" /></a>
              <a href="https://twitter.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><FiTwitter className="w-5 h-5" /></a>
              <a href="https://linkedin.com" target="_blank" rel="noreferrer" className="text-gray-500 hover:text-white transition-colors"><FiLinkedin className="w-5 h-5" /></a>
            </div>

            <div className="text-sm text-gray-600">
              © 2025 FutureTracker. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div >
  );
};

export default Home;
