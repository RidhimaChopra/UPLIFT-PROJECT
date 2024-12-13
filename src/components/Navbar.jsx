


import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const NavLink = ({ href, children }) => (
  <a href={href} className="text-gray-200 hover:text-white transition-colors duration-300">
    {children}
  </a>
);

const Button = ({ children, primary, className, onClick }) => (
  <button
    onClick={onClick}
    className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 ${
      primary
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
        : 'bg-white text-purple-600 hover:bg-purple-50'
    } ${className}`}
  >
    {children}
  </button>
);

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const { scrollYProgress } = useScroll();
  const navigate = useNavigate();

  useEffect(() => {
    const checkLoginStatus = () => {
      const token = localStorage.getItem('token');
      const storedUsername = localStorage.getItem('username');
      if (token && storedUsername) {
        setIsLoggedIn(true);
        setUsername(storedUsername);
      } else {
        setIsLoggedIn(false);
        setUsername('');
      }
    };

    checkLoginStatus();
    window.addEventListener('storage', checkLoginStatus);

    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsLoggedIn(false);
    setUsername('');
    navigate('/');
  };

  return (
    <>
      <nav className="fixed w-full z-50 bg-gradient-to-r text-white from-purple-900 to-indigo-900">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold">Uplift</div>
            <div className="hidden md:flex space-x-8">
              <Link to="/">Home</Link>
              <Link to="/articles">Articles</Link>
              <Link to="/doctors">Appointments</Link>
              
              <Link to="/sessions">Sessions</Link>
            </div>
            <div className="hidden md:flex space-x-4">
              {isLoggedIn ? (
                <>
                  <span className="self-center">Hi, {username}</span>
                  <Button onClick={handleLogout}>Log Out</Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button>Log In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button primary>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-purple-800 py-4"
          >
            <div className="container mx-auto px-6 flex flex-col space-y-4">
              <NavLink href="#about">About</NavLink>
              <NavLink href="#features">Features</NavLink>
              <Link to="/doctors">Appointments</Link>
              <Link to="/articles">Articles</Link>
              <Link to="/sessions">Sessions</Link>
              {isLoggedIn ? (
                <>
                  <span className="text-white">Hi, {username}</span>
                  <Button onClick={handleLogout}>Log Out</Button>
                </>
              ) : (
                <>
                  <Link to="/login">
                    <Button>Log In</Button>
                  </Link>
                  <Link to="/signup">
                    <Button primary>Sign Up</Button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </nav>

      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-indigo-500 z-50 origin-left"
        style={{ scaleX: scrollYProgress }}
      />
    </>
  );
}

export default Navbar;

