import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { propertyService } from '../services/propertyService';
import { Map } from '../components/Map';

export function PropertyDetails() {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProperty();
  }, [id]);

  const loadProperty = async () => {
    try {
      setLoading(true);
      const propertyData = await propertyService.get(id);
      if (!propertyData) {
        setError('Property not found');
        return;
      }
      
      // Transform the data to match the component's expected format
      const transformedProperty = {
        id: propertyData.id,
        title: propertyData.name,
        type: propertyData.type,
        price: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(propertyData.price),
        image: propertyData.images?.[0]?.url || '/placeholder-property.jpg',
        images: propertyData.images || [],
        description: propertyData.description,
        beds: propertyData.bedrooms,
        baths: propertyData.bathrooms,
        size: `${propertyData.maxGuests} guests max`,
        location: propertyData.address,
        amenities: propertyData.amenities || []
      };
      
      setProperty(transformedProperty);
    } catch (err) {
      console.error('Error loading property:', err);
      setError('Failed to load property details. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !property) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">
            {error || 'Property Not Found'}
          </h2>
          <Link to="/properties" className="text-blue-600 hover:underline">
            Return to Properties
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Link to="/properties" className="text-blue-600 hover:underline mb-6 inline-block">
        ← Back to Listings
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="h-[500px] rounded-lg overflow-hidden">
              <img
                src={property.images[0]?.url || '/placeholder-property.jpg'}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            {property.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {property.images.slice(1).map((image, index) => (
                  <div key={index} className="aspect-w-1 aspect-h-1 rounded-lg overflow-hidden">
                    <img
                      src={image.url}
                      alt={`${property.title} - Image ${index + 2}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg mt-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {property.title}
              </h1>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm font-medium">
                {property.type}
              </span>
            </div>
            
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              {property.price}
            </p>
            
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div>
                <span className="block text-gray-500 dark:text-gray-400 text-sm">Bedrooms</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{property.beds}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400 text-sm">Bathrooms</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{property.baths}</span>
              </div>
              <div>
                <span className="block text-gray-500 dark:text-gray-400 text-sm">Capacity</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">{property.size}</span>
              </div>
            </div>

            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
              <p className="text-gray-600 dark:text-gray-300">{property.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Amenities</h2>
              <div className="grid grid-cols-2 gap-2">
                {property.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center text-gray-600 dark:text-gray-300">
                    <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    {amenity}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Location Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Location</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{property.location}</p>
            <div className="h-[400px] rounded-lg overflow-hidden">
              <Map address={property.location} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}