# Personalisierte Rezept- und Video-Discovery

## 1. Verstehe die Datenmodelle und Anforderungen

### Kernmodelle (Prisma Schema)

1. **Video Model**
   - Basisinformationen:
     - `id`, `title`, `description`, `videoUrl`, `thumbnailUrl`
     - Engagement-Metriken: `viewsCount`, `likesCount`, `commentsCount`
     - Kategorisierung: `category` (COOKING, BREAKFAST, LUNCH, etc.)
     - `tags` Array für zusätzliche Kategorisierung
     - Creator-Beziehung via `creatorId`

2. **VideoMetrics Model**
   - Nutzer-spezifische Interaktionsdaten:
     - `watchedSeconds` - Angesehene Zeit
     - `lastPosition` - Letzte Wiedergabeposition
     - `completed` - Video vollständig angesehen
     - `replayCount` - Anzahl der Wiederholungen
     - `averageWatchPercent` - Durchschnittlicher Prozentsatz angesehen
     - Unique constraint auf `[userId, videoId]` für Nutzer-spezifisches Tracking

3. **RecipeMetadata Model**
   - Rezept-spezifische Informationen:
     - `ingredients` Array
     - `cookingTime` in Minuten
     - `difficulty` (BEGINNER, INTERMEDIATE, ADVANCED)
     - `cuisine` Typ
     - `servings` und `calories`
     - `equipment` benötigt
     - `dietaryTags` für Ernährungspräferenzen
     - `steps` als JSON mit Timestamps und Beschreibungen

### Personalisierungsfaktoren

1. **Engagement Metriken**
   - Wiedergabezeit (`watchedSeconds`)
   - Abschlussrate (`completed`)
   - Wiederholungsverhalten (`replayCount`)
   - Durchschnittliche Betrachtungszeit (`averageWatchPercent`)

2. **Inhaltliche Ähnlichkeit**
   - Rezeptcharakteristiken:
     - Übereinstimmung der Küche
     - Schwierigkeitsgrad-Präferenz
     - Zubereitungszeit-Präferenzen
     - Übereinstimmung der Ernährungspräferenzen
   - Video-Metadaten:
     - Kategorie-Übereinstimmungen
     - Tag-Überlappungen
     - Titel/Beschreibungs-Ähnlichkeit

3. **Soziale Signale**
   - Likes (`likes` Tabelle)
   - Kommentare (`comments` Tabelle)
   - Creator-Following-Status (`followers` Tabelle)
   - Speicherverhalten (`savedRecipes` Tabelle)

### Ziel der Personalisierung

Das Hauptziel ist es, für jeden Nutzer einen personalisierten Score pro Video zu berechnen, der sich aus zwei Hauptkomponenten zusammensetzt:

1. **Nutzerinteraktionen**
   - Basierend auf VideoMetrics (Watch Time, Replay Count, etc.)
   - Gewichtung der verschiedenen Interaktionstypen
   - Berücksichtigung des zeitlichen Verlaufs

2. **Inhaltliche Relevanz**
   - Semantische Ähnlichkeit von Titeln und Beschreibungen
   - Übereinstimmung von Rezeptmerkmalen
   - Ähnlichkeit der Ernährungspräferenzen

Diese Faktoren sollen in einem hybriden Empfehlungsalgorithmus kombiniert werden, um einen personalisierten Feed zu erstellen, der sowohl das Nutzerverhalten als auch inhaltliche Präferenzen berücksichtigt.

## 2. KI-basierte Empfehlungslogik

• Idee: Integriere eine AI-basierte Empfehlung, die personalisierte Feeds anzeigt. Nutze dabei das vorhandene Video Metrics System (Views, Watch Time, Replay Count etc.) und kombiniere es mit Embeddings oder Recommender-System-Ansätzen (z.B. Kollaboratives Filtern oder Content-basierte Empfehlungen).  

• Nutzen für UX: Anstatt nur chronologisch oder nach Views zu sortieren, erkennt die KI das Nutzungsverhalten und schlägt Videos vor, die inhaltlich ähnlich sind oder besonders gut zur Ernährungsweise bzw. zum Geschmack passen.  

• Umsetzungsidee:
  1. Kombiniere deine vorhandenen **VideoMetrics** (Watch Time, Replay Count, Completion Rate) mit semantischen **Text-Embeddings** (z.B. via OpenAI) für Titel, Beschreibung, Tags und ggf. Rezeptzutaten.  
  2. Errechne (z.B. in einem Cloud Function- oder Supabase Edge Function-Job) einen Score pro Video für jeden User.  
  3. Beim Laden deines "Video-Feeds" nutze diesen Score, um die Reihenfolge zu personalisieren.  
  4. Alternativ kannst du das Tag-System (z.B. Vegan, Vegetarisch, Cuisine etc.) mit in den Algorithmus integrieren, um direkt Rezepte zu empfehlen, die zum Nutzerprofil passen (siehe vorhandene Felder in deinen Models).  

