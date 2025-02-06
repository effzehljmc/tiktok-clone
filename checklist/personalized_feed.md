
### 2. Personalisiertes Rezept- und Video-Discovery via KI
• Idee: Integriere eine AI-basierte Empfehlung, die personalisierte Feeds anzeigt. Nutze dabei das vorhandene Video Metrics System (Views, Watch Time, Replay Count etc.) und kombiniere es mit Embeddings oder Recommender-System-Ansätzen (z.B. Kollaboratives Filtern oder Content-basierte Empfehlungen).  
• Nutzen für UX: Anstatt nur chronologisch oder nach Views zu sortieren, erkennt die KI das Nutzungsverhalten und schlägt Videos vor, die inhaltlich ähnlich sind oder besonders gut zur Ernährungsweise bzw. zum Geschmack passen.  
• Umsetzungsidee:
  1. Kombiniere deine vorhandenen **VideoMetrics** (Watch Time, Replay Count, Completion Rate) mit semantischen **Text-Embeddings** (z.B. via OpenAI) für Titel, Beschreibung, Tags und ggf. Rezeptzutaten.  
  2. Errechne (z.B. in einem Cloud Function- oder Supabase Edge Function-Job) einen Score pro Video für jeden User.  
  3. Beim Laden deines „Video-Feeds“ nutze diesen Score, um die Reihenfolge zu personalisieren.  
  4. Alternativ kannst du das Tag-System (z.B. Vegan, Vegetarisch, Cuisine etc.) mit in den Algorithmus integrieren, um direkt Rezepte zu empfehlen, die zum Nutzerprofil passen (siehe vorhandene Felder in deinen Models).  

Mögliche User Stories:  
• „Als Nutzerin möchte ich eine auf mich zugeschnittene Rezept-Auswahl sehen, die zu meinen Diätvorlieben passt.“  
• „Als User möchte ich Videos vorgeschlagen bekommen, die meinen bisherigen Like- oder View-Gewohnheiten ähneln.“  

---

## Weitere Ideen, die darauf aufbauen (optional)
- Textbasierte „Zusammenfassung“ des Videos (bspw. automatisches Erstellen einer Schritt-für-Schritt-Checkliste aus dem Transkript).  
- Automatisches Tagging und Hashtag-Empfehlungen für Creator (z.B. via Feature: TrendLens) – besonders spannend, wenn du das Creator-Szenario vertiefen willst.  
- Voice Commands: „Schneid das erste und letzte Segment weg“ oder „Füge Musik hinzu“ (in Kombination mit einem Video-Editor wie OpenShot per Cloud Function).  


#####

Der KI-Ansatz für das personalisierte Rezept- und Videodiscovery-Feature kombiniert zwei wesentliche Datenströme, um individuelle Empfehlungen zu generieren:

1. **Analyse von Nutzerinteraktionen und Video-Metriken**  
   - Die App sammelt bereits Metriken wie Watch Time, Replay Count, Completion Rate usw.  
   - Diese Kennzahlen geben Aufschluss darüber, welche Videos oder Rezeptinhalte für den jeweiligen Nutzer besonders interessant oder relevant sind.
   - Anhand dieser Daten kann ein Engagement-Score berechnet werden, der z. B. feststellt, ob ein Video wiederholt oder fast vollständig angesehen wurde.

2. **Semantische Inhaltsanalyse mittels NLP und Text-Embeddings**  
   - Inhalte wie Titel, Beschreibungen, Rezeptzutaten und weitere Metadaten werden mittels Natural Language Processing (NLP) in numerische Vektoren (Embeddings) umgewandelt.  
   - Diese Vektor-Repräsentationen ermöglichen es, die semantische Ähnlichkeit zwischen verschiedenen Videos und Rezepten zu bestimmen.  
   - Hierbei können z. B. OpenAI-Modelle oder ähnliche Dienste eingesetzt werden, um einen sogenannten „Content-Space“ zu erzeugen.

3. **Kombinierter Empfehlungsalgorithmus (hybrider Ansatz)**  
   - **Content-basierte Empfehlung:** Die semantischen Embeddings helfen dabei, Videos zu identifizieren, die inhaltlich ähnlich sind. Wird ein bestimmtes Rezeptvideo häufig angesehen, können Videos mit ähnlichen Inhalten hervorgehoben werden.  
   - **Verhaltensorientierte Empfehlung:** Die aus den Video-Metriken abgeleiteten Scores (basierend auf Watch Time, Replay Count etc.) fließen in den Empfehlungsalgorithmus ein. So wird berücksichtigt, welche Inhalte der Nutzer bevorzugt konsumiert.
   - Optional können auch Ansätze des kollaborativen Filterings integriert werden, indem das Verhalten ähnlicher Nutzer mit einbezogen wird.

