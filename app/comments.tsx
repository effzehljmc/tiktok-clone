import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ListRenderItem, Dimensions, ActivityIndicator, Modal } from 'react-native';
import { useComments } from '../hooks/useComments';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withTiming,
  runOnJS
} from 'react-native-reanimated';

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

interface CommentsScreenProps {
  isVisible: boolean;
  onClose: () => void;
  videoId: string;
}

const CommentsScreen: React.FC<CommentsScreenProps> = ({ isVisible, onClose, videoId }) => {
  const { comments, isLoading, isAddingComment, error, addComment, refetch } = useComments(videoId);
  const [newComment, setNewComment] = useState('');
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsClosing(false);
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90
      });
    }
  }, [isVisible]);

  useEffect(() => {
    if (error) {
      Toast.show({
        type: 'error',
        text1: 'Failed to load comments'
      });
    }
  }, [error]);

  const handleClose = useCallback(() => {
    if (isClosing) return;
    setIsClosing(true);
    
    translateY.value = withTiming(SCREEN_HEIGHT, {
      duration: 250
    }, () => {
      runOnJS(onClose)();
    });
  }, [onClose, isClosing]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim()) return;
    
    try {
      await addComment(newComment.trim());
      setNewComment('');
    } catch (error) {
      // Error is handled by the mutation
    }
  }, [newComment, addComment]);

  const handleRefresh = useCallback(() => {
    if (!isLoading) {
      refetch();
    }
  }, [refetch, isLoading]);

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

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

  const ListEmptyComponent = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>
        {isLoading ? 'Loading comments...' : 'No comments yet. Be the first to comment!'}
      </Text>
    </View>
  ), [isLoading]);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={[StyleSheet.absoluteFill, styles.modalOverlay]}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View style={[styles.container, animatedStyle, { 
          paddingBottom: insets.bottom,
          paddingTop: insets.top 
        }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <View style={styles.handle} />
              <Text style={styles.headerText}>
                {comments?.length || 0} comments
              </Text>
              <TouchableOpacity 
                onPress={handleClose} 
                style={styles.closeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
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
            {error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Failed to load comments</Text>
                <TouchableOpacity 
                  onPress={() => refetch()} 
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                  styles.commentsList,
                  (!comments || comments.length === 0) && styles.emptyList
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={ListEmptyComponent}
                refreshing={isLoading}
                onRefresh={handleRefresh}
                onEndReachedThreshold={0.5}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
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
                editable={!isAddingComment}
              />
              <TouchableOpacity 
                onPress={handleSubmitComment}
                style={[
                  styles.sendButton,
                  (!newComment.trim() || isAddingComment) && styles.sendButtonDisabled
                ]}
                disabled={!newComment.trim() || isAddingComment}
              >
                {isAddingComment ? (
                  <ActivityIndicator size="small" color="#fe2c55" />
                ) : (
                  <MaterialCommunityIcons 
                    name="send" 
                    size={24} 
                    color={newComment.trim() ? '#fe2c55' : '#666'} 
                  />
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default CommentsScreen;

const styles = StyleSheet.create({
  modalOverlay: {
    justifyContent: 'flex-end',
    backgroundColor: 'transparent',
    zIndex: 100,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  container: {
    height: SCREEN_HEIGHT * 0.75,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    overflow: 'hidden',
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingTop: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#fff',
    borderRadius: 2,
    position: 'absolute',
    top: -20,
    alignSelf: 'center',
  },
  headerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    padding: 8,
  },
  headerBorder: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#fe2c55',
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#fe2c55',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 
