import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Alert, ActivityIndicator, Platform, TextInput, Modal, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import { C, spacing, radius, fontSize } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import api from '../../config/api';
import LocationInput from '../../components/LocationInput';

const LOGO = require('../../../assets/logo.jpeg');
const BANNER = require('../../../assets/bannerbackground5.webp');

const BabyNamingScreen = ({ navigation }) => {
  const { hasProfile } = useAuth();
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [timeOfBirth, setTimeOfBirth] = useState('');
  const [placeOfBirth, setPlaceOfBirth] = useState('');
  const [gender, setGender] = useState('Male'); // Default gender
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [dateObj, setDateObj] = useState(new Date());
  const [fetchingLocation, setFetchingLocation] = useState(false);

  // Modal State
  const [selectedName, setSelectedName] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [namesModalVisible, setNamesModalVisible] = useState(false);
  const [explanationLoading, setExplanationLoading] = useState(false);
  const [explanation, setExplanation] = useState('');

  const handleNameClick = async (nameObj) => {
    setSelectedName(nameObj);
    setExplanation('');
    setExplanationLoading(true);
    setModalVisible(true);
    try {
      const res = await api.post('/api/baby-naming/explain', {
        name: nameObj.name,
        meaning: nameObj.meaning,
        nakshatra: result?.nakshatra,
        pada: result?.pada,
        syllable: result?.allowed_syllables?.[0],
        gender: gender
      });
      setExplanation(res.data.explanation);
    } catch (err) {
      setExplanation('Unable to fetch deeper AI meaning. Try again later.');
    } finally {
      setExplanationLoading(false);
    }
  };

  const onDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const d = selectedDate.getDate().toString().padStart(2, '0');
      const m = (selectedDate.getMonth() + 1).toString().padStart(2, '0');
      const y = selectedDate.getFullYear();
      setDateOfBirth(`${d}-${m}-${y}`);
    }
  };

  const onTimeChange = (event, selectedDate) => {
    setShowTimePicker(false);
    if (selectedDate) {
      setDateObj(selectedDate);
      const h = selectedDate.getHours().toString().padStart(2, '0');
      const min = selectedDate.getMinutes().toString().padStart(2, '0');
      setTimeOfBirth(`${h}:${min}`);
    }
  };

  const fetchLocation = async () => {
    setFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required.');
        setFetchingLocation(false);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      if (geocode.length > 0) {
        const g = geocode[0];
        const city = g.city || g.subregion || g.region;
        const country = g.country;
        setPlaceOfBirth(`${city}, ${country}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to fetch location.');
    } finally {
      setFetchingLocation(false);
    }
  };

  const generateNames = async () => {
    if (!dateOfBirth || !timeOfBirth || !placeOfBirth) {
      Alert.alert('Error', 'Please fill all birth details');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/api/baby-naming/generate', {
        dateOfBirth,
        timeOfBirth,
        placeOfBirth,
        gender
      });
      if (res.data) {
        setResult(res.data);
        setNamesModalVisible(true);
      }
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to generate names');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    if (!name) return 'Aa';
    return name.substring(0, 2).replace(/^\w/, c => c.toUpperCase());
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#5E1026', '#7A1731']} style={styles.header}>
        <Image source={BANNER} style={styles.headerBannerOverlay} />
        <View style={styles.headerTopRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={20} color="#E0D1D5" />
          </TouchableOpacity>
          <View style={styles.headerLogoContainer}>
             <Image source={LOGO} style={styles.headerLogo} />
          </View>
        </View>
        <Text style={styles.headerTag}>VEDIC + MODERN</Text>
        <Text style={styles.headerTitle}>Baby Naming</Text>
        <Text style={styles.headerSub}>Auspicious names by Nakshatra & Rashi.</Text>
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        <View style={styles.inputSection}>
          <Text style={styles.selectLabel}>Date of Birth *</Text>
          <TouchableOpacity
            style={[styles.textInput, { justifyContent: 'center' }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={{ color: dateOfBirth ? '#2C1E12' : '#A88257', fontSize: 15 }}>
              {dateOfBirth || "DD-MM-YYYY"}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={dateObj}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}

          <Text style={styles.selectLabel}>Time of Birth *</Text>
          <TouchableOpacity
            style={[styles.textInput, { justifyContent: 'center' }]}
            onPress={() => setShowTimePicker(true)}
          >
            <Text style={{ color: timeOfBirth ? '#2C1E12' : '#A88257', fontSize: 15 }}>
              {timeOfBirth || "HH:MM (24-hour)"}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={dateObj}
              mode="time"
              is24Hour={true}
              display="default"
              onChange={onTimeChange}
            />
          )}

          <Text style={styles.selectLabel}>Place of Birth *</Text>
          <View style={{ zIndex: 9999 }}>
            <LocationInput
              value={placeOfBirth}
              onChangeText={setPlaceOfBirth}
              placeholder="e.g., Mumbai, India"
              style={{ marginBottom: 16 }}
            />
          </View>

          <Text style={styles.selectLabel}>Gender *</Text>
          <View style={styles.genderRow}>
            <TouchableOpacity
              style={[styles.genderChip, gender === 'Male' && styles.genderChipActive]}
              onPress={() => setGender('Male')}
            >
              <Text style={[styles.genderChipText, gender === 'Male' && styles.genderChipTextActive]}>Boy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.genderChip, gender === 'Female' && styles.genderChipActive]}
              onPress={() => setGender('Female')}
            >
              <Text style={[styles.genderChipText, gender === 'Female' && styles.genderChipTextActive]}>Girl</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.genBtn, loading && { opacity: 0.6 }]}
            onPress={generateNames}
            disabled={loading}
          >
            <Text style={styles.genBtnText}>
              {loading ? 'Generating...' : '✨ Generate Names'}
            </Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#5A182D" />
            <Text style={styles.loadingText}>Consulting the stars for perfect names...</Text>
          </View>
        )}

        {result && !loading && (
          <View style={styles.resultsSection}>
            <Text style={styles.sectionLabel}>— BY NAKSHATRA</Text>

            <View style={[styles.nameCard, { flexDirection: 'column', alignItems: 'stretch' }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View>
                  <Text style={{ fontSize: 13, color: '#6B5040', marginBottom: 4 }}>Moon Nakshatra</Text>
                  <Text style={{ fontSize: 24, fontWeight: '700', color: '#2C1E12', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>{result.nakshatra}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 13, color: '#6B5040', marginBottom: 4 }}>Pada</Text>
                  <View style={[styles.nakshatraPill, { paddingHorizontal: 12, paddingVertical: 6 }]}>
                    <Text style={[styles.nakshatraPillText, { fontSize: 16 }]}>{result.pada}</Text>
                  </View>
                </View>
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
                <Text style={{ fontSize: 13, color: '#6B5040', marginRight: 8 }}>Vedic Syllables:</Text>
                {result.allowed_syllables?.map((syl, i) => (
                  <View key={i} style={[styles.nakshatraPill, { marginRight: 4 }]}>
                    <Text style={styles.nakshatraPillText}>{syl}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.genBtn, { backgroundColor: '#E0D1D5', shadowOpacity: 0 }]}
                onPress={() => setNamesModalVisible(true)}
              >
                <Text style={[styles.genBtnText, { color: '#5A182D' }]}>View Generated Names</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Generated Names List Modal */}
      <Modal
        visible={namesModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNamesModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: '85%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Auspicious Names</Text>
                <Text style={{ fontSize: 13, color: '#6B5040', marginTop: 4 }}>
                  {result?.nakshatra} • Syllables: {result?.allowed_syllables?.join(', ')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setNamesModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#2C1E12" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {(() => {
                if (!result) return null;
                let namesToRender = [];
                if (result.suggested_names && Array.isArray(result.suggested_names) && result.suggested_names.length > 0) {
                  namesToRender = result.suggested_names;
                } else {
                  // Better Dynamic Frontend Fallback for common Indian names
                  const syl = result.allowed_syllables?.[0] || 'A';
                  // Use the first 1-2 letters of the syllable for a more natural Indian name
                  const baseLetter = syl.length > 2 ? syl.substring(0, 2) : syl.substring(0, 1);

                  const boySuffixes = [
                    { s: 'irag', m: "Brilliant; Illuminating" },
                    { s: 'andan', m: "Sandalwood; Auspicious" },
                    { s: 'inmay', m: "Full of knowledge" },
                    { s: 'etan', m: "Consciousness; Life" },
                    { s: 'aitanya', m: "Divine consciousness" }
                  ];

                  const girlSuffixes = [
                    { s: 'ahat', m: "Desire; Love" },
                    { s: 'itra', m: "Beautiful picture; Art" },
                    { s: 'aitali', m: "Born in Chaitra month" },
                    { s: 'aru', m: "Beautiful; Attractive" },
                    { s: 'andni', m: "Moonlight; Radiance" }
                  ];

                  const genericBoySuffixes = [
                    { s: 'vik', m: "Brave and victorious" },
                    { s: 'raj', m: "King; Rule" },
                    { s: 'kshit', m: "Ruler of the earth" },
                    { s: 'may', m: "Illusion; Magical" },
                    { s: 'ran', m: "Joyous; Delightful" }
                  ];

                  const genericGirlSuffixes = [
                    { s: 'mika', m: "Beautifully formed" },
                    { s: 'nya', m: "Goddess; Noble" },
                    { s: 'rika', m: "Born of the stars" },
                    { s: 'vi', m: "Bird; Divine" },
                    { s: 'sha', m: "Desire; Hope" }
                  ];

                  // If it's "Ch" use the specific ones, otherwise use generic ones appended to the actual syllable
                  let chosenList = [];
                  if (baseLetter.toLowerCase() === 'c' || baseLetter.toLowerCase() === 'ch') {
                    chosenList = gender === 'Male' ? boySuffixes : girlSuffixes;
                    namesToRender = chosenList.map(item => ({ name: `Ch${item.s}`, meaning: item.m }));
                  } else {
                    chosenList = gender === 'Male' ? genericBoySuffixes : genericGirlSuffixes;
                    namesToRender = chosenList.map(item => ({ name: `${syl}${item.s}`, meaning: item.m }));
                  }
                }

                return namesToRender.map((nameObj, i) => {
                  const nameStr = typeof nameObj === 'object' ? nameObj.name : nameObj;
                  const meaningStr = typeof nameObj === 'object' ? nameObj.meaning : '';
                  const nakshatraStr = result.nakshatra || '';

                  return (
                    <TouchableOpacity
                      key={i}
                      style={[styles.nameCard, { shadowOpacity: 0.1, elevation: 4 }]}
                      activeOpacity={0.7}
                      onPress={() => {
                        setNamesModalVisible(false);
                        setTimeout(() => handleNameClick(typeof nameObj === 'object' ? nameObj : { name: nameStr, meaning: meaningStr }), 400);
                      }}
                    >
                      <View style={styles.nameIconBox}>
                        <Text style={styles.nameIconText}>{getInitials(nameStr)}</Text>
                      </View>

                      <View style={styles.nameContent}>
                        <View style={styles.nameTitleRow}>
                          <Text style={styles.nameTitle}>{nameStr}</Text>
                          {nakshatraStr ? (
                            <View style={styles.nakshatraPill}>
                              <Text style={styles.nakshatraPillText}>{nakshatraStr}</Text>
                            </View>
                          ) : null}
                        </View>
                        {meaningStr ? (
                          <Text style={styles.nameMeaning}>{meaningStr}</Text>
                        ) : null}
                      </View>

                      <Ionicons name="sparkles" size={16} color="#A88257" />
                    </TouchableOpacity>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* AI Explanation Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                About "{selectedName?.name}"
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color="#2C1E12" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {explanationLoading ? (
                <View style={styles.modalLoading}>
                  <ActivityIndicator size="large" color="#A88257" />
                  <Text style={styles.loadingText}>Revealing spiritual significance...</Text>
                </View>
              ) : (
                <Text style={styles.explanationText}>
                  {explanation ? explanation.replace(/<[^>]*>?/gm, '') : ''}
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F3EB'
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    overflow: 'hidden',
  },
  headerBannerOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    width: 500, height: 500, resizeMode: 'cover', opacity: 0.8,
  },
  headerLogoContainer: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerLogo: {
    width: 36, height: 36, borderRadius: 8, resizeMode: 'contain',
    borderWidth: 2, borderColor: '#FFFFFF',
  },
  backBtn: {
    width: 36, height: 36,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerTag: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D4BA80',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginBottom: 4,
  },
  headerSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 60,
  },
  inputSection: {
    marginBottom: 24,
  },
  selectLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2C1E12',
    marginBottom: 12
  },
  textInput: {
    backgroundColor: '#F3E9DD',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#2C1E12',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8DFD2',
    height: 48,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationBtn: {
    backgroundColor: '#F3E9DD',
    padding: 12,
    borderRadius: 14,
    marginLeft: 12,
    borderWidth: 1,
    borderColor: '#E8DFD2',
    height: 48,
    width: 48,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    borderWidth: 1, borderColor: '#E8DFD2', backgroundColor: '#FFFFFF', marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#E0D1D5', borderColor: '#5A182D'
  },
  chipText: {
    fontSize: 14, fontWeight: '600', color: '#2C1E12'
  },
  chipTextActive: {
    color: '#5A182D'
  },
  genderRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8DFD2',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    marginRight: 8,
  },
  genderChipActive: {
    backgroundColor: '#E0D1D5',
    borderColor: '#5A182D',
  },
  genderChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C1E12',
  },
  genderChipTextActive: {
    color: '#5A182D',
  },
  genBtn: {
    backgroundColor: '#5A182D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#5A182D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  genBtnText: {
    color: '#FFFFFF', fontSize: 16, fontWeight: '700'
  },
  loadingWrap: {
    marginTop: 20, alignItems: 'center'
  },
  loadingText: {
    marginTop: 12, color: '#6B5040', fontStyle: 'italic'
  },
  resultsSection: {
    marginTop: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#6B5040',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  nameCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#2C1E12',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  nameIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E0D1D5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  nameIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5A182D',
  },
  nameContent: {
    flex: 1,
  },
  nameTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2C1E12',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    marginRight: 8,
  },
  nakshatraPill: {
    backgroundColor: '#E0D1D5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  nakshatraPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#5A182D',
  },
  nameMeaning: {
    fontSize: 13,
    color: '#6B5040',
  },
  rawText: {
    fontSize: 14, color: '#2C1E12', lineHeight: 22
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FAF7F2',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '70%',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD2',
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#A88257',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
  },
  closeBtn: {
    padding: 4,
    backgroundColor: '#E0D1D5',
    borderRadius: 20,
  },
  modalBody: {
    flex: 1,
  },
  modalLoading: {
    marginTop: 40,
    alignItems: 'center',
  },
  explanationText: {
    fontSize: 16,
    color: '#6B5040',
    lineHeight: 26,
  },
});

export default BabyNamingScreen;

