import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export const storageService = {
  async uploadPropertyImage(file, propertyId) {
    try {
      const fileExtension = file.name.split('.').pop().toLowerCase();
      const allowedTypes = ['jpg', 'jpeg', 'png', 'pdf', 'heic'];
      
      if (!allowedTypes.includes(fileExtension)) {
        throw new Error('Invalid file type. Only jpg, jpeg, png, pdf, and heic files are allowed.');
      }

      const fileName = `${uuidv4()}.${fileExtension}`;
      const storageRef = ref(storage, `properties/${propertyId}/${fileName}`);
      
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      return {
        url: downloadURL,
        fileName: fileName,
        originalName: file.name,
        contentType: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },

  async deletePropertyImage(propertyId, fileName) {
    try {
      const storageRef = ref(storage, `properties/${propertyId}/${fileName}`);
      await deleteObject(storageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },

  async getPropertyImages(propertyId) {
    try {
      const storageRef = ref(storage, `properties/${propertyId}`);
      const result = await listAll(storageRef);
      
      const urls = await Promise.all(
        result.items.map(async (itemRef) => {
          const url = await getDownloadURL(itemRef);
          return {
            url,
            fileName: itemRef.name,
            fullPath: itemRef.fullPath
          };
        })
      );
      
      return urls;
    } catch (error) {
      console.error('Error getting property images:', error);
      throw error;
    }
  }
};
