


import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Appointment() {
  const [doctorId, setDoctorId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSlotBooked, setIsSlotBooked] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    setDate(today);
  }, [today]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:3000/bookAppointment',
        { doctorId, date, time },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201) {
        setIsSlotBooked(true); // Slot is successfully booked
        setErrorMessage(''); // Clear previous errors
        alert('Appointment booked successfully! Proceeding to payment...');
        // Add payment redirection logic here if required
      }
    } catch (error) {
      setIsSlotBooked(false); // Prevent payment
      if (error.response && error.response.status === 400) {
        // Handle already booked slot error
        setErrorMessage(error.response.data.message || 'This slot is already booked. Please choose another time.');
      } else {
        // Handle other unexpected errors
        setErrorMessage('An unexpected error occurred. Please try again later.');
      }
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-10 px-4">
      <h2 className="text-3xl font-bold mb-6">Book an Appointment</h2>
      {errorMessage && (
        <div className="mb-4 text-red-500 font-bold">
          {errorMessage}
        </div>
      )}
      <form onSubmit={handleSubmit} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="doctorId" className="block text-gray-700 font-bold mb-2">Doctor ID</label>
          <input
            type="text"
            id="doctorId"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="date" className="block text-gray-700 font-bold mb-2">Date</label>
          <input
            type="date"
            id="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full p-2 border rounded"
            min={today}
            required
          />
        </div>
        <div className="mb-4">
          <label htmlFor="time" className="block text-gray-700 font-bold mb-2">Time</label>
          <input
            type="time"
            id="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          Book Appointment
        </button>
      </form>
      {/* Payment button */}
      <button
        onClick={() => alert('Proceeding to payment...')}
        disabled={!isSlotBooked} // Disable unless slot is booked
        className={`bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 mt-4 ${!isSlotBooked ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        Proceed to Payment
      </button>
    </div>
  );
}

export default Appointment;
