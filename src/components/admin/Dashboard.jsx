import React, { useState, useEffect } from 'react';
import { bookingService } from '../../services/bookingService';
import { propertyService } from '../../services/propertyService';
import { clientService } from '../../services/clientService';
import { BookingCalendar } from './BookingCalendar';
import { AdminPropertyCard } from './AdminPropertyCard';
import { formatCurrency } from '../../utils/formatters';
import { 
  HomeIcon, 
  UserGroupIcon, 
  CalendarIcon, 
  BanknotesIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    totalClients: 0,
    totalProperties: 0,
    totalRevenue: 0,
    recentBookings: [],
    propertyBookings: {}
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all required data in parallel
      const [bookingsData, clients, properties] = await Promise.all([
        bookingService.getAll(),
        clientService.getAll(),
        propertyService.getAll()
      ]);

      console.log('Loaded bookings:', bookingsData); // Debug log

      setBookings(bookingsData);

      // Calculate statistics
      const activeBookings = bookingsData.filter(booking => 
        booking.status === 'confirmed' && 
        new Date(booking.checkOut) >= new Date()
      );

      const totalRevenue = bookingsData
        .filter(booking => booking.status !== 'cancelled')
        .reduce((sum, booking) => sum + parseFloat(booking.totalAmount || 0), 0);

      // Sort bookings by check-in date and get the 5 most recent
      const recentBookings = [...bookingsData]
        .sort((a, b) => {
          const dateA = a.checkIn?.seconds ? new Date(a.checkIn.seconds * 1000) : new Date(a.checkIn);
          const dateB = b.checkIn?.seconds ? new Date(b.checkIn.seconds * 1000) : new Date(b.checkIn);
          return dateB - dateA;
        })
        .slice(0, 5);

      // Group bookings by property
      const propertyBookings = properties.reduce((acc, property) => {
        const propertyBookings = bookingsData.filter(booking => booking.propertyId === property.id)
          .sort((a, b) => {
            const dateA = a.checkIn?.seconds ? new Date(a.checkIn.seconds * 1000) : new Date(a.checkIn);
            const dateB = b.checkIn?.seconds ? new Date(b.checkIn.seconds * 1000) : new Date(b.checkIn);
            return dateB - dateA;
          })
          .slice(0, 3); // Get 3 most recent bookings per property

        acc[property.id] = {
          property,
          bookings: propertyBookings,
          revenue: propertyBookings
            .filter(booking => booking.status !== 'cancelled')
            .reduce((sum, booking) => sum + parseFloat(booking.totalAmount || 0), 0),
          activeBookings: propertyBookings.filter(booking => 
            booking.status === 'confirmed' && 
            new Date(booking.checkOut) >= new Date()
          ).length
        };
        return acc;
      }, {});

      setStats({
        totalBookings: bookingsData.length,
        activeBookings: activeBookings.length,
        totalClients: clients.length,
        totalProperties: properties.length,
        totalRevenue: totalRevenue,
        recentBookings,
        propertyBookings
      });
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      // Handle Firestore Timestamp
      if (date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString();
      }
      // Handle regular Date object or ISO string
      const dateObj = new Date(date);
      return isNaN(dateObj.getTime()) ? 'N/A' : dateObj.toLocaleDateString();
    } catch (err) {
      console.error('Error formatting date:', err);
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse text-center">Loading dashboard data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4 sm:px-6 lg:px-8">
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {/* Total Properties Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <HomeIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Properties
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalProperties}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Clients Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <UserGroupIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Clients
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalClients}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Bookings Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Bookings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.totalBookings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Active Bookings Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClipboardDocumentCheckIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Active Bookings
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {stats.activeBookings}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Revenue Card */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total Revenue
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {formatCurrency(stats.totalRevenue)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Calendar */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Booking Calendar</h2>
          <BookingCalendar bookings={bookings} />
        </div>

        {/* Recent Bookings Table */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Bookings</h2>
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Property
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Client
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check In
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Check Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentBookings.length > 0 ? (
                  stats.recentBookings.map((booking) => (
                    <tr key={booking.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.property?.name || 'Loading...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {booking.client ? `${booking.client.firstName} ${booking.client.lastName}` : 'Loading...'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(booking.checkIn)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(booking.checkOut)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                          ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                          ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                          ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                        `}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(booking.totalAmount)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      No recent bookings found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Property Bookings */}
        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Property Bookings</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Object.values(stats.propertyBookings).map(({ property, bookings }) => (
              <AdminPropertyCard 
                key={property.id} 
                property={property} 
                bookings={bookings}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
