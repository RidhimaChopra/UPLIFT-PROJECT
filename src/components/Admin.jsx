import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Admin = () => {
  const [doctors, setDoctors] = useState([]);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:3000/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setDoctors(response.data.filter(user => user.role === 'doctor'));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const updateDoctor = async (id, status, availability, price) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3000/doctors/${id}`, 
        { status, availability, price },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchDoctors();
    } catch (error) {
      console.error('Error updating doctor:', error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <div className="overflow-x-auto">
        <table className="w-full bg-white shadow-md rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-gray-600 uppercase text-sm leading-normal">
              <th className="py-3 px-6 text-left">Username</th>
              <th className="py-3 px-6 text-left">Email</th>
              <th className="py-3 px-6 text-left">Status</th>
              <th className="py-3 px-6 text-left">Availability</th>
              <th className="py-3 px-6 text-left">Price</th>
              <th className="py-3 px-6 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="text-gray-600 text-sm font-light">
            {doctors.map((doctor) => (
              <tr key={doctor.id} className="border-b border-gray-200 hover:bg-gray-100">
                <td className="py-3 px-6 text-left whitespace-nowrap">
                  {doctor.username}
                </td>
                <td className="py-3 px-6 text-left">
                  {doctor.email}
                </td>
                <td className="py-3 px-6 text-left">
                  <select
                    value={doctor.status}
                    onChange={(e) => updateDoctor(doctor.id, e.target.value, doctor.availability, doctor.price)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </td>
                <td className="py-3 px-6 text-left">
                  <select
                    value={doctor.availability}
                    onChange={(e) => updateDoctor(doctor.id, doctor.status, e.target.value, doctor.price)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  >
                    <option value="available">Available</option>
                    <option value="unavailable">Unavailable</option>
                  </select>
                </td>
                <td className="py-3 px-6 text-left">
                  <input
                    type="number"
                    value={doctor.price}
                    onChange={(e) => updateDoctor(doctor.id, doctor.status, doctor.availability, e.target.value)}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  />
                </td>
                <td className="py-3 px-6 text-left">
                  <button
                    onClick={() => updateDoctor(doctor.id, doctor.status, doctor.availability, doctor.price)}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Update
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Admin;

