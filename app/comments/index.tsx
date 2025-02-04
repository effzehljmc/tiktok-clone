import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ListRenderItem, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useComments } from '../../hooks/useComments';
import { useState, useCallback } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Comment {
  id: string;
  text: string;
  videoId: string;
  userId: string;
  createdAt: string;
  user: {
    id: string;
    username: string | null;
  };
}

export default function CommentsScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { comments, isLoading, addComment } = useComments(videoId);
  const [newComment, setNewComment] = useState('');
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    
    await addComment(newComment.trim());
    setNewComment('');
  }, [newComment, addComment]);

  const renderComment: ListRenderItem<Comment> = useCallback(({ item }) => (
    <View style={styles.commentContainer}>
      <View style={styles.commentLeft}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>
            {item.user.username?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
      </View>
      <View style={styles.commentRight}>
        <Text style={styles.username}>@{item.user.username}</Text>
        <Text style={styles.commentText}>{item.text}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
    </View>
  ), []);

  return (
    <View style={styles.modalOverlay}>
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={() => router.back()}
      />
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerText}>
              {comments?.length || 0} comments
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.headerBorder} />
        </View>

        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              renderItem={renderComment}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.commentsList}
              showsVerticalScrollIndicator={false}
            />
          )}
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="Add a comment..."
              placeholderTextColor="#666"
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              onPress={handleSubmitComment}
              style={[
                styles.sendButton,
                !newComment.trim() && styles.sendButtonDisabled
              ]}
              disabled={!newComment.trim()}
            >
              <MaterialCommunityIcons 
                name="send" 
                size={24} 
                color={newComment.trim() ? '#fe2c55' : '#666'} 
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
  },
  backdrop: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: '#000',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  headerBorder: {
    height: 1,
    backgroundColor: '#333',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
  },
  commentsList: {
    padding: 16,
  },
  commentContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  commentLeft: {
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  commentRight: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontWeight: '600',
    marginBottom: 4,
  },
  commentText: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  timestamp: {
    color: '#666',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: '#333',
    backgroundColor: '#000',
  },
  input: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    color: '#fff',
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
}); 
