
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format, addDays, parseISO, isBefore, isAfter, startOfDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Edit, X, Search, Filter, ChevronLeft, ChevronRight, CreditCard } from 'lucide-react';
import * as jwtDecode from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const Button = ({ children, variant = "default", onClick, disabled, className, icon: Icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-2
      ${variant === "primary" 
        ? "bg-purple-600 hover:bg-purple-700 text-white shadow-lg hover:shadow-xl" 
        : variant === "outline"
        ? "border border-purple-200 text-purple-600 hover:bg-purple-50"
        : "bg-white hover:bg-gray-50 text-gray-900"}
      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      ${className}
    `}
  >
    {Icon && <Icon className="w-4 h-4" />}
    {children}
  </button>
);

const Card = ({ children, className }) => (
  <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
    {children}
  </div>
);

const Input = ({ label, id, type, value, onChange, className, icon: Icon, min }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
      {label}
    </label>
    <div className="relative">
      {Icon && (
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Icon className="h-5 w-5 text-gray-400" />
        </div>
      )}
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        min={min}
        className={`
          block w-full rounded-lg border border-gray-300 
          ${Icon ? 'pl-10' : 'pl-3'} pr-3 py-2
          focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
          ${className}
        `}
      />
    </div>
  </div>
);

const ListDoctors = () => {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [bookingDate, setBookingDate] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priceFilter, setPriceFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState('');
  const [showAppointments, setShowAppointments] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [doctorsPerPage] = useState(6);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    fetchDoctors();
    const token = localStorage.getItem('token');
    if (token) {
      const decodedToken = jwtDecode.jwtDecode(token);
      setCurrentUser({
        id: decodedToken.id,
        role: decodedToken.role,
        username: decodedToken.username
      });
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser]);

  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setIsRazorpayLoaded(true);
      };
      document.body.appendChild(script);
    };

    if (!window.Razorpay) {
      loadRazorpay();
    } else {
      setIsRazorpayLoaded(true);
    }
  }, []);


  useEffect(() => {
    const timer = setInterval(() => {
      deletePassedAppointments();
    }, 60000); 

    return () => clearInterval(timer);
  }, [appointments]);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get('http://localhost:3000/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      setError('Failed to fetch doctors. Please try again later.');
    }
  };

  const fetchAppointments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/appointments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (currentUser.role === 'doctor') {
        setAppointments(response.data.filter(appointment => appointment.doctor.id === currentUser.id));
      } else {
        setAppointments(response.data);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Failed to fetch appointments. Please try again later.');
    }
  };

  const checkAvailability = async (doctorId, date, time) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:3000/check-availability`, {
        params: { doctorId, date, time },
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log(`Availability check result for doctorId: ${doctorId}, date: ${date}, time: ${time}:`, response.data.available);
      return response.data.available;
    } catch (error) {
      console.error('Error checking availability:', error);
      setError('Failed to check availability. Please try again.');
      return false;
    }
  };

  const deletePassedAppointments = useCallback(async () => {
    const now = new Date();
    const passedAppointments = appointments.filter(appointment => {
      const appointmentDateTime = parseISO(`${appointment.date}T${appointment.time}`);
      return isBefore(appointmentDateTime, now);
    });

    for (const appointment of passedAppointments) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/appointments/${appointment.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch (error) {
        console.error('Error deleting passed appointment:', error);
      }
    }

    if (passedAppointments.length > 0) {
      fetchAppointments();
    }
  }, [appointments]);

  const handleBookAppointment = async (doctor) => {
    setSelectedDoctor(doctor);
    setShowModal(true);
    setError('');
    setPaymentStatus('');
  };

  const handleDateTimeChange = async (date, time) => {
    if (!date || !time) return;

    const selectedDate = new Date(date);
    const today = startOfDay(new Date());

    if (isBefore(selectedDate, today)) {
      setError('Please select a date from today onwards.');
      return;
    }

    const [hours, minutes] = time.split(':');
    const appointmentTime = new Date(date);
    appointmentTime.setHours(parseInt(hours), parseInt(minutes));

    const openingTime = new Date(date);
    openingTime.setHours(10, 0, 0);
    const closingTime = new Date(date);
    closingTime.setHours(17, 0, 0);

    if (appointmentTime < openingTime || appointmentTime > closingTime) {
      setError('Appointments are only available between 10:00 AM and 5:00 PM.');
      return;
    }

    const formattedDate = format(new Date(date), 'yyyy-MM-dd');
    const isAvailable = await checkAvailability(selectedDoctor.id, formattedDate, time);
    if (!isAvailable) {
      setError('This slot is not available. Please choose another time.');
    } else {
      setError('');
    }
  };

  const initiatePayment = async () => {
    if (!isRazorpayLoaded) {
      setError('Payment gateway is not loaded yet. Please try again in a moment.');
      return;
    }

    const formattedDate = format(new Date(bookingDate), 'yyyy-MM-dd');
    const isAvailable = await checkAvailability(selectedDoctor.id, formattedDate, bookingTime);
    if (!isAvailable) {
      setError('This slot is no longer available. Please choose another time.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/create-order', {
        amount: selectedDoctor.price * 100, 
        currency: 'INR',
        receipt: `receipt_${Date.now()}`,
        notes: {
          doctorId: selectedDoctor.id,
          date: format(new Date(bookingDate), 'yyyy-MM-dd'),
          time: bookingTime
        }
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const options = {
        key: 'rzp_test_jnFll4vBKCwPho', 
        amount: response.data.amount,
        currency: response.data.currency,
        name: 'Doctor Appointment',
        description: `Appointment with Dr. ${selectedDoctor.username}`,
        order_id: response.data.id,
        handler: function (response) {
          setPaymentStatus('success');
          submitBooking(response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
        },
        prefill: {
          name: localStorage.getItem('username'),
          email: localStorage.getItem('email'),
          contact: localStorage.getItem('phone') || ''
        },
        theme: {
          color: '#7C3AED'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error initiating payment:', error);
      setError('Failed to initiate payment. Please try again.');
    }
  };


  const submitBooking = async (paymentId, orderId, signature) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:3000/bookAppointment', {
        doctorId: selectedDoctor.id,
        date: format(new Date(bookingDate), 'yyyy-MM-dd'),
        time: bookingTime,
        paymentId,
        orderId,
        signature
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setShowModal(false);
      fetchAppointments();
      setError('');
      setPaymentStatus('success');
      
      alert('Appointment booked successfully! A confirmation email has been sent to your registered email address.');
    } catch (error) {
      console.error('Error booking appointment:', error);
      setError('Failed to book appointment. Please try again.');
    }
  };



  const startEditingAppointment = (appointment) => {
    const appointmentDate = parseISO(appointment.date);
    const twoDaysFromNow = addDays(new Date(), 2);

    if (isBefore(appointmentDate, twoDaysFromNow)) {
      setError('Cannot update appointment within 2 days of the scheduled date.');
      return;
    }

    setEditingAppointment({
      ...appointment,
      date: format(appointmentDate, 'yyyy-MM-dd'),
    });
    setError('');
  };

  const updateAppointment = async (id) => {
    if (!editingAppointment) return;

    const appointmentDate = parseISO(editingAppointment.date);
    const twoDaysFromNow = addDays(new Date(), 2);

    if (isBefore(appointmentDate, twoDaysFromNow)) {
      setError('Cannot update appointment within 2 days of the scheduled date.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/appointments/${id}`, {
        date: format(appointmentDate, 'yyyy-MM-dd'),
        time: editingAppointment.time
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
      setEditingAppointment(null);
      setError('');
    } catch (error) {
      console.error('Error updating appointment:', error);
      setError('Failed to update appointment. Please try again.');
    }
  };

  const deleteAppointment = async (id, date) => {
    const appointmentDate = parseISO(date);
    const twoDaysFromNow = addDays(new Date(), 2);

    if (isBefore(appointmentDate, twoDaysFromNow)) {
      setError('Cannot cancel appointment within 2 days of the scheduled date.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3000/appointments/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchAppointments();
      setError('');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      setError('Failed to cancel appointment. Please try again.');
    }
  };

  const isAppointmentEditable = (date) => {
    const appointmentDate = parseISO(date);
    const twoDaysFromNow = addDays(new Date(), 2);
    return !isBefore(appointmentDate, twoDaysFromNow);
  };

  const filteredDoctors = doctors.filter(doctor => 
    doctor.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (priceFilter === '' || doctor.price <= parseInt(priceFilter)) &&
    (availabilityFilter === '' || doctor.availability === availabilityFilter)
  );

  const indexOfLastDoctor = currentPage * doctorsPerPage;
  const indexOfFirstDoctor = indexOfLastDoctor - doctorsPerPage;
  const currentDoctors = filteredDoctors.slice(indexOfFirstDoctor, indexOfLastDoctor);
  const totalPages = Math.ceil(filteredDoctors.length / doctorsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 pt-20 p-6">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-900">Find Your Doctor</h1>
          <Button
            onClick={() => setShowAppointments(!showAppointments)}
            variant="outline"
            icon={showAppointments ? ChevronRight : ChevronLeft}
          >
            {showAppointments ? 'Hide Appointments' : 'Show Appointments'}
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          
          <div className="lg:w-full">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              
              <Card>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    label="Search Doctors"
                    id="search"
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    icon={Search}
                  />
                  <Input
                    label="Max Price"
                    id="price"
                    type="number"
                    value={priceFilter}
                    onChange={(e) => setPriceFilter(e.target.value)}
                    icon={Filter}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Availability
                    </label>
                    <select
                      value={availabilityFilter}
                      onChange={(e) => setAvailabilityFilter(e.target.value)}
                      className="block w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    >
                      <option value="">All</option>
                      <option value="available">Available</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
              </Card>

              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentDoctors.map((doctor) => (
                  <motion.div
                    key={doctor.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    layout
                  >
                    <Card>
                      <h2 className="text-xl font-semibold text-purple-900 mb-4">{doctor.username}</h2>
                      <div className="space-y-2 text-gray-600 mb-4">
                        <p>Email: {doctor.email}</p>
                        <p>Price: ₹ {doctor.price}</p>
                        <p className="flex items-center gap-2">
                          Availability: 
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            doctor.availability === 'available' 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {doctor.availability}
                          </span>
                        </p>
                      </div>
                      {doctor.availability === 'available' && currentUser && currentUser.role !== 'doctor' && (
                        <Button 
                          variant="primary" 
                          onClick={() => handleBookAppointment(doctor)}
                          icon={Calendar}
                        >
                          Book Appointment
                        </Button>
                      )}
                      {currentUser && currentUser.role === 'doctor' && currentUser.id === doctor.id && (
                        <div className="mt-2 flex justify-end space-x-2">
                          <Button
                            onClick={() => navigate('/doctor-profile')}
                            variant="outline"
                            icon={Edit}
                          >
                            Edit Profile
                          </Button>
                        </div>
                      )}
                    </Card>
                  </motion.div>
                ))}
              </div>


              <div className="flex justify-center mt-6 space-x-2">
                <Button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 1}
                  icon={ChevronLeft}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4 py-2 bg-white rounded-lg">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  icon={ChevronRight}
                >
                  Next
                </Button>
              </div>
            </motion.div>
          </div>


          <AnimatePresence>
            {showAppointments && (
              <motion.div 
                className="lg:w-1/3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Card className="sticky top-6">
                  <h2 className="text-2xl font-bold text-purple-900 mb-6">
                    {currentUser.role === 'doctor' ? 'My Patients' : 'My Appointments'}
                  </h2>
                  <div className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                    {appointments.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No appointments found</p>
                    ) : (
                      appointments.map((appointment) => (
                        <motion.div
                          key={appointment.id}
                          className="bg-gray-50 rounded-lg p-4"
                          layout
                        >
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-lg">
                              {currentUser.role === 'doctor' ? appointment.user.username : appointment.doctor.username}
                            </h3>
                          </div>
                          <div className="space-y-2 text-gray-600 mb-3">
                            <p className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              {format(parseISO(appointment.date), 'MMM dd, yyyy')}
                            </p>
                            <p className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              {appointment.time}
                            </p>
                          </div>
                          {currentUser.role !== 'doctor' && (
                            <div className="flex justify-end gap-2">
                              <Button
                                onClick={() => startEditingAppointment(appointment)}
                                disabled={!isAppointmentEditable(appointment.date)}
                                variant="outline"
                                icon={Edit}
                              >
                                Update
                              </Button>
                              <Button
                                onClick={() => deleteAppointment(appointment.id, appointment.date)}
                                disabled={!isAppointmentEditable(appointment.date)}
                                variant="outline"
                                icon={X}
                              >
                                Cancel
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      ))
                    )}
                  </div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      
      <AnimatePresence>
        {showModal && currentUser && currentUser.role !== 'doctor' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-xl font-bold text-purple-900 mb-4">
                Book Appointment with {selectedDoctor?.username}
              </h3>
              <Input
                label="Date"
                id="date"
                type="date"
                value={bookingDate}
                onChange={(e) => {
                  setBookingDate(e.target.value);
                  handleDateTimeChange(e.target.value, bookingTime);
                }}
                min={format(new Date(), 'yyyy-MM-dd')}
                icon={Calendar}
              />
              <Input
                label="Time"
                id="time"
                type="time"
                value={bookingTime}
                onChange={(e) => {
                  setBookingTime(e.target.value);
                  handleDateTimeChange(bookingDate, e.target.value);
                }}
                icon={Clock}
              />
              <div className="mt-4">
                <p className="text-lg font-semibold text-purple-900">
                  Price: ₹ {selectedDoctor?.price}
                </p>
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  icon={X}
                >
                  Cancel
                </Button>
                <Button
                  onClick={initiatePayment}
                  variant="primary"
                  icon={CreditCard}
                  disabled={!bookingDate || !bookingTime || !isRazorpayLoaded}
                >
                  {isRazorpayLoaded ? 'Pay and Book' : 'Loading Payment...'}
                </Button>
              </div>
              {paymentStatus === 'success' && (
                <p className="mt-4 text-green-600 font-semibold">
                  Payment successful! Your appointment is booked.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg"
            role="alert"
          >
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ListDoctors;


