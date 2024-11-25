import React, { useState, useEffect } from 'react';
import { propertyService } from '../../services/propertyService';
import { PropertyForm } from './PropertyForm';
import { PropertyDetails } from './PropertyDetails';
import { PlusIcon, MagnifyingGlassIcon, BeakerIcon } from '@heroicons/react/24/outline';

export function PropertyManager() {
  const [properties, setProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProperties();
  }, []);

  const loadProperties = async () => {
    try {
      setLoading(true);
      const data = await propertyService.getAll();
      setProperties(data);
      setError(null);
    } catch (err) {
      console.error('Error loading properties:', err);
      setError('Failed to load properties');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      await loadProperties();
      return;
    }
    try {
      setLoading(true);
      const results = await propertyService.searchByName(searchTerm.trim());
      setProperties(results);
      setError(null);
    } catch (err) {
      console.error('Error searching properties:', err);
      setError('Failed to search properties');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySelect = (property) => {
    setSelectedProperty(property);
    setIsFormOpen(false);
  };

  const handleAddNew = () => {
    setSelectedProperty(null);
    setIsFormOpen(true);
  };

  const handleCreateTestProperty = async () => {
    try {
      setLoading(true);
      const testProperty = {
        name: 'Test Luxury Villa',
        type: 'villa',
        address: '123 Ocean View Drive, Malibu, CA 90265',
        description: 'Stunning beachfront villa with panoramic ocean views. This luxurious property features modern amenities and elegant design.',
        price: 599.99,
        bedrooms: 4,
        bathrooms: 3.5,
        maxGuests: 8,
        amenities: [
          'wifi',
          'pool',
          'gym',
          'airConditioning',
          'heating',
          'kitchen',
          'parking',
          'balcony'
        ],
        status: 'available',
        images: []
      };

      await propertyService.create(testProperty);
      console.log('Test property created successfully');
      await loadProperties();
    } catch (err) {
      console.error('Error creating test property:', err);
      setError('Failed to create test property');
    } finally {
      setLoading(false);
    }
  };

  const handlePropertySaved = async () => {
    setIsFormOpen(false);
    setSelectedProperty(null);
    await loadProperties();
  };

  const handleEdit = (property) => {
    setSelectedProperty(property);
    setIsFormOpen(true);
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Are you sure you want to delete this property?')) {
      return;
    }
    try {
      await propertyService.delete(propertyId);
      setSelectedProperty(null);
      await loadProperties();
    } catch (err) {
      console.error('Error deleting property:', err);
      setError('Failed to delete property');
    }
  };

  if (loading && properties.length === 0) {
    return <div className="p-4">Loading properties...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="flex h-full">
      {/* Properties List */}
      <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Properties</h2>
            <div className="flex space-x-2">
              <button
                onClick={handleCreateTestProperty}
                className="flex items-center px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                title="Create a test property"
              >
                <BeakerIcon className="h-5 w-5 mr-1" />
                Test
              </button>
              <button
                onClick={handleAddNew}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-5 w-5 mr-1" />
                Add New
              </button>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search properties..."
                className="w-full pl-10 pr-4 py-2 border rounded-md"
              />
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Search
            </button>
          </form>
        </div>

        <div className="divide-y divide-gray-200">
          {properties.map((property) => (
            <div
              key={property.id}
              onClick={() => handlePropertySelect(property)}
              className={`p-4 cursor-pointer hover:bg-gray-50 ${
                selectedProperty?.id === property.id ? 'bg-blue-50' : ''
              }`}
            >
              <h3 className="font-medium">{property.name}</h3>
              <p className="text-sm text-gray-500">{property.address}</p>
              <p className="text-sm text-gray-500">
                {property.type} - ${property.price}/night
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Property Details or Form */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isFormOpen ? (
          <PropertyForm
            property={selectedProperty}
            onSave={handlePropertySaved}
            onCancel={() => setIsFormOpen(false)}
          />
        ) : selectedProperty ? (
          <PropertyDetails
            property={selectedProperty}
            onEdit={() => handleEdit(selectedProperty)}
            onDelete={() => handleDelete(selectedProperty.id)}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Select a property or create a new one
          </div>
        )}
      </div>
    </div>
  );
}
