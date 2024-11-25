import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { propertyService } from '../services/propertyService';

export function FeaturedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFeaturedProperties();
  }, []);

  const loadFeaturedProperties = async () => {
    try {
      setLoading(true);
      const properties = await propertyService.getAll({ status: 'available' });
      // Transform and get the first 4 properties
      const transformed = properties.slice(0, 4).map(property => ({
        id: property.id,
        title: property.name,
        price: new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(property.price),
        beds: property.bedrooms,
        baths: property.bathrooms,
        size: `${property.maxGuests} guests max`,
        image: property.images?.[0]?.url || '/placeholder-property.jpg'
      }));
      setFeaturedProperties(transformed);
    } catch (err) {
      console.error('Error loading featured properties:', err);
      setError('Failed to load featured properties');
    } finally {
      setLoading(false);
    }
  };

  const nextSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === featuredProperties.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? featuredProperties.length - 1 : prevIndex - 1
    );
  };

  useEffect(() => {
    if (featuredProperties.length > 1) {
      const timer = setInterval(nextSlide, 5000);
      return () => clearInterval(timer);
    }
  }, [featuredProperties.length]);

  if (loading) {
    return (
      <div className="relative h-[500px] mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || featuredProperties.length === 0) {
    return (
      <div className="relative h-[500px] mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <p className="text-xl font-semibold mb-2">
            {error || 'No featured properties available'}
          </p>
          <Link
            to="/properties"
            className="text-blue-600 hover:underline"
          >
            View All Properties
          </Link>
        </div>
      </div>
    );
  }

  const property = featuredProperties[currentIndex];

  return (
    <div className="relative h-[500px] mb-8 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="absolute inset-0">
        <img
          src={property.image}
          alt={property.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
        <div className="max-w-7xl mx-auto">
          <span className="inline-block px-3 py-1 bg-blue-600 rounded-full text-sm mb-3">
            Featured Property
          </span>
          <h2 className="text-3xl font-bold mb-2">
            {property.title}
          </h2>
          <p className="text-xl mb-2">{property.price}</p>
          <p className="text-gray-200 mb-4">
            {property.beds} beds • {property.baths} baths • {property.size}
          </p>
          <Link
            to={`/property/${property.id}`}
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>

      {featuredProperties.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
          >
            <ChevronLeftIcon className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/30 text-white p-2 rounded-full hover:bg-black/50 transition-colors"
          >
            <ChevronRightIcon className="h-6 w-6" />
          </button>
        </>
      )}
    </div>
  );
}