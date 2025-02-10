**Idee für ein weiteres KI-Feature: „AI-StepCollage“**  
Stelle dir vor, du nutzt ein generatives Bildmodell, um aus den Rezeptschritten automatisch kleine Illustrationen oder Icons zu erstellen und daraus eine hübsche Collage zu generieren. Nutzer können diese Collage in ihrer Rezeptübersicht speichern oder auf Social Media teilen.  

---

## Neue User Story
• “Als Hobby-Koch möchte ich eine automatisch generierte Collage von Bildern oder Icons zu jedem Rezeptschritt erhalten, damit ich eine schnelle visuelle Übersicht habe und diese Collage mit Freunden teilen kann.”

### Warum ist das nützlich?
1. Das Feature schafft eine ansprechende, visuelle Zusammenfassung aller Rezeptschritte.  
2. Es lässt sich schnell in Social Feeds oder Reels einbinden, was deiner App zusätzliche „Shareability“ verleiht.  
3. Das Design lässt sich individuell an das Rezeptthema anpassen (z. B. festliche Farben bei Weihnachtsplätzchen).

---

## Grober technischer Ablauf

1. **Rezeptschritt-Analyse**  
   • Das System extrahiert die Rezeptschritte (z.B. „Mehl und Wasser mischen“, „Teig ruhen lassen“, „Teig ausrollen“, …) aus den vorhandenen Rezeptdaten.  

2. **Prompt-Generierung**  
   • Pro Schritt wird ein kurzer Prompt für einen Bildgenerierungsdienst (BFL, Stable Diffusion, DALL·E etc.) erstellt, zum Beispiel:  
     “Generate a simple stylized icon for dough mixing in a minimalistic line-art style.”  

3. **Bildgenerierung**  
   • Die KI generiert für jeden Schritt ein Icon oder kleines Artwork.  

4. **Collage-Building**  
   • Nach der Generierung speichert sich dein Backend (z. B. Supabase oder Firebase) die Bilder.  
   • Ein kleines Collage-Layout-Tool (z. B. clientseitig in React Native oder serverseitig via Canvas-Bibliothek) wird genutzt, um aus den generierten Icons eine hübsche Collage zu erstellen.  

5. **Speichern & Teilen**  
   • Die fertige Collage kann direkt im Profil des Nutzers angezeigt oder als Bild-URL gespeichert werden.  
   • Ein „Teilen“-Button ermöglicht das Posten der Collage in Social Feeds oder das Speichern auf dem Gerät.  

---

## Beispiel-Code-Skizze  
(ohne Zeilennummern; Integration in ein Next.js- oder Supabase-Edge-Function-Backend)

// Beispiel: Logik für die Collage-Erzeugung (serverseitig)
```typescript
// services/stepCollage.ts

import fetch from 'node-fetch';
// evtl. Canvas, node-canvas oder CanvasKit (CanvasKit für WASM)

export async function generateStepCollage(recipeSteps: string[]) {
  // 1. Generiere pro Schritt ein Icon
  const stepIconsPromises = recipeSteps.map(async (step) => {
    const prompt = `Generate a minimalistic icon illustrating "${step}"`;
    const iconResponse = await fetch('https://api.blackforestlabs.ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.BFL_API_KEY}`
      },
      body: JSON.stringify({
        prompt,
        style: 'line-art', 
        // ggf. weitere Optionen
      })
    });

    const { imageUrl } = await iconResponse.json();
    return imageUrl;
  });

  const stepIcons = await Promise.all(stepIconsPromises);

  // 2. Baue Collage mit node-canvas (Pseudocode)
  // const canvas = createCanvas(800, 400);
  // const ctx = canvas.getContext('2d');
  // let xPos = 10;
  // stepIcons.forEach(async (iconUrl, index) => {
  //   const iconImg = await loadImage(iconUrl);
  //   ctx.drawImage(iconImg, xPos, 20, 100, 100);
  //   xPos += 110;
  // });
  // const collageBuffer = canvas.toBuffer('image/png');

  // 3. Lade Collage in Storage hoch & erhalte finalen Link
  // const collageUrl = await uploadToSupabase(collageBuffer);

  // For demonstration: wir geben einfach die Icon-URLs zurück
  return stepIcons; 
}
```

Im Frontend könntest du die Collage (oder die einzelnen Icons) in deiner Rezeptdetailseite anzeigen und den User entscheiden lassen, ob er die Collage speichern, teilen oder erneut generieren möchte.

---

## Check gegen @GauntletAI Project 3 - ReelAI-2.md und @README.md
- Wir integrieren hier ein weiteres „AI Feature“, das echten Mehrwert für Rezeptfans bietet („AI-StepCollage“).  
- Es passt in die existierenden KI-Funktionen in deinem Projekt (siehe AI-Agent Service und Bilderzeugung).  
- Die User Story wird nahtlos in die bereits vorhandene Rezeptübersicht eingebettet (siehe README: Recipe Features, Dynamic Recipe Variations, etc.).  
- Das Feature nutzt das generative Bild-Backend (z. B. Black Forest Labs) ähnlich wie in checklist/images.md vorgeschlagen, nur diesmal für eine Collage.  

Somit erweitert dieses Feature die visuelle Darstellungsweise von Rezepten, steigert die Interaktivität und fördert das Teilen in Social Feeds. Es erfüllt die Vorgaben aus GauntletAI Project 3 - ReelAI-2.md, da es eine eigenständige, „substantielle“ KI-Funktion ist, die man in deine bestehende TikTok-ähnliche App integrieren kann.
