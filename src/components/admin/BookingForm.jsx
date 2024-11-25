import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import { propertyService } from '../../services/propertyService';
import { clientService } from '../../services/clientService';
import { bookingService } from '../../services/bookingService';
import "react-datepicker/dist/react-datepicker.css";

export function BookingForm({ onSubmit, onCancel, initialData = null }) {
  const [properties, setProperties] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [formData, setFormData] = useState({
    propertyId: '',
    clientId: '',
    checkIn: new Date(),
    checkOut: new Date(new Date().setDate(new Date().getDate() + 7)),
    status: 'pending',
    totalAmount: '',
    paymentStatus: 'pending',
    notes: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        checkIn: initialData.checkIn instanceof Date ? initialData.checkIn : new Date(initialData.checkIn),
        checkOut: initialData.checkOut instanceof Date ? initialData.checkOut : new Date(initialData.checkOut)
      });
      // Load the selected property for initial data
      if (initialData.propertyId) {
        loadProperty(initialData.propertyId);
      }
    }
    loadFormData();
  }, [initialData]);

  const loadFormData = async () => {
    try {
      const [propertiesData, clientsData] = await Promise.all([
        propertyService.getAll(),
        clientService.getAll()
      ]);
      setProperties(propertiesData);
      setClients(clientsData);
    } catch (error) {
      console.error('Error loading form data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadProperty = async (propertyId) => {
    try {
      const property = await propertyService.getById(propertyId);
      setSelectedProperty(property);
      calculateTotalAmount(property, formData.checkIn, formData.checkOut);
    } catch (error) {
      console.error('Error loading property:', error);
    }
  };

  const calculateTotalAmount = (property, checkIn, checkOut) => {
    if (!property || !property.price || !checkIn || !checkOut) return;

    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.error('Invalid dates:', { checkIn, checkOut });
        return;
      }

      const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      if (nights <= 0) return;

      const total = (nights * property.price).toFixed(2);
      setFormData(prev => ({
        ...prev,
        totalAmount: total
      }));
    } catch (error) {
      console.error('Error calculating total amount:', error);
    }
  };

  const handlePropertyChange = async (e) => {
    const propertyId = e.target.value;
    setFormData(prev => ({
      ...prev,
      propertyId
    }));

    if (propertyId) {
      await loadProperty(propertyId);
    } else {
      setSelectedProperty(null);
      setFormData(prev => ({
        ...prev,
        totalAmount: ''
      }));
    }
  };

  const handleDateChange = async (date, field) => {
    setError(null); // Clear any previous errors
    const newFormData = {
      ...formData,
      [field]: date
    };
    setFormData(newFormData);

    if (selectedProperty && newFormData.checkIn && newFormData.checkOut) {
      // Check availability when dates change
      try {
        const availability = await bookingService.checkAvailability(
          selectedProperty.id,
          newFormData.checkIn,
          newFormData.checkOut,
          initialData?.id // Pass booking ID if we're editing
        );

        if (!availability.available) {
          const conflictDates = {
            start: availability.conflictingBooking.checkIn.toLocaleDateString(),
            end: availability.conflictingBooking.checkOut.toLocaleDateString()
          };
          setError(`Property is not available for the selected dates. There is a conflicting booking from ${conflictDates.start} to ${conflictDates.end}`);
        } else {
          calculateTotalAmount(selectedProperty, newFormData.checkIn, newFormData.checkOut);
        }
      } catch (error) {
        console.error('Error checking availability:', error);
        setError('Error checking property availability');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null); // Clear any previous errors

    try {
      // Check availability one final time before submitting
      const availability = await bookingService.checkAvailability(
        formData.propertyId,
        formData.checkIn,
        formData.checkOut,
        initialData?.id
      );

      if (!availability.available) {
        const conflictDates = {
          start: availability.conflictingBooking.checkIn.toLocaleDateString(),
          end: availability.conflictingBooking.checkOut.toLocaleDateString()
        };
        setError(`Property is not available for the selected dates. There is a conflicting booking from ${conflictDates.start} to ${conflictDates.end}`);
        return;
      }

      // Validate dates
      const checkIn = new Date(formData.checkIn);
      const checkOut = new Date(formData.checkOut);
      
      if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
        console.error('Invalid dates:', { checkIn: formData.checkIn, checkOut: formData.checkOut });
        return;
      }

      if (checkIn >= checkOut) {
        alert('Check-out date must be after check-in date');
        return;
      }

      const dataToSubmit = {
        ...formData,
        checkIn: formData.checkIn,
        checkOut: formData.checkOut,
        totalAmount: parseFloat(formData.totalAmount)
      };

      if (initialData) {
        await bookingService.update(initialData.id, dataToSubmit);
      } else {
        await bookingService.create(dataToSubmit);
      }
      onSubmit();
    } catch (error) {
      console.error('Error saving booking:', error);
      setError(error.message || 'Error creating booking');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="propertyId" className="block text-sm font-medium text-gray-700">
            Property
          </label>
          <select
            id="propertyId"
            name="propertyId"
            value={formData.propertyId}
            onChange={handlePropertyChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select a property</option>
            {properties.map(property => (
              <option key={property.id} value={property.id}>
                {property.name} - ₱{property.price}/night
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
            Client
          </label>
          <select
            id="clientId"
            name="clientId"
            value={formData.clientId}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="">Select a client</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>
                {`${client.firstName} ${client.lastName}`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="checkIn" className="block text-sm font-medium text-gray-700">
            Check-in Date
          </label>
          <DatePicker
            selected={formData.checkIn}
            onChange={date => handleDateChange(date, 'checkIn')}
            selectsStart
            startDate={formData.checkIn}
            endDate={formData.checkOut}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="checkOut" className="block text-sm font-medium text-gray-700">
            Check-out Date
          </label>
          <DatePicker
            selected={formData.checkOut}
            onChange={date => handleDateChange(date, 'checkOut')}
            selectsEnd
            startDate={formData.checkIn}
            endDate={formData.checkOut}
            minDate={formData.checkIn}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">
            Total Amount
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">₱</span>
            </div>
            <input
              type="number"
              name="totalAmount"
              id="totalAmount"
              value={formData.totalAmount}
              onChange={handleInputChange}
              className="mt-1 block w-full pl-7 rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
              readOnly
            />
          </div>
          {selectedProperty && (
            <p className="mt-1 text-sm text-gray-500">
              {Math.ceil((new Date(formData.checkOut) - new Date(formData.checkIn)) / (1000 * 60 * 60 * 24))} nights × ₱{selectedProperty.price}/night
            </p>
          )}
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Booking Status
          </label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div>
          <label htmlFor="paymentStatus" className="block text-sm font-medium text-gray-700">
            Payment Status
          </label>
          <select
            id="paymentStatus"
            name="paymentStatus"
            value={formData.paymentStatus}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            required
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={formData.notes}
            onChange={handleInputChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {initialData ? 'Update Booking' : 'Create Booking'}
        </button>
      </div>
    </form>
  );
}
