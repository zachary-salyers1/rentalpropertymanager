import React from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { formatCurrency } from '../../utils/formatters';
import { 
  CalendarIcon, 
  CurrencyDollarIcon, 
  UserGroupIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export const AdminPropertyCard = ({ property, bookings = [] }) => {
  // Calculate property statistics
  const activeBookings = bookings.filter(
    booking => new Date(booking.endDate?.seconds ? booking.endDate.seconds * 1000 : booking.endDate) >= new Date()
  ).length;
  
  const totalRevenue = bookings.reduce(
    (sum, booking) => sum + (parseFloat(booking.totalAmount) || 0), 
    0
  );

  const recentBookings = bookings
    .sort((a, b) => {
      const dateA = new Date(a.startDate?.seconds ? a.startDate.seconds * 1000 : a.startDate);
      const dateB = new Date(b.startDate?.seconds ? b.startDate.seconds * 1000 : b.startDate);
      return dateB - dateA;
    })
    .slice(0, 3);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (date.seconds) {
        return format(new Date(date.seconds * 1000), 'MMM d, yyyy');
      }
      // Handle regular Date object or ISO string
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? 'N/A' : format(dateObj, 'MMM d, yyyy');
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  const getBookingStatusColor = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate?.seconds ? startDate.seconds * 1000 : startDate);
    const end = new Date(endDate?.seconds ? endDate.seconds * 1000 : endDate);
    
    if (now < start) return 'bg-yellow-100 text-yellow-800'; // Upcoming
    if (now >= start && now <= end) return 'bg-green-100 text-green-800'; // Active
    return 'bg-gray-100 text-gray-800'; // Past
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Property Header */}
      <div className="relative h-48">
        <img
          src={property.images?.[0]?.url || property.imageUrl || property.image || '/placeholder-property.jpg'}
          alt={property.name || 'Property Image'}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/placeholder-property.jpg';
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
          <div className="p-4 text-white">
            <h3 className="text-xl font-bold">{property.name || 'Unnamed Property'}</h3>
            <p className="text-sm opacity-90">{property.location || 'Location not specified'}</p>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="p-4 grid grid-cols-3 gap-4 border-b dark:border-gray-700">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <UserGroupIcon className="h-5 w-5 text-blue-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {activeBookings}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Active Bookings
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CurrencyDollarIcon className="h-5 w-5 text-green-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Revenue
          </div>
        </div>
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <CalendarIcon className="h-5 w-5 text-purple-500" />
          </div>
          <div className="text-lg font-semibold text-gray-900 dark:text-white">
            {bookings.length}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total Bookings
          </div>
        </div>
      </div>

      {/* Recent Bookings */}
      <div className="p-4">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
          Recent Bookings
        </h4>
        <div className="space-y-3">
          {recentBookings.map((booking, index) => (
            <div 
              key={index}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center space-x-3">
                <ClockIcon className="h-4 w-4 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Loading...'}
                  </div>
                  <div className="text-gray-500 text-xs">
                    {formatDate(booking.startDate)} - {formatDate(booking.endDate)}
                  </div>
                </div>
              </div>
              <span 
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  getBookingStatusColor(booking.startDate, booking.endDate)
                }`}
              >
                {formatCurrency(booking.totalAmount)}
              </span>
            </div>
          ))}
          {recentBookings.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No recent bookings
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900">
        <Link
          to={`/admin/dashboard/properties/${property.id}`}
          className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md transition-colors font-medium"
        >
          Manage Property
        </Link>
      </div>
    </div>
  );
};
