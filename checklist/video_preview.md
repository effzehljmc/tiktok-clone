Hier folgt eine detaillierter, chronologischer Schritt-für-Schritt-Guide, um den im Video gezeigten nächsten Part zu implementieren – nämlich die Möglichkeit, nicht nur direkt von der Live-Kamera Videos aufzunehmen, sondern auch bereits gespeicherte Videos aus der Galerie auszuwählen, diese vorzuschauen und hochzuladen.

---

## 1. Vorbereitung & Installation

### 1.1. Installation des Expo Image Picker

- **Befehl im Terminal ausführen:**

  ```bash
  npx expo install expo-image-picker
  ```

### 1.2. Installation von Expo AV (für die Videovorschau)

- **Befehl im Terminal ausführen:**

  ```bash
  npx expo install expo-av
  ```

### 1.3. Anpassen der App-Konfiguration (app.json oder app.config.js)

Füge in deiner Konfiguration die nötigen Berechtigungen hinzu, damit die App auf Fotos, Kamera und Mikrofon zugreifen darf. Zum Beispiel:

```json
{
  "expo": {
    "plugins": [
      "expo-camera",
      "expo-image-picker"
    ],
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "Diese App benötigt Zugriff auf die Kamera.",
        "NSMicrophoneUsageDescription": "Diese App benötigt Zugriff auf das Mikrofon.",
        "NSPhotoLibraryUsageDescription": "Diese App benötigt Zugriff auf deine Fotos."
      }
    },
    "android": {
      "permissions": [
        "CAMERA",
        "RECORD_AUDIO",
        "READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

Starte danach deinen Expo-Server neu, damit die Änderungen übernommen werden.

---

## 2. Erweiterung der Kamera-Seite um den Video-Picker

Wir erweitern die bisherige Kamera-Seite (z. B. in `camera.tsx`), sodass der Nutzer zusätzlich zur Live-Aufnahme auch ein bereits gespeichertes Video auswählen kann.

### 2.1. Importiere die benötigten Module

Füge oben in deiner `camera.tsx` neben den bereits verwendeten Imports noch den Image Picker und das Video-Element ein:

```tsx
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Dimensions } from 'react-native';
```

### 2.2. Erweitere den Komponenten-State

Ergänze deinen State um eine Variable, die die Video-URI speichert, sowie ggf. einen State für den Wiedergabestatus:

```tsx
const [videoUri, setVideoUri] = useState<string | null>(null);
const [isVideoPlaying, setIsVideoPlaying] = useState(false);
const videoRef = useRef<Video>(null);
```

### 2.3. Funktion zum Auswählen eines Videos aus der Galerie

Erstelle eine Funktion `pickVideo`, die den Image Picker verwendet, um ein Video aus der Galerie auszuwählen:

```tsx
const pickVideo = async () => {
  // Optionale Konfiguration: alle Medientypen erlauben, Bearbeitung erlauben etc.
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All, // oder nur .Videos, falls gewünscht
    allowsEditing: true,
    aspect: [4, 3],
    quality: 1,
  });

  console.log('ImagePicker Result:', result);

  if (!result.cancelled && result.assets && result.assets.length > 0) {
    // Die Video-URI befindet sich im ersten Element des assets-Arrays
    const uri = result.assets[0].uri;
    setVideoUri(uri);
    // Optional: Direkt den Upload starten oder erst dem Nutzer die Vorschau zeigen
    // saveVideo(uri); // Falls du den Upload sofort anstoßen möchtest
  }
};
```

### 2.4. UI-Anpassung: Hinzufügen eines Buttons für den Video-Picker

Ergänze dein bestehendes Kamera-Layout um einen Button (z. B. ein Icon), der beim Drücken die Funktion `pickVideo` ausführt.  
Beispiel:

```tsx
<TouchableOpacity onPress={pickVideo} style={{ padding: 10 }}>
  {/* Ändere das Icon – hier z. B. von transparent zu weiß */}
  <Ionicons name="aperture-outline" size={32} color="white" />
</TouchableOpacity>
```

Platziere diesen Button an einer passenden Stelle im Overlay (z. B. in der Button-Leiste oben oder unten).

---

## 3. Videovorschau mit Expo AV

Sobald eine Video-URI gesetzt wurde, möchten wir dem Nutzer eine Vorschau ermöglichen. Anstelle der Kamera-Vorschau wird dann das Video-Element gerendert.

### 3.1. Bedingtes Rendern: Kamera oder Video

Im Return-Statement deiner Komponente prüfst du, ob `videoUri` existiert. Falls ja, rendere das Video statt des Camera-Elements:

```tsx
return (
  <View style={{ flex: 1 }}>
    {videoUri ? (
      // Videovorschau
      <View style={{ flex: 1 }}>
        <Video
          ref={videoRef}
          source={{ uri: videoUri }}
          style={{
            width: Dimensions.get('window').width,
            height: Dimensions.get('window').height,
          }}
          useNativeControls
          resizeMode="contain"
          isLooping={false}
          onPlaybackStatusUpdate={(status) => {
            // Aktualisiere den Status (optional)
            setIsVideoPlaying(status.isPlaying);
          }}
        />
      </View>
    ) : (
      // Live-Kameraansicht
      <Camera
        ref={cameraRef}
        style={{ flex: 1 }}
        type={cameraType}
        ratio="16:9"
      />
    )}

    {/* Steuerungsbuttons (Overlay) */}
    <View style={{
      position: 'absolute',
      bottom: 30,
      width: '100%',
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center'
    }}>
      {/* Button zum Umschalten der Kamera */}
      <TouchableOpacity onPress={flipCamera}>
        <Ionicons name="camera-reverse-outline" size={32} color="white" />
      </TouchableOpacity>

      {/* Button zum Aufnehmen/Beenden der Aufnahme – nur, wenn keine Video-URI vorliegt */}
      {!videoUri && (
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
      )}

      {/* Button für den Video-Picker */}
      <TouchableOpacity onPress={pickVideo}>
        <Ionicons name="aperture-outline" size={32} color="white" />
      </TouchableOpacity>
    </View>

    {/* Optional: Button zum Posten/Hochladen des Videos */}
    {videoUri && (
      <View style={{
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        alignItems: 'center'
      }}>
        <TouchableOpacity
          onPress={() => saveVideo(videoUri)}
          style={{
            backgroundColor: '#2196F3',
            padding: 15,
            borderRadius: 8
          }}
        >
          <Text style={{ color: 'white' }}>Video Posten</Text>
        </TouchableOpacity>
      </View>
    )}
  </View>
);
```

### 3.2. Play/Pause-Funktionalität (optional)

Um dem Nutzer zu ermöglichen, das Video abzuspielen oder zu pausieren, kannst du einen zusätzlichen Button hinzufügen, der die Wiedergabe steuert:

```tsx
<TouchableOpacity
  onPress={async () => {
    if (videoRef.current) {
      const status = await videoRef.current.getStatusAsync();
      if (status.isPlaying) {
        videoRef.current.pauseAsync();
      } else {
        videoRef.current.playAsync();
      }
    }
  }}
  style={{ position: 'absolute', top: 50, right: 20 }}
