import React, { useState } from 'react';
import { storageService } from '../../services/storageService';
import { XMarkIcon } from '@heroicons/react/24/outline';

export function ImageUpload({ propertyId, onImageUpload, onImageDelete, existingImages = [] }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setUploading(true);
    setError(null);

    try {
      for (const file of files) {
        const imageData = await storageService.uploadPropertyImage(file, propertyId);
        onImageUpload(imageData);
      }
    } catch (err) {
      console.error('Error uploading files:', err);
      setError(err.message);
    } finally {
      setUploading(false);
      // Clear the input
      e.target.value = '';
    }
  };

  const handleDelete = async (image) => {
    try {
      await storageService.deletePropertyImage(propertyId, image.fileName);
      onImageDelete(image);
    } catch (err) {
      console.error('Error deleting image:', err);
      setError(err.message);
    }
  };

  const renderPreview = (image) => {
    const isImage = image.contentType?.startsWith('image/') || 
                   image.url.match(/\.(jpg|jpeg|png|gif|heic)$/i);
    
    if (isImage) {
      return (
        <img 
          src={image.url} 
          alt="Property" 
          className="w-full h-full object-cover rounded-lg"
        />
      );
    } else {
      return (
        <div className="flex items-center justify-center w-full h-full bg-gray-100 rounded-lg">
          <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      );
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="mb-2 text-sm text-gray-500">
              <span className="font-semibold">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-gray-500">
              JPG, JPEG, PNG, PDF, HEIC (MAX. 10MB)
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,.heic"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {uploading && (
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Uploading...</span>
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
          {existingImages.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                {renderPreview(image)}
              </div>
              <button
                onClick={() => handleDelete(image)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
