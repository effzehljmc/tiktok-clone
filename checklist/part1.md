Hier ist dein **überarbeiteter Step-by-Step-Plan für Woche 1**, angepasst an die **Projektanforderungen** und basierend auf der bisherigen Implementierungsbeschreibung aus dem Transkript.

Da du dich für den **Konsumententyp** entschieden hast, werde ich den Plan fokussiert auf eine **spezifische Konsumentengruppe** schreiben – z. B. **Fitness-Enthusiasten, die Workouts entdecken wollen**. Falls du eine andere Zielgruppe möchtest, kann ich es anpassen.

---

# **📅 Woche 1: Implementierungsplan für den Konsumententyp**
### **🚀 Ziel: Einen funktionierenden vertikalen Konsumenten-Flow entwickeln**
✅ **Ergebnis am Ende von Woche 1:** Nutzer können sich einloggen, durch einen personalisierten Video-Feed scrollen, Videos liken, kommentieren, speichern und suchen.

---

## **📌 Phase 1: Basis-App & Struktur (Tag 1-2)**  
**Ziel:** Projekt einrichten, Navigation & grundlegende Architektur aufsetzen.

### **🔹 Schritt 1: Initialisierung & Projektstruktur**
- **Expo & React Native-Projekt mit Supabase einrichten**
  - `expo init reelai`
  - Supabase-Client konfigurieren
  - `.env`-Datei für API-Keys hinzufügen
- **Projektstruktur bereinigen**
  - Nicht benötigte Default-Dateien entfernen
  - **Ordnerstruktur aufbauen:**
    ```
    /app
      /screens
        Home.tsx
        Search.tsx
        Profile.tsx
        Saved.tsx
        Notifications.tsx
      /components
        VideoItem.tsx
        LikeButton.tsx
        CommentSection.tsx
      /utils
        supabase.ts
    ```

### **🔹 Schritt 2: Navigation & Authentifizierung**
- **Expo Router installieren** für Navigation  
- **Tab-Bar mit 5 Tabs einrichten:**
  - **Home (Feed)**
  - **Search (Suchen & Entdecken)**
  - **Saved (Gespeicherte Videos)**
  - **Notifications (Benachrichtigungen)**
  - **Profile (Eigenes Profil)**  
- **Supabase-Auth integrieren:**  
  - Login & Registrierung mit E-Mail/Passwort  
  - Zustand des Users in `supabase.auth.getUser()` verwalten  

---

## **📌 Phase 2: Konsumenten-Features (Tag 3-4)**  
**Ziel:** Einen funktionierenden **Workout-Video-Feed** bauen.

### **🔹 Schritt 3: Video-Feed mit Autoplay & Swipe-Funktion**
- **Supabase-Datenbank für Videos aufsetzen:**
  ```sql
  CREATE TABLE videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    video_url TEXT NOT NULL,
    creator_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **Daten in Supabase laden** (Test-Videos hinzufügen)
- **Video-Feed umsetzen:**  
  - `FlatList` für Scrollen  
  - `expo-av` für Videoplayer  
  - **Autoplay bei Sichtbarkeit** mit `onViewableItemsChanged`  

---

### **🔹 Schritt 4: Likes & Speicherung von Likes**
- **Supabase-Tabelle für Likes aufsetzen:**
  ```sql
  CREATE TABLE likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    video_id UUID REFERENCES videos(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **Like-Button in `VideoItem.tsx` hinzufügen**
- **Like-Status pro Video abrufen & speichern**
- **Nutzer können Videos liken & entliken**

---

## **📌 Phase 3: Erweiterte Konsumenten-Funktionen (Tag 5-6)**
**Ziel:** Kommentare, Suche & gespeicherte Videos implementieren.

### **🔹 Schritt 5: Kommentare lesen & schreiben**
- **Supabase-Tabelle für Kommentare aufsetzen:**
  ```sql
  CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    video_id UUID REFERENCES videos(id),
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **`CommentSection.tsx` erstellen** für Kommentare unter Videos  
- **Kommentare aus Supabase abrufen & posten**  
- **Nutzer können Kommentare liken & melden**  

---

### **🔹 Schritt 6: Suche & Entdecken**
- **Supabase-Index für effiziente Suche anlegen:**
  ```sql
  CREATE INDEX video_search_idx ON videos USING GIN (to_tsvector('english', title));
  ```
- **Suche nach Titeln & Hashtags implementieren** in `Search.tsx`
- **Ergebnisse als klickbare Liste anzeigen**
- **Filteroptionen für Workouts (z. B. nach Dauer, Intensität)**

---

### **🔹 Schritt 7: Speichern von Videos für später**
- **Supabase-Tabelle für gespeicherte Videos aufsetzen:**
  ```sql
  CREATE TABLE saved_videos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    video_id UUID REFERENCES videos(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **"Gespeicherte Videos"-Seite (`Saved.tsx`)** erstellen  
- **Nutzer können Videos speichern & entfernen**  
- **Liste der gespeicherten Videos im Tab abrufen**  

---

## **📌 Phase 4: Letzte Optimierungen & Testing (Tag 7)**
**Ziel:** Bugs fixen, App stabilisieren & Testen für Abgabe.

### **🔹 Schritt 8: Aktivitäten & Benachrichtigungen**
- **Supabase-Tabelle für Aktivitäten aufsetzen:**
  ```sql
  CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    type TEXT NOT NULL,
    video_id UUID REFERENCES videos(id),
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- **Benachrichtigungs-Seite (`Notifications.tsx`) erstellen**
- **Nutzer sehen neue Likes, Kommentare & Antworten**

---

### **🔹 Schritt 9: Finaler Test & Deployment**
- **End-to-End-Test der gesamten App**
  - Anmeldung & Navigation prüfen
  - Video-Feed testen (Autoplay, Scrollen)
  - Likes, Kommentare, gespeicherte Videos validieren
- **Fehler in Logs prüfen & fixen**
- **Deployment mit Expo & GitHub hochladen**

---

# **🎯 Fazit:**
✅ **Dieser Plan ist genau auf die Anforderungen abgestimmt.**  
✅ **Erfüllt das Kriterium "ein spezifischer Konsument" mit Fitness-Enthusiasten.**  
✅ **Ermöglicht es, Woche 2 mit AI-Personalisierung aufzubauen.**  

---

### **🚀 Bonus: Vorbereitung für Woche 2 (AI-Features)**
Hier einige mögliche **AI-Features für Woche 2**:  
1. **Smart Workout Recommendations** → AI empfiehlt passende Videos.  
2. **AI-gestützte Suche** → Nutzer suchen nach Übungen, AI erkennt Inhalte im Video.  
3. **AI Workout Analyzer** → AI analysiert Workout-Technik und gibt Tipps.  

➡️ **Lass mich wissen, ob du Änderungen möchtest oder Code für einen bestimmten Schritt brauchst!** 😊