import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Admin from './components/Admin';
import Article from './components/Articles';
import ListDoctors from './components/ListDoctors';
import Appointment from './components/Appointments';
import Session from './components/Sessions';
import Chatbot from './components/Chatbot';  // Import the Chatbot
import DoctorProfile from './components/DoctorProfile'; // Import DoctorProfile component

import "./App.css";

function App() {
  const username = localStorage.getItem('username');  // Get the username

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="/articles" element={<Article />} />
          <Route path="/doctors" element={<ListDoctors />} />
          <Route path="/appointments" element={<Appointment />} />
          <Route path="/sessions" element={<Session />} />
          <Route path="admin" element={<Admin />} />
          <Route path="/doctor-profile" element={<DoctorProfile />} /> {/* Add route for DoctorProfile */}
          {/* Add a fallback route for unmatched URLs */}
          <Route path="*" element={<Home />} />
        </Route>
      </Routes>

       <Chatbot username={username} ></Chatbot>
    </Router>
  );
}

export default App;

