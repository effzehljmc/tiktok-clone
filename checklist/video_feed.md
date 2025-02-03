Hier folgt eine detaillierte, chronologisch aufgebaute Schritt-für-Schritt-Anleitung, um den im Video gezeigten nächsten Teil umzusetzen – von der Session-Persistenz über das Sign-Out bis hin zur Integration der Kamera mit Videoaufzeichnung, Upload in Supabase Storage und anschließender Datenbank-Aktualisierung. Du findest unten jeden Schritt mit den nötigen Codebeispielen und Erklärungen.

---

## 1. Session-Persistenz mit Supabase onAuthStateChange

### 1.1. Problem:  
Aktuell wird der Nutzer bei jedem Laden der App zur Login-Seite geleitet, weil die Session nicht gespeichert wird. Supabase bietet mit `onAuthStateChange` eine Möglichkeit, den aktuellen Authentifizierungsstatus fortlaufend zu überwachen und die Session automatisch wiederherzustellen.

### 1.2. Umsetzung:  
In deinem globalen Auth-Provider (z. B. in `providers/AuthProvider.tsx`) fügst du einen Effekt ein, der bei jeder Änderung des Auth-Zustands (z. B. Sign In oder Sign Out) reagiert.

**Beispielcode:**

```tsx
// providers/AuthProvider.tsx
import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../utils/supabase';
import { useRouter } from 'expo-router';

const AuthContext = createContext({
  user: null,
  loading: true,
  signIn: async (email: string, password: string) => {},
  signUp: async (email: string, password: string, username: string) => {},
  signOut: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Beim Mounten: Überprüfe den aktuellen Session-Status
  useEffect(() => {
    // Abrufen der aktuellen Session
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        // Falls bereits eine Session besteht, hole die zusätzlichen Nutzerdaten
        getUser(data.session.user.id);
        router.push('/tabs'); // Automatischer Redirect zur Hauptseite
      }
      setLoading(false);
    });

    // Auth-State-Listener einrichten – er reagiert auf jede Änderung im Auth-Zustand
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        // Falls ein gültiger Session-Token vorhanden ist, hole den Nutzer
        getUser(session.user.id);
        router.push('/tabs');
      } else {
        // Kein gültiger Session-Token: (Optional) kannst du hier z. B. den Nutzer abmelden oder den Login anzeigen
        setUser(null);
      }
    });

    // Listener beim Unmounting bereinigen
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function getUser(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error) {
      console.error('GetUser error:', error);
      return;
    }
    setUser(data);
  }

  // Weitere Funktionen: signIn, signUp und signOut (siehe nachfolgende Schritte)

  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('SignIn error:', error);
      return;
    }
    await getUser(data.session?.user.id);
    router.push('/tabs');
  }

  async function signUp(email: string, password: string, username: string) {
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) {
      console.error('SignUp error:', authError);
      return;
    }
    const userId = authData.user?.id;
    const { error: dbError } = await supabase
      .from('users')
      .insert([{ id: userId, username, email }])
      .single();
    if (dbError) {
      console.error('DB Insert error:', dbError);
      return;
    }
    await getUser(userId);
    router.back(); // Falls der SignUp als Modal angezeigt wird
  }

  async function signOut() {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/login');
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
```

---

## 2. Hinzufügen eines Sign-Out-Buttons

### 2.1. Problem:  
Du möchtest, dass der Nutzer sich ausloggen kann – idealerweise an einer Stelle wie im Profil- oder Menübereich.

### 2.2. Umsetzung:  
Erstelle in deiner Profil-Seite oder einem anderen passenden Bereich einen Button, der beim Drücken die `signOut`-Funktion des Auth-Providers aufruft.

**Beispielcode (z. B. in `Profile.tsx`):**

```tsx
// screens/Profile.tsx
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth } from '../providers/AuthProvider';

export default function Profile() {
  const { user, signOut } = useAuth();

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Hallo, {user ? user.username : 'Gast'}!</Text>
      <Button title="Sign Out" onPress={signOut} />
    </View>
  );
}
```

---

## 3. Integration der Kamera-Funktionalität

### 3.1. Installation und Konfiguration

1. **Installiere Expo Camera:**

   ```bash
   npx expo install expo-camera
   ```

2. **Passe deine `app.json` oder `app.config.js` an:**  
   Füge in den Plugins-Einstellungen den `expo-camera`-Plugin-Eintrag hinzu (neben Expo Router, falls benötigt).

   **Beispiel (app.json):**

   ```json
   {
     "expo": {
       "plugins": [
         "expo-camera",
         "expo-router"
       ]
       // ... weitere Konfiguration
     }
   }
   ```

3. **Starte den Server neu,** damit die Änderungen wirksam werden.

---

## 4. Erstellen der Kamera-Seite

