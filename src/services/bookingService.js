import { db, auth } from '../firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

const COLLECTION_NAME = 'bookings';

export const bookingService = {
  async getAll() {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access bookings');
      }

      const bookingsCol = collection(db, COLLECTION_NAME);
      const q = query(bookingsCol, orderBy('checkIn', 'desc'));
      const bookingSnapshot = await getDocs(q);
      
      const bookings = [];
      for (const docSnap of bookingSnapshot.docs) {
        const bookingData = docSnap.data();
        // Fetch related client and property data
        const clientDoc = await getDoc(doc(db, 'clients', bookingData.clientId));
        const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId));
        
        bookings.push({
          id: docSnap.id,
          ...bookingData,
          checkIn: bookingData.checkIn?.toDate?.() || bookingData.checkIn,
          checkOut: bookingData.checkOut?.toDate?.() || bookingData.checkOut,
          client: clientDoc.exists() ? { id: clientDoc.id, ...clientDoc.data() } : null,
          property: propertyDoc.exists() ? { id: propertyDoc.id, ...propertyDoc.data() } : null
        });
      }
      
      return bookings;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access booking details');
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const bookingData = docSnap.data();
        // Fetch related client and property data
        const clientDoc = await getDoc(doc(db, 'clients', bookingData.clientId));
        const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId));
        
        return {
          id: docSnap.id,
          ...bookingData,
          checkIn: bookingData.checkIn?.toDate?.() || bookingData.checkIn,
          checkOut: bookingData.checkOut?.toDate?.() || bookingData.checkOut,
          client: clientDoc.exists() ? { id: clientDoc.id, ...clientDoc.data() } : null,
          property: propertyDoc.exists() ? { id: propertyDoc.id, ...propertyDoc.data() } : null
        };
      }
      return null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  },

  async checkAvailability(propertyId, checkIn, checkOut, excludeBookingId = null) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to check availability');
      }

      const checkInDate = new Date(checkIn);
      const checkOutDate = new Date(checkOut);
      
      // Convert dates to timestamps for comparison
      const checkInTimestamp = Timestamp.fromDate(checkInDate);
      const checkOutTimestamp = Timestamp.fromDate(checkOutDate);

      const bookingsCol = collection(db, COLLECTION_NAME);
      const q = query(
        bookingsCol,
        where('propertyId', '==', propertyId),
        where('status', '!=', 'cancelled')
      );
      
      const bookingSnapshot = await getDocs(q);
      
      for (const docSnap of bookingSnapshot.docs) {
        // Skip the current booking if we're updating
        if (excludeBookingId && docSnap.id === excludeBookingId) {
          continue;
        }
        
        const booking = docSnap.data();
        const existingCheckIn = booking.checkIn.toDate();
        const existingCheckOut = booking.checkOut.toDate();

        // Check for any overlap
        if (
          (checkInDate >= existingCheckIn && checkInDate < existingCheckOut) || // New check-in during existing booking
          (checkOutDate > existingCheckIn && checkOutDate <= existingCheckOut) || // New check-out during existing booking
          (checkInDate <= existingCheckIn && checkOutDate >= existingCheckOut) // New booking completely encompasses existing booking
        ) {
          return {
            available: false,
            conflictingBooking: {
              id: docSnap.id,
              checkIn: existingCheckIn,
              checkOut: existingCheckOut
            }
          };
        }
      }
      
      return {
        available: true,
        conflictingBooking: null
      };
    } catch (error) {
      console.error('Error in checkAvailability:', error);
      throw error;
    }
  },

  async create(bookingData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to create bookings');
      }

      // Check availability before creating the booking
      const availability = await this.checkAvailability(
        bookingData.propertyId,
        bookingData.checkIn,
        bookingData.checkOut
      );

      if (!availability.available) {
        throw new Error('Property is not available for the selected dates');
      }

      // Convert dates to Firestore Timestamps
      const dataToSave = {
        ...bookingData,
        checkIn: Timestamp.fromDate(new Date(bookingData.checkIn)),
        checkOut: Timestamp.fromDate(new Date(bookingData.checkOut)),
        createdBy: user.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: bookingData.status || 'confirmed'
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), dataToSave);
      return {
        id: docRef.id,
        ...bookingData
      };
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  },

  async update(id, bookingData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to update bookings');
      }

      // If dates are being updated, check availability
      if (bookingData.checkIn && bookingData.checkOut) {
        const availability = await this.checkAvailability(
          bookingData.propertyId,
          bookingData.checkIn,
          bookingData.checkOut,
          id // Exclude current booking from availability check
        );

        if (!availability.available) {
          throw new Error('Property is not available for the selected dates');
        }
      }

      const dataToUpdate = {
        ...bookingData,
        updatedAt: Timestamp.now()
      };

      // Convert dates to Firestore Timestamps if they exist
      if (bookingData.checkIn) {
        dataToUpdate.checkIn = Timestamp.fromDate(new Date(bookingData.checkIn));
      }
      if (bookingData.checkOut) {
        dataToUpdate.checkOut = Timestamp.fromDate(new Date(bookingData.checkOut));
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, dataToUpdate);
      
      return {
        id,
        ...bookingData
      };
    } catch (error) {
      console.error('Error in update:', error);
      throw error;
    }
  },

  async delete(id) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to delete bookings');
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return id;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  },

  async getClientBookings(clientId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access client bookings');
      }

      const bookingsCol = collection(db, COLLECTION_NAME);
      const q = query(
        bookingsCol,
        where('clientId', '==', clientId),
        orderBy('checkIn', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookings = [];
      
      for (const docSnap of querySnapshot.docs) {
        const bookingData = docSnap.data();
        const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId));
        
        bookings.push({
          id: docSnap.id,
          ...bookingData,
          checkIn: bookingData.checkIn?.toDate?.() || bookingData.checkIn,
          checkOut: bookingData.checkOut?.toDate?.() || bookingData.checkOut,
          property: propertyDoc.exists() ? { id: propertyDoc.id, ...propertyDoc.data() } : null
        });
      }
      
      return bookings;
    } catch (error) {
      console.error('Error in getClientBookings:', error);
      throw error;
    }
  },

  async getPropertyBookings(propertyId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access property bookings');
      }

      const bookingsCol = collection(db, COLLECTION_NAME);
      const q = query(
        bookingsCol,
        where('propertyId', '==', propertyId),
        orderBy('checkIn', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookings = [];
      
      for (const docSnap of querySnapshot.docs) {
        const bookingData = docSnap.data();
        const clientDoc = await getDoc(doc(db, 'clients', bookingData.clientId));
        
        bookings.push({
          id: docSnap.id,
          ...bookingData,
          checkIn: bookingData.checkIn?.toDate?.() || bookingData.checkIn,
          checkOut: bookingData.checkOut?.toDate?.() || bookingData.checkOut,
          client: clientDoc.exists() ? { id: clientDoc.id, ...clientDoc.data() } : null
        });
      }
      
      return bookings;
    } catch (error) {
      console.error('Error in getPropertyBookings:', error);
      throw error;
    }
  },

  async getBookingsByDateRange(startDate, endDate) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access bookings');
      }

      const bookingsCol = collection(db, COLLECTION_NAME);
      const q = query(
        bookingsCol,
        where('checkIn', '>=', startDate),
        where('checkIn', '<=', endDate),
        orderBy('checkIn', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const bookings = [];
      
      for (const docSnap of querySnapshot.docs) {
        const bookingData = docSnap.data();
        const clientDoc = await getDoc(doc(db, 'clients', bookingData.clientId));
        const propertyDoc = await getDoc(doc(db, 'properties', bookingData.propertyId));
        
        bookings.push({
          id: docSnap.id,
          ...bookingData,
          checkIn: bookingData.checkIn?.toDate?.() || bookingData.checkIn,
          checkOut: bookingData.checkOut?.toDate?.() || bookingData.checkOut,
          client: clientDoc.exists() ? { id: clientDoc.id, ...clientDoc.data() } : null,
          property: propertyDoc.exists() ? { id: propertyDoc.id, ...propertyDoc.data() } : null
        });
      }
      
      return bookings;
    } catch (error) {
      console.error('Error in getBookingsByDateRange:', error);
      throw error;
    }
  }
};
