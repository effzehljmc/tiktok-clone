import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { supabase } from '@/utils/supabase';
import { useState, useEffect } from 'react';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { Button, Input } from '@rneui/themed';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

const DIETARY_PREFERENCES = [
  'VEGETARIAN',
  'VEGAN',
  'GLUTEN_FREE',
  'DAIRY_FREE',
  'KETO',
  'PALEO',
  'LOW_CARB',
  'LOW_FAT',
  'NUT_FREE',
  'HALAL',
  'KOSHER',
  'PESCATARIAN',
] as const;
type DietaryPreference = typeof DIETARY_PREFERENCES[number];

export default function ProfileScreen() {
  const { user, signOut, updatePreferences } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedDietTags, setSelectedDietTags] = useState<DietaryPreference[]>([]);
  const [dislikedIngredients, setDislikedIngredients] = useState('');

  useEffect(() => {
    if (user) {
      setSelectedDietTags((user.diet_tags ?? []) as DietaryPreference[]);
      setDislikedIngredients(user.disliked_ingredients?.join(', ') ?? '');
    }
  }, [user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator color="#fff" size="large" />
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

  function toggleDietTag(tag: DietaryPreference) {
    setSelectedDietTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  }

  async function handlePreferencesUpdate() {
    try {
      await updatePreferences({
        diet_tags: selectedDietTags,
        disliked_ingredients: dislikedIngredients.split(',').map(ing => ing.trim()).filter(Boolean)
      });
      Alert.alert('Success', 'Preferences updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update preferences. Please try again.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#1a1a1a', '#000']}
          style={styles.gradientBackground}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{user.username || 'Profile'}</Text>
            <TouchableOpacity onPress={signOut} style={styles.logoutButton}>
              <Ionicons name="log-out-outline" size={24} color="#fff" />
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
                <Ionicons name="camera" size={14} color="#000" />
              </View>
            </TouchableOpacity>
            <Text style={styles.username}>{user.username}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Dietary Preferences</Text>
            <View style={styles.dietTagsContainer}>
              {DIETARY_PREFERENCES.map(tag => (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.dietTag,
                    selectedDietTags.includes(tag) && styles.dietTagSelected
                  ]}
                  onPress={() => toggleDietTag(tag)}
                >
                  <Text style={[
                    styles.dietTagText,
                    selectedDietTags.includes(tag) && styles.dietTagTextSelected
                  ]}>
                    {tag.split('_').map(word => 
                      word.charAt(0) + word.slice(1).toLowerCase()
                    ).join(' ')}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Input
              value={dislikedIngredients}
              onChangeText={setDislikedIngredients}
              placeholder="e.g. peanuts, shellfish"
              placeholderTextColor="#666"
              label="Disliked Ingredients"
              labelStyle={styles.inputLabel}
              inputStyle={styles.input}
              containerStyle={styles.inputContainer}
            />
            <Button
              title="Save Preferences"
              onPress={handlePreferencesUpdate}
              ViewComponent={LinearGradient}
              linearGradientProps={{
                colors: ['#2563eb', '#1d4ed8'],
                start: { x: 0, y: 0 },
                end: { x: 1, y: 0 },
              }}
              buttonStyle={styles.button}
              titleStyle={styles.buttonText}
              containerStyle={styles.buttonContainer}
            />
          </View>

          <Button
            title="Test AI Recipe Assistant"
            onPress={() => router.push('/tests/ai-agent')}
            ViewComponent={LinearGradient}
            linearGradientProps={{
              colors: ['#2563eb', '#1d4ed8'],
              start: { x: 0, y: 0 },
              end: { x: 1, y: 0 },
            }}
            buttonStyle={styles.button}
            titleStyle={styles.buttonText}
            containerStyle={[styles.buttonContainer, { marginTop: 16 }]}
          />
        </LinearGradient>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    padding: 20,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoutButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#000',
  },
  username: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  email: {
    fontSize: 16,
    color: '#999',
  },
  card: {
    backgroundColor: '#222',
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 24,
  },
  dietTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  dietTag: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  dietTagSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  dietTagText: {
    color: '#999',
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  dietTagTextSelected: {
    color: '#fff',
  },
  inputContainer: {
    paddingHorizontal: 0,
    marginBottom: 8,
  },
  inputLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  input: {
    color: '#fff',
    fontSize: 16,
    paddingVertical: 8,
  },
  button: {
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
  },
}); 