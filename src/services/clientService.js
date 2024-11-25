import { db } from '../firebase';
import { auth } from '../firebase';
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

const COLLECTION_NAME = 'clients';

export const clientService = {
  async getAll() {
    try {
      console.log('Fetching all clients from collection:', COLLECTION_NAME);
      // Check if user is authenticated
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access clients');
      }

      const clientsCol = collection(db, COLLECTION_NAME);
      const q = query(clientsCol, orderBy('lastName'));
      console.log('Query created:', q);
      
      const clientSnapshot = await getDocs(q);
      console.log('Got snapshot with size:', clientSnapshot.size);
      
      const clients = clientSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Processed clients:', clients);
      return clients;
    } catch (error) {
      console.error('Error in getAll:', error);
      throw error;
    }
  },

  async getById(id) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access client details');
      }

      console.log('Fetching client by ID:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = {
          id: docSnap.id,
          ...docSnap.data()
        };
        console.log('Found client:', data);
        return data;
      }
      console.log('No client found with ID:', id);
      return null;
    } catch (error) {
      console.error('Error in getById:', error);
      throw error;
    }
  },

  async create(clientData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to create clients');
      }

      console.log('Creating new client:', clientData);
      const clientsCol = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(clientsCol, {
        ...clientData,
        createdBy: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      console.log('Created client with ID:', docRef.id);
      return {
        id: docRef.id,
        ...clientData
      };
    } catch (error) {
      console.error('Error in create:', error);
      throw error;
    }
  },

  async update(id, clientData) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to update clients');
      }

      console.log('Updating client with ID:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...clientData,
        updatedAt: new Date().toISOString()
      });
      console.log('Updated client with ID:', id);
      return {
        id,
        ...clientData
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
        throw new Error('User must be authenticated to delete clients');
      }

      console.log('Deleting client with ID:', id);
      const docRef = doc(db, COLLECTION_NAME, id);
      await deleteDoc(docRef);
      console.log('Deleted client with ID:', id);
      return id;
    } catch (error) {
      console.error('Error in delete:', error);
      throw error;
    }
  },

  async searchByName(searchTerm) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to search clients');
      }

      console.log('Searching for clients by name:', searchTerm);
      const clientsCol = collection(db, COLLECTION_NAME);
      const q = query(
        clientsCol,
        where('lastName', '>=', searchTerm),
        where('lastName', '<=', searchTerm + '\uf8ff')
      );
      console.log('Query created:', q);
      
      const querySnapshot = await getDocs(q);
      console.log('Got snapshot with size:', querySnapshot.size);
      
      const clients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Processed clients:', clients);
      return clients;
    } catch (error) {
      console.error('Error in searchByName:', error);
      throw error;
    }
  },

  async getClientBookings(clientId) {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User must be authenticated to access client bookings');
      }

      console.log('Fetching bookings for client with ID:', clientId);
      const bookingsCol = collection(db, 'bookings');
      const q = query(bookingsCol, where('clientId', '==', clientId));
      console.log('Query created:', q);
      
      const querySnapshot = await getDocs(q);
      console.log('Got snapshot with size:', querySnapshot.size);
      
      const bookings = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Processed bookings:', bookings);
      return bookings;
    } catch (error) {
      console.error('Error in getClientBookings:', error);
      throw error;
    }
  }
};
