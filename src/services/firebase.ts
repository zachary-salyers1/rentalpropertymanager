import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import type { Property, Booking, Client, Message, User } from '../types';

// Property Services
export const propertyService = {
  async getAll() {
    const snapshot = await getDocs(collection(db, 'properties'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Property[];
  },

  async getById(id: string) {
    const docRef = doc(db, 'properties', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Property : null;
  },

  async create(property: Omit<Property, 'id'>) {
    const docRef = await addDoc(collection(db, 'properties'), property);
    return { id: docRef.id, ...property };
  },

  async update(id: string, property: Partial<Property>) {
    const docRef = doc(db, 'properties', id);
    await updateDoc(docRef, property);
    return { id, ...property };
  },

  async delete(id: string) {
    await deleteDoc(doc(db, 'properties', id));
  },

  async uploadImage(file: File) {
    const storageRef = ref(storage, `properties/${file.name}`);
    await uploadBytes(storageRef, file);
    return getDownloadURL(storageRef);
  }
};

// Booking Services
export const bookingService = {
  async getAll() {
    const snapshot = await getDocs(collection(db, 'bookings'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
  },

  async getByClient(clientId: string) {
    const q = query(
      collection(db, 'bookings'),
      where('clientId', '==', clientId),
      orderBy('startDate', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Booking[];
  },

  async create(booking: Omit<Booking, 'id'>) {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...booking,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...booking };
  },

  async update(id: string, booking: Partial<Booking>) {
    const docRef = doc(db, 'bookings', id);
    await updateDoc(docRef, { ...booking, updatedAt: Timestamp.now() });
    return { id, ...booking };
  }
};

// Client Services
export const clientService = {
  async getAll() {
    const snapshot = await getDocs(collection(db, 'clients'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Client[];
  },

  async getById(id: string) {
    const docRef = doc(db, 'clients', id);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } as Client : null;
  },

  async create(client: Omit<Client, 'id'>) {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...client,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
    return { id: docRef.id, ...client };
  },

  async update(id: string, client: Partial<Client>) {
    const docRef = doc(db, 'clients', id);
    await updateDoc(docRef, { ...client, updatedAt: Timestamp.now() });
    return { id, ...client };
  }
};

// Message Services
export const messageService = {
  async getAllForUser(userId: string) {
    const q = query(
      collection(db, 'messages'),
      where('receiverId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Message[];
  },

  async send(message: Omit<Message, 'id'>) {
    const docRef = await addDoc(collection(db, 'messages'), {
      ...message,
      createdAt: Timestamp.now(),
      read: false
    });
    return { id: docRef.id, ...message };
  },

  async markAsRead(id: string) {
    const docRef = doc(db, 'messages', id);
    await updateDoc(docRef, { read: true });
  }
};
