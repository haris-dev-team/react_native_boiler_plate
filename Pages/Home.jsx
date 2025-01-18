import React, { useState } from 'react';
import { View, Text, Button, Image, StyleSheet, PermissionsAndroid, Platform } from 'react-native';
import * as ImagePicker from 'react-native-image-picker';
import Tesseract from 'tesseract.js';

const Home = () => {
  const [imageUri, setImageUri] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Request Camera Permission (For Android)
  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: 'This app needs access to your camera to capture business cards.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
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
          console.error('Image Picker Error:', response.errorMessage);
        } else {
          console.log('Image URI:', response.assets[0].uri);
          setImageUri(response.assets[0].uri);
          setExtractedText(''); // Reset extracted text
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

export default Home;
