import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, PermissionsAndroid, Platform, Alert } from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import Tesseract from 'tesseract.js';

const App = () => {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Request Camera Permission (For Android)
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const cameraGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to capture business cards.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      
      const storageGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );

      const writeStorageGranted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );

      return (
        cameraGranted === PermissionsAndroid.RESULTS.GRANTED &&
        storageGranted === PermissionsAndroid.RESULTS.GRANTED &&
        writeStorageGranted === PermissionsAndroid.RESULTS.GRANTED
      );
    }
    return true; // iOS automatically handles permissions
  };

  // Open Camera to Capture Image
  const pickImage = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      alert('Camera permission denied');
      return;
    }

    ImagePicker.launchCamera(
      { mediaType: 'photo', saveToPhotos: true },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Image Picker Error', response.errorMessage);
        } else {
          // Ensure that the correct URI is being set
          const imageUri = response.assets && response.assets[0] && response.assets[0].uri;
          if (imageUri) {
            console.log('Image URI:', imageUri);
            setImageUri(imageUri);
            setExtractedText(''); // Reset extracted text
          } else {
            Alert.alert('Error', 'Image URI not found.');
          }
        }
      }
    );
  };

  // Perform OCR on Captured Image
  const performOCR = async () => {
    if (!imageUri) {
      alert('Please capture an image first!');
      return;
    }

    setIsProcessing(true); // Show loading indicator
    try {
      const result = await Tesseract.recognize(imageUri, 'eng', {
        logger: (info) => console.log(info), // Logs OCR progress
      });
      setExtractedText(result.data.text); // Set the extracted text
    } catch (error) {
      console.error('OCR Error:', error);
      alert('Failed to extract text. Please try again.');
    } finally {
      setIsProcessing(false); // Hide loading indicator
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Business Card Scanner</Text>
      <Button title="Capture Business Card" onPress={pickImage} />

      {imageUri && <Image source={{ uri: imageUri }} style={styles.image} />}
      {imageUri && (
        <Button title="Extract Text" onPress={performOCR} disabled={isProcessing} />
      )}

      {isProcessing && <Text style={styles.processing}>Processing...</Text>}

      {extractedText ? (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Extracted Text:</Text>
          <Text style={styles.resultText}>{extractedText}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  image: {
    width: 300,
    height: 200,
    marginVertical: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  processing: {
    marginVertical: 10,
    fontSize: 16,
    color: '#ff8c00',
  },
  resultContainer: {
    marginTop: 20,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    backgroundColor: '#fff',
    width: '90%',
  },
  resultTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 16,
    color: '#333',
  },
});

export default App;
