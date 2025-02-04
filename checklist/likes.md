Hier sind einige Vorschläge und kritische Anmerkungen, wie du das Like-System in deinen Video-Feed integrieren könntest:

---

### 1. Erweiterung der Datenbasis & Abfrage

- **Backend-seitig:**  
  Dein Prisma-Schema für das Like-System ist grundsätzlich solide. Zur Performance empfiehlt es sich, den eindeutigen zusammengesetzten Index (userId, videoId) zu verwenden – was du bereits getan hast. Falls du die Like-Anzahl im Video-Objekt aktuell hältst (über likesCount), solltest du sicherstellen, dass bei jedem Like/Un-Like auch dieser Wert aktualisiert wird.  
  *Tipp:* Überlege, ob ein Trigger in der Datenbank (oder eine Supabase-Funktion) sinnvoll ist, um die Zählung automatisch zu aktualisieren, sodass du im Frontend immer korrekte Daten erhältst.

- **Frontend-seitig (useVideos):**  
  Momentan wird im Query nur die Gesamtzahl der Likes geladen. Es wäre sinnvoll, zusätzlich zu ermitteln, ob der aktuell eingeloggte Nutzer das Video bereits geliked hat.  
  Zwei mögliche Ansätze:
  • Den Supabase-Query so erweitern, dass er entweder per Join (oder separater Abfrage) den Like-Status für den aktuellen User mitliefert.  
  • Eine zusätzliche, clientseitige State-Variable führen (z. B. ein Dictionary, das pro Video speichert, ob es vom User bereits geliked wurde) und diese bei Like-Aktionen aktualisieren.

---

### 2. Integration in VideoFeed.tsx

- **UI-Komponente:**  
  Füge an einer geeigneten Stelle (z. B. im Overlay unter dem Video oder in einer separaten Ecke) einen Like-Button ein. Verwende dazu beispielsweise das Ionicons-Symbol „heart“ für bereits gelikte Videos und „heart-outline“ für nicht gelikte.

- **Event-Handler:**  
  Implementiere eine Funktion, die den Like-Zustand toggelt. Diese Funktion überprüft zunächst, ob der User bereits ein Like gesetzt hat. Falls ja, wird das Like entfernt (DELETE-Anfrage an Supabase); andernfalls wird ein neuer Like-Eintrag erstellt.  
  Vergiss nicht, den UI-Zustand (z. B. die Like-Anzeige und den Like-Count) direkt und optimistisch zu aktualisieren oder nach erfolgreicher Rückmeldung die Videos-Daten neu zu laden (z. B. über die React Query Invalidation).

- **Fehlerbehandlung:**  
  Falls ein Fehler beim wie auch immer auftreten sollte, sollte der Nutzer hiervon in Kenntnis gesetzt werden (z. B. via Toast oder Modal). Außerdem empfiehlt sich hier – falls der Nutzer nicht eingeloggt ist – ein Redirect zum Login.

---

### 3. Beispiel-Code-Integration

Hier ein Ausschnitt, wie du das Like-System in den VideoFeed integrieren könntest:

