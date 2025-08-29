'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { PostcodeData, searchPostcodes, getServicesByCategory, getCategories } from '../../../lib/bud-priser-data';

export default function BudPriserPage() {
  const [postcode, setPostcode] = useState('');
  const [selectedZone, setSelectedZone] = useState<PostcodeData | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{
    timestamp: Date;
    postcode: string;
    price: number;
    place: string;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budPriserSearchHistory');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        } catch (error) {
          console.error('Error parsing saved search history:', error);
        }
      }
    }
    return [];
  });
  
  // Postcode search states
  const [postcodeSuggestions, setPostcodeSuggestions] = useState<PostcodeData[]>([]);
  const [showPostcodeSuggestions, setShowPostcodeSuggestions] = useState(false);
  
  // Extra services search states
  const [extraServiceSearch, setExtraServiceSearch] = useState('');
  const [serviceSuggestions, setServiceSuggestions] = useState<Array<{
    id: string;
    name: string;
    category: string;
    price: number;
    description: string;
  }>>([]);
  const [showServiceSuggestions, setShowServiceSuggestions] = useState(false);
  const [selectedServices, setSelectedServices] = useState<Array<{
    id: string;
    name: string;
    price: number;
    description: string;
  }>>([]);
  
  // Advanced hidden states
  const [weatherImpact, setWeatherImpact] = useState(0);
  const [trafficImpact, setTrafficImpact] = useState(0);
  const [distanceImpact, setDistanceImpact] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search', 'history', or 'registered'
  const [isMobile, setIsMobile] = useState(false);
  
  // Registration states
  const [registeredEntries, setRegisteredEntries] = useState<Array<{
    id: string;
    timestamp: Date;
    bilnummer: string;
    kjoredato: string;
    freightOrder: string;
    freightUnit: string;
    soNummer: string;
    kommentarer: string;
    adHoc1: string;
    adHoc2: string;
    totalpris: number;
    postcode: string;
    place: string;
    selectedServices: Array<{
      id: string;
      name: string;
      price: number;
      description: string;
    }>;
  }>>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('budPriserRegisteredEntries');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          return parsed.map((entry: any) => ({
            ...entry,
            timestamp: new Date(entry.timestamp)
          }));
        } catch (error) {
          console.error('Error parsing saved registered entries:', error);
        }
      }
    }
    return [];
  });
  
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [registrationForm, setRegistrationForm] = useState({
    bilnummer: '',
    kjoredato: '',
    freightOrder: '',
    freightUnit: '',
    soNummer: '',
    kommentarer: ''
  });
  
  // Function to generate next available vehicle number
  const generateNextVehicleNumber = () => {
    if (registeredEntries.length === 0) {
      return 'NO_O_M0001';
    }
    
    // Extract all vehicle numbers and find the highest one
    const vehicleNumbers = registeredEntries
      .map(entry => entry.bilnummer)
      .filter(bilnummer => bilnummer.match(/^NO_O_M\d{4}$/))
      .map(bilnummer => parseInt(bilnummer.replace('NO_O_M', '')));
    
    if (vehicleNumbers.length === 0) {
      return 'NO_O_M0001';
    }
    
    const nextNumber = Math.max(...vehicleNumbers) + 1;
    return `NO_O_M${nextNumber.toString().padStart(4, '0')}`;
  };
  
  const serviceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Hidden advanced calculations
  useEffect(() => {
    const weatherConditions = ['☀️', '🌧️', '❄️', '🌤️'];
    const randomWeather = weatherConditions[Math.floor(Math.random() * weatherConditions.length)];
    if (randomWeather === '❄️') setWeatherImpact(200);
    else if (randomWeather === '🌧️') setWeatherImpact(100);
    else setWeatherImpact(0);
    
    const randomTraffic = Math.random();
    if (randomTraffic > 0.7) setTrafficImpact(150);
    else if (randomTraffic < 0.3) setTrafficImpact(-50);
    else setTrafficImpact(0);
  }, []);

  // Postcode search function
  const searchPostcodesWithSuggestions = useCallback((searchTerm: string) => {
    if (searchTerm.length < 2) { // Start searching from 2 characters
      return [];
    }
    
    const results = searchPostcodes(searchTerm);
    return results.slice(0, 10); // Limit to 10 suggestions
  }, []);

  // Service search function
  const searchServices = useCallback((searchTerm: string) => {
    if (searchTerm.length < 1) { // Start searching from 1 character
      setServiceSuggestions([]);
      setShowServiceSuggestions(false);
      return;
    }

    const allServices: Array<{id: string, name: string, category: string, price: number, description: string}> = [];
    
    // Get all categories and their services
    const categories = getCategories();
    categories.forEach(category => {
      const services = getServicesByCategory(category);
      services.forEach(service => {
        allServices.push({
          id: service.id,
          name: service.name,
          category: category,
          price: service.basePrice,
          description: service.description
        });
      });
    });

    // Filter services based on search term (case-insensitive)
    const filteredServices = allServices.filter(service =>
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setServiceSuggestions(filteredServices.slice(0, 8)); // Limit to 8 suggestions
    setShowServiceSuggestions(filteredServices.length > 0);
  }, []);

  // Postcode change handler
  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPostcode(value);
    
    // Clear suggestions if input is empty
    if (value.length === 0) {
      setPostcodeSuggestions([]);
      setShowPostcodeSuggestions(false);
      return;
    }
    
    // Search for postcodes
    const suggestions = searchPostcodesWithSuggestions(value);
    setPostcodeSuggestions(suggestions);
    setShowPostcodeSuggestions(suggestions.length > 0);
  };

  const handleServiceSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setExtraServiceSearch(value);
    
    // Clear suggestions if input is empty
    if (value.length === 0) {
      setServiceSuggestions([]);
      setShowServiceSuggestions(false);
      return;
    }
    
    // Immediate search for services (no debouncing needed for local data)
    searchServices(value);
  };

  // Address selection handler removed - now using postkode only

  const selectService = (service: any) => {
    // Check if service is already selected
    const isAlreadySelected = selectedServices.some(s => s.id === service.id);
    
    if (!isAlreadySelected) {
      setSelectedServices(prev => [...prev, {
        id: service.id,
        name: service.name,
        price: service.price,
        description: service.description
      }]);
    }
    
    setExtraServiceSearch('');
    setShowServiceSuggestions(false);
  };

  const removeService = (serviceId: string) => {
    setSelectedServices(prev => prev.filter(s => s.id !== serviceId));
  };

  const handlePostcodeSelect = (data: PostcodeData) => {
    setSelectedZone(data);
    setPostcode(data.postcode);
    
    // Calculate total price including selected services
    const basePrice = data.price;
    const servicesPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
    const totalPrice = basePrice + servicesPrice;
    
    // Fix JavaScript floating point precision issue by rounding to 2 decimal places
    const roundedPrice = Math.round(totalPrice * 100) / 100;
    
    setTotalPrice(roundedPrice);
    
    const newEntry = {
      timestamp: new Date(),
      address: '', // No address anymore
      postcode: data.postcode,
      price: roundedPrice,
      place: data.place
    };
    
    const updatedHistory = [newEntry, ...searchHistory];
    setSearchHistory(updatedHistory);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('budPriserSearchHistory', JSON.stringify(updatedHistory));
    }
  };

  const handleBeregnPris = async () => {
    if (postcode) {
      setIsCalculating(true);
      
      // Simulate calculation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Search for postcode in Excel data
      const postcodeResults = searchPostcodes(postcode);
      
      if (postcodeResults.length > 0) {
        // Find exact match first, then partial matches
        const exactMatch = postcodeResults.find(p => p.postcode === postcode);
        const data = exactMatch || postcodeResults[0];
        
        // Set selected zone and calculate total price including services
        setSelectedZone(data);
        const basePrice = data.price;
        const servicesPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
        const totalPrice = basePrice + servicesPrice;
        const roundedPrice = Math.round(totalPrice * 100) / 100;
        setTotalPrice(roundedPrice);
        
        // Add to search history
        const newEntry = {
          timestamp: new Date(),
          address: '', // No address anymore
          postcode: postcode,
          price: roundedPrice, // Use total price including services
          place: data.place
        };
        
        const updatedHistory = [newEntry, ...searchHistory];
        setSearchHistory(updatedHistory);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('budPriserSearchHistory', JSON.stringify(updatedHistory));
        }
      } else {
        // Postcode not found in Excel file
        setSelectedZone({
          postcode: postcode,
          place: 'Vi dekker ikke dette området',
          price: 0,
          zone: 'Ukjent'
        });
        setTotalPrice(0);
        
        // Add to search history with "not in our zone" message
        const newEntry = {
          timestamp: new Date(),
          address: '', // No address anymore
          postcode: postcode,
          price: 0,
          place: 'Vi dekker ikke dette området'
        };
        
        const updatedHistory = [newEntry, ...searchHistory];
        setSearchHistory(updatedHistory);
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('budPriserSearchHistory', JSON.stringify(updatedHistory));
        }
      }
      
      setIsCalculating(false);
    }
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('budPriserSearchHistory');
    }
  };
  
  // Registration functions
  const handleRegister = () => {
    if (postcode && totalPrice > 0) {
      // Auto-fill the next available vehicle number
      const nextVehicleNumber = generateNextVehicleNumber();
      setRegistrationForm(prev => ({
        ...prev,
        bilnummer: nextVehicleNumber
      }));
      setShowRegistrationModal(true);
    }
  };
  
  const handleRegistrationSubmit = () => {
    const newEntry = {
      id: Date.now().toString(),
      timestamp: new Date(),
      bilnummer: registrationForm.bilnummer,
      kjoredato: registrationForm.kjoredato,
      freightOrder: registrationForm.freightOrder,
      freightUnit: registrationForm.freightUnit,
      soNummer: registrationForm.soNummer,
      kommentarer: registrationForm.kommentarer,
      adHoc1: '', // Can be filled later if needed
      adHoc2: '', // Can be filled later if needed
      totalpris: totalPrice,
      address: '', // No address anymore
      postcode: postcode,
      place: selectedZone?.place || '',
      selectedServices: [...selectedServices]
    };
    
    const updatedEntries = [newEntry, ...registeredEntries];
    setRegisteredEntries(updatedEntries);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('budPriserRegisteredEntries', JSON.stringify(updatedEntries));
    }
    
    // Reset form and close modal
    setRegistrationForm({
      bilnummer: '',
      kjoredato: '',
      freightOrder: '',
      freightUnit: '',
      soNummer: '',
      kommentarer: ''
    });
    setShowRegistrationModal(false);
  };
  
  const exportToExcel = () => {
    if (registeredEntries.length === 0) return;
    
    // Create CSV content matching the Excel template
    const mainHeaders = [
      'Vehicle',
      'Departure', 
      'FO Number',
      'FU',
      'Note',
      'Charge Type',
      'Description',
      'Amount'
    ];
    
    const subHeaders = [
      'Bilnummer I riktig format',
      'Kjøredato',
      'Freight order noteres ALLTID',
      'Freight Unit noteres ALLTID',
      'SO-nummer pluss eventuelle kommentarer',
      'AD HOC',
      'AD HOC',
      'Totalpris, KUN en linje per levering'
    ];
    
    const csvContent = [
      mainHeaders.join(','),
      subHeaders.join(','),
      ...registeredEntries.map(entry => [
        entry.bilnummer,
        entry.kjoredato,
        entry.freightOrder,
        entry.freightUnit,
        `${entry.soNummer}${entry.kommentarer ? ` - ${entry.kommentarer}` : ''}`,
        'AD HOC',
        'AD HOC',
        entry.totalpris.toFixed(2)
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `bud-priser-registrerte-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const clearRegisteredEntries = () => {
    setRegisteredEntries([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('budPriserRegisteredEntries');
    }
  };

  // Update total price when selected services change
  useEffect(() => {
    if (selectedZone && selectedZone.price > 0) {
      const basePrice = selectedZone.price;
      const servicesPrice = selectedServices.reduce((sum, service) => sum + service.price, 0);
      const totalPrice = basePrice + servicesPrice;
      
      // Fix JavaScript floating point precision issue
      const roundedPrice = Math.round(totalPrice * 100) / 100;
      setTotalPrice(roundedPrice);
    }
  }, [selectedServices, selectedZone]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (serviceInputRef.current && !serviceInputRef.current.contains(event.target as Node)) {
        setShowServiceSuggestions(false);
      }
      // Close postcode suggestions when clicking outside
      setShowPostcodeSuggestions(false);
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div>
      {/* Page Header */}
      <div className="page-header" style={{ padding: isMobile ? '1rem' : undefined }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <div className="card-icon">
            <svg style={{ width: '24px', height: '24px', color: 'var(--primary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="page-title">🚚 BUD Priser</h1>
            <p className="page-subtitle">
              Beregn leveringspriser basert på postkode og tjenester
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ marginBottom: '1rem', overflowX: 'auto' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid var(--gray-200)', gap: '0', minWidth: isMobile ? '480px' : 'auto' }}>
            <button
              onClick={() => setActiveTab('search')}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'search' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'search' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'search' ? '600' : '500',
                fontSize: isMobile ? '0.9rem' : 'var(--font-size-base)'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>🔍</span>
              Søk & Beregn
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'history' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'history' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'history' ? '600' : '500',
                fontSize: isMobile ? '0.9rem' : 'var(--font-size-base)'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>📊</span>
              Søkehistorikk
            </button>
            <button
              onClick={() => setActiveTab('registered')}
              style={{
                padding: isMobile ? '0.75rem 1rem' : '1rem 2rem',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                borderBottom: activeTab === 'registered' ? '2px solid var(--primary)' : '2px solid transparent',
                color: activeTab === 'registered' ? 'var(--primary)' : 'var(--gray-600)',
                fontWeight: activeTab === 'registered' ? '600' : '500',
                fontSize: isMobile ? '0.9rem' : 'var(--font-size-base)'
              }}
            >
              <span style={{ marginRight: '0.5rem' }}>📝</span>
              Registrerte
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button
            style={{
              padding: '0.5rem 1rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {searchHistory.length} TOTALT
          </button>
          <button
            style={{
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              color: 'var(--gray-600)',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
                              {searchHistory.length > 0 ? (Math.round(searchHistory.reduce((sum, entry) => sum + entry.price, 0) / searchHistory.length * 100) / 100).toFixed(2) : '0.00'} GJENNOMSNITT
          </button>
          <button
            style={{
              padding: '0.5rem 1rem',
              background: '#f1f5f9',
              color: 'var(--gray-600)',
              border: '1px solid var(--gray-200)',
              borderRadius: '0.375rem',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {new Set(searchHistory.map(entry => entry.postcode)).size} POSTKODER
          </button>
        </div>
      </div>

      {/* Search Tab */}
      {activeTab === 'search' && (
        <div style={{ padding: isMobile ? '1rem' : undefined }}>
          {/* Search Fields Block */}
          <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>Søkefelt</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Skriv inn postkode og eventuelle ekstra tjenester</p>
            </div>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.5rem' }}>
                {/* Postcode Input */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>
                    📮 Postkode
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      value={postcode}
                      onChange={handlePostcodeChange}
                      placeholder="Skriv postkode (f.eks. 1475)..."
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    
                    {/* Postcode Suggestions */}
                    {showPostcodeSuggestions && postcodeSuggestions.length > 0 && (
                      <div style={{ 
                        position: 'absolute', 
                        zIndex: 20, 
                        width: '100%', 
                        marginTop: '0.25rem', 
                        background: 'white', 
                        border: '1px solid var(--gray-300)', 
                        borderRadius: '0.375rem', 
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', 
                        maxHeight: '12rem', 
                        overflow: 'auto' 
                      }}>
                        {postcodeSuggestions.map((postcodeData, index) => (
                          <div
                            key={`${postcodeData.postcode}-${index}`}
                            onClick={() => {
                              handlePostcodeSelect(postcodeData);
                              setShowPostcodeSuggestions(false);
                            }}
                            style={{ 
                              padding: '0.75rem', 
                              cursor: 'pointer', 
                              borderBottom: '1px solid var(--gray-100)', 
                              transition: 'background-color 0.15s',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                          >
                            <div>
                              <div style={{ fontWeight: '500', color: 'var(--gray-900)' }}>
                                {postcodeData.postcode} {postcodeData.place}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
                                {postcodeData.zone} - {postcodeData.price} kr
                              </div>
                            </div>
                            <div style={{ 
                              fontSize: '0.875rem', 
                              fontWeight: '600', 
                              color: 'var(--primary)' 
                            }}>
                              {postcodeData.price} kr
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Clear button when postcode is entered */}
                    {postcode && (
                      <button
                        onClick={() => {
                          setPostcode('');
                          setSelectedZone(null);
                          setTotalPrice(0);
                          setPostcodeSuggestions([]);
                          setShowPostcodeSuggestions(false);
                        }}
                        style={{
                          position: 'absolute',
                          right: '0.5rem',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#dc2626',
                          cursor: 'pointer',
                          fontSize: '1rem',
                          padding: '0',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                        title="Fjern postkode"
                      >
                        ×
                      </button>
                    )}
                  </div>
                  
                  {/* Red message for unknown postcodes */}
                  {selectedZone && selectedZone.place === 'Vi dekker ikke dette området' && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.5rem', 
                      background: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      borderRadius: '0.375rem',
                      color: '#dc2626',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}>
                      ⚠️ Vi dekker ikke dette området
                    </div>
                  )}
                </div>

                {/* Extra Services Search */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: 'var(--gray-700)' }}>
                    ⚡ Ekstra Tjenester
                  </label>
                  <div style={{ position: 'relative' }} ref={serviceInputRef}>
                    <input
                      type="text"
                      value={extraServiceSearch}
                      onChange={handleServiceSearchChange}
                      placeholder="Søk etter tjenester (1+ bokstaver)..."
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                    />
                    
                    {/* Service Suggestions */}
                    {showServiceSuggestions && serviceSuggestions.length > 0 && (
                      <div style={{ position: 'absolute', zIndex: 20, width: '100%', marginTop: '0.25rem', background: 'white', border: '1px solid var(--gray-300)', borderRadius: '0.375rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', maxHeight: '12rem', overflow: 'auto' }}>
                        {serviceSuggestions.map((service, index) => (
                          <div
                            key={service.id}
                            onClick={() => selectService(service)}
                            style={{ padding: '0.75rem', cursor: 'pointer', borderBottom: '1px solid var(--gray-100)', transition: 'background-color 0.15s' }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                          >
                            <div style={{ fontSize: '0.875rem', fontWeight: '500', color: 'var(--gray-900)' }}>
                              {service.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                              {service.category} • {service.price.toFixed(2)} kr
                            </div>
                            {service.description && (
                              <div style={{ fontSize: '0.7rem', color: 'var(--gray-400)', marginTop: '0.25rem', fontStyle: 'italic' }}>
                                {service.description}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  {/* Selected Services Display */}
                  {selectedServices.length > 0 && (
                    <div style={{ marginTop: '0.5rem' }}>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'var(--gray-700)' }}>
                        Valgte Tjenester:
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {selectedServices.map((service) => (
                          <div
                            key={service.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                              padding: '0.25rem 0.5rem',
                              background: '#f0f9ff',
                              border: '1px solid #0ea5e9',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem'
                            }}
                          >
                            <span style={{ color: '#0ea5e9' }}>{service.name}</span>
                            <span style={{ color: '#0369a1', fontWeight: '600' }}>({service.price.toFixed(2)} kr)</span>
                            <button
                              onClick={() => removeService(service.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                color: '#dc2626',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                padding: '0',
                                marginLeft: '0.25rem'
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)', marginTop: '0.25rem' }}>
                    Søk etter ekstra tjenester fra Excel-filen
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Calculate Button Block */}
          <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid var(--gray-200)', marginBottom: '1.5rem' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>Beregning</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Beregn totalpris basert på valgt postkode og tjenester</p>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={handleBeregnPris}
                  disabled={isCalculating || !postcode}
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: isCalculating || !postcode ? 'not-allowed' : 'pointer',
                    background: isCalculating || !postcode ? '#9ca3af' : 'var(--primary)',
                    color: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  {isCalculating ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{ width: '20px', height: '20px', border: '2px solid white', borderTop: '2px solid transparent', borderRadius: '50%', marginRight: '0.75rem', animation: 'spin 1s linear infinite' }}></div>
                      Beregner pris...
                    </div>
                  ) : (
                    'BEREGN PRIS'
                  )}
                </button>
                
                <button
                  onClick={handleRegister}
                  disabled={!postcode || totalPrice === 0}
                  style={{
                    padding: '0.75rem 2rem',
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: !postcode || totalPrice === 0 ? 'not-allowed' : 'pointer',
                    background: !postcode || totalPrice === 0 ? '#9ca3af' : '#10b981',
                    color: 'white',
                    transition: 'all 0.2s'
                  }}
                >
                  📝 Registrer
                </button>
              </div>
            </div>
          </div>

          {/* Price Display Block */}
          <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>Totalpris</h3>
              <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Beregnet pris for levering og tjenester</p>
            </div>
            <div style={{ padding: '1.5rem', textAlign: 'center' }}>
                              <div style={{ fontSize: '2.25rem', fontWeight: '700', color: 'var(--primary)', marginBottom: '0.5rem' }}>{totalPrice.toFixed(2)} kr</div>
              
              {selectedZone && (
                <div style={{ color: 'var(--gray-600)', marginBottom: '0.5rem' }}>
                  {selectedZone.postcode} - {selectedZone.place}
                </div>
              )}
              
              {selectedServices.length > 0 && (
                <div style={{ marginTop: '0.5rem', padding: '0.75rem', background: '#f0f9ff', borderRadius: '0.375rem', border: '1px solid #0ea5e9' }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0ea5e9', marginBottom: '0.25rem' }}>
                    Valgte Tjenester:
                  </div>
                  {selectedServices.map((service) => (
                    <div key={service.id} style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                                              • {service.name}: {service.price.toFixed(2)} kr
                    </div>
                  ))}
                </div>
              )}
              
              {totalPrice === 0 && (
                <div style={{ color: 'var(--gray-400)', fontSize: '0.875rem' }}>
                  Skriv inn postkode og klikk "BEREGN PRIS"
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div style={{ padding: isMobile ? '1rem' : undefined }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>Søkehistorikk</h3>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Oversikt over alle beregninger</p>
                </div>
                {searchHistory.length > 0 && (
                  <button
                    onClick={clearSearchHistory}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                  >
                    🗑️ Tøm historikk
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {searchHistory.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '3rem 1.5rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📊</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>Ingen søkeresultater ennå</div>
                  <div style={{ fontSize: '0.875rem' }}>Start med å søke etter en postkode i søkefanen</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  {/* Excel-style Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', padding: '0.75rem', background: '#f8fafc', borderBottom: '1px solid var(--gray-200)', fontWeight: '500', fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                    <div>📅 Dato/Tid</div>
                    <div>📮 Type</div>
                    <div>📮 Postkode</div>
                    <div>🏘️ Sted</div>
                    <div>💰 Pris (kr)</div>
                  </div>
                  
                  {/* Excel-style Table Rows */}
                  <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                    {searchHistory.map((entry, index) => (
                      <div 
                        key={index} 
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(5, 1fr)',
                          gap: '1rem',
                          padding: '0.75rem',
                          borderBottom: '1px solid var(--gray-100)',
                          transition: 'background-color 0.15s',
                          background: index % 2 === 0 ? 'white' : '#f8fafc'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8fafc'}
                      >
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-600)', fontFamily: 'monospace' }}>
                          <div style={{ fontWeight: '500', color: 'var(--gray-800)' }}>
                            {entry.timestamp.toLocaleDateString('nb-NO')}
                          </div>
                          <div style={{ color: 'var(--gray-400)' }}>
                            {entry.timestamp.toLocaleTimeString('nb-NO', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-800)', fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          📮 Postkode
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--primary)', fontWeight: '600' }}>
                          {entry.postcode}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--gray-700)' }}>
                          {entry.place}
                        </div>
                        <div style={{ fontSize: '1.125rem', fontWeight: '700', color: '#10b981' }}>
                          {entry.price.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Excel-style Table Footer with Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem', padding: '0.75rem', background: '#dbeafe', borderTop: '1px solid #3b82f6', fontWeight: '500', fontSize: '0.875rem' }}>
                    <div style={{ color: '#1d4ed8' }}>📊 Total</div>
                    <div style={{ color: '#1d4ed8' }}>{searchHistory.length} søk</div>
                    <div style={{ color: '#1d4ed8' }}>
                      {new Set(searchHistory.map(entry => entry.postcode)).size} unike postkoder
                    </div>
                    <div style={{ color: '#1d4ed8' }}>Gjennomsnitt</div>
                    <div style={{ color: '#1d4ed8' }}>
                      {(Math.round(searchHistory.reduce((sum, entry) => sum + entry.price, 0) / searchHistory.length * 100) / 100).toFixed(2)} kr
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Registered Tab */}
      {activeTab === 'registered' && (
        <div style={{ padding: isMobile ? '1rem' : undefined }}>
          <div style={{ background: 'white', borderRadius: '0.5rem', border: '1px solid var(--gray-200)' }}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--gray-200)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem', color: 'var(--gray-900)' }}>Registrerte Oppdrag</h3>
                  <p style={{ color: 'var(--gray-600)', fontSize: '0.875rem' }}>Oversikt over alle registrerte leveringer</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {registeredEntries.length > 0 && (
                    <>
                      <button
                        onClick={exportToExcel}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#10b981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#059669'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#10b981'}
                      >
                        📊 Eksporter til Excel
                      </button>
                      <button
                        onClick={clearRegisteredEntries}
                        style={{
                          padding: '0.5rem 1rem',
                          background: '#dc2626',
                          color: 'white',
                          border: 'none',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                        onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                      >
                        🗑️ Tøm registrerte
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <div style={{ padding: '1.5rem' }}>
              {registeredEntries.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--gray-500)', padding: '3rem 1.5rem' }}>
                  <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📝</div>
                  <div style={{ fontSize: '1.125rem', fontWeight: '500' }}>Ingen registrerte oppdrag ennå</div>
                  <div style={{ fontSize: '0.875rem' }}>Registrer et oppdrag ved å klikke "Registrer" i søkefanen</div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  {/* Excel-style Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem', padding: '0.75rem', background: '#f8fafc', borderBottom: '1px solid var(--gray-200)', fontWeight: '500', fontSize: '0.75rem', color: 'var(--gray-700)' }}>
                    <div>🚛 Bilnummer</div>
                    <div>📅 Kjøredato</div>
                    <div>📋 Freight Order</div>
                    <div>📦 Freight Unit</div>
                    <div>🔢 SO-nummer + Kommentarer</div>
                    <div>📝 AD HOC</div>
                    <div>📝 AD HOC</div>
                    <div>💰 Totalpris</div>
                  </div>
                  
                  {/* Excel-style Table Rows */}
                  <div style={{ maxHeight: '24rem', overflowY: 'auto' }}>
                    {registeredEntries.map((entry, index) => (
                      <div 
                        key={entry.id} 
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(8, 1fr)',
                          gap: '0.5rem',
                          padding: '0.75rem',
                          borderBottom: '1px solid var(--gray-100)',
                          transition: 'background-color 0.15s',
                          background: index % 2 === 0 ? 'white' : '#f8fafc'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8fafc'}
                      >
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-800)', fontWeight: '500' }}>
                          {entry.bilnummer}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-700)' }}>
                          {entry.kjoredato}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-700)' }}>
                          {entry.freightOrder}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-700)' }}>
                          {entry.freightUnit}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--gray-600)', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={`${entry.soNummer}${entry.kommentarer ? ` - ${entry.kommentarer}` : ''}`}>
                          {entry.soNummer}{entry.kommentarer && ` - ${entry.kommentarer}`}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-700)', fontWeight: '500' }}>
                          AD HOC
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gray-700)', fontWeight: '500' }}>
                          AD HOC
                        </div>
                        <div style={{ fontSize: '0.875rem', fontWeight: '700', color: '#10b981' }}>
                          {entry.totalpris.toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Excel-style Table Footer with Summary */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '0.5rem', padding: '0.75rem', background: '#dbeafe', borderTop: '1px solid #3b82f6', fontWeight: '500', fontSize: '0.75rem' }}>
                    <div style={{ color: '#1d4ed8' }}>📊 Total</div>
                    <div style={{ color: '#1d4ed8' }}>-</div>
                    <div style={{ color: '#1d4ed8' }}>-</div>
                    <div style={{ color: '#1d4ed8' }}>-</div>
                    <div style={{ color: '#1d4ed8' }}>-</div>
                    <div style={{ color: '#1d4ed8' }}>-</div>
                    <div style={{ color: '#1d4ed8' }}>-</div>
                    <div style={{ color: '#1d4ed8' }}>
                      {(Math.round(registeredEntries.reduce((sum, entry) => sum + entry.totalpris, 0) * 100) / 100).toFixed(2)} kr
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hidden Advanced Info */}
      <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--gray-400)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem' }}>
          <span>🌡️ Vær: {weatherImpact > 0 ? `+${weatherImpact} kr` : 'Normal'}</span>
          <span>🚦 Trafikk: {trafficImpact > 0 ? `+${trafficImpact} kr` : trafficImpact < 0 ? `${trafficImpact} kr` : 'Normal'}</span>
          <span>📍 Avstand: {distanceImpact > 0 ? `+${distanceImpact} kr` : 'Normal'}</span>
        </div>
      </div>

      {/* Registration Modal */}
      {showRegistrationModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '0.5rem',
            padding: '2rem',
            maxWidth: '500px',
            width: '90%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: 'var(--gray-900)' }}>📝 Registrer Oppdrag</h2>
              <button
                onClick={() => setShowRegistrationModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--gray-400)',
                  padding: '0'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ padding: '1rem', background: '#f0f9ff', borderRadius: '0.375rem', border: '1px solid #0ea5e9' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: '500', color: '#0ea5e9', marginBottom: '0.5rem' }}>
                  Oppdrag Detaljer:
                </div>
                <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                  📮 Postkode: {postcode} - {selectedZone?.place}<br/>
                  💰 Totalpris: {totalPrice.toFixed(2)} kr<br/>
                  {selectedServices.length > 0 && (
                    <>
                      ⚡ Tjenester: {selectedServices.map(s => `${s.name} (${s.price.toFixed(2)} kr)`).join(', ')}
                    </>
                  )}
                </div>
              </div>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleRegistrationSubmit(); }}>
              <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'var(--gray-700)' }}>
                    🚛 Bilnummer
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      value={registrationForm.bilnummer}
                      onChange={(e) => setRegistrationForm(prev => ({ ...prev, bilnummer: e.target.value }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem 0.75rem',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.375rem',
                        fontSize: '0.875rem'
                      }}
                      placeholder="NO_O_M0001"
                      pattern="NO_O_M[0-9]{4}"
                      title="Format: NO_O_M + 4 siffer"
                    />
                    <button
                      type="button"
                      onClick={() => setRegistrationForm(prev => ({ ...prev, bilnummer: generateNextVehicleNumber() }))}
                      style={{
                        padding: '0.5rem 0.75rem',
                        background: '#f3f4f6',
                        color: 'var(--gray-700)',
                        border: '1px solid var(--gray-300)',
                        borderRadius: '0.375rem',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        transition: 'background-color 0.2s'
                      }}
                      title="Generer neste tilgjengelige bilnummer"
                    >
                      🔄 Neste
                    </button>
                  </div>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'var(--gray-700)' }}>
                    📅 Kjøredato
                  </label>
                  <input
                    type="date"
                    value={registrationForm.kjoredato}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, kjoredato: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'var(--gray-700)' }}>
                    📋 Freight Order
                  </label>
                  <input
                    type="text"
                    value={registrationForm.freightOrder}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, freightOrder: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="6100"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'var(--gray-700)' }}>
                    📦 Freight Unit
                  </label>
                  <input
                    type="text"
                    value={registrationForm.freightUnit}
                    onChange={(e) => setRegistrationForm(prev => ({ ...prev, freightUnit: e.target.value }))}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem'
                    }}
                    placeholder="41/4200"
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.25rem', color: 'var(--gray-700)' }}>
                    🔢 SO-nummer + Kommentarer
                  </label>
                  <textarea
                    value={`${registrationForm.soNummer}${registrationForm.kommentarer ? ` - ${registrationForm.kommentarer}` : ''}`}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.includes(' - ')) {
                        const [soNummer, ...kommentarParts] = value.split(' - ');
                        const kommentarer = kommentarParts.join(' - ');
                        setRegistrationForm(prev => ({
                          ...prev,
                          soNummer: soNummer.trim(),
                          kommentarer: kommentarer.trim()
                        }));
                      } else {
                        setRegistrationForm(prev => ({
                          ...prev,
                          soNummer: value.trim(),
                          kommentarer: ''
                        }));
                      }
                    }}
                    style={{
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--gray-300)',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      minHeight: '80px',
                      resize: 'vertical'
                    }}
                    placeholder="SO-2024-001 - Eventuelle kommentarer om oppdraget..."
                  />

                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowRegistrationModal(false)}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: 'var(--gray-200)',
                    color: 'var(--gray-700)',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  Avbryt
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                >
                  📝 Registrer Oppdrag
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
