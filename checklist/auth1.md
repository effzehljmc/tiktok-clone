Below findest du einen detaillierten, chronologisch strukturierten Schritt-für-Schritt-Guide, der beschreibt, wie du in deinem Projekt (unter Verwendung von Expo, React Native und Supabase) genau das umsetzt, was im Video demonstriert wurde. Der Guide gliedert sich in die folgenden Abschnitte:

---

## **1. Vorbereitung: Projekt und Basisdateien**

- **Projekt Setup:**  
  Stelle sicher, dass dein Expo-Projekt eingerichtet ist und du bereits eine funktionierende Supabase-Instanz (sowie den Supabase-Client in einer Datei wie `utils/supabase.ts`) konfiguriert hast.

- **Dateistruktur (Beispiel):**
  ```
  /app
    /screens
      Login.tsx
      SignUp.tsx
      Home.tsx
      … (weitere Seiten)
    /providers
      AuthProvider.tsx
    /utils
      supabase.ts
  ```

---

## **2. Login-Seite implementieren**

### **2.1. UI erstellen**

Erstelle eine neue Datei `Login.tsx` und baue das grundlegende Layout für die Login-Seite auf:

- **Eingabefelder:**  
  Füge zwei `TextInput`-Komponenten hinzu – eines für die **E-Mail** und eines für das **Passwort**. Nutze dazu z. B. Tailwind-ähnliche Klassen (oder StyleSheet-Objekte) für ein ansprechendes Design.

- **Beispielcode:**
  
  ```tsx
  // Login.tsx
  import React, { useState } from 'react';
  import { View, TextInput, Button, TouchableOpacity, Text } from 'react-native';
  // Importiere den Supabase-Client (wird später im Login-Handler genutzt)
  import { supabase } from '../utils/supabase';
  import { useRouter } from 'expo-router';

  export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Temporärer Login-Handler (wird später mit Supabase integriert)
    async function handleLogin() {
      // Hier rufen wir später Supabase auf (siehe Abschnitt 4)
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Login error:', error);
      } else {
        // Nach erfolgreichem Login zur Hauptseite navigieren
        router.push('/tabs');
      }
    }

    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        {/* E-Mail Eingabe */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={{
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        />
        {/* Passwort Eingabe */}
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        />
        {/* Login Button */}
        <Button title="Log In" onPress={handleLogin} />

        {/* Link zur SignUp-Seite */}
        <TouchableOpacity onPress={() => router.push('/signup')}>
          <Text style={{ color: 'black', fontWeight: '600', marginTop: 12, textAlign: 'center' }}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </View>
    );
  }
  ```

### **2.2. State & Handler für Eingaben**

- **State-Variablen:**  
  Definiere `email` und `password` mit `useState` und verknüpfe die `onChangeText`-Events der `TextInput`-Felder damit.

- **Login-Handler:**  
  Erstelle die Funktion `handleLogin`, die später den Login-Vorgang über Supabase abwickelt.

---

## **3. SignUp-Seite erstellen**

### **3.1. UI erstellen und Felder kopieren**

Erstelle eine neue Datei `SignUp.tsx` und kopiere das Layout der Login-Seite. Ergänze dieses Layout um ein zusätzliches Eingabefeld für den **Benutzernamen**.

- **Beispielcode:**

  ```tsx
  // SignUp.tsx
  import React, { useState } from 'react';
  import { View, TextInput, Button, Text, TouchableOpacity } from 'react-native';
  import { supabase } from '../utils/supabase';
  import { useRouter } from 'expo-router';

  export default function SignUp() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    async function handleSignUp() {
      // 1. Registriere den Nutzer über Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) {
        console.error('SignUp error:', authError);
        return;
      }

      // 2. Nutze die zurückgegebene User-ID, um einen Eintrag in der eigenen "users"-Tabelle zu erstellen
      const userId = authData.user?.id;
      const { error: dbError } = await supabase
        .from('users')
        .insert([{ id: userId, username, email }])
        .single();

      if (dbError) {
        console.error('Error inserting into users table:', dbError);
        return;
      }

      // 3. Nach erfolgreicher Registrierung: Navigiere zurück oder direkt zum Hauptbereich
      // Bei Verwendung eines Modal-Layouts: zuerst Modal schließen, dann routen
      router.back(); // oder: router.push('/tabs');
    }

    return (
      <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
        {/* Benutzername Eingabe */}
        <TextInput
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          style={{
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        />
        {/* E-Mail Eingabe */}
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={{
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        />
        {/* Passwort Eingabe */}
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={{
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
          }}
        />
        {/* Sign Up Button */}
        <Button title="Sign Up" onPress={handleSignUp} />
      </View>
    );
  }
  ```