### 4.1. Neue Route für die Kamera als Modal  
Erstelle eine Datei z. B. `camera.tsx` im entsprechenden Routenordner (z. B. im Root-Level, wenn du den Expo Router verwendest).

### 4.2. Kamera-UI und Grundfunktionen

**Beispielcode:**

```tsx
// camera.tsx
import React, { useState, useRef } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Camera, CameraType } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export const presentation = 'modal'; // Damit wird diese Route als Modal angezeigt

export default function CameraScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(CameraType.back);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const cameraRef = useRef<Camera>(null);
  const router = useRouter();

  // Anfrage der Kameraberechtigung (kann auch im useEffect geschehen)
  React.useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>Keine Kameraberechtigung erteilt.</Text>;
  }

  // Funktion: Kamera umschalten (vorne/hinten)
  const flipCamera = () => {
    setCameraType((current) =>
      current === CameraType.back ? CameraType.front : CameraType.back
    );
  };

  // Funktion: Video aufnehmen bzw. beenden
  const handleRecordVideo = async () => {
    if (isRecording) {
      // Aufnahme stoppen
      if (cameraRef.current) {
        const video = await cameraRef.current.stopRecording();
        console.log('Aufgezeichnetes Video:', video.uri);
        setVideoUri(video.uri);
        setIsRecording(false);
      }
    } else {
      // Aufnahme starten
      if (cameraRef.current) {
        setIsRecording(true);
        const video = await cameraRef.current.recordAsync();
        console.log('Video wird aufgenommen:', video.uri);
        setVideoUri(video.uri);
      }
    }
  };

  // Dummy-Funktion zum Pausieren (falls benötigt)
  const pauseRecording = () => {
    // Logik für Pause (z. B. Kamera-Vorschau pausieren) – Expo Camera unterstützt in der Regel nur start/stop
  };

  return (
    <View style={{ flex: 1 }}>
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        type={cameraType}
        ratio="16:9"
      />

      {/* Steuerungsbuttons */}
      <View style={{
        position: 'absolute',
        bottom: 30,
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center'
      }}>
        {/* Kamera umschalten */}
        <TouchableOpacity onPress={flipCamera}>
          <Ionicons name="camera-reverse-outline" size={32} color="white" />
        </TouchableOpacity>

        {/* Aufnahme-/Stop-Button */}
        <TouchableOpacity
          onPress={handleRecordVideo}
          style={{
            backgroundColor: isRecording ? 'red' : 'white',
            width: 70,
            height: 70,
            borderRadius: 35,
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Ionicons name="videocam" size={32} color={isRecording ? 'white' : 'black'} />
        </TouchableOpacity>

        {/* Falls gewünscht: Button für "Pause" oder zusätzliche Optionen */}
        <TouchableOpacity onPress={pauseRecording}>
          <Ionicons name="pause-circle" size={32} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 5. Video speichern: Hochladen in Supabase Storage und Datenbank-Update

### 5.1. Upload in den Storage

Sobald du ein Video aufgenommen hast und eine `videoUri` vorhanden ist, möchtest du dem Nutzer die Möglichkeit geben, das Video zu speichern. Hierzu musst du:

1. **Ein FormData-Objekt erstellen:**  
   Hänge das Video an das FormData an. Achte darauf, den Dateinamen und den MIME-Type korrekt zu setzen.

2. **Die Datei in den Supabase Storage hochladen:**  
   Verwende dazu die Supabase Storage API.

**Beispielcode (innerhalb der Kamera-Komponente oder in einer separaten Funktion):**

```tsx
const saveVideo = async () => {
  if (!videoUri) return;

  // Extrahiere Dateinamen aus der URI
  const fileName = videoUri.split('/').pop();
  // Hier wird angenommen, dass es sich um ein MP4 handelt – passe den MIME-Type ggf. an
  const fileType = 'video/mp4';

  const formData = new FormData();
  formData.append('file', {
    uri: videoUri,
    name: fileName,
    type: fileType,
  } as any); // Typanpassung für FormData

  // Hochladen in den Storage – der Bucket "videos" muss in Supabase vorher angelegt werden!
  const { data, error } = await supabase.storage
    .from('videos')
    .upload(`videos/${fileName}`, formData, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload-Fehler:', error);
    return;
  }

  console.log('Hochgeladene Datei:', data);

  // Anschließend den Pfad (data.path) in der Datenbank speichern
  await insertVideoToDB(data.path);
};
```

### 5.2. Video-Daten in der Datenbank speichern

Füge in deiner Datenbank (z. B. in der Tabelle `videos`) einen neuen Eintrag ein. Die benötigten Felder könnten z. B. `title`, `uri` (Speicherpfad) und `user_id` sein.

**Beispielcode:**

```tsx
const insertVideoToDB = async (filePath: string) => {
  // Hier nehmen wir an, dass du Zugriff auf das globale user-Objekt hast (z. B. über den Auth-Context)
  const { user } = useAuth();
  const title = 'Test Title'; // Ersetze dies ggf. durch ein dynamisches Feld

  const { data, error } = await supabase
    .from('videos')
    .insert([{ title, uri: filePath, user_id: user?.id }]);

  if (error) {
    console.error('DB Insert Error:', error);
  } else {
    console.log('Video in DB gespeichert:', data);
    // Nach erfolgreichem Upload und DB-Insert: Modal schließen und zurück navigieren
    router.back();
  }
};
```

> **Hinweis:** Stelle sicher, dass du in deinem Supabase-Projekt einen Bucket namens z. B. „videos“ angelegt hast und die entsprechenden Richtlinien (Policies) eingerichtet sind. Für Testzwecke kannst du z. B. allen authentifizierten Nutzern Schreibrechte einräumen.

---

## 6. Optimierung: Kamera als Modal in der Tab-Navigation

### 6.1. Problem:  
Der Kamera-Bildschirm sollte als vollbildiges Modal angezeigt werden – jedoch ist er aktuell in der Tab-Bar integriert.

### 6.2. Umsetzung:
- **Erstelle eine separate Routen-Datei:**  
  Wie oben in `camera.tsx` gezeigt.
- **In der Tab-Bar-Konfiguration:**  
  Fange den Tab-Press ab und leite stattdessen zur Kamera-Route weiter.  
  **Beispiel (in deinem Tab-Navigator):**

  ```tsx
  // Beispiel in deinem Tab-Layout (z. B. in tabs.tsx)
  import { useRouter } from 'expo-router';

  // In der Tab-Komponente:
  <Tab.Screen
    name="Camera"
    component={CameraScreen}
    options={{
      tabBarButton: (props) => {
        const router = useRouter();
        return (
          <TouchableOpacity
            {...props}
            onPress={(e) => {
              e.preventDefault();
              router.push('/camera'); // Öffnet den Kamera-Modal
            }}
          >
            {/* Icon etc. */}
          </TouchableOpacity>
        );
      },
    }}
  />
  ```

- **Im Kamera-Modal:**  
  Stelle sicher, dass beim Abschluss (z. B. nach erfolgreichem Upload) der Router zurück navigiert:
  ```tsx
  router.back();
  ```

---

## 7. Zusammenfassung und abschließende Tests

1. **Session-Persistenz:**  
   - Der Auth-Provider überwacht permanent den Auth-Status über `onAuthStateChange` und ruft bei vorhandener Session automatisch `getUser` auf, sodass der Nutzer nicht bei jedem Neustart eingeloggt werden muss.

2. **Sign-Out:**  
   - Ein Sign-Out-Button (z. B. im Profil) ruft `signOut` auf, setzt den globalen Nutzer auf `null` und navigiert zum Login.

3. **Kamera-Funktionalität:**  
   - Die Expo Camera wird installiert und in einem eigenen Modal angezeigt.
   - Der Nutzer kann die Kamera umschalten, ein Video aufnehmen (Start/Stop) und über einen Button den Aufnahmevorgang triggern.
   - Nach der Aufnahme wird die Video-URI gespeichert.

4. **Video-Upload:**  
   - Das aufgezeichnete Video wird mithilfe eines FormData-Objekts in einen Supabase Storage Bucket (z. B. „videos“) hochgeladen.
   - Nach erfolgreichem Upload wird der Datei-Pfad in der Datenbank (z. B. Tabelle `videos`) zusammen mit einem Titel und der Nutzer-ID gespeichert.

5. **Navigation:**  
   - Nach erfolgreichem Upload wird das Kamera-Modal automatisch geschlossen (mittels `router.back()`), sodass der Nutzer zur Hauptseite (bzw. Tab-Navigation) zurückkehrt.

6. **End-to-End-Test:**  
   - Teste die gesamte Flow: Starte die App, prüfe, ob bei bereits vorhandener Session automatisch weitergeleitet wird, logge dich aus und wieder ein, teste die Kamera (auf einem echten Gerät via Expo Go), nimm ein Video auf, lade es hoch und überprüfe, ob in Supabase sowohl der Storage als auch die Datenbank korrekt aktualisiert werden.

---

Mit diesen Schritten hast du den nächsten Teil des Videos vollständig umgesetzt:  
- **Session-Persistenz** (Vermeidung des erneuten Logins bei jedem App-Start)  
- **Sign Out**  
- **Integration und Nutzung der Expo Camera** inkl. Videoaufnahme, Upload in Supabase Storage und anschließende Speicherung der Video-Informationen in der Datenbank  
- **Einbau eines Kamera-Modals** innerhalb der Navigation

Nun bist du bestens vorbereitet, im nächsten Schritt (oder Video) die Videos aus der Datenbank abzurufen und im Feed anzuzeigen. Viel Erfolg bei der Implementierung!