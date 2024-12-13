import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as jwtDecode from 'jwt-decode';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Edit, Trash2, Calendar, ChevronLeft, ChevronRight, Eye } from 'lucide-react';

const Button = ({ children, primary, className, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
      primary
        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
        : 'bg-white text-purple-600 hover:bg-purple-50 border border-purple-600'
    } ${className}`}
  >
    {children}
  </button>
);

const Modal = ({ isOpen, onClose, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [className, setClassName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState(null);
  const [editingSession, setEditingSession] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showMySessions, setShowMySessions] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sessionsPerPage] = useState(6);
  const [viewingSession, setViewingSession] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessions();
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = jwtDecode.jwtDecode(token);
      setCurrentUser(decoded);
    }
  }, []);

  useEffect(() => {
    if (!editingSession) {
      setDate(new Date().toISOString().split('T')[0]);
    }
  }, [editingSession]);

  const validateTime = (timeString) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours > 10 || (hours === 10 && minutes >= 0)) && (hours < 17 || (hours === 17 && minutes === 0));
  };

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/sessions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSessions(response.data);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError('Failed to fetch sessions. Please try again later.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateTime(time)) {
      setError('Please select a time between 10 AM and 5 PM.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('className', className);
      formData.append('date', date);
      formData.append('time', time);
      formData.append('venue', venue);
      formData.append('description', description);
      if (image) {
        formData.append('image', image);
      }

      let response;
      if (editingSession) {
        response = await axios.put(`http://localhost:3000/sessions/${editingSession.id}`, formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      } else {
        response = await axios.post('http://localhost:3000/sessions', formData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        });
      }

      setClassName('');
      setDate('');
      setTime('');
      setVenue('');
      setDescription('');
      setImage(null);
      setIsModalOpen(false);
      setEditingSession(null);
      fetchSessions();
    } catch (error) {
      console.error('Error posting/editing session:', error);
      if (error.response) {
        if (error.response.status === 401) {
          setError('You are not authorized to perform this action. Please log in again.');
        } else if (error.response.status === 403) {
          setError('You do not have permission to perform this action. Only approved doctors can manage sessions.');
        } else {
          setError(error.response.data.message || 'An error occurred while processing your request.');
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
      if (error.response && error.response.status === 401) {
        setError('You are not authorized to delete this session. Please log in again.');
      } else {
        setError('Failed to delete session. Please try again.');
      }
    }
  };

  const handleEdit = (session) => {
    setEditingSession(session);
    setClassName(session.className);
    setDate(session.date);
    setTime(session.time);
    setVenue(session.venue);
    setDescription(session.description);
    setIsModalOpen(true);
  };

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.venue.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = showMySessions ? session.doctor.id === currentUser?.id : true;
    return matchesSearch && matchesUser;
  });

  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstSession, indexOfLastSession);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const canAddOrEditSessions = currentUser && currentUser.role === 'doctor' && currentUser.status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-white text-gray-800">
      <div className="max-w-6xl mx-auto py-20 px-4 sm:px-6 lg:px-8">
        <motion.h2 
          className="text-4xl font-bold mb-8 text-center text-gray-800"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Explore Our Sessions
        </motion.h2>
        
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 px-4 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
            <Search className="absolute right-3 top-2.5 text-gray-400" size={20} />
          </div>
          <div className="flex items-center space-x-4">
            {canAddOrEditSessions && (
              <>
                <label className="flex items-center space-x-2 text-sm">
                  <input
                    type="checkbox"
                    checked={showMySessions}
                    onChange={(e) => setShowMySessions(e.target.checked)}
                    className="form-checkbox h-4 w-4 text-purple-600 transition duration-150 ease-in-out"
                  />
                  <span>My Sessions</span>
                </label>
                <Button primary onClick={() => {
                  setEditingSession(null);
                  setClassName('');
                  setDate('');
                  setTime('');
                  setVenue('');
                  setDescription('');
                  setImage(null);
                  setIsModalOpen(true);
                }}>
                  Create Session
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {currentSessions.map((session) => (
            <motion.div
              key={session.id}
              className="bg-white rounded-lg shadow-xl overflow-hidden"
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {session.image && (
                <img src={`http://localhost:3000${session.image}`} alt={session.className} className="w-full h-48 object-cover" />
              )}
              <div className="p-6">
                <h3 className="text-xl font-semibold mb-2">{session.className}</h3>
                <p className="text-gray-600 mb-4">{session.description.substring(0, 100)}...</p>
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-gray-500">By: Dr. {session.doctor.username}</p>
                  <div className="flex items-center">
                    <Calendar className="text-purple-600 mr-1" size={16} />
                    <span className="text-sm font-semibold">{new Date(session.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <Button className="flex justify-between items-center" onClick={() => setViewingSession(session)}>
                    <Eye size={16} className="mr-2" />
                    View Details
                  </Button>
                  {canAddOrEditSessions && session.doctor.id === currentUser.id && (
                    <div className="flex space-x-2">
                      <button onClick={() => handleEdit(session)} className="text-blue-500 hover:text-blue-600">
                        <Edit size={20} />
                      </button>
                      <button onClick={() => handleDelete(session.id)} className="text-red-500 hover:text-red-600">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            {Array.from({ length: Math.ceil(filteredSessions.length / sessionsPerPage) }).map((_, index) => (
              <button
                key={index}
                onClick={() => paginate(index + 1)}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                  currentPage === index + 1 ? 'text-indigo-600 bg-indigo-50' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {index + 1}
              </button>
            ))}
            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === Math.ceil(filteredSessions.length / sessionsPerPage)}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </nav>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-2xl font-bold mb-4">{editingSession ? 'Edit Session' : 'Create Session'}</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Class Name"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />
          <input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            min="10:00"
            max="17:00"
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />
          <input
            type="text"
            placeholder="Venue"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full mb-4 p-2 border border-gray-300 rounded"
            rows="4"
          ></textarea>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            className="mb-4"
          />
          <div className="flex justify-end space-x-2">
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button primary type="submit">{editingSession ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={!!viewingSession} onClose={() => setViewingSession(null)}>
        {viewingSession && (
          <div>
            <h3 className="text-2xl font-bold mb-4">{viewingSession.className}</h3>
            {viewingSession.image && (
              <img src={`http://localhost:3000${viewingSession.image}`} alt={viewingSession.className} className="w-full h-48 object-cover mb-4 rounded" />
            )}
            <p className="text-gray-600 mb-4">{viewingSession.description}</p>
            <p className="text-sm text-gray-500 mb-2">By: Dr. {viewingSession.doctor.username}</p>
            <p className="text-sm text-gray-500 mb-2">Date: {new Date(viewingSession.date).toLocaleDateString()}</p>
            <p className="text-sm text-gray-500 mb-2">Time: {viewingSession.time}</p>
            <p className="text-sm text-gray-500 mb-4">Venue: {viewingSession.venue}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default Sessions;

