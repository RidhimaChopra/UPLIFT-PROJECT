import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Chatbot from './Chatbot'; // Import the Chatbot component


function Layout() {
  
  const location = useLocation();

  // Check if the current route is not the login or signup page
  const showChatbot = !['/login', '/signup'].includes(location.pathname);

  return (
    <>
      <Navbar />
      <Outlet />
      <Footer />

      {showChatbot && <Chatbot />}  {/* Render Chatbot component based on route */}
    </>
  );
}

export default Layout;
