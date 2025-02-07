# Video Metrics System

Das Video Metrics System sammelt und verarbeitet Engagement-Daten für den Recommendation-Algorithmus.

## Tracked Metrics

- **Views**: Zählt eindeutige Aufrufe pro User-Session
- **Watch Time**: Verfolgt die angesehenen Sekunden pro Video
- **Completion Rate**: Markiert Videos als abgeschlossen bei 90% Betrachtung
- **Replay Count**: Zählt wie oft ein User ein Video wiederholt
- **Average Watch Percentage**: Berechnet den durchschnittlichen Prozentsatz der Betrachtung über alle Wiedergaben
- **Last Position**: Speichert die letzte Wiedergabeposition für Resume-Funktionalität

## Technische Implementation

### Datenbank-Schema
```prisma
model VideoMetrics {
  id                   String   @id @default(dbgenerated("uuid_generate_v4()")) @db.Uuid
  videoId             String   @map("video_id") @db.Uuid
  userId              String   @map("user_id") @db.Uuid
  watchedSeconds      Int      @default(0)
  watchedAt           DateTime @default(now())
  lastPosition        Int      @default(0)
  completed           Boolean  @default(false)
  replayCount         Int      @default(0)
  averageWatchPercent Float    @default(0)
  // ... relations and indexes
}
```

### Verwendung
Das Metrics-System trackt User-Engagement automatisch über den `useVideoMetrics` Hook:

```typescript
const { trackVideoMetrics } = useVideoMetrics();

// In der Video-Komponente
onPlaybackStatusUpdate={(status) => {
  trackVideoMetrics(videoId, status, prevStatus);
}}
```

### Technische Features
- Verwendet Prisma für Datenbankschema und Migrationen
- Implementiert RPC-Funktionen für atomares View-Counting
- Batch-Updates zur Reduzierung der Datenbankbelastung
- Retry-Logik für fehlgeschlagene Updates
- Session-basiertes View-Tracking

### Performance-Optimierungen
- Batch-Verarbeitung von Metriken
- Effiziente Datenbankindizes
- Optimierte Abfragen für Recommendation Engine
- Caching häufig verwendeter Metriken 