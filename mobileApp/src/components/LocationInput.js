import React, { useState, useEffect } from 'react';
import {
  View, TextInput, TouchableOpacity, Text, StyleSheet,
  ActivityIndicator, Keyboard, ScrollView, Animated
} from 'react-native';
import axios from 'axios';
import { Ionicons } from '@expo/vector-icons';
import { C, spacing, radius, fontSize, shadow } from '../theme';

const LocationInput = ({
  value, onChangeText, placeholder, style, onFocus,
  // optional dark-theme overrides
  dark = false,
  soft = false,
}) => {
  const [query, setQuery] = useState(value || '');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownAnim = React.useRef(new Animated.Value(0)).current;

  const th = dark ? {
    inputBg: 'rgba(255,255,255,0.05)',
    inputBorder: 'rgba(200,164,90,0.3)',
    inputText: '#FFFFFF',
    inputPlaceholder: '#9A8878',
    dropdownBg: '#1A0A14',
    dropdownBorder: 'rgba(200,164,90,0.3)',
    itemBorder: 'rgba(200,164,90,0.1)',
    itemText: '#D4C4B0',
    subtextColor: '#9A8878',
    iconColor: '#C8A45A',
    clearColor: '#9A8878',
  } : soft ? {
    inputBg: '#FCFAF8',
    inputBorder: '#ECE6E2',
    inputText: '#54474B',
    inputPlaceholder: '#B5A5A1',
    dropdownBg: '#FFFFFF',
    dropdownBorder: '#E9DEDA',
    itemBorder: '#F2EAE7',
    itemText: '#54474B',
    subtextColor: '#9A8580',
    iconColor: '#A87861',
    clearColor: '#A68F8A',
  } : {
    inputBg: '#F7F1E5',
    inputBorder: '#E8DCC2',
    inputText: '#2D2A26',
    inputPlaceholder: '#A08856',
    dropdownBg: '#FFFDF8',
    dropdownBorder: '#E8DCC2',
    itemBorder: '#F0E8DE',
    itemText: '#2D2A26',
    subtextColor: '#A08856',
    iconColor: '#C9A45A',
    clearColor: '#A08856',
  };

  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  useEffect(() => {
    Animated.timing(dropdownAnim, {
      toValue: showDropdown ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [showDropdown]);

  const searchLocations = async (text) => {
    setQuery(text);
    onChangeText(text);

    if (text.length < 3) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    setShowDropdown(true);
    try {
      const response = await axios.get(`https://photon.komoot.io/api/?q=${encodeURIComponent(text)}&limit=5`);
      
      if (!response.data || !response.data.features) {
        setSuggestions([]);
        return;
      }
      const results = response.data.features.map(f => {
        const { name, city, state, country } = f.properties;
        const parts = [name, city, state, country].filter(p => p);
        return parts.join(', ');
      });
      
      const uniqueResults = [...new Set(results)];
      setSuggestions(uniqueResults);
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSelect = (item) => {
    setQuery(item);
    onChangeText(item);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  const clearSearch = () => {
    setQuery('');
    onChangeText('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={[styles.inputWrapper, { backgroundColor: th.inputBg, borderColor: th.inputBorder }]}>
        <Ionicons name="location-outline" size={17} color={th.iconColor} style={styles.searchIcon} />
        <TextInput
          style={[styles.input, { color: th.inputText }]}
          value={query}
          onChangeText={searchLocations}
          placeholder={placeholder || 'Search city...'}
          placeholderTextColor={th.inputPlaceholder}
          onFocus={() => {
            if (onFocus) onFocus();
            if (query.length >= 3) setShowDropdown(true);
          }}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={clearSearch} style={styles.clearBtn}>
            <Ionicons name="close" size={16} color={th.clearColor} />
          </TouchableOpacity>
        )}
      </View>

      {showDropdown && (query.length >= 3) && (
        <Animated.View style={[
          styles.dropdown,
          { backgroundColor: th.dropdownBg, borderColor: th.dropdownBorder },
          { opacity: dropdownAnim, transform: [{ translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-10, 0] }) }] },
        ]}>
          <ScrollView
            style={{ maxHeight: 220 }}
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={true}
          >
            {loading && suggestions.length === 0 ? (
              <View style={styles.centerBox}>
                <ActivityIndicator color={C.saffron} size="small" />
                <Text style={[styles.subtext, { color: th.subtextColor }]}>Searching locations...</Text>
              </View>
            ) : suggestions.length > 0 ? (
              <View>
                {suggestions.map((item, index) => (
                  <TouchableOpacity
                    key={`loc-${index}`}
                    style={[styles.item, { borderBottomColor: th.itemBorder }, index === suggestions.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => onSelect(item)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.itemText, { color: th.itemText }]} numberOfLines={2}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : !loading && (
              <View style={styles.centerBox}>
                <Text style={[styles.subtext, { color: th.subtextColor }]}>No matching locations found</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: 9999,
    width: '100%',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.input,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    color: C.text,
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  clearBtn: {
    padding: 8,
  },
  dropdown: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderRadius: radius.md,
    zIndex: 10000,
    ...shadow.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    elevation: 20,
  },
  item: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E8DE',
  },
  itemText: {
    fontSize: 14,
    color: '#2D2A26',
    fontWeight: '500',
    lineHeight: 20,
  },
  centerBox: {
    padding: 30,
    alignItems: 'center',
  },
  subtext: {
    fontSize: 13,
    color: C.textMid,
    marginTop: 8,
    textAlign: 'center',
  }
});

export default LocationInput;