### **3.2. Modal-Darstellung (Optional)**

Wenn du den Signup-Bildschirm als Modal anzeigen möchtest (wie im Video demonstriert), kannst du in deinem Routing (z. B. mit Expo Router) angeben, dass diese Seite als Modal gerendert wird.  
Beispiel (in der Datei, in der du deine Routen definierst):

```tsx
// Im Datei-basierten Router (z.B. app/signup.tsx)
export const presentation = 'modal';
```

---

## **4. Integration der Supabase-Authentifizierung**

### **4.1. Login-Funktionalität**

- **Verwenden von `supabase.auth.signInWithPassword`:**  
  In der `handleLogin`-Funktion rufst du Supabase auf, um den Nutzer mit E-Mail und Passwort zu authentifizieren.  
  Bereits im Login-Beispiel oben integriert:
  
  ```tsx
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  ```

- **Fehlerbehandlung:**  
  Prüfe, ob ein Fehler zurückgegeben wird, und gebe diesen im Log aus oder zeige eine Fehlermeldung im UI an.

### **4.2. SignUp-Funktionalität**

- **Erster Schritt – Registrierung über Supabase Auth:**  
  Nutze `supabase.auth.signUp({ email, password })` um den Nutzer zu registrieren.  
- **Zweiter Schritt – Benutzer-Datensatz in eigener Tabelle:**  
  Verwende die zurückgegebene `user.id`, um einen neuen Eintrag in der eigenen `user`-Tabelle zu erstellen (hier kannst du auch zusätzliche Felder wie `username` speichern):

  

- **Navigation nach erfolgreicher Registrierung:**  
  Nachdem beide Schritte (Auth und DB-Insert) erfolgreich waren, navigiere den Nutzer in den Hauptbereich deiner App.

---

## **5. Erstellen eines globalen Authentifizierungs-Providers**

Da du in fast allen Seiten auf den aktuell angemeldeten Nutzer zugreifen möchtest – ohne bei jeder Interaktion Supabase erneut abzufragen – ist es sinnvoll, einen globalen State mittels React Context zu verwalten.

### **5.1. AuthProvider erstellen**

Erstelle in deinem Ordner `/providers` die Datei `AuthProvider.tsx`:

- **Aufgaben des Providers:**
  - **User-Objekt:** Speichern des aktuell angemeldeten Nutzers.
  - **Ladezustand:** Verwalten, ob die Authentifizierung gerade überprüft wird.
  - **Funktionen:** `signIn`, `signUp`, `signOut` und eine Funktion zum erneuten Abrufen der Nutzerinformationen (z. B. `getUser`).

- **Beispielcode:**

  ```tsx
  // providers/AuthProvider.tsx
  import React, { createContext, useState, useContext, useEffect } from 'react';
  import { supabase } from '../utils/supabase';
  import { useRouter } from 'expo-router';

  // Definiere den Typ des Kontextwerts (je nach deinen Feldern)
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

    // Beim Mounten: Überprüfe, ob bereits ein Nutzer eingeloggt ist
    useEffect(() => {
      const session = supabase.auth.getSession().then(({ data }) => {
        setUser(data.session?.user ?? null);
        setLoading(false);
      });

      // Optional: Auth-State-Listener einrichten
      const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
        setUser(session?.user ?? null);
      });

      return () => {
        listener?.subscription.unsubscribe();
      };
    }, []);

    // Funktion: Nutzer anmelden
    async function signIn(email: string, password: string) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('SignIn error:', error);
        return;
      }
      // Hole zusätzliche Nutzer-Details aus der eigenen Tabelle
      await getUser(data.session?.user.id);
      router.push('/tabs');
    }

    // Funktion: Nutzer registrieren
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
      // Hole den kompletten Nutzer-Datensatz
      await getUser(userId);
      router.back(); // Bei Modal: schließe es; oder router.push('/tabs') für reguläre Navigation
    }

    // Funktion: Nutzer abmelden
    async function signOut() {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    }

    // Funktion: Zusätzliche Nutzerinformationen abrufen (aus eigener "users"-Tabelle)
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

    return (
      <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
        {children}
      </AuthContext.Provider>
    );
  };

  // Custom Hook für einfachen Zugriff
  export const useAuth = () => useContext(AuthContext);
  ```

