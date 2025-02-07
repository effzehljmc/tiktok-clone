```markdown
Die Einbindung von Embeddings in dein Empfehlungssystem lässt sich grob in vier Schritte unterteilen:

---

## 1. Datenvorbereitung
Zuerst musst du klären, welche Textinformationen du pro Video bzw. Rezept einbetten möchtest. Typischerweise wären das:
- Titel → video.title
- Beschreibung → video.description
- Tags → video.tags
- Rezeptdaten (z. B. ingredients, cookingTime, difficulty) → recipeMetadata

Anhand dieser Felder erzeugst du einen Text (z. B. per Konkatinierung), den du später an den OpenAI Embeddings-Endpunkt schickst.

---

## 2. Embeddings erzeugen (OpenAI API)
Du kannst den OpenAI-Endpoint (bspw. text-embedding-ada-002) verwenden, um Embeddings für deinen Text zu generieren. Dabei sendest du den zu „embed”-denden String sowie deinen OpenAI-API-Key an die API und bekommst einen Embeddings-Vektor zurück.

Einfaches Beispiel (TypeScript/Node):

```typescript
import axios from 'axios';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export async function generateEmbeddings(text: string): Promise<number[]> {
  const url = 'https://api.openai.com/v1/embeddings';
  const model = 'text-embedding-ada-002';

  const response = await axios.post(url, {
    input: text,
    model
  }, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`
    }
  });

  // Der Rückgabewert ist typischerweise ein Array von floats
  return response.data.data[0].embedding;
}
```

Wichtig:
• Achte auf deine Token-Limits und ggf. Preis, wenn du sehr viele Videos auf einmal einbetten willst.  
• Kürze ggf. extrem lange Beschreibungen, indem du vor dem Request nur x Zeichen oder Tokens verwendest.

---

## 3. Speicherung in PostgreSQL/pgvector
Da du PostgreSQL verwendest, kannst du eine Spalte vom Typ vector (mittels pgvector-Extension) erstellen und die Embeddings direkt dort ablegen, z. B. in einer neuen Spalte video_embedding. In Prisma geht das aktuell (Stand 2023) nur über ein Raw SQL Migration-Statement, da Prisma pgvector noch nicht offiziell unterstützt. Beispiel:

In deiner Prisma-Schema (oder per Migrationsscript):

```sql
-- Stellt sicher, dass pgvector installiert ist
CREATE EXTENSION IF NOT EXISTS vector;

-- Füge die Spalte 'embedding_vector' vom Typ 'vector(1536)' hinzu
-- (1536 ist z. B. die Dimension für text-embedding-ada-002)
ALTER TABLE "videos"
ADD COLUMN "embedding_vector" vector(1536);
```

Wir gehen davon aus, dass du bereits eine search_vector-Spalte hast (für Full-Text-Suche). Die kann bestehen bleiben. Die Embeddings-Spalte ist ein separater Vektor. Danach kannst du sie updaten, sobald du das Embedding generiert hast.

Beispiel für das Updaten per Prisma (Raw Query):

```typescript
import { prisma } from '../utils/prismaClient'; // PrismaClient-Instanz

export async function storeEmbeddings(videoId: string, embedding: number[]) {
  const dim = embedding.length; // z. B. 1536
  // 'embedding' muss in der Form '{x,y,z,...}' stehen für pgvector
  const embeddingString = `{${embedding.join(',')}}`;

  await prisma.$executeRawUnsafe(`
    UPDATE "videos"
    SET "embedding_vector" = '${embeddingString}'
    WHERE "id" = '${videoId}';
  `);
}
```

Anstelle von $executeRawUnsafe kannst du z. B. auch $queryRawUnsafe verwenden. Beachte, dass Prisma (noch) kein eingebautes pgvector-Support hat, weshalb du auf Raw SQL zurückfallen musst.

---

## 4. Nutzung in der Recommendation
Wenn du den contentSimilarityScore berechnen willst, gehst du so vor:
1. Lade die Embeddings des Nutzers (z. B. dessen Profil oder vorherige Vorlieben) oder dem Video, das als „Basis“ dient.  
2. Berechne die Cosine Similarity (oder L2, je nach Bedarf) zwischen den Embeddings.  
3. Den errechneten Wert addierst du zum Engagement-Score, um eine „hybride“ Scoring-Funktion zu erhalten.

Beispiel (Skizze in TypeScript/Node):

```typescript
import { prisma } from '../utils/prismaClient';

function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < vecA.length; i++) {
    dot += vecA[i] * vecB[i];
    normA += vecA[i] ** 2;
    normB += vecB[i] ** 2;
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export async function calculateContentSimilarity(
  userEmbedding: number[],
  videoId: string
): Promise<number> {
  // 1. Hole das Embedding aus der Videos-Tabelle
  const video = await prisma.videos.findUnique({
    where: { id: videoId },
    select: { embedding_vector: true }
  });

  if (!video || !video.embedding_vector) {
    return 0;
  }

  // embedding_vector liegt als string "{x,y,z}" vor,
  // parse es in ein number[] um
  const vectorString = video.embedding_vector.replace('{', '').replace('}', '');
  const videoVector = vectorString.split(',').map(Number);

  // 2. Cosine Similarity
  const similarity = cosineSimilarity(userEmbedding, videoVector);

  // Wertebereich ~ 0 bis 1 (wenn perfekt gleich). Multipliziere ggf. mit Faktor zur Gewichtung
  return similarity;
}
```

Je nach Anforderung kannst du auch mehrere Content-Embeddings (Titel, Zutaten etc.) zusammenfassen. In vielen Fällen reicht ein einzelnes, das aus dem Gesamtkontext (Titel + Beschreibung + Tags) entsteht.

---

## Wie gehst du praktisch vor?

1. Erweiterung des Schemas um eine vector-Spalte (falls noch nicht vorhanden):  
   • CREATE EXTENSION pgvector;  
   • ALTER TABLE … ADD COLUMN embedding_vector vector(1536);

2. Cronjob oder Batch-Script schreiben, das alle Videos (noch ohne Embedding) nimmt:  
   • Textdaten zusammentragen (title, description, tags, recipeMetadata).  
   • generateEmbeddings() aufrufen.  
   • storeEmbeddings() aufrufen („embedding_vector“ in der “videos”-Tabelle aktualisieren).

3. Bei zukünftigen Uploads (z. B. wenn Creator ein neues Video erstellt):  
   • Sobald title, description und tags final vorliegen, rufe generateEmbeddings() auf und speichere das Embedding.

4. In der Recommendation-Funktion (getPersonalizedVideos o. ä.):  
   • Lade sowohl Engagement-Score als auch embedding_vector.  
   • Ermittle die Similarity zum Nutzer-Embedding oder zu thematisch passenden Basiswerten (z. B. seine meistgeschauten Themen).  
   • Summiere alles in total_score.  
   • Sortiere absteigend nach total_score.

5. Optimiere den Ablauf über Zwischenspeicherung (Caching) oder eine Edge Function (falls du Supabase Edge Functions nutzt), falls es zu Performanceproblemen kommt. Bedenke, dass Embeddings-Generierung etwas Zeit und API-Kosten beansprucht.

---

### Zusammenfassung
• Du erzeugst die Embeddings per OpenAI (text-embedding-ada-002) für die Textfelder deines Videos.  
• Du speicherst diese Embeddings in einer pgvector-Spalte in der Postgres-Datenbank.  
• Für das Scoring führst du eine Cosine Similarity-Berechnung mit den User-Präferenzen oder benachbarten Videos durch.  
• So entsteht ein hybrider Score, der sowohl Engagement-Metriken als auch semantische Ähnlichkeiten nutzt.

Damit hast du die Grundbausteine, um deinen Recommendation Service mit KI-basierten Embeddings anzureichern und personalisierte Feeds noch genauer auf die Vorlieben deiner Nutzer zuzuschneiden.
```
