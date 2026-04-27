import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const LocationInput = ({ value, onChange, placeholder, className, name }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (val) => {
    onChange({ target: { name, value: val } });
    if (val.length > 2) {
      setLoading(true);
      try {
        // Use Photon API (OpenStreetMap based) - Free and no key required
        const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(val)}&limit=5`);
        const features = response.data.features || [];
        const results = features.map(f => {
          const { name, city, state, country } = f.properties;
          const parts = [name || city, state, country].filter(Boolean);
          return [...new Set(parts)].join(', ');
        });
        setSuggestions([...new Set(results)]);
        setShowDropdown(true);
      } catch (error) {
        console.error('Error fetching locations:', error);
      } finally {
        setLoading(false);
      }
    } else {
      setSuggestions([]);
      setShowDropdown(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => handleSearch(e.target.value)}
        onFocus={() => value.length > 2 && setShowDropdown(true)}
        placeholder={placeholder}
        className={`${className} pr-10`}
        autoComplete="off"
        required
      />
      {loading && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <Loader2 className="w-4 h-4 text-saffron animate-spin" />
        </div>
      )}
      {showDropdown && (suggestions.length > 0 || loading) && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-vborder rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-vtext-muted animate-pulse">
              Searching locations...
            </div>
          )}
          {suggestions.map((s, i) => (
            <div
              key={i}
              className="px-4 py-3 hover:bg-saffron-pale cursor-pointer text-sm text-vtext-mid border-b border-vborder last:border-0 transition-colors"
              onClick={() => {
                onChange({ target: { name, value: s } });
                setShowDropdown(false);
              }}
            >
              {s}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LocationInput;
