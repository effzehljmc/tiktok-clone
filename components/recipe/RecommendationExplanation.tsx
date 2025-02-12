import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/utils/i18n';
import { COLORS } from '@/constants/Colors';
import { RecommendationExplanation as ExplanationType } from '@/types/recommendation';
import { getFactorIcon } from '@/types/recommendation';
import { trackExplanationInteraction } from '@/utils/analytics';
import { supabase } from '@/utils/supabase';

// Define colors used in this component
const THEME = {
  ...COLORS,
  primary: '#2563eb', // Same as in RecommendedRecipes
};

interface Props {
  explanation: ExplanationType;
  videoId: string;
  expanded?: boolean;
  userFeedback?: string;
  onFeedbackChange?: () => void;
}

export function RecommendationExplanation({ 
  explanation,
  videoId,
  expanded = false,
  userFeedback,
  onFeedbackChange
}: Props) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();

  const handleFeedback = async (feedbackType: 'more_like_this' | 'not_for_me') => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      const { error } = await supabase.rpc('handle_recommendation_feedback', {
        p_video_id: videoId,
        p_feedback_type: feedbackType
      });

      if (error) throw error;

      // Track the feedback interaction
      trackExplanationInteraction(videoId, `feedback_${feedbackType}`);
      
      // Close the modal first for better UX
      setIsExpanded(false);

      // Small delay to allow modal to close smoothly before removing the item
      if (feedbackType === 'not_for_me') {
        setTimeout(() => {
          // Notify parent component to refresh recommendations
          onFeedbackChange?.();
        }, 300);
      } else {
        onFeedbackChange?.();
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert(
        'Error',
        'Failed to submit feedback. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header}
        onPress={() => {
          setIsExpanded(!isExpanded);
          trackExplanationInteraction(
            videoId, 
            isExpanded ? 'collapse' : 'expand'
          );
        }}
        accessibilityRole="button"
        accessibilityLabel={t('recommendation.expand_explanation')}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text style={styles.mainReason}>
          {t(`recommendation.mainReason.${explanation.mainReason === 'Similar to recipes you enjoy' ? 'engagement' : 'default'}`)}
        </Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'information-circle-outline'} 
          size={16} 
          color={THEME.whiteAlpha60}
        />
      </TouchableOpacity>

      <Modal
        visible={isExpanded}
        transparent
        animationType="fade"
        onRequestClose={() => setIsExpanded(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsExpanded(false)}
        >
          <BlurView intensity={20} tint="dark" style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {t(`recommendation.mainReason.${explanation.mainReason === 'Similar to recipes you enjoy' ? 'engagement' : 'default'}`)}
              </Text>
              <TouchableOpacity 
                onPress={() => setIsExpanded(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={THEME.whiteAlpha90} />
              </TouchableOpacity>
            </View>

            <View style={styles.factorsContainer}>
              {explanation.factors.map((factor, index) => (
                <View key={index} style={styles.factor}>
                  <Ionicons 
                    name={getFactorIcon(factor.type)} 
                    size={16} 
                    color={THEME.whiteAlpha90}
                  />
                  <Text style={styles.factorDescription}>
                    {t(factor.i18n_key, factor.i18n_params)}
                  </Text>
                </View>
              ))}
              
              {explanation.detailedExplanation && (
                <Text style={styles.detailedExplanation}>
                  {explanation.detailedExplanation}
                </Text>
              )}

              <View style={styles.feedbackContainer}>
                <Text style={styles.feedbackTitle}>Help us improve your recommendations</Text>
                <View style={styles.feedbackButtons}>
                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      userFeedback === 'more_like_this' && styles.feedbackButtonActive,
                      isSubmitting && styles.feedbackButtonDisabled
                    ]}
                    onPress={() => handleFeedback('more_like_this')}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="add-circle-outline" size={20} color={THEME.whiteAlpha90} />
                    <Text style={styles.feedbackButtonText}>More like this</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.feedbackButton,
                      userFeedback === 'not_for_me' && styles.feedbackButtonActive,
                      isSubmitting && styles.feedbackButtonDisabled
                    ]}
                    onPress={() => handleFeedback('not_for_me')}
                    disabled={isSubmitting}
                  >
                    <Ionicons name="close-circle-outline" size={20} color={THEME.whiteAlpha90} />
                    <Text style={styles.feedbackButtonText}>Not for me</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
    maxWidth: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mainReason: {
    fontSize: 14,
    color: THEME.whiteAlpha90,
    flex: 1,
    marginRight: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: THEME.whiteAlpha10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.whiteAlpha90,
    flex: 1,
    marginRight: 16,
  },
  factorsContainer: {
    padding: 16,
    gap: 12,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  factorDescription: {
    fontSize: 14,
    color: THEME.whiteAlpha90,
    flex: 1,
    lineHeight: 20,
  },
  detailedExplanation: {
    marginTop: 16,
    fontSize: 14,
    color: THEME.whiteAlpha60,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  feedbackContainer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: THEME.whiteAlpha10,
  },
  feedbackTitle: {
    fontSize: 14,
    color: THEME.whiteAlpha90,
    marginBottom: 12,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  feedbackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: THEME.whiteAlpha10,
  },
  feedbackButtonActive: {
    backgroundColor: THEME.primary,
  },
  feedbackButtonDisabled: {
    opacity: 0.5,
  },
  feedbackButtonText: {
    fontSize: 14,
    color: THEME.whiteAlpha90,
    fontWeight: '500',
  },
}); 