import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import axios from 'axios';
import { C, radius, spacing, fontSize } from '../theme';

const LocationInput = ({ value, onChangeText, placeholder, style }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val) => {
    onChangeText(val);
    if (val.length > 2) {
      setLoading(true);
      try {
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

  const onSelect = (item) => {
    onChangeText(item);
    setShowDropdown(false);
    setSuggestions([]);
  };

  return (
    <View style={{ zIndex: 2000 }}>
      <View style={{ position: 'relative' }}>
        <TextInput
          style={[style, { paddingRight: 40 }]}
          value={value}
          onChangeText={handleSearch}
          placeholder={placeholder}
          placeholderTextColor={C.textDim || '#999'}
          autoComplete="off"
        />
        {loading && (
          <View style={styles.spinner}>
            <ActivityIndicator color={C.saffron || '#D4760A'} size="small" />
          </View>
        )}
      </View>
      {showDropdown && (suggestions.length > 0 || loading) && (
        <View style={styles.dropdown}>
          {loading && suggestions.length === 0 && (
            <View style={{ padding: 15, alignItems: 'center' }}>
              <ActivityIndicator color={C.saffron || '#D4760A'} size="small" />
              <Text style={{ fontSize: 12, color: C.textMid || '#666', marginTop: 5 }}>Searching locations...</Text>
            </View>
          )}
          {suggestions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.item, index === suggestions.length - 1 && { borderBottomWidth: 0 }]}
              onPress={() => onSelect(item)}
            >
              <Text style={styles.itemText}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  dropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md || 12,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#EADCD0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    position: 'absolute',
    top: 55,
    width: '100%',
    zIndex: 3000,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  itemText: {
    fontSize: 14,
    color: '#333333',
  },
  spinner: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
});

export default LocationInput;
