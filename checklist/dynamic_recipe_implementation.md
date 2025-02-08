# Dynamic Recipe Implementation Progress

## ✅ Completed

1. **AI-Agent Service**
   - ✓ Created `services/aiAgent.ts` with OpenAI integration
   - ✓ Implemented caching with Supabase table `ai_response_cache`
   - ✓ Created Supabase Edge Function `supabase/functions/ai-agent/index.ts`
   - ✓ Added detailed logging for debugging
   - ✓ Fixed OpenAI API integration (v4)
   - ✓ Fixed environment variables deployment

2. **AI-Agent Architecture**
   - ✓ Created modular prompt builder system in `services/prompts/recipePrompts.ts`
   - ✓ Implemented specialized prompt builders for:
     - Recipe variations
     - Prepared templates for nutrition analysis (not active)
     - Prepared templates for cooking techniques (not active)
     - Prepared templates for ingredient substitution (not active)
   - ✓ Added error handling wrapper with retry logic in `services/safeAiAgent.ts`
   - ✓ Implemented exponential backoff and error-specific handling

3. **Test Interface**
   - ✓ Created `components/tests/AIAgentTest.tsx`
   - ✓ Added test route `app/tests/ai-agent.tsx`
   - ✓ Added test button in profile screen `app/(tabs)/profile.tsx`
   - ✓ Implemented basic chat interface with error handling
   - ✓ Added loading states and response caching display

4. **Data Model**
   - ✓ Updated `Video` type to include recipe metadata
   - ✓ Modified `useSavedRecipes` hook for recipe metadata
   - ✓ Added recipe metadata to database schema
   - ✓ Implemented recipe context formatting

## 🚧 In Progress

1. **Recipe Interaction**
   - [ ] Implement recipe variation storage
   - [ ] Add "back to original recipe" functionality
   - [ ] Add recipe modification history

2. **User Experience**
   - [ ] Implement feedback system for AI responses
   - [ ] Add user preference persistence
   - [ ] Add response rating system

3. **Core Features**
   - [ ] Activate and test nutrition analysis
   - [ ] Activate and test cooking technique guidance
   - [ ] Activate and test ingredient substitution
   - [ ] Implement context-aware recipe assistance

## 📝 To Do

1. **Performance & Monitoring**
   - [ ] Add telemetry/metrics collection
   - [ ] Integrate with proper logging service
   - [ ] Implement circuit breaker pattern
   - [ ] Optimize caching strategy for frequent queries

2. **Additional Features**
   - [ ] Add voice commands
   - [ ] Add multi-language support
   - [ ] Implement personalized recipe suggestions

3. **Testing & Documentation**
   - [ ] Add unit tests for AI agent service
   - [ ] Add integration tests for recipe variations
   - [ ] Create user documentation for AI features
   - [ ] Document API endpoints and response formats

Below is a high-level checklist of how you can **implement the AI-powered "Dynamische Rezeptvarianten & Ernährungsoptimierung"** feature described in `@dynamic_recipe.md`.  
Each step is presented as a structured ToDo with potential file references and approaches. Adjust specifics to your existing project setup.

---

## 1. Server-/Backend-Aufbau

1. **AI-Agent Service erstellen**  
   - Ziel: Ein Service, der alle AI-Anfragen (Rezeptvarianten, Nährwertberechnung, kontextbezogene Fragen) übernimmt.  
   - **Datei vorschlagen:**  
     ```typescript:services/aiAgent.ts
     export async function queryRecipeAgent(userPrompt: string, context: string) {
       // 1. OpenAI / GPT-4 request
       // 2. Build messages array with system + user prompts
       // 3. Send request to OpenAI
       // 4. Return AI response
     }
     ```
   - **Wichtig:** Caching-Mechanismus in Betracht ziehen (z.B. Redis oder Supabase Storage), um häufig gestellte Fragen oder bereits generierte Rezeptvarianten nicht jedes Mal neu zu generieren.

2. **API-Route implementieren**  
   - Ziel: Einheitlicher Endpunkt, z. B. `/api/ai-agent`, der alle Chat/AI-Anfragen entgegennimmt.  
   - **Datei vorschlagen (Next.js-Beispiel)**  
     ```typescript:pages/api/ai-agent.ts
     import { NextApiRequest, NextApiResponse } from "next";
     import { queryRecipeAgent } from "@/services/aiAgent";

     export default async function handler(req: NextApiRequest, res: NextApiResponse) {
       try {
         const { userPrompt, context } = req.body;
         const content = await queryRecipeAgent(userPrompt, context);
         return res.status(200).json({ content });
       } catch (err) {
         return res.status(500).json({ error: "AI request failed." });
       }
     }
     ```

3. **Eventuell: Separate Endpunkte für andere Funktionen**  
   - Wenn du eine "Rezeptvarianten-Erstellung" im großen Stil brauchst, könntest du in `/api/recipe-variant` eine dedizierte Route anbieten, die dasselbe AI-Service-Modul nutzt.  
   - In vielen Fällen reicht aber ein einzelner, generischer Endpunkt.

---

## 2. Frontend-Aufbau

