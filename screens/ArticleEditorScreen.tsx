import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabaseClient';
import CategorySelector from '../components/CategorySelector';
import { toast } from 'sonner-native';

interface ArticleFormData {
  title: string;
  summary: string;
  content: string;
  category: string;
}

export default function ArticleEditorScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    summary: '',
    content: '',
    category: 'All',
  });

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        const compressed = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 1080 } }],
          { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );

        // Check file size (2MB limit)
        const fileInfo = await FileSystem.getInfoAsync(compressed.uri);
        if (fileInfo.size > 2 * 1024 * 1024) {
          toast.error('Image size must be under 2MB');
          return;
        }

        setSelectedImage(compressed.uri);
      }
    } catch (error) {
      toast.error('Error selecting image');
      console.error(error);
    }
  };

  const uploadImage = async (uri: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('No user found');

      const fileName = `${Date.now()}-article-image`;
      const filePath = `${user.id}/${fileName}.jpg`;
      const response = await fetch(uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('article-images')
        .upload(filePath, blob);

      if (uploadError) throw uploadError;
      return filePath;
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate form
      if (!formData.title || !formData.summary || !formData.content || !selectedImage) {
        toast.error('Please fill in all fields and add an image');
        return;
      }

      // Get category ID
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .eq('name', selectedCategory)
        .single();

      if (!categories) {
        toast.error('Invalid category');
        return;
      }

      // Upload image
      const imagePath = await uploadImage(selectedImage);

      // Create article
      const { error: articleError } = await supabase.from('articles').insert({
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        image_path: imagePath,
        category_id: categories.id,
        created_by: (await supabase.auth.getUser()).data.user?.id,
      });

      if (articleError) throw articleError;

      toast.success('Article created successfully');
      navigation.goBack();
    } catch (error) {
      toast.error('Error creating article');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Article</Text>
        <TouchableOpacity 
          onPress={handleSubmit}
          disabled={loading}
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
        >
          <Text style={styles.submitButtonText}>
            {loading ? 'Creating...' : 'Create'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity 
          style={styles.imageUpload}
          onPress={handleImagePick}
        >
          {selectedImage ? (
            <Image 
              source={{ uri: selectedImage }} 
              style={styles.selectedImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Feather name="image" size={32} color="#666" />
              <Text style={styles.imagePlaceholderText}>
                Add Article Image
              </Text>
              <Text style={styles.imageLimit}>
                (Max size: 2MB)
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.label}>Category</Text>
        <CategorySelector
          selectedCategory={selectedCategory}
          onSelectCategory={(category) => {
            setSelectedCategory(category);
            setFormData(prev => ({ ...prev, category }));
          }}
        />

        <Text style={styles.label}>Title</Text>
        <TextInput
          style={styles.input}
          value={formData.title}
          onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
          placeholder="Enter article title"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.summary}
          onChangeText={(text) => setFormData(prev => ({ ...prev, summary: text }))}
          placeholder="Enter a brief summary"
          placeholderTextColor="#999"
          multiline
          numberOfLines={3}
        />

        <Text style={styles.label}>Content</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formData.content}
          onChangeText={(text) => setFormData(prev => ({ ...prev, content: text }))}
          placeholder="Enter article content"
          placeholderTextColor="#999"
          multiline
          numberOfLines={10}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#eeeeee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  imageUpload: {
    width: '100%',
    height: 200,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  selectedImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  imagePlaceholderText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  imageLimit: {
    marginTop: 4,
    fontSize: 12,
    color: '#999',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eeeeee',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
