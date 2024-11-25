import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { propertyService } from '../../services/propertyService';
import { clientService } from '../../services/clientService';

export function BookingDetails({ bookingId, onClose }) {
  const [booking, setBooking] = useState(null);
  const [property, setProperty] = useState(null);
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBookingDetails();
  }, [bookingId]);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    // Handle Firestore Timestamp
    if (date.seconds) {
      return new Date(date.seconds * 1000).toLocaleDateString();
    }
    // Handle regular Date object or ISO string
    const d = new Date(date);
    return isNaN(d.getTime()) ? 'N/A' : d.toLocaleDateString();
  };

  const loadBookingDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const bookingData = await bookingService.getById(bookingId);
      console.log('Booking data:', bookingData); // Debug log
      
      if (!bookingData) {
        setError('Booking not found');
        return;
      }

      setBooking(bookingData);

      // Load property and client data
      try {
        const propertyData = await propertyService.get(bookingData.propertyId);
        setProperty(propertyData);
      } catch (err) {
        console.error('Error loading property:', err);
        setError('Error loading property details');
      }

      try {
        const clientData = await clientService.getById(bookingData.clientId);
        setClient(clientData);
      } catch (err) {
        console.error('Error loading client:', err);
        setError('Error loading client details');
      }
    } catch (err) {
      console.error('Error loading booking details:', err);
      setError('Error loading booking details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg w-full mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg w-full mx-4">
          <div className="text-red-500 text-center mb-4">{error}</div>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  if (!booking || !property || !client) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-8 max-w-lg w-full mx-4">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Booking Details</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Property</h3>
              <p className="text-gray-600 dark:text-gray-300">{property.name}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{property.address}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Client</h3>
              <p className="text-gray-600 dark:text-gray-300">
                {client.firstName} {client.lastName}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{client.email}</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{client.phone}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Dates</h3>
              <p className="text-gray-600 dark:text-gray-300">
                Check-in: {formatDate(booking.checkIn)}
              </p>
              <p className="text-gray-600 dark:text-gray-300">
                Check-out: {formatDate(booking.checkOut)}
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Status</h3>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>

            {booking.notes && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Notes</h3>
                <p className="text-gray-600 dark:text-gray-300">{booking.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={onClose}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
