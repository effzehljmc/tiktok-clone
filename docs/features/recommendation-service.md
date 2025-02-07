# Recommendation Service

Der Recommendation Service kombiniert Nutzerinteraktionen mit inhaltlicher Ähnlichkeit, um personalisierte Video-Empfehlungen zu generieren.

## Implementierte Features

### 1. Hybrid Scoring System
- **Engagement Score** (70% Gewichtung)
  ```sql
  engagement_score = (watched_seconds * 1.0) +          -- 1 Punkt pro Sekunde
                    (CASE WHEN completed THEN 50 ELSE 0 END) + -- 50 Punkte für Completion
                    (replay_count * 10) +              -- 10 Punkte pro Replay
                    (average_watch_percent * 0.5)      -- 0.5 Punkte pro % Watch Time
  ```
- **Content Similarity** (30% Gewichtung)
  - Basiert auf OpenAI Text-Embeddings
  - Berücksichtigt Titel, Beschreibung, Tags und Rezept-Metadaten
  - Verwendet Cosine Similarity für Ähnlichkeitsberechnung

### 2. Automatische Score-Aktualisierung
- Stündliche Neuberechnung via pg_cron
- Speicherung in `video_scores` Tabelle
- Berücksichtigung des zuletzt angesehenen Videos für Ähnlichkeitsberechnung

### 3. Datenmodell
- **VideoMetrics**: Tracking von User-Interaktionen
  - Watched Time, Completion Rate, Replay Count
  - Average Watch Percent
- **Video Scores**: Persistente Score-Speicherung
  - Engagement Score
  - Content Similarity Score
  - Combined Total Score

## API Endpoints
```typescript
// Personalisierte Video-Empfehlungen abrufen
getPersonalizedVideos(
  userId: string,
  referenceVideoId?: string,
  limit: number = 10
): Promise<(Video & { recommendationScore: number })[]>
```

## Technische Details
1. **Embedding Generation**
   - OpenAI API (text-embedding-ada-002)
   - 1536-dimensionale Vektoren
   - Speicherung in PostgreSQL mit pgvector

2. **Similarity Search**
   - IVFFlat Index für schnelle Ähnlichkeitssuche
   - Cosine Similarity Operator (<->)
   - Optimierte Batch-Verarbeitung

3. **Score Calculation**
   ```typescript
   totalScore = (engagementScore * 0.7) + (contentSimilarityScore * 0.3)
   ```

## Automatisierung
- Stündlicher Cron-Job für Score-Aktualisierung
- Automatische Embedding-Generierung für neue Videos
- Regelmäßige Neuberechnung der Ähnlichkeitsscores 