>
  <Ionicons name={isVideoPlaying ? "pause" : "play"} size={32} color="white" />
</TouchableOpacity>
```

---

## 4. Upload des Videos in Supabase Storage und Einfügen in die Datenbank

Da du den Upload bereits in einem früheren Teil implementiert hast, passt du die Funktion `saveVideo` so an, dass sie sowohl für aufgezeichnete als auch für aus der Galerie ausgewählte Videos verwendet werden kann.

### 4.1. Beispiel: Upload-Funktion

```tsx
const saveVideo = async (uri: string) => {
  // Extrahiere den Dateinamen aus der URI
  const fileName = uri.split('/').pop();
  const fileType = 'video/mp4'; // Passe ggf. den MIME-Type an

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: fileName,
    type: fileType,
  } as any);

  // Lade die Datei in den Supabase-Bucket "videos" hoch
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

  // Anschließend den Videoeintrag in der Datenbank speichern
  await insertVideoToDB(data.path);
};
```

### 4.2. Beispiel: Datenbankeintrag

```tsx
const insertVideoToDB = async (filePath: string) => {
  // Zugriff auf das globale user-Objekt (z.B. über den Auth-Context)
  const { user } = useAuth();
  const title = 'Test Title'; // Kann später dynamisch vergeben werden

  const { data, error } = await supabase
    .from('videos')
    .insert([{ title, uri: filePath, user_id: user?.id }]);

  if (error) {
    console.error('DB Insert Error:', error);
  } else {
    console.log('Video in DB gespeichert:', data);
    // Nach erfolgreichem Upload: Modal schließen oder zum Feed navigieren
    router.back();
  }
};
```

---

## 5. Testen und Feinschliff

1. **Testen des Video-Pickers:**  
   - Starte die App auf einem realen Gerät (mittels Expo Go).  
   - Drücke den Button (das Aperture-Icon), um ein Video aus der Galerie auszuwählen.  
   - Überprüfe in der Konsole, ob das Ergebnis korrekt geloggt und die `videoUri` gesetzt wurde.

2. **Videovorschau und Steuerung:**  
   - Sobald ein Video ausgewählt wurde, sollte statt der Kameraansicht das Video im `Video`-Element angezeigt werden.  
   - Überprüfe, ob der Play/Pause-Button funktioniert.

3. **Upload und Datenbank:**  
   - Drücke den "Video Posten"-Button, um den Upload zu starten.  
   - Überprüfe in der Supabase Storage-Konsole, ob das Video hochgeladen wurde, und in der Datenbank (z. B. Tabelle `videos`), ob der Eintrag korrekt erstellt wurde.

4. **UI-Anpassungen:**  
   - Passe bei Bedarf das Styling (z. B. mit `Dimensions` für die Videoanzeige oder zusätzliche Statusanzeigen während des Uploads) an.

---

## 6. Zusammenfassung

- **Erweiterung der Kamera-Funktion:**  
  Du hast einen Button hinzugefügt, der es dem Nutzer ermöglicht, statt der Live-Kamera ein bereits gespeichertes Video aus der Galerie auszuwählen.

- **Integration des Expo Image Picker:**  
  Mit `expo-image-picker` können Videos aus der Galerie ausgewählt und deren URI in den State übernommen werden.

- **Videovorschau mit Expo AV:**  
  Der `Video`-Komponent von `expo-av` ermöglicht es, das ausgewählte Video anzuzeigen, native Steuerungen zu nutzen und die Wiedergabe zu kontrollieren.

- **Upload in Supabase & Datenbankspeicherung:**  
  Mithilfe der zuvor implementierten Upload-Funktion wird das Video in einen Supabase Storage-Bucket hochgeladen und der Pfad in der Datenbank gespeichert.

- **Navigation & Abschluss:**  
  Nach dem erfolgreichen Upload wird der Nutzer (mittels `router.back()`) zurückgeleitet – in einem späteren Schritt soll der Home-Feed (ähnlich wie TikTok) implementiert werden, der alle hochgeladenen Videos anzeigt.

Mit diesen Schritten hast du den im Video beschriebenen Funktionsumfang vollständig umgesetzt. Auch wenn der Code aktuell noch etwas „messy“ wirkt, kannst du ihn in zukünftigen Iterationen modularisieren und aufräumen. Viel Erfolg bei der Weiterentwicklung deiner App!