4. **Personalisierte Feed-Gestaltung**  
   - Die beiden Ansätze werden kombiniert, um für jeden Nutzer einen individuellen Score pro Video zu berechnen.  
   - Beim Laden des Video-Feeds wird dieser Score genutzt, um die Reihenfolge der Videos dynamisch anzupassen – Inhalte, die sowohl inhaltlich passen als auch von hoher Engagement-Metrik geprägt sind, werden prominenter platziert.

Zusammengefasst:  
Der KI-Ansatz integriert also sowohl die expliziten inhaltlichen Eigenschaften der Videos (über Embeddings) als auch implizites Nutzerverhalten (über Metriken), um ein hybrides Empfehlungssystem zu realisieren. Dies führt zu einem personalisierten Feed, der sich optimal an die individuellen Vorlieben und das Konsumverhalten der Nutzer anpasst.


#####


Implementierung



#####


```markdown
# Schritt-für-Schritt Anleitung: Implementieren des personalisierten Rezept- und Videodiscovery-Features

Diese Anleitung zeigt dir, wie du das Feature “Personalisierte Rezept- und Videodiscovery” entwickelst, das sich nahtlos in die bestehende Codebasis und in unser Prisma-Datenmodell einfügt. Dabei kombinieren wir Interaktionsdaten (VideoMetrics) sowie inhaltliche Daten (RecipeMetadata und Video-Textinformationen), um jedem Nutzer einen individuellen Video-Feed anzubieten.

---

## 1. Verstehe die Datenmodelle und Anforderungen

- Schaue dir das Prisma-Schema (prisma/schema.prisma) an. Die relevanten Modelle für diesen Use-Case sind:
  - **Video** – Enthält Basisinformationen (Titel, Video-URL etc.).
  - **VideoMetrics** – Speichert pro Benutzer die Kennzahlen wie watched_seconds, replay_count usw.
  - **RecipeMetadata** – Enthält zusätzlich zu den basic Video-Daten Informationen über Rezepte (wie cookingTime, difficulty, ingredients usw.).
  
- Das Ziel ist es, für jeden User einen Score zu berechnen, der sowohl auf den Metriken (Nutzerinteraktionen) als auch auf inhaltlicher Ähnlichkeit (z. B. basierend auf Title/Description und Recipe-Metadaten) basiert.

---

## 2. Setup und Planung

- Stelle sicher, dass deine Entwicklungsumgebung läuft (Expo, React Native, Supabase, Prisma).
- Arbeite mit bestehenden Hooks wie `useVideos` und anderen Komponenten (z. B. in `RecipeFeed.tsx`), um die neue Logik zu integrieren.
- Entscheide, ob du den KI-Teil (Text-Embeddings) in Echtzeit berechnen oder vorab persistieren möchtest. Für den MVP kannst du zuerst den Schwerpunkt auf VideoMetrics legen.

---

## 3. Erstelle den Recommendation Service im Backend

Um die personalisierten Feeds zu berechnen, lege eine neue Service-Datei an, z. B. unter `services/recommendations.ts`.

Beispiel (pseudocode und einfache Logik):

```typescript
// services/recommendations.ts
import { supabase } from '@/utils/supabase';
import { Video } from '@/hooks/useVideos';

// Beispieltyp erweitern – füge z. B. eine Eigenschaft für den berechneten Score hinzu.
export interface PersonalizedVideo extends Video {
  personalizedScore?: number;
}

