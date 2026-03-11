import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

interface PhotoDropzoneProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
  maxPhotos?: number;
  guidance?: string;
}

export function PhotoDropzone({
  photos,
  onPhotosChange,
  maxPhotos = 8,
  guidance,
}: PhotoDropzoneProps) {
  const canAdd = photos.length < maxPhotos;

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to photograph items.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      onPhotosChange([...photos, result.assets[0].uri]);
    }
  };

  const handleLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Photo library access is needed to select images.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: maxPhotos - photos.length,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      onPhotosChange([...photos, ...uris].slice(0, maxPhotos));
    }
  };

  const removePhoto = (index: number) => {
    onPhotosChange(photos.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      {guidance && (
        <View style={styles.guidanceBox}>
          <Text style={styles.guidanceIcon}>📸</Text>
          <Text style={styles.guidanceText}>{guidance}</Text>
        </View>
      )}

      {/* Photo strip */}
      {photos.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.strip}>
          {photos.map((uri, index) => (
            <View key={index} style={styles.thumbContainer}>
              <Image source={{ uri }} style={styles.thumb} />
              <TouchableOpacity
                onPress={() => removePhoto(index)}
                style={styles.removeBtn}
              >
                <Ionicons name="close-circle" size={20} color="#ef4444" />
              </TouchableOpacity>
              <View style={styles.photoIndex}>
                <Text style={styles.photoIndexText}>{index + 1}</Text>
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Counter */}
      <View style={styles.counterRow}>
        <Text style={styles.counter}>
          {photos.length}/{maxPhotos} photos
          {photos.length === 0 ? ' — minimum 1 required' : ''}
        </Text>
        <Text style={styles.tip}>More photos = better accuracy</Text>
      </View>

      {/* Action buttons */}
      {canAdd && (
        <View style={styles.btnRow}>
          <TouchableOpacity onPress={handleCamera} style={styles.btn} activeOpacity={0.8}>
            <Ionicons name="camera" size={20} color="#f4f4f5" />
            <Text style={styles.btnText}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLibrary} style={styles.btn} activeOpacity={0.8}>
            <Ionicons name="images" size={20} color="#f4f4f5" />
            <Text style={styles.btnText}>Library</Text>
          </TouchableOpacity>
        </View>
      )}

      {!canAdd && (
        <Text style={styles.maxReached}>Maximum {maxPhotos} photos reached</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  guidanceBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1c1c2c',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: '#6366f144',
  },
  guidanceIcon: {
    fontSize: 18,
  },
  guidanceText: {
    fontSize: 13,
    color: '#a5b4fc',
    flex: 1,
    lineHeight: 20,
  },
  strip: {
    flexGrow: 0,
  },
  thumbContainer: {
    marginRight: 8,
    position: 'relative',
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#141414',
  },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
  },
  photoIndex: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: '#00000088',
    borderRadius: 4,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoIndexText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '700',
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counter: {
    fontSize: 12,
    color: '#a1a1aa',
  },
  tip: {
    fontSize: 11,
    color: '#52525b',
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#1c1c1c',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  btnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#f4f4f5',
  },
  maxReached: {
    textAlign: 'center',
    fontSize: 13,
    color: '#71717a',
    paddingVertical: 8,
  },
});
