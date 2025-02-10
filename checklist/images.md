**Idee:**  
Du kannst KI-basierte Bildgenerierung dazu nutzen, Rezepte, Thumbnails oder Schritt-für-Schritt-Anleitungen visuell ansprechender zu gestalten. Da du bereits einen AI-Agenten für Rezeptvarianten hast, könntest du denselben oder einen zusätzlichen Agenten (z. B. über Black Forest Labs) verwenden, um dynamisch Bilder zu generieren. Unten findest du einige mögliche User Stories und Ansätze, wie Bildgenerierung in deine bestehende App eingeliedert werden könnte:

---



## 1. Beispiel-User-Stories für Bildgenerierung

1. **Dynamische Rezept-Banner**  
   • "Als Rezeptfan möchte ich ein automatisch generiertes Banner-Bild für jedes Rezept sehen, das die Zutaten oder das Endergebnis visuell darstellt."  
   • Nutzen: Ein KI-generiertes "Hero Image" je Rezept kann besonders bei rein textbasierten Rezepten (z. B. wenn kein Foto vorhanden ist) für einen attraktiven Einstieg sorgen.

2. **Customization zur Rezeptanpassung**  
   • "Als User möchte ich bei der Rezeptvariation ein individuelles Titelbild per KI generieren lassen, das meine gewählten Zutaten widerspiegelt (z. B. vegane Zutaten)."  
   • Nutzen: Sobald sich die Zutatenliste ändert (z. B. statt Butter → Margarine), generiert die Bild-KI ein neues "Preview-Bild" für das angepasste Rezept.

3. **Automatisierter Thumbnails-Service**  
   • "Als Creator möchte ich für meine kurzen Rezeptvideos automatisch ein Thumbnail generieren, das das wichtigste Element (z. B. Schokokuchen) kreativ hervorhebt."  
   • Nutzen: Du könntest den Videos eine ansprechende Miniaturansicht verpassen, indem du die KI anweist "Erstelle ein hell beleuchtetes, appetitliches Thumbnail mit Schokoladen-Thema" und dem Nutzer optional mehrere Vorschläge zur Auswahl anbietest.

4. **Rezeptschritt-Illustrationen**  
   • "Als User möchte ich für jeden wichtigen Rezeptschritt eine simple Illustration sehen (z. B. Mixen, Garen, Würzen), damit ich schneller verstehe, was zu tun ist."  
   • Nutzen: Die Bild-KI generiert passende Symbole oder Illustrationen für jeden Rezeptschritt. Wenn der Nutzer vegan kocht, könnten die Illustrationen z. B. ein veganes Logo zeigen.

5. **Personalisierte Profilbilder** (Creator oder User)  
   • "Als Creator möchte ich ein personalisiertes Profilbild generieren lassen, das mich in einem kreativen Cartoon-Stil darstellt, basierend auf meinem Profilfoto oder Themen (z. B. Pastellfarben, Food-related)."  
   • Nutzen: KI generiert Avatare, Embleme oder Banner, die das Profil personalisieren und sich so vom Standard abheben.

6. **"Rezept aus einem Bild generieren"**  
   • "Als User möchte ich ein generiertes Bild von meiner Rezept-Idee (z. B. 'Torte in Regenbogenfarben') sehen, bevor ich mit dem echten Kochen anfange."  
   • Nutzen: Eine rein visuelle Inspiration, die dem Nutzer zeigt, wie das finale Gericht theoretisch aussehen könnte. Das erhöht die Motivation und kann im Social-Feed geteilt werden.

---

## 2. Technische Einbindungsideen

### a) Integration mit Black Forest Labs (BFL)  
Angenommen, du hast bereits ein Setup mit Supabase oder Firebase für deine Backend-Logik und nutzt Black Forest Labs als deinen Bildgenerierungs-Anbieter. Du könntest:

