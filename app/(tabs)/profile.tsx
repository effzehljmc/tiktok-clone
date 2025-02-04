import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase } from '@/utils/supabase';
import { useState } from 'react';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);

  if (!user) {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" />
        </View>
      </SafeAreaView>
    );
  }

  async function pickImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled) {
        await uploadImage(result.assets[0]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }

  async function uploadImage(imageAsset: ImagePicker.ImagePickerAsset) {
    if (!user) return;

    try {
      setUploading(true);

      // Get the file extension from the URI
      const uri = imageAsset.uri;
      const ext = uri.substring(uri.lastIndexOf('.') + 1);
      
      // Create a unique file name
      const fileName = `${user.id}/profile.${ext}`;

      // Convert URI to base64 if not already provided
      let base64Data = imageAsset.base64;
      if (!base64Data) {
        base64Data = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
      }

      // Convert base64 to ArrayBuffer
      const arrayBuffer = decode(base64Data);

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, arrayBuffer, {
          upsert: true,
          contentType: `image/${ext}`,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Update user profile
      const { error: updateError } = await supabase
        .from('User')
        .update({ image: publicUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {user.username || 'Profile'}
          </Text>
          <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
            <Ionicons name="log-out-outline" size={24} color="#000" />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={pickImage}
            disabled={uploading}
          >
            {user.image ? (
              <Image
                source={user.image}
                style={styles.avatar}
                contentFit="cover"
                transition={200}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
            <View style={styles.editBadge}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <Text style={styles.username}>{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  logoutText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#000',
  },
  profileInfo: {
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#007AFF',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#666',
  },
}); 