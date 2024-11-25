export interface Property {
  id: string;
  title: string;
  type: string;
  price: string;
  beds: number;
  baths: number;
  size: string;
  location: string;
  image: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  status: 'available' | 'rented' | 'maintenance';
  ownerId: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  clientId: string;
  startDate: Date;
  endDate: Date;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  bookings: string[]; // Array of booking IDs
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  read: boolean;
  createdAt: Date;
  propertyId?: string; // Optional reference to a property
  bookingId?: string; // Optional reference to a booking
}

export interface User {
  id: string;
  email: string;
  role: 'admin' | 'client';
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}