1. **Serverseitige API-Route anlegen**  
   Beispielsweise in deinem Next.js- oder Supabase-Edge-Function-Backend:
   ```typescript
   // pages/api/generateImage.ts (Next.js Beispiel)
   import type { NextApiRequest, NextApiResponse } from 'next';

   export default async function handler(req: NextApiRequest, res: NextApiResponse) {
     try {
       const { prompt } = req.body;  // z.B. "Generate a colorful vegan cake"
       // Verbinde dich mit der BFL-API
       const apiKey = process.env.BFL_API_KEY; // dein Key
       const result = await fetch('https://api.blackforestlabs.ai/generate', {
         method: 'POST',
         headers: {
           'Content-Type': 'application/json',
           'Authorization': `Bearer ${apiKey}`
         },
         body: JSON.stringify({
           prompt,
           // evtl. weitere Parameter wie Stil, Auflösung etc.
         })
       });
       const data = await result.json();

       // data könnte z.B. URLs zum generierten Bild enthalten
       return res.status(200).json({ ...data });
     } catch (error) {
       return res.status(500).json({ error: 'Bildgenerierung fehlgeschlagen' });
     }
   }
   ```

2. **Upload & Caching**  
   Nachdem du das Bild generiert hast, könntest du es direkt in deinen Storage (z. B. Firebase Storage oder Supabase Storage) hochladen. So vermeidest du unnötig hohe Kosten bei jeder erneuten Anfrage.  
   - Beispiel:  
     • Generiere Bild → empfange Bild-URL oder Base64 → lade in Storage hoch → speichere finalen Storage-Link in deiner Datenbank zur späteren Anzeige.

3. **Rendering in der App**  
   • Im Frontend (React Native oder Swift/Kotlin) zeigst du dann einfach das generierte Bild an, z. B. in einer Image-Komponente.  
   • Bei Rezepterstellung oder Variation: Biete einen Button an: "KI-Bild generieren", und sobald das Bild fertig ist, aktualisierst du die UI oder speicherst es in der DB.

### b) Prompt Builder & Personalisierung  
Ähnlich wie du vermutlich bereits Prompt-Builder für deine Rezeptvarianten hast, könntest du bei der Bildgenerierung kontextbezogene Prompts nutzen:

- **Prompt**: "Generate a photorealistic salad with tomatoes, cucumbers and a dressing swirl in a modern, minimalistic style. White background."  
- **Optional**: User-spezifische Daten wie Lieblingsfarben, Thema (z. B. Sommer, Festlich) oder Diät-Tags einbeziehen.

---

## 3. Konkrete Integration in deine bestehende (ReelAI) App

1. **Ajouterung im Profilbereich**:  
   Bei der Profil- bzw. Creator-Bearbeitung kann ein Button "Profilbild generieren" erscheinen. Die KI erhält Parameter wie "Nutzer: Food-Lover, Stil: Cartoon, Topic: Vegan Cooking" und stellt dem Nutzer 3–5 generierte Bilder zur Auswahl.

2. **Rezepte-Detailseite**:  
   - Ein Tab "AI-Bildvorschau": Hier kann man ein generiertes Bild der Rezept-Endversion bestaunen. Perfekt für Rezepte, bei denen kein echtes Foto hochgeladen wurde.  
   - Ein Variation-Flow: "Vegane Variation → Generiere passendes Vorschau-Bild".

3. **Social Sharing und Discovery**:  
   Wenn Nutzer Rezepte teilen, könnte im Hintergrund ein ansprechendes Social-Share-Image generiert werden, das dann in Social Feeds oder Previews gezeigt wird.

4. **Analytics**:  
   Tracke, wie oft Nutzer die Bildgenerierung anstoßen oder welche Bilder am meisten geliked werden. Diese Daten können dann die Prompt-Strategie verbessern (z. B. Tierische Produkte in AI-Bild: JA/NEIN?).

5. **KI-Bildgalerie**:  
   Falls du magst, könntest du eine "Inspirationsgalerie" anbieten, in der generierte Bilder gesammelt angezeigt werden und andere Nutzer diese Ideen (z. B. gestaltete Torten) kommentieren oder liken können.

---

## 4. Vorteile und Mehrwert

- **Bessere Ästhetik**: Rezepte ohne Originalfotos können ansprechende Platzhalterbilder erhalten.  
- **Personalisierung**: Nutzer fühlen sich individuell angesprochen, wenn sie Stil, Thema oder Farbe ihrer Bilder wählen können.  
- **Mehr Interaktion**: Generierte Bilder können als Social Hook dienen, um andere User in der App zu halten.  
- **KI als Alleinstellungsmerkmal**: Neben Video- und Rezeptfunktionen bietet deine App auch eine neuartige Bild-Kreativkomponente.