1. **Chat-Interface in die Rezeptdetailseite integrieren**  
   - Füge in deiner bestehenden Detail- oder Modal-Komponente (z. B. `RecipeDetails.tsx`) einen Bereich hinzu, der es Nutzern ermöglicht, eine Frage an den Agenten zu stellen.  
   - **Beispiel-Komponente**:
     ```typescript:components/recipe/RecipeChat.tsx
     import React, { useState } from 'react';
     import { View, TextInput, Button, Text } from 'react-native';

     export function RecipeChat({ recipeContext }: { recipeContext: string }) {
       const [message, setMessage] = useState('');
       const [response, setResponse] = useState('');

       async function handleSend() {
         const res = await fetch('/api/ai-agent', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ userPrompt: message, context: recipeContext })
         });
         const data = await res.json();
         setResponse(data.content);
       }

       return (
         <View>
           <Text>Frage an den AI-Agenten:</Text>
           <TextInput
             value={message}
             placeholder="Frag nach einer Rezeptänderung..."
             onChangeText={(text) => setMessage(text)}
           />
           <Button title="Senden" onPress={handleSend} />
           {response ? <Text>Antwort: {response}</Text> : null}
         </View>
       );
     }
     ```
   - Binde diese Komponente in deine Rezeptdetail-Komponente ein (`RecipeDetails.tsx`), wobei du das benötigte Kontext-Objekt (z. B. Zutaten, Schritte) übergibst.

2. **Kombination mit dynamischen UI-Elementen**  
   - Beim Eingang einer AI-Antwort, in der bspw. einzelne Zutaten geändert werden, kann eine Methode aufgerufen werden, die deine Zutatenliste neu rendert.  
   - Falls der Agent eine neue Schritt-für-Schritt-Anleitung erstellt hat, lasse sie optional in einem Overlay oder direkt als Update in der UI darstellen.

3. **Interaktion mit Einkaufslistenfunktion**  
   - Nutze das Feedback des Agenten, um automatisch angepasste Zutaten zu deiner vorhandenen Einkaufslisten-Logik hinzuzufügen.  
   - Beispiel: Der Nutzer klickt "Variante übernehmen" → Die App updatet die `shoppingList`-Daten mit den geänderten Zutaten.

---

## 3. Datenmodell & Kontextbereitstellung

1. **Relevante Rezeptdaten beschaffen**  
   - Beim Öffnen eines Rezepts bereitest du einen `context`-String auf, der die wichtigsten Informationen enthält: Zutaten, Zubereitungszeit, Ernährungstags, usw.  
   - Beispiel:
     ```typescript:services/contextBuilder.ts
     export function buildRecipeContext(recipe: RecipeMetadata): string {
       // Kombiniere Titel, Zutaten, Equipment, Steps etc. zu einem string
       return `
       Rezept: ${recipe.title}
       Zutaten: ${recipe.ingredients.join(", ")}
       Steps: ${recipe.steps.map(step => step.description).join(". ")}
       `;
     }
     ```
   - Diesen `context` übergibst du dann an die Chat-Komponente.

2. **Spezielle Felder für Feedback & Varianten**  
   - Optional kannst du ein `variantId` oder `feedback`-Feld in deiner Datenbank speichern, um wiederholte Fragen zu verbessern oder zu tracken, welche Varianten Nutzer am häufigsten anfragen.

---

## 4. Performance & Caching

1. **Caching der AI-Antworten**  
   - Bei häufig gestellten Fragen ("Wie ersetze ich Butter im Teig?") können die Antworten in einer Cache-Tabelle oder in Redis gespeichert werden.  
   - Prüfe beim Empfang einer neuen Anfrage, ob du eine ähnliche Frage schon einmal beantwortet hast.

2. **Asynchrone Verarbeitung**  
   - Bei rechenintensiven oder sehr langen Recherchen (z. B. komplexe Nährwertanalysen) kann ein Queue-System (z. B. Bull, Supabase Functions) eingesetzt werden, um die Anfrage asynchron zu bearbeiten.  
   - Das Frontend kann einen Ladezustand anzeigen, bis die Variante generiert wurde.

---

## 5. User Experience & Feedback

1. **UI/UX-Optimierung**  
   - Baue ein klares Feedback-System ein, das signalisiert, wenn die AI noch "denkt".  
   - Stelle sicher, dass der Nutzer jederzeit zurück zum Originalrezept wechseln kann, falls eine Variante nicht gefällt.

2. **Feedback-Loop**  
   - Erlaube dem Nutzer, die AI-Antwort zu bewerten ("Hilfreich", "Nicht hilfreich", Sterne, o. Ä.).  
   - Nutze diese Daten (z. B. in einer DB-Spalte `agent_feedback`) um zukünftige Interaktionen zu verbessern oder zu priorisieren.

---

## 6. Weiterführende ToDos

- **Nährwertanalyse automatisieren**: Binde eine interne oder externe API ein (z. B. `nutritionix`), um die Nährwerte der vom Agenten generierten Varianten zu berechnen.  
- **Sprachsteuerung**: Integriere `react-native-voice` oder ähnliche Libraries, um Nutzern Voice-Commands für den Agenten zu ermöglichen.  
- **Langzeit-Learning**: Erweitere deinen Agent-Service um personalisierte User-Profiles (Vorlieben, Allergien, Diätziel), damit zukünftige Rezeptvarianten automatisch noch "persönlicher" generiert werden.  
- **Multisprachen-Support**: Bei Bedarf kann der Agent in anderen Sprachen antworten (z. B. Englische Rezepte mit deutscher Erklärung oder umgekehrt).

---

**Fazit:**  
Diese Schritt-für-Schritt-Liste beschreibt, wie du den AI-Agenten und das Feature "Dynamische Rezeptvariationen & Ernährungsoptimierung" in deine bestehende Codebasis integrierst. Du kombinierst die Chat-/Voice-Komponente, AI-Service-Logik und dein App-Datenmodell (Rezepte, Einkaufslisten) zu einem fließenden Nutzererlebnis: Nutzer können Fragen stellen, Rezepte anpassen und nahtlos dynamische Änderungen in der UI sowie in ihren Einkaufslisten übernehmen.