export async function getPersonalizedVideos(userId: string): Promise<PersonalizedVideo[]> {
  // 1. Hole alle veröffentlichten Videos aus der Datenbank
  const { data: videos, error } = await supabase
    .from('videos')
    .select(`
      id,
      title,
      description,
      video_url,
      thumbnail_url,
      views_count,
      likes_count,
      comments_count,
      recipeMetadata: recipe_metadata (
        cooking_time,
        difficulty,
        cuisine,
        dietary_tags
      )
    `)
    .eq('status', 'PUBLISHED');
  if (error) throw error;
  if (!videos) return [];

  // 2. Für jedes Video, hole die zugehörigen VideoMetrics für den aktuellen Nutzer
  const personalizedVideos: PersonalizedVideo[] = [];
  for (const video of videos) {
    const { data: metricsData } = await supabase
      .from('video_metrics')
      .select('*')
      .eq('video_id', video.id)
      .eq('user_id', userId)
      .single();
    
    // Berechne Beispiel-Score: z. B. watched_seconds + (replay_count * 10)
    let engagementScore = 0;
    if (metricsData) {
      engagementScore = metricsData.watched_seconds + (metricsData.replay_count * 10);
    }
    
    // Optional: Berechne zusätzlich einen Inhaltsähnlichkeits-Score (z. B. durch Text-Embeddings)
    // Falls du diesen Teil implementieren möchtest, kannst du hier eine Funktion aufrufen, die
    // Titel, Beschreibung oder Rezept-Metadaten in Vektor-Repräsentationen umwandelt und vergleicht.
    
    personalizedVideos.push({
      ...video,
      personalizedScore: engagementScore,
    });
  }

  // 3. Sortiere die Videos absteigend nach dem berechneten Score
  personalizedVideos.sort((a, b) => (b.personalizedScore || 0) - (a.personalizedScore || 0));
  return personalizedVideos;
}
```

---

## 4. Erstelle einen neuen Hook für personalisierte Videos

Lege einen neuen Hook an, um die personalisierten Videos in deinem Frontend zu verwenden. Erstelle z. B. `hooks/usePersonalizedVideos.ts`:

```typescript
// hooks/usePersonalizedVideos.ts
import { useQuery } from '@tanstack/react-query';
import { getPersonalizedVideos, PersonalizedVideo } from '@/services/recommendations';

export function usePersonalizedVideos(userId: string) {
  return useQuery<PersonalizedVideo[]>(['personalizedVideos', userId], () => getPersonalizedVideos(userId));
}
```

---

## 5. Integration ins Frontend

- **Anpassen der Video-Abfrage:**  
  In deinen bestehenden Komponenten (z. B. in `RecipeFeed.tsx` oder `VideoFeed.tsx`) kannst du nun den neuen Hook einbinden.  
  Beispiel:

```typescript
// components/recipe/RecipeFeed.tsx (Ausschnitt)
import { usePersonalizedVideos } from '@/hooks/usePersonalizedVideos';
import { useAuth } from '@/hooks/useAuth';

export function RecipeFeed() {
  const { user } = useAuth();
  // Verwende den neuen Hook, sofern der User eingeloggt ist
  const { data: videos, isLoading } = usePersonalizedVideos(user?.id || '');
  
  if (isLoading || !videos) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Zeige den Feed der personalisierten Videos an */}
      <VideoFeed
        videos={videos}
        showSearchIcon={false}
        renderVideoOverlay={(video) => (
          <>
            {/* Bestehende Overlays oder weitere personalisierte Elemente */}
            <Text>Score: {(video as any).personalizedScore || 0}</Text>
          </>
        )}
      />
    </View>
  );
}
```

- **Optional: Toggle zwischen normalem und personalisiertem Feed**  
  Falls gewünscht, kann ein UI-Element eingebaut werden, um zwischen chronologischer Reihenfolge und personalisierten Empfehlungen zu wechseln.

---

## 6. Testing und Validierung

- **Unit-Tests:** Schreibe Tests für deinen Recommendation Service, um sicherzustellen, dass die Scores korrekt berechnet und die Videos korrekt sortiert werden.
- **Integrationstests:** Teste im Frontend, ob der Feed entsprechend den Nutzerinteraktionen (z. B. erhöhter Watch Time, Replay Count) aktualisiert wird.
- **Manuelle Tests:** Logge dich als unterschiedliche Benutzer ein, um zu prüfen, dass der personalisierte Score Einfluss auf die Video-Reihenfolge hat.

---

## 7. Optimierung und Weiterentwicklung

- **Text Embeddings:** Falls du die inhaltliche Ähnlichkeitsberechnung einbauen möchtest, schaue dir die (auskommentierte) Funktion in `hooks/useVideoSearch.ts` an und integriere eine Lösung (z. B. OpenAI Embeddings).  
  Möglicherweise möchtest du in Zukunft Embeddings vorab berechnen und in die Datenbank zu speichern, um Laufzeitkosten zu sparen.
- **Caching und Performance:** Nutze die React Query Optionen, um Caching für personalisierte Daten optimal zu konfigurieren (staleTime, refetchOnWindowFocus etc.).

---

## 8. Code Review und Dokumentation

- Bitte einen erfahreneren Entwickler, deinen Code zu reviewen, insbesondere den Recommendation Service.
- Aktualisiere die Projektdokumentation, z. B. in `personalized_feed.md`, um den neuen Hook und Service zu beschreiben.

---

Diese Schritte führen dich von der Planung an über die Backend- und Frontend-Integration bis hin zum Testen und Optimieren des personalisierten Feeds – alles konsistent abgestimmt mit unserem Prisma-Datenmodell und der bestehenden Codebasis.
```