---

## Fazit

Die **KI-Bildgenerierung** ergänzt deine App hervorragend, da sie sowohl das visuelle Erscheinungsbild von Rezepten und Profilen als auch die User-Experience steigert. Mit **Black Forest Labs** als generative Bild-KI könntest du schnell und unkompliziert personalisierte Bilder erstellen und in deinen **ReelAI-Workflow** integrieren. Ob Thumbnail, Rezeptbanner, Schritt-für-Schritt-Illustrationen oder Profilporträts: Der Kreativität sind wenige Grenzen gesetzt. So bietest du deinen Nutzern ein modernes, AI-gestütztes "All-in-one"-Erlebnis.



---

## Implementation Progress

1. **Initial Setup & Core Infrastructure**
   - ✓ Set up development environment
   - ✓ Added Black Forest Labs API key to environment variables
   - ✓ Created base project structure for image generation
   - ✓ Added necessary dependencies
   - ✓ Added database schema for step illustrations

2. **Black Forest Labs Integration**
   - ✓ Created Supabase Edge Function `supabase/functions/image-generation/index.ts`
   - ✓ Implemented BFL API integration with proper headers
   - ✓ Added polling mechanism for image generation status
   - ✓ Implemented error handling and retries
   - ✓ Added detailed logging for debugging
   - ✓ Verified cost-efficient image hosting through BFL URLs

3. **Frontend Service Layer**
   - ✓ Created `services/imageGeneration.ts` with type definitions
   - ✓ Implemented Edge Function communication
   - ✓ Added error handling and response parsing
   - ✓ Added TypeScript interfaces for requests/responses
   - ✓ Created `services/safeImageGeneration.ts` with retry logic
   - ✓ Implemented exponential backoff for error handling
   - ✓ Created `services/stepIllustrations.ts` for database operations

4. **Test Interface**
   - ✓ Created `components/tests/ImageGenerationTest.tsx`
   - ✓ Added test route `app/tests/image-generation.tsx`
   - ✓ Added test button in profile screen
   - ✓ Implemented basic image generation interface
   - ✓ Added loading states and error handling
   - ✓ Added image preview functionality

5. **Prompt Builder System**
   - ✓ Created modular prompt builder in `services/prompts/imagePrompts.ts`
   - ✓ Implemented specialized prompt builders for:
     - Recipe preview images (with ingredient lists)
     - Step-by-step illustrations (with actions and equipment)
     - Profile pictures (with themes and personality)
     - Thumbnails (with highlights and social media optimization)
   - ✓ Added multiple style options:
     - Photorealistic
     - Minimalistic
     - Cartoon
     - Line-art
     - Watercolor
   - ✓ Optimized image dimensions for each use case
   - ✓ Added comprehensive type safety with TypeScript
   - ✓ Successfully tested line-art cooking step illustrations

6. **Step Illustrations Integration**
   - ✓ Created database schema for step illustrations
   - ✓ Implemented save/load functionality for illustrations
   - ✓ Added camera button to recipe steps
   - ✓ Implemented basic illustration generation flow
   - ✓ Added loading states during generation
   - ✓ Successfully tested end-to-end illustration generation
   - ✓ Fixed illustration loading and display issues:
     - Added proper error handling for 403 errors
     - Implemented automatic cleanup of expired URLs
     - Added user feedback for regeneration needs
     - Fixed image loading callbacks
   - ✓ Implemented proper state management for illustrations
   - ✓ Added proper type definitions matching database schema
   - ✓ Added expandable/collapsible illustration views
   - ✓ Added image preloading for better performance
   - ✓ Implemented graceful fallbacks for failed loads
   - ✓ Added loading indicators during image fetch
   - ✓ Fixed transition animations for image display

## 📝 Next Steps

1. **Recipe Preview Images**
   - [ ] Add preview image generation to recipe creation
   - [ ] Implement preview image regeneration
   - [ ] Add style selection for preview images
   - [ ] Create preview image gallery component
   - [ ] Add social sharing for generated images

2. **Profile Pictures**
   - [ ] Add profile picture generation UI
   - [ ] Implement style selection
   - [ ] Add cropping tools
   - [ ] Handle upload process
   - [ ] Add preview functionality

