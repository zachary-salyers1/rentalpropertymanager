import { db, auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export const userService = {
  async createUserProfile(user, additionalData = {}) {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (!snapshot.exists()) {
        const { email } = user;
        const createdAt = new Date().toISOString();
        
        console.log('Creating new user profile with admin role:', user.uid);
        
        await setDoc(userRef, {
          email,
          createdAt,
          role: 'admin', // Set role as admin for the first user
          ...additionalData,
        });

        console.log('User profile created successfully');
        return userRef;
      }

      console.log('User profile already exists:', snapshot.data());
      return userRef;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  },

  async getCurrentUser() {
    try {
      const user = auth.currentUser;
      if (!user) {
        console.log('No authenticated user found');
        return null;
      }

      const userRef = doc(db, 'users', user.uid);
      const snapshot = await getDoc(userRef);

      if (snapshot.exists()) {
        const userData = {
          uid: user.uid,
          ...snapshot.data()
        };
        console.log('Current user data:', userData);
        return userData;
      }

      console.log('No user profile found for:', user.uid);
      return null;
    } catch (error) {
      console.error('Error getting current user:', error);
      throw error;
    }
  },

  async isAdmin() {
    try {
      const user = await this.getCurrentUser();
      const isAdmin = user?.role === 'admin';
      console.log('Is user admin?', isAdmin);
      return isAdmin;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  }
};