### **5.2. Den Provider in der App nutzen**

- **Wrappe dein gesamtes App-Layout:**  
  Stelle sicher, dass dein oberster Komponentenbaum (z. B. in `App.tsx` oder in deinem Layout-File, falls du den Expo Router nutzt) mit `<AuthProvider>` umschlossen ist. So haben alle untergeordneten Seiten Zugriff auf den globalen Auth-Context.

  ```tsx
  // Beispiel in App.tsx oder layout.tsx
  import React from 'react';
  import { AuthProvider } from './providers/AuthProvider';
  import { Slot } from 'expo-router';

  export default function AppLayout() {
    return (
      <AuthProvider>
        <Slot /> {/* Hier werden alle Seiten gerendert */}
      </AuthProvider>
    );
  }
  ```

---

## **6. Verwendung des globalen Nutzer-Objekts**

- **In anderen Seiten:**  
  Importiere einfach deinen Custom Hook `useAuth` und greife auf `user`, `signIn`, `signUp` oder `signOut` zu. So kannst du den aktuell angemeldeten Nutzer überall in der App referenzieren, ohne wiederholt Supabase abfragen zu müssen.

  ```tsx
  // Beispiel: Home.tsx
  import React from 'react';
  import { View, Text } from 'react-native';
  import { useAuth } from '../providers/AuthProvider';

  export default function Home() {
    const { user } = useAuth();

    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text>Welcome, {user ? user.username : 'Guest'}!</Text>
      </View>
    );
  }
  ```

---

## **7. Abschlusstests & Validierung**

1. **Registrierung testen:**  
   - Öffne die SignUp-Seite, gib einen Benutzernamen, eine E-Mail und ein Passwort ein.
   - Prüfe in Supabase, ob ein Auth-Objekt erstellt wurde und ein entsprechender Eintrag in deiner `users`-Tabelle vorhanden ist.

2. **Login testen:**  
   - Verwende die Login-Seite, um dich mit den gerade erstellten Zugangsdaten anzumelden.
   - Bestätige, dass du nach erfolgreichem Login auf die Hauptseite (z. B. `/tabs`) weitergeleitet wirst und dass das globale Nutzerobjekt (mittels `useAuth`) verfügbar ist.

3. **Globaler State:**  
   - Navigiere zu verschiedenen Seiten (z. B. Home, Friends, Inbox) und überprüfe, ob überall das gleiche Nutzerobjekt abgerufen wird, ohne dass erneute Supabase-Abfragen erforderlich sind.

---

## **8. Zusammenfassung**

- **Login und SignUp:**  
  Du hast zwei separate Seiten erstellt, die Eingabefelder für E-Mail, Passwort und (bei SignUp) auch den Benutzernamen enthalten.  
- **Supabase-Integration:**  
  Die Authentifizierungsfunktionen `signInWithPassword` und `signUp` werden direkt in den jeweiligen Seiten verwendet. Anschließend wird bei SignUp ein zusätzlicher Datenbankeintrag in deiner eigenen `users`-Tabelle erstellt.
- **Globaler Auth-Provider:**  
  Mithilfe eines React Context stellst du sicher, dass der authentifizierte Nutzer (mit allen benötigten Zusatzinformationen) global verfügbar ist, sodass du nicht wiederholt Supabase abfragen musst.

Mit diesen Schritten hast du genau das umgesetzt, was im Video demonstriert wurde – von der UI-Implementierung über die Authentifizierung mit Supabase bis hin zur Einrichtung eines globalen Authentifizierungs-Providers, der dir die Nutzung des Nutzerobjekts auf allen Seiten ermöglicht.