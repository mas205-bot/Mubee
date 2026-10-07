import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Star, 
  Navigation, 
  ShieldCheck, 
  Check, 
  Wrench, 
  Search, 
  Clock, 
  Send, 
  Store, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertCircle,
  Copy,
  SlidersHorizontal,
  Compass
} from 'lucide-react';
import { ServiceCenter, ApplianceType } from '../types';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ActiveTab } from './Navbar';

interface ServiceCenterLocatorProps {
  onQuoteRequested: () => void;
  onNavigateTab: (tab: ActiveTab) => void;
  filterAppliance?: ApplianceType;
}

export const ServiceCenterLocator: React.FC<ServiceCenterLocatorProps> = ({
  onQuoteRequested,
  onNavigateTab,
  filterAppliance
}) => {
  const { user } = useAuth();
  const [centers, setCenters] = useState<ServiceCenter[]>([]);
  const [selectedCenter, setSelectedCenter] = useState<ServiceCenter | null>(null);
  
  // Search & Filters
  const [addressInput, setAddressInput] = useState<string>('');
  const [activeAddressQuery, setActiveAddressQuery] = useState<string>('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'all' | 'repair_service' | 'appliance_store'>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(filterAppliance || 'all');
  const [searchRadiusMiles, setSearchRadiusMiles] = useState<number>(50);
  
  // Geolocation
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>({ lat: 41.8781, lng: -87.6298 });
  const [locationLabel, setLocationLabel] = useState<string>('Chicago Metro, IL');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  
  // Expanded reviews accordion state
  const [expandedReviewsCenterId, setExpandedReviewsCenterId] = useState<string | null>(null);

  // Quote Request Modal state
  const [quoteModalOpen, setQuoteModalOpen] = useState<boolean>(false);
  const [quoteApplianceDesc, setQuoteApplianceDesc] = useState<string>('Whirlpool Refrigerator');
  const [quoteProblemSummary, setQuoteProblemSummary] = useState<string>('Not cooling properly / defrost heater error');
  const [customerName, setCustomerName] = useState<string>(user?.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>('(312) 555-8291');
  const [customerEmail, setCustomerEmail] = useState<string>(user?.email || 'customer@example.com');
  const [preferredContact, setPreferredContact] = useState<string>('phone');
  
  const [isSubmittingQuote, setIsSubmittingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [quoteSuccessResult, setQuoteSuccessResult] = useState<{
    referenceNumber: string;
    totalCost: number;
    centerName: string;
    phone?: string;
  } | null>(null);

  useEffect(() => {
    if (user) {
      if (!customerName) setCustomerName(user.name);
      if (!customerEmail) setCustomerEmail(user.email);
    }
  }, [user]);

  useEffect(() => {
    const loadCenters = async () => {
      try {
        const data = await api.getServiceCenters();
        setCenters(data);
        if (data.length > 0) setSelectedCenter(data[0]);
      } catch (err) {
        console.warn('Failed loading service centers', err);
      }
    };
    loadCenters();
  }, []);

  useEffect(() => {
    if (filterAppliance) {
      setSelectedSpecialty(filterAppliance);
    }
  }, [filterAppliance]);

  // Current Location handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        });
        setLocationLabel(`Current GPS (${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)})`);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation error or denied:', err);
        setUserCoords({ lat: 41.8781, lng: -87.6298 });
        setLocationLabel('Chicago Downtown (Default)');
        setIsLocating(false);
      },
      { timeout: 8000 }
    );
  };

  const geocodeAddress = async (query: string): Promise<{ lat: number; lng: number; label: string }> => {
    const endpoint = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(query)}`;
    const response = await fetch(endpoint, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'FixBeforeBuy/1.0'
      }
    });

    if (!response.ok) {
      throw new Error('Location lookup failed.');
    }

    const results = await response.json() as Array<{ lat?: string; lon?: string; display_name?: string }>;
    const match = results[0];

    if (!match?.lat || !match?.lon) {
      throw new Error('Address could not be resolved to coordinates.');
    }

    const normalizedLabel = match.display_name
      ? match.display_name.split(',').slice(0, 3).join(', ').trim()
      : query;

    return {
      lat: Number(match.lat),
      lng: Number(match.lon),
      label: normalizedLabel || query
    };
  };

  // Address search submit
  const handleAddressSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedQuery = addressInput.trim();
    if (!trimmedQuery) {
      setActiveAddressQuery('');
      return;
    }

    setActiveAddressQuery(trimmedQuery);

    try {
      const geocoded = await geocodeAddress(trimmedQuery);
      setUserCoords({
        lat: geocoded.lat,
        lng: geocoded.lng
      });
      setLocationLabel(geocoded.label);
    } catch (error) {
      console.warn('Address geocoding failed, keeping fallback location:', error);
      setLocationLabel(trimmedQuery);
      setUserCoords({ lat: 41.8781, lng: -87.6298 });
    }
  };

  // Distance helper in miles
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 3958.8; // Radius of Earth in miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  };

  // Open Quote Modal
  const openQuoteModalForCenter = (center: ServiceCenter) => {
    setSelectedCenter(center);
    setQuoteError(null);
    setQuoteSuccessResult(null);
    setQuoteModalOpen(true);
  };

  // Send Instant Quote Request (Troubleshoot & Fix)
  const handleSendQuoteRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetCenter = selectedCenter || (centers.length > 0 ? centers[0] : null);
    if (!targetCenter) {
      setQuoteError('No service center currently available. Please refresh and try again.');
      return;
    }

    setIsSubmittingQuote(true);
    setQuoteError(null);

    try {
      const response = await api.requestQuote({
        serviceCenterId: targetCenter.id,
        applianceDescription: quoteApplianceDesc.trim() || 'Appliance Diagnostics & Repair Inspection',
        problemSummary: quoteProblemSummary.trim() || 'General fault troubleshooting and estimate requested',
        customerName: customerName.trim() || (user?.name || 'Valued Customer'),
        customerPhone: customerPhone.trim() || '(312) 555-0100',
        customerEmail: customerEmail.trim() || (user?.email || 'customer@fixbeforebuy.org'),
        preferredContact: preferredContact || 'phone'
      });

      if (response && response.estimate) {
        setQuoteSuccessResult({
          referenceNumber: response.referenceNumber || response.estimate.id,
          totalCost: response.estimate.totalCost,
          centerName: targetCenter.name,
          phone: targetCenter.phone
        });
        onQuoteRequested();
      } else {
        throw new Error('Could not parse response from quote server');
      }
    } catch (err: any) {
      console.error('Quote dispatch failed:', err);
      setQuoteError(err.message || 'Failed to dispatch quote. Please check connection and try again.');
    } finally {
      setIsSubmittingQuote(false);
    }
  };

  // Open directions link in external maps without requiring Google API key
  const handleOpenDirections = (center: ServiceCenter) => {
    const dest = encodeURIComponent(`${center.name}, ${center.address}, ${center.city}, ${center.state} ${center.zip}`);
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
  };

  // Filter service centers
  const allCentersWithDistance = centers
    .map((center) => {
      const distanceMiles = userCoords
        ? calculateDistance(userCoords.lat, userCoords.lng, center.latitude, center.longitude)
        : 0;
      return { center, distanceMiles };
    })
    .filter(({ center }) => {
      const matchesQuery = !activeAddressQuery || (
        center.name.toLowerCase().includes(activeAddressQuery.toLowerCase()) ||
        center.address.toLowerCase().includes(activeAddressQuery.toLowerCase()) ||
        center.city.toLowerCase().includes(activeAddressQuery.toLowerCase()) ||
        center.zip.includes(activeAddressQuery) ||
        center.certifiedBrands.some(b => b.toLowerCase().includes(activeAddressQuery.toLowerCase()))
      );

      const matchesType = selectedTypeFilter === 'all' || center.centerType === selectedTypeFilter;
      const matchesBrand = selectedBrand === 'all' || center.certifiedBrands.includes(selectedBrand);
      const matchesSpecialty = selectedSpecialty === 'all' || center.specialties.includes(selectedSpecialty as ApplianceType);

      return matchesQuery && matchesType && matchesBrand && matchesSpecialty;
    })
    .sort((a, b) => a.distanceMiles - b.distanceMiles);

  const filteredCenters = allCentersWithDistance
    .filter(({ distanceMiles }) => {
      if (!userCoords) return true;
      return distanceMiles <= searchRadiusMiles;
    })
    .map(({ center }) => center);

  const allBrands = Array.from(new Set(centers.flatMap(c => c.certifiedBrands)));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-xs bg-store-grid">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[11px] font-mono text-blue-700 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600" />
              <span>Certified Repair & Parts Workshop Directory</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1 font-mech">
              Authorized Service Centers & Parts Outlets
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Find authorized appliance mechanics and genuine parts stores near your location. View operating schedules, customer reviews, and request instant repair quotes.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-800 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors font-mech uppercase tracking-wider shadow-2xs"
            >
              <Navigation className={`w-3.5 h-3.5 text-blue-600 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating GPS...' : 'Use My GPS Location'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS TOOLBAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 space-y-3.5 shadow-xs">
        {/* Address & Specified Location Search Input */}
        <form onSubmit={handleAddressSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Search by address, city, zip code (e.g. 1420 Industrial Blvd, Chicago, 60607)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-9 pr-24 text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 font-medium"
            />
            {addressInput && (
              <button
                type="button"
                onClick={() => { setAddressInput(''); setActiveAddressQuery(''); }}
                className="absolute right-18 top-2 text-[11px] text-slate-400 hover:text-slate-700"
              >
                Clear
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 px-3.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold uppercase tracking-wider font-mech transition-colors shadow-2xs"
            >
              Search
            </button>
          </div>

          <div className="md:col-span-4 flex items-center justify-between px-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            <span className="flex items-center gap-1.5 font-mono text-[11px]">
              <Compass className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span className="truncate max-w-[190px] font-semibold">{locationLabel}</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded shrink-0">ONLINE</span>
          </div>
        </form>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
          <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-500 mb-1">Search Radius</label>
            <select
              value={searchRadiusMiles}
              onChange={(e) => setSearchRadiusMiles(Number(e.target.value))}
              className="w-full bg-white border border-slate-200 rounded-md px-2 py-1.5 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value={10}>10 miles</option>
              <option value={25}>25 miles</option>
              <option value={50}>50 miles</option>
              <option value={100}>100 miles</option>
              <option value={250}>250 miles</option>
            </select>
          </div>
          {/* Provider Type Segmented Filter */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setSelectedTypeFilter('all')}
              className={`flex-1 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all font-mech ${
                selectedTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({centers.length})
            </button>
            <button
              onClick={() => setSelectedTypeFilter('repair_service')}
              className={`flex-1 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all font-mech ${
                selectedTypeFilter === 'repair_service' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Repair Pros
            </button>
            <button
              onClick={() => setSelectedTypeFilter('appliance_store')}
              className={`flex-1 py-1 text-xs font-bold uppercase tracking-wider rounded-md transition-all font-mech ${
                selectedTypeFilter === 'appliance_store' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stores & Parts
            </button>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Certified Brands</option>
              {allBrands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Appliance Category Filter */}
          <div>
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-3 text-xs text-slate-800 font-medium focus:outline-hidden focus:border-blue-500"
            >
              <option value="all">All Appliance Types</option>
              <option value="refrigerator">Refrigerators & Freezers</option>
              <option value="washing_machine">Washing Machines</option>
              <option value="dryer">Clothes Dryers</option>
              <option value="dishwasher">Dishwashers</option>
              <option value="hvac_ac">HVAC & Air Conditioners</option>
              <option value="laptop">Laptops & PCs</option>
              <option value="oven_range">Ovens & Ranges</option>
            </select>
          </div>
        </div>
      </div>

      {/* MAIN LAYOUT: LIST + INTERACTIVE MAP */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Results List (5 cols) */}
        <div className="lg:col-span-5 space-y-3.5 max-h-[720px] overflow-y-auto pr-1">
          <div className="flex items-center justify-between text-xs font-mono text-slate-500 px-1 font-semibold">
            <span>RESULTS FOUND: {filteredCenters.length}</span>
            <span>SORT: PROXIMITY</span>
          </div>

          {filteredCenters.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-xs shadow-xs">
              <AlertCircle className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-900 font-mech text-sm">No matching service centers found within {searchRadiusMiles} miles</p>
              <p className="mt-1">This location is currently outside the available provider coverage in the app. Try a different city, zip code, or expand the radius.</p>
              <button
                onClick={() => {
                  setAddressInput('');
                  setActiveAddressQuery('');
                  setSelectedBrand('all');
                  setSelectedSpecialty('all');
                  setSelectedTypeFilter('all');
                  setSearchRadiusMiles(250);
                }}
                className="mt-3 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-md text-xs font-mono"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            filteredCenters.map((center) => {
              const isSelected = selectedCenter?.id === center.id;
              const isReviewsExpanded = expandedReviewsCenterId === center.id;
              const isStore = center.centerType === 'appliance_store';
              const distance = userCoords 
                ? calculateDistance(userCoords.lat, userCoords.lng, center.latitude, center.longitude) 
                : 2.4;

              return (
                <div
                  key={center.id}
                  onClick={() => setSelectedCenter(center)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all space-y-3 ${
                    isSelected
                      ? 'bg-blue-50/70 border-blue-600 ring-1 ring-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  {/* Title & Badge Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        {isStore ? (
                          <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                        )}
                        <h3 className="text-sm font-bold text-slate-900 leading-snug font-mech">
                          {center.name}
                        </h3>
                      </div>
                      
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{center.address}, {center.city}, {center.state} {center.zip}</span>
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200 justify-end">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="text-xs font-mono font-bold text-slate-900 tabular-nums">{center.rating}</span>
                        <span className="text-[10px] text-slate-400">({center.reviewCount})</span>
                      </div>
                      <span className="text-[10px] font-mono text-blue-700 font-bold block mt-1">
                        {distance} miles away
                      </span>
                    </div>
                  </div>

                  {/* Highlights / Hourly Benchmark */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-700">
                    <span className="font-mono text-emerald-700 font-bold">
                      {isStore ? 'Parts Store & Outlet' : `~$${center.hourlyRateEstimate}/hr benchmark`}
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Open Now
                    </span>
                    <span className="text-slate-300">·</span>
                    <span className="text-slate-500 font-medium">
                      {center.hasMobileDispatch ? 'Mobile Truck Dispatch' : 'Workshop Drop-off'}
                    </span>
                  </div>

                  {/* Operating Hours Summary */}
                  {center.operatingHours && (
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-0.5 font-mono">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{center.operatingHours.weekday}</span>
                        <span className="text-slate-400">Regular</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-500 text-[10px]">
                        <span>{center.operatingHours.saturday}</span>
                        <span>{center.operatingHours.sunday}</span>
                      </div>
                    </div>
                  )}

                  {/* Certified Brands */}
                  <div className="flex flex-wrap gap-1">
                    {center.certifiedBrands.slice(0, 4).map((b) => (
                      <span
                        key={b}
                        className="text-[10px] font-mono bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.5 rounded font-semibold"
                      >
                        {b}
                      </span>
                    ))}
                    {center.certifiedBrands.length > 4 && (
                      <span className="text-[10px] font-mono text-slate-400 px-1 py-0.5">
                        +{center.certifiedBrands.length - 4} more
                      </span>
                    )}
                  </div>

                  {/* Action Row */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedReviewsCenterId(isReviewsExpanded ? null : center.id);
                        }}
                        className="text-[11px] text-slate-600 hover:text-slate-900 flex items-center gap-1 font-medium"
                      >
                        <span>{center.reviews?.length || 0} Reviews</span>
                        {isReviewsExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenDirections(center);
                        }}
                        className="text-[11px] text-blue-700 hover:text-blue-800 flex items-center gap-1 font-bold font-mech uppercase tracking-wider"
                      >
                        <Navigation className="w-3 h-3" />
                        <span>Directions</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openQuoteModalForCenter(center);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md text-xs font-bold uppercase tracking-wider transition-all font-mech shadow-xs"
                    >
                      Instant Quote
                    </button>
                  </div>

                  {/* Expandable Reviews Drawer */}
                  {isReviewsExpanded && center.reviews && (
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-2.5 animate-in fade-in duration-150">
                      <span className="text-[10px] font-mono uppercase text-slate-500 block font-bold">
                        Verified Customer Feedback:
                      </span>
                      {center.reviews.map((rev) => (
                        <div key={rev.id} className="border-b border-slate-200/80 pb-2 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-bold text-slate-800">{rev.author}</span>
                            <span className="text-slate-400 font-mono text-[10px]">{rev.date}</span>
                          </div>
                          <div className="flex items-center gap-1 my-0.5">
                            {[...Array(rev.rating)].map((_, i) => (
                              <Star key={i} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            ))}
                            {rev.verifiedRepair && (
                              <span className="text-[9px] font-mono text-emerald-700 font-bold ml-1">
                                ✓ Verified Repair
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-600 leading-snug">
                            "{rev.comment}"
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Interactive Map & Selected Detail Card (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Interactive Geographic Map Canvas */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 h-[340px] relative overflow-hidden flex flex-col justify-between shadow-xs">
            {/* Grid texture */}
            <div className="absolute inset-0 opacity-40 pointer-events-none bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:20px_20px]" />

            {/* Top map telemetry */}
            <div className="relative z-10 flex items-center justify-between text-xs font-mono">
              <span className="bg-white/95 border border-slate-200 px-2.5 py-1 rounded-md text-blue-700 font-bold flex items-center gap-1.5 shadow-xs">
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                SERVICE SECTOR: {locationLabel.toUpperCase()}
              </span>
              <span className="bg-white/95 border border-slate-200 px-2.5 py-1 rounded-md text-slate-600 font-semibold shadow-xs">
                ACTIVE PINS: {filteredCenters.length}
              </span>
            </div>

            {/* SVG Visual Radar Map */}
            <div className="relative z-10 flex-1 my-2 flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 640 240">
                {/* Street arterial lines */}
                <path d="M 40 120 L 600 120 M 180 20 L 180 220 M 340 10 L 340 230 M 480 30 L 480 210" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="5 5" />
                <path d="M 60 70 Q 280 110 580 60" stroke="#94a3b8" strokeWidth="2.5" fill="none" opacity="0.6" />
                <path d="M 80 170 Q 300 140 560 180" stroke="#94a3b8" strokeWidth="2.5" fill="none" opacity="0.6" />

                {/* User / GPS origin beacon */}
                {userCoords && (
                  <g transform="translate(320, 125)">
                    <circle r="14" fill="#3b82f6" opacity="0.18" className="animate-ping" />
                    <circle r="7" fill="#2563eb" stroke="#ffffff" strokeWidth="2" />
                    <text y="-11" textAnchor="middle" fill="#1d4ed8" fontSize="9" fontFamily="monospace" fontWeight="bold">
                      SEARCH ORIGIN
                    </text>
                  </g>
                )}

                {/* Center Pins */}
                {filteredCenters.map((center, idx) => {
                  const positions = [
                    { x: 190, y: 75 },
                    { x: 380, y: 65 },
                    { x: 230, y: 165 },
                    { x: 450, y: 155 },
                    { x: 140, y: 180 },
                    { x: 520, y: 90 }
                  ];
                  const pos = positions[idx % positions.length];
                  const isSelected = selectedCenter?.id === center.id;
                  const isStore = center.centerType === 'appliance_store';

                  return (
                    <g 
                      key={center.id} 
                      transform={`translate(${pos.x}, ${pos.y})`}
                      className="cursor-pointer transition-transform group"
                      onClick={() => setSelectedCenter(center)}
                    >
                      <circle 
                        r={isSelected ? "15" : "11"} 
                        fill={isSelected ? (isStore ? "#059669" : "#2563eb") : "#ffffff"} 
                        stroke={isSelected ? "#ffffff" : (isStore ? "#059669" : "#2563eb")} 
                        strokeWidth="2.5" 
                      />
                      <text 
                        y="4" 
                        textAnchor="middle" 
                        fill={isSelected ? "#ffffff" : (isStore ? "#059669" : "#1e40af")} 
                        fontSize="10" 
                        fontFamily="monospace" 
                        fontWeight="bold"
                      >
                        {idx + 1}
                      </text>
                      
                      {/* Name popup on selected */}
                      {isSelected && (
                        <g transform="translate(0, -22)">
                          <rect 
                            x="-70" 
                            y="-14" 
                            width="140" 
                            height="18" 
                            rx="4" 
                            fill="#1e293b" 
                            stroke="#ffffff" 
                            strokeWidth="1"
                          />
                          <text 
                            y="-1" 
                            textAnchor="middle" 
                            fill="#ffffff" 
                            fontSize="9" 
                            fontFamily="monospace"
                            fontWeight="bold"
                          >
                            {center.name.slice(0, 20)}
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Bottom map status */}
            <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>LAT: {selectedCenter?.latitude || 41.878} · LNG: {selectedCenter?.longitude || -87.629}</span>
              <button
                onClick={() => selectedCenter && handleOpenDirections(selectedCenter)}
                className="text-blue-700 hover:text-blue-800 hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Navigate to selected pin</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Selected Center Comprehensive Detail Dossier */}
          {selectedCenter && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 font-mech">
                      {selectedCenter.name}
                    </h3>
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedCenter.address}, {selectedCenter.city}, {selectedCenter.state} {selectedCenter.zip}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleOpenDirections(selectedCenter)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors font-mech uppercase tracking-wider"
                  >
                    <Navigation className="w-3.5 h-3.5 text-blue-600" />
                    <span>Get Directions</span>
                  </button>

                  <button
                    onClick={() => openQuoteModalForCenter(selectedCenter)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs font-mech"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Request Instant Quote</span>
                  </button>
                </div>
              </div>

              {/* Contact Information & Hours Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                {/* Telephone */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1 font-semibold">
                    <Phone className="w-3 h-3 text-blue-600" />
                    Direct Phone Line
                  </span>
                  <a 
                    href={`tel:${selectedCenter.phone}`} 
                    className="text-slate-900 font-mono font-bold hover:text-blue-700 hover:underline block text-sm"
                  >
                    {selectedCenter.phone}
                  </a>
                  <span className="text-[10px] text-emerald-700 block font-mono font-semibold">
                    24/7 Dispatch Available
                  </span>
                </div>

                {/* Email */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1 font-semibold">
                    <Mail className="w-3 h-3 text-blue-600" />
                    Service Desk Email
                  </span>
                  <a 
                    href={`mailto:${selectedCenter.email}`} 
                    className="text-slate-700 font-mono hover:text-slate-900 truncate block font-medium"
                  >
                    {selectedCenter.email}
                  </a>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    Average response: &lt; 20m
                  </span>
                </div>

                {/* Rates / Type */}
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                  <span className="text-[11px] text-slate-500 block flex items-center gap-1 font-semibold">
                    <Wrench className="w-3 h-3 text-blue-600" />
                    Workshop Benchmark
                  </span>
                  <span className="text-slate-900 font-mono font-bold block text-sm tabular-nums">
                    {selectedCenter.centerType === 'appliance_store' ? 'Retail & Wholesale' : `$${selectedCenter.hourlyRateEstimate} / hr + parts`}
                  </span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    12-Month Labor Guarantee
                  </span>
                </div>
              </div>

              {/* Operating Hours Table */}
              {selectedCenter.operatingHours && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-600" />
                      Weekly Operating Hours Schedule:
                    </span>
                    <span className="text-emerald-700">Open Today</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono text-slate-600 pt-1">
                    <div className="bg-white p-2 rounded-md border border-slate-200">
                      <strong className="text-slate-800 block">Monday - Friday:</strong>
                      <span>{selectedCenter.operatingHours.weekday.replace('Mon - Fri: ', '')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-md border border-slate-200">
                      <strong className="text-slate-800 block">Saturday:</strong>
                      <span>{selectedCenter.operatingHours.saturday.replace('Sat: ', '')}</span>
                    </div>
                    <div className="bg-white p-2 rounded-md border border-slate-200">
                      <strong className="text-slate-800 block">Sunday:</strong>
                      <span>{selectedCenter.operatingHours.sunday.replace('Sun: ', '')}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Supported Brands */}
              <div>
                <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5 font-semibold">
                  Factory Certifications & Authorized Brands:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedCenter.certifiedBrands.map((b) => (
                    <span 
                      key={b}
                      className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded-md font-mono font-medium"
                    >
                      {b}
                    </span>
                  ))}
                </div>
              </div>

              {/* Store Offerings if applicable */}
              {selectedCenter.storeOfferings && (
                <div className="pt-2 border-t border-slate-100">
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-1.5 font-semibold">
                    In-Store Inventory & Services:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-700">
                    {selectedCenter.storeOfferings.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>

      {/* INSTANT QUOTE MODAL (With Fix & Troubleshoot Confirmation) */}
      {quoteModalOpen && selectedCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-700 font-bold">
                  Direct Workshop Dispatch
                </span>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-1.5 font-mech">
                  <Wrench className="w-4 h-4 text-blue-600" />
                  Request Instant Repair Quote
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Provider: <strong className="text-slate-800">{selectedCenter.name}</strong>
                </p>
              </div>

              <button
                onClick={() => setQuoteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            {/* Error banner if submission failed */}
            {quoteError && (
              <div className="p-3 text-xs bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{quoteError}</span>
              </div>
            )}

            {/* Success state */}
            {quoteSuccessResult ? (
              <div className="p-6 text-center space-y-4 bg-slate-50 rounded-xl border border-emerald-300">
                <div className="w-12 h-12 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-7 h-7" />
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900 font-mech">
                    Quote Request Successfully Transmitted!
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">
                    An itemized preliminary estimate has been generated and saved to your Repair Estimates dashboard.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-lg border border-slate-200 text-xs font-mono space-y-1 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quote Reference:</span>
                    <strong className="text-slate-900">{quoteSuccessResult.referenceNumber}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Service Provider:</span>
                    <strong className="text-slate-900">{quoteSuccessResult.centerName}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Total:</span>
                    <strong className="text-emerald-700 font-bold">${quoteSuccessResult.totalCost}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Warranty Coverage:</span>
                    <strong className="text-blue-700 font-bold">12 Months Guaranteed</strong>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setQuoteModalOpen(false);
                      onNavigateTab('estimates');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider font-mech shadow-xs"
                  >
                    View in Estimates Tab
                  </button>
                  <button
                    onClick={() => setQuoteModalOpen(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold font-mech"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSendQuoteRequest} className="space-y-3.5">
                {/* Appliance description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Appliance Brand & Model Description
                  </label>
                  <input
                    type="text"
                    required
                    value={quoteApplianceDesc}
                    onChange={(e) => setQuoteApplianceDesc(e.target.value)}
                    placeholder="e.g. Whirlpool WRF535 French Door Refrigerator"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Problem Summary */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnosed Fault / Observed Symptoms
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={quoteProblemSummary}
                    onChange={(e) => setQuoteProblemSummary(e.target.value)}
                    placeholder="e.g. Fresh food compartment is warm, freezer coils iced over, fan clicking."
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>

                {/* Contact information fields */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Alex Vance"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Phone Number (For dispatch)
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="(312) 555-0199"
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-mono focus:outline-hidden focus:border-blue-500 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 font-medium"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setQuoteModalOpen(false)}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 font-mech"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingQuote}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs font-mech transition-all"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSubmittingQuote ? 'Transmitting Request...' : 'Transmit Quote Request'}</span>
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