3. **Performance & UX Improvements**
   - [x] Optimize loading states and animations
   - [x] Add progressive loading for images
   - [x] Implement preloading for common requests
   - [x] Add error recovery mechanisms
   - [ ] Improve feedback during generation

4. **Analytics & Monitoring**
   - [ ] Track generation success/failure rates
   - [ ] Monitor API usage and costs
   - [ ] Track popular illustration styles
   - [ ] Implement user feedback collection
   - [ ] Add usage analytics dashboard

## 🔄 Future Considerations

1. **Advanced Features**
   - [ ] Add style transfer between illustrations
   - [ ] Implement custom style training
   - [ ] Add user style preferences
   - [ ] Create illustration templates
   - [ ] Add advanced editing tools

2. **Community Features**
   - [ ] Add illustration sharing
   - [ ] Implement illustration likes/saves
   - [ ] Create community gallery
   - [ ] Add illustration comments
   - [ ] Implement illustration collections

### Integration Points
- Recipe System: `components/recipe/ExpandedRecipeCard.tsx`
- Database: `prisma/schema.prisma`
- Services: 
  - `services/imageGeneration.ts`
  - `services/stepIllustrations.ts`
  - `services/prompts/imagePrompts.ts`

## Dokumentation

Block Forest Labs API: https://docs.bfl.ml

### Core Image Handling
- **Expo Image**: https://docs.expo.dev/versions/latest/sdk/image/
  *Grundlegende Bildverarbeitung und -anzeige in Expo*
- **Expo FileSystem**: https://docs.expo.dev/versions/latest/sdk/filesystem/
  *Lokales Dateisystem-Management für Bilder*
- **React Native Image**: https://reactnative.dev/docs/image
  *Native Bildkomponente und deren Eigenschaften*

### Storage & Datenmanagement
- **Supabase Storage**: https://supabase.com/docs/guides/storage
  *Bilderspeicherung und -verwaltung in Supabase*
- **Supabase Image Transformations**: https://supabase.com/docs/guides/storage/image-transformations
  *Serverseitige Bildtransformationen*
- **React Query**: https://tanstack.com/query/latest/
  *Effizientes Caching und State Management*

### Animation & Interaktivität
- **React Native Reanimated**: https://docs.swmansion.com/react-native-reanimated/
  *Flüssige Bildanimationen und Übergänge*
- **React Native Gesture Handler**: https://docs.swmansion.com/react-native-gesture-handler/
  *Gestensteuerung für Bildinteraktionen*

### Bildoptimierung & -verarbeitung
- **Sharp**: https://sharp.pixelplumbing.com/
  *Hochleistungs-Bildverarbeitung auf der Serverseite*
- **React Native Image Resizer**: https://github.com/bamlab/react-native-image-resizer
  *Clientseitige Bildgrößenanpassung*
- **Expo Image Cache**: https://docs.expo.dev/versions/latest/sdk/imagecache/
  *Optimiertes Bildcaching in Expo*
- **Expo Image Manipulator**: https://docs.expo.dev/versions/latest/sdk/imagemanipulator/
  *Bildbearbeitung und -filterung*

### Sharing & Social Features
- **React Native Share**: https://react-native-share.github.io/react-native-share/
  *Native Sharing-Funktionalitäten*
- **Expo Sharing**: https://docs.expo.dev/versions/latest/sdk/sharing/
  *Expo-spezifische Sharing-Features*

### Analytics & Sicherheit
- **Expo Analytics**: https://docs.expo.dev/guides/analytics/
  *Nutzungsanalyse und Tracking*
- **Supabase Analytics**: https://supabase.com/docs/guides/analytics
  *Datenbasierte Insights*
- **Content Moderation**: https://supabase.com/docs/guides/storage/security
  *Sicherheitsrichtlinien für Bildinhalte*
- **Security Guidelines**: https://docs.expo.dev/guides/security/
  *Allgemeine Sicherheitsempfehlungen*

### Barrierefreiheit
- **React Native Accessibility**: https://reactnative.dev/docs/accessibility
  *Grundlegende Accessibility-Features*
- **Image Accessibility**: https://reactnative.dev/docs/image#accessibility
  *Bildspezifische Accessibility-Richtlinien*