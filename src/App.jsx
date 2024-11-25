import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReactGA from 'react-ga4';
import { Navbar } from './components/Navbar';
import { Map } from './components/Map';
import { Footer } from './components/Footer';
import { ThemeToggle } from './components/ThemeToggle';
import { FeaturedCarousel } from './components/FeaturedCarousel';
import { PropertyDetails } from './pages/PropertyDetails';
import { Properties } from './pages/Properties';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './contexts/AuthContext';

// Initialize GA4
ReactGA.initialize('G-XXXXXXXXXX');

export function App() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    ReactGA.send({ hitType: "pageview", page: window.location.pathname });
  }, []);

  return (
    <Router>
      <AuthProvider>
        <div className={darkMode ? 'dark' : ''}>
          <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <Routes>
              {/* Admin routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/dashboard/*"
                element={
                  <ProtectedRoute>
                    <AdminDashboard darkMode={darkMode} setDarkMode={setDarkMode} />
                  </ProtectedRoute>
                }
              />
              
              {/* Public routes */}
              <Route
                path="/*"
                element={
                  <>
                    <Navbar />
                    <main>
                      <Routes>
                        <Route path="/" element={
                          <div>
                            <FeaturedCarousel />
                            <div className="container mx-auto px-4 py-8">
                              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
                                Welcome to CondosPH
                              </h1>
                              <p className="text-gray-600 dark:text-gray-300 mb-8">
                                Discover your perfect rental property in the Philippines
                              </p>
                              <div className="flex justify-center">
                                <Link
                                  to="/properties"
                                  className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors"
                                >
                                  Browse Properties
                                </Link>
                              </div>
                            </div>
                          </div>
                        } />
                        <Route path="/properties" element={<Properties />} />
                        <Route path="/property/:id" element={<PropertyDetails />} />
                        <Route path="/about" element={<div>About Page</div>} />
                        <Route path="/contact" element={<div>Contact Page</div>} />
                      </Routes>
                    </main>
                    <Footer />
                    <div className="fixed bottom-4 right-4">
                      <ThemeToggle darkMode={darkMode} setDarkMode={setDarkMode} />
                    </div>
                  </>
                }
              />
            </Routes>
          </div>
        </div>
      </AuthProvider>
    </Router>
  );
}