```typescript
// components/video/VideoFeed.tsx
import { useAuth } from '../../providers/AuthProvider'; // Stelle sicher, dass du den aktuell eingeloggten User abrufen kannst.
import { supabase } from '../../utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useState, useCallback } from 'react';
import { useQueryClient } from 'react-query';

export function VideoFeed() {
  // Bestehende Hooks
  const { data: videos, isLoading } = useVideos();
  const [activeVideoIndex, setActiveVideoIndex] = useState(0);
  const [videoStatus, setVideoStatus] = useState<{ [key: string]: AVPlaybackStatus }>({});
  const [likedVideos, setLikedVideos] = useState<{ [videoId: string]: boolean }>({});
  const windowHeight = Dimensions.get('window').height;
  const videoRefs = useRef<{ [key: string]: Video | null }>({});
  const flatListRef = useRef<FlatList>(null);
  const { user } = useAuth(); // Aktuellen Benutzer abrufen
  const queryClient = useQueryClient();

  // Existierende Effekte und Handler...
  useEffect(() => {
    if (!videos) return;
    videos.forEach((video, index) => {
      if (index !== activeVideoIndex && videoRefs.current[video.id]) {
        videoRefs.current[video.id]?.pauseAsync();
      }
    });
  }, [activeVideoIndex, videos]);

  const handlePlayPause = useCallback(async (videoId: string) => {
    const video = videoRefs.current[videoId];
    if (!video) return;
    const status = videoStatus[videoId];
    if (!status?.isLoaded) return;

    if ((status as AVPlaybackStatusSuccess).isPlaying) {
      await video.pauseAsync();
    } else {
      Object.entries(videoRefs.current).forEach(([id, ref]) => {
        if (id !== videoId && ref) {
          ref.pauseAsync();
        }
      });
      await video.playAsync();
    }
  }, [videoStatus]);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / windowHeight);
    
    if (index !== activeVideoIndex) {
      setActiveVideoIndex(index);
      flatListRef.current?.scrollToOffset({
        offset: index * windowHeight,
        animated: true,
      });
    }
  }, [activeVideoIndex, windowHeight]);

  // Like-Handler zur Aktualisierung des Like-Zustandes
  const handleToggleLike = useCallback(async (videoId: string) => {
    if (!user) {
      // Eventuell zum Login weiterleiten oder einen Hinweis anzeigen
      console.warn('User must be logged in to like a video.');
      return;
    }

    const currentlyLiked = likedVideos[videoId] || false;

    if (currentlyLiked) {
      // Like entfernen (Unlike)
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('video_id', videoId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error unliking video:', error);
      } else {
        setLikedVideos((prev) => ({ ...prev, [videoId]: false }));
        // Option 1: Lokal den likesCount runterzählen (falls im Video-Objekt vorhanden)
        // Option 2: Query neu laden
        queryClient.invalidateQueries(['videos']);
      }
    } else {
      // Like hinzufügen
      const { error } = await supabase
        .from('likes')
        .insert({ video_id: videoId, user_id: user.id });
      if (error) {
        console.error('Error liking video:', error);
      } else {
        setLikedVideos((prev) => ({ ...prev, [videoId]: true }));
        queryClient.invalidateQueries(['videos']);
      }
    }
  }, [likedVideos, user, queryClient]);

  const renderItem = useCallback(({ item, index }: ListRenderItemInfo<VideoType>) => (
    <View style={[styles.videoContainer, { height: windowHeight }]}>
      <Video
        ref={(ref) => (videoRefs.current[item.id] = ref)}
        source={{ uri: item.url }}
        posterSource={item.thumbnailUrl ? { uri: item.thumbnailUrl } : undefined}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        shouldPlay={index === activeVideoIndex}
        isLooping
        useNativeControls={false}
        onError={(error) => {
          console.error(`Video playback error for ${item.title}:`, error);
        }}
        onPlaybackStatusUpdate={(status) => {
          setVideoStatus(prev => ({
            ...prev,
            [item.id]: status,
          }));
        }}
        progressUpdateIntervalMillis={500}
        shouldCorrectPitch={false}
        isMuted={false}
        volume={1.0}
        rate={1.0}
      />
      <View style={styles.overlay}>
        <Text style={styles.title}>{item.caption || item.title}</Text>
        <Text style={styles.username}>@{item.creator.username}</Text>
      </View>
      <TouchableOpacity 
        style={styles.playPauseButton}
        onPress={() => handlePlayPause(item.id)}
      >
        <Ionicons 
          name={videoStatus[item.id]?.isLoaded && (videoStatus[item.id] as AVPlaybackStatusSuccess)?.isPlaying ? 'pause' : 'play'}
          size={50}
          color="white"
        />
      </TouchableOpacity>
      {/* Like-Button integrieren */}
      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => handleToggleLike(item.id)}
      >
        <Ionicons 
          name={likedVideos[item.id] ? "heart" : "heart-outline"}
          size={30}
          color={likedVideos[item.id] ? "red" : "white"}
        />
        <Text style={styles.likeCount}>{item.likes}</Text>
      </TouchableOpacity>
    </View>
  ), [activeVideoIndex, windowHeight, videoStatus, handlePlayPause, likedVideos, handleToggleLike]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!videos?.length) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <Text>Keine Videos verfügbar</Text>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={videos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScrollEndDrag={handleScroll}
        snapToInterval={windowHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        getItemLayout={(_, index) => ({
          length: windowHeight,
          offset: windowHeight * index,
          index,
        })}
        maxToRenderPerBatch={2}
        windowSize={3}
        removeClippedSubviews={true}
        initialNumToRender={1}
        contentContainerStyle={styles.flatListContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  flatListContent: {
    flexGrow: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 90,
    left: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 8,
    marginBottom: 10,
  },
  title: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  username: {
    color: 'white',
    marginTop: 4,
    fontSize: 14,
  },
  playPauseButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 30,
    padding: 10,
  },
  likeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    alignItems: 'center',
  },
  likeCount: {
    color: 'white',
    marginTop: 4,
    fontSize: 12,
  },
});
```

---

### 4. Zusammenfassung & Kritik

- **Vorteile dieses Ansatzes:**  
  • Du integrierst das Like-System direkt in den Video-Feed, sodass der User interaktiv Videos liken und entliken kann.  
  • Der Ansatz der Optimistic Update (temporäres Anpassen des lokalen States und anschließendes Invalidate der Query) sorgt für eine reaktive UI.

- **Weitere Verbesserungsmöglichkeiten:**  
  • **Status des Likes in der Abfrage:** Überlege, den Like-Status (z. B. in einem Feld wie `likedByUser`) bereits bei der Datenabfrage aus Supabase mitzuliefern, sodass du nicht ausschließlich auf client-seitige State-Pflege angewiesen bist.  
  • **Real-Time Updates:** Nutze bei Bedarf Supabase-Subscriptions, um Like-Updates in Echtzeit anzuzeigen – gerade wenn mehrere Nutzer gleichzeitig den Feed sehen.  
  • **Animationen:** Für eine bessere UX könnten Animationen (z. B. ein Herz, das kurz aufleuchtet) hinzugefügt werden, wenn der Like-Button getappt wird.

Mit diesen Anpassungen und Überlegungen solltest du das Like-System nahtlos in deinen Video-Feed integrieren und eine reaktive, interaktive Nutzererfahrung ermöglichen.