### User Stories
• "Als Nutzerin möchte ich eine auf mich zugeschnittene Rezept-Auswahl sehen, die zu meinen Diätvorlieben passt."  
• "Als User möchte ich Videos vorgeschlagen bekommen, die meinen bisherigen Like- oder View-Gewohnheiten ähneln."  

## Weitere Ideen (optional)
- Textbasierte "Zusammenfassung" des Videos (bspw. automatisches Erstellen einer Schritt-für-Schritt-Checkliste aus dem Transkript).  
- Automatisches Tagging und Hashtag-Empfehlungen für Creator (z.B. via Feature: TrendLens) – besonders spannend, wenn du das Creator-Szenario vertiefen willst.  
- Voice Commands: "Schneid das erste und letzte Segment weg" oder "Füge Musik hinzu" (in Kombination mit einem Video-Editor wie OpenShot per Cloud Function).  

Der KI-Ansatz für das personalisierte Rezept- und Videodiscovery-Feature kombiniert zwei wesentliche Datenströme, um individuelle Empfehlungen zu generieren:

1. **Analyse von Nutzerinteraktionen und Video-Metriken**  
   - Die App sammelt bereits Metriken wie Watch Time, Replay Count, Completion Rate usw.  
   - Diese Kennzahlen geben Aufschluss darüber, welche Videos oder Rezeptinhalte für den jeweiligen Nutzer besonders interessant oder relevant sind.
   - Anhand dieser Daten kann ein Engagement-Score berechnet werden, der z. B. feststellt, ob ein Video wiederholt oder fast vollständig angesehen wurde.

2. **Semantische Inhaltsanalyse mittels NLP und Text-Embeddings**  
   - Inhalte wie Titel, Beschreibungen, Rezeptzutaten und weitere Metadaten werden mittels Natural Language Processing (NLP) in numerische Vektoren (Embeddings) umgewandelt.  
   - Diese Vektor-Repräsentationen ermöglichen es, die semantische Ähnlichkeit zwischen verschiedenen Videos und Rezepten zu bestimmen.  
   - Hierbei können z. B. OpenAI-Modelle oder ähnliche Dienste eingesetzt werden, um einen sogenannten "Content-Space" zu erzeugen.

3. **Kombinierter Empfehlungsalgorithmus (hybrider Ansatz)**  
   - **Content-basierte Empfehlung:** Die semantischen Embeddings helfen dabei, Videos zu identifizieren, die inhaltlich ähnlich sind. Wird ein bestimmtes Rezeptvideo häufig angesehen, können Videos mit ähnlichen Inhalten hervorgehoben werden.  
   - **Verhaltensorientierte Empfehlung:** Die aus den Video-Metriken abgeleiteten Scores (basierend auf Watch Time, Replay Count etc.) fließen in den Empfehlungsalgorithmus ein. So wird berücksichtigt, welche Inhalte der Nutzer bevorzugt konsumiert.
   - Optional können auch Ansätze des kollaborativen Filterings integriert werden, indem das Verhalten ähnlicher Nutzer mit einbezogen wird.

4. **Personalisierte Feed-Gestaltung**  
   - Die beiden Ansätze werden kombiniert, um für jeden Nutzer einen individuellen Score pro Video zu berechnen.  
   - Beim Laden des Video-Feeds wird dieser Score genutzt, um die Reihenfolge der Videos dynamisch anzupassen – Inhalte, die sowohl inhaltlich passen als auch von hoher Engagement-Metrik geprägt sind, werden prominenter platziert.

Zusammengefasst:  
Der KI-Ansatz integriert also sowohl die expliziten inhaltlichen Eigenschaften der Videos (über Embeddings) als auch implizites Nutzerverhalten (über Metriken), um ein hybrides Empfehlungssystem zu realisieren. Dies führt zu einem personalisierten Feed, der sich optimal an die individuellen Vorlieben und das Konsumverhalten der Nutzer anpasst.

Implementierung

Score = (watched_seconds * 1.0) +          -- 1 Punkt pro Sekunde angeschaut
        (CASE WHEN completed THEN 50 ELSE 0 END) + -- 50 Punkte für komplettes Anschauen
        (replay_count * 10) +              -- 10 Punkte pro Wiederholung
        (average_watch_percent * 0.5)      -- 0.5 Punkte pro % durchschnittlich geschaut


