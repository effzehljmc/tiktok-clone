import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
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

      {isExpanded && (
        <BlurView intensity={10} tint="dark" style={styles.factorsContainer}>
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
        </BlurView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    borderRadius: 8,
    overflow: 'hidden',
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
  factorsContainer: {
    padding: 12,
    gap: 8,
    backgroundColor: COLORS.whiteAlpha05,
    borderRadius: 8,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  factorDescription: {
    fontSize: 13,
    color: COLORS.whiteAlpha60,
    flex: 1,
  },
  factorScore: {
    fontSize: 12,
    color: COLORS.whiteAlpha90,
    fontVariant: ['tabular-nums'],
  },
  detailedExplanation: {
    marginTop: 12,
    fontSize: 12,
    color: COLORS.whiteAlpha60,
    fontStyle: 'italic',
    lineHeight: 18,
  },
}); 