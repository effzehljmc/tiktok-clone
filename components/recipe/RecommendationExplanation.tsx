import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '@/utils/i18n';
import { COLORS } from '@/constants/Colors';
import { RecommendationExplanation as ExplanationType } from '@/types/recommendation';
import { getFactorIcon } from '@/types/recommendation';
import { trackExplanationInteraction } from '@/utils/analytics';

interface Props {
  explanation: ExplanationType;
  videoId: string;
  expanded?: boolean;
}

export function RecommendationExplanation({ 
  explanation,
  videoId,
  expanded = false
}: Props) {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const { t } = useTranslation();
  
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
        <Text style={styles.mainReason}>{explanation.mainReason}</Text>
        <Ionicons 
          name={isExpanded ? 'chevron-up' : 'information-circle-outline'} 
          size={16} 
          color={COLORS.whiteAlpha60}
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
              <Text style={styles.modalTitle}>{explanation.mainReason}</Text>
              <TouchableOpacity 
                onPress={() => setIsExpanded(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={COLORS.whiteAlpha90} />
              </TouchableOpacity>
            </View>

            <View style={styles.factorsContainer}>
              {explanation.factors.map((factor, index) => (
                <View key={index} style={styles.factor}>
                  <Ionicons 
                    name={getFactorIcon(factor.type)} 
                    size={16} 
                    color={COLORS.whiteAlpha90}
                  />
                  <Text style={styles.factorDescription}>
                    {t(factor.i18n_key, factor.i18n_params)}
                  </Text>
                  {factor.score > 0 && (
                    <Text style={styles.factorScore}>
                      {Math.round(factor.score * 100)}%
                    </Text>
                  )}
                </View>
              ))}
              
              {explanation.detailedExplanation && (
                <Text style={styles.detailedExplanation}>
                  {explanation.detailedExplanation}
                </Text>
              )}
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
    color: COLORS.whiteAlpha90,
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
    borderBottomColor: COLORS.whiteAlpha10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.whiteAlpha90,
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
    color: COLORS.whiteAlpha90,
    flex: 1,
    lineHeight: 20,
  },
  factorScore: {
    fontSize: 14,
    color: COLORS.whiteAlpha90,
    fontVariant: ['tabular-nums'],
    marginLeft: 8,
  },
  detailedExplanation: {
    marginTop: 16,
    fontSize: 14,
    color: COLORS.whiteAlpha60,
    fontStyle: 'italic',
    lineHeight: 20,
  },
}); 