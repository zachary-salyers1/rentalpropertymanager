import React, { useState } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useNavigate } from 'react-router-dom';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export function BookingCalendar({ bookings }) {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Transform bookings into calendar events
  const events = bookings.map(booking => ({
    id: booking.id,
    title: `${booking.property?.name || 'Property'} - ${booking.client?.firstName || 'Client'}`,
    start: new Date(booking.checkIn),
    end: new Date(booking.checkOut),
    resource: booking
  }));

  const handleEventClick = (event) => {
    navigate(`/admin/dashboard/bookings/${event.id}`);
  };

  // Custom event styling
  const eventStyleGetter = (event) => {
    const style = {
      backgroundColor: '#3B82F6', // Blue background
      borderRadius: '4px',
      opacity: 0.8,
      color: 'white',
      border: 'none',
      display: 'block',
      padding: '2px 5px'
    };

    // Different colors based on booking status
    switch (event.resource.status) {
      case 'confirmed':
        style.backgroundColor = '#059669'; // Green
        break;
      case 'pending':
        style.backgroundColor = '#D97706'; // Yellow
        break;
      case 'cancelled':
        style.backgroundColor = '#DC2626'; // Red
        break;
      default:
        break;
    }

    return {
      style
    };
  };

  // Custom toolbar to add booking status legend
  const CustomToolbar = (toolbar) => {
    const goToBack = () => {
      toolbar.onNavigate('PREV');
    };

    const goToNext = () => {
      toolbar.onNavigate('NEXT');
    };

    const goToCurrent = () => {
      toolbar.onNavigate('TODAY');
    };

    return (
      <div className="flex justify-between items-center mb-4 p-2">
        <div className="flex space-x-2">
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            onClick={goToBack}
          >
            ←
          </button>
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            onClick={goToCurrent}
          >
            Today
          </button>
          <button
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded"
            onClick={goToNext}
          >
            →
          </button>
        </div>
        <h2 className="text-xl font-semibold">
          {toolbar.label}
        </h2>
        <div className="flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#059669] mr-2"></div>
            <span className="text-sm">Confirmed</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#D97706] mr-2"></div>
            <span className="text-sm">Pending</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 rounded-full bg-[#DC2626] mr-2"></div>
            <span className="text-sm">Cancelled</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-[600px] bg-white p-4 rounded-lg shadow">
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        style={{ height: '100%' }}
        onSelectEvent={handleEventClick}
        eventPropGetter={eventStyleGetter}
        components={{
          toolbar: CustomToolbar
        }}
        views={['month', 'week', 'day']}
      />
    </div>
  );
}
