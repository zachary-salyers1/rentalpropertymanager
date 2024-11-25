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
  orderBy
} from 'firebase/firestore';

const COLLECTION_NAME = 'properties';

export const propertyService = {
  async getAll(filters = {}) {
    try {
      const propertiesCol = collection(db, COLLECTION_NAME);
      let q = query(propertiesCol);

      // Apply filters
      if (filters.status) {
        q = query(q, where('status', '==', filters.status));
      }
      if (filters.type) {
        q = query(q, where('type', '==', filters.type));
      }
      if (filters.minPrice) {
        q = query(q, where('price', '>=', parseFloat(filters.minPrice)));
      }
      if (filters.maxPrice) {
        q = query(q, where('price', '<=', parseFloat(filters.maxPrice)));
      }
      if (filters.beds) {
        q = query(q, where('bedrooms', '>=', parseInt(filters.beds)));
      }
      if (filters.baths) {
        q = query(q, where('bathrooms', '>=', parseInt(filters.baths)));
      }

      // Add default ordering
      q = query(q, orderBy('name'));
      
      const propertySnapshot = await getDocs(q);
      return propertySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  },

  async get(id) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data()
        };
      }
      return null;
    } catch (error) {
      console.error('Error in get:', error);
      throw error;
    }
  },

  // Admin-only methods that require authentication
  async create(propertyData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to create properties');
      }

      const propertiesCol = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(propertiesCol, {
        ...propertyData,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      return {
        id: docRef.id,
        ...propertyData
      };
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  },

  async update(id, propertyData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to update properties');
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...propertyData,
        updatedAt: new Date().toISOString()
      });
      
      return {
        id,
        ...propertyData
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
        throw new Error('User must be authenticated to delete properties');
      }

      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  },

  async getPropertyBookings(propertyId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access property bookings');
      }

      const bookingsCol = collection(db, 'bookings');
      const q = query(
        bookingsCol,
        where('propertyId', '==', propertyId),
        orderBy('startDate', 'desc')
      );
      
      const bookingSnapshot = await getDocs(q);
      return bookingSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error in getPropertyBookings:', error);
      throw error;
    }
  }
};
