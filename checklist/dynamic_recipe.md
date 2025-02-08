# Dynamische Rezeptvariationen & Ernährungsoptimierung

Dieses Feature ermöglicht nicht nur die Erzeugung alternativer Rezeptvarianten (z. B. vegetarisch, vegan, kalorienreduziert) basierend auf dem Originalrezept, sondern bietet auch eine interaktive, agentenbasierte Benutzererfahrung, die sich nahtlos in die bestehende Koch- und Rezeptnische integriert.

---

## 1. Konzeptübersicht

Die dynamische Rezeptfunktion umfasst:

- **Dynamische Rezeptvariation:**  
  AI-Agenten generieren in Echtzeit alternative Varianten, die an individuelle Diätpräferenzen, Allergien oder Kalorienvorgaben angepasst sind.

- **Interaktiver Kochassistent:**  
  Über ein Chat-Interface können Nutzer Fragen stellen (z. B. "Wie lange knete ich den Teig?" oder "Welches Öl passt als Butterersatz?") und erhalten sofort kontextbasierte Antworten.

- **Ernährungsprofiling:**  
  Dynamisch kalkulierte Nährwertinformationen und Optimierungsvorschläge werden bereitgestellt – sei es durch automatische Berechnungen oder durch ergänzende AI-Antworten.

---

## 2. Integration in die App

### a) AI-basierte Rezeptagenten

Ein zentraler AI-Agent übernimmt Aufgaben, die früher durch separate, statische Endpunkte abgedeckt wurden:
- **Rezeptvarianten in Echtzeit:**  
  Nutzer erhalten per Eingabe im Chat dynamisch generierte Rezeptvarianten (z. B. "vegane Variante" oder "kalorienreduziert").
  
- **Kontextbezogene Antworten:**  
  Der Agent beantwortet spezifische Fragen zu Zubereitungsschritten und liefert detaillierte Anleitungen sowie alternative Vorschläge.
  
- **Ernährungsoptimierung:**  
  Auf Basis des Originalrezepts und zusätzlicher Nutzerpräferenzen werden Zutatenlisten sowie Nährwerte angepasst und direkt visualisiert.

### b) Backend-Integration

- **Zentraler API-Endpunkt:**  
  Statt mehrerer fest definierter Routen wird ein einheitlicher Endpunkt (z. B. `/api/ai-agent`) eingesetzt, der alle Anfragen verarbeitet.
  
- **Agent-Service:**  
  In `services/aiAgent.ts` wird mittels eines Chat-Komplettierungsansatzes (GPT-4) dynamisch auf Nutzeranfragen reagiert.

- **Asynchrone Verarbeitung & Caching:**  
  Generierte Varianten und Antworten werden temporär gecacht, um wiederholte Anfragen effizient zu bedienen.

### c) Frontend-Integration

- **Integriertes Chat-Interface:**  
  Auf der Rezeptdetailseite wird ein Chat-Bereich angezeigt, über den der Nutzer den AI-Agenten direkt ansprechen kann.
  
- **Dynamische Anzeige:**  
  Basisinformationen wie Zutatenliste und Nährwerte werden zunächst statisch dargestellt. Bei Interaktion ergänzt der Agent diese um detaillierte, kontextbezogene Informationen in einem Overlay oder Chat-Fenster.

---

## 3. Konkrete Abläufe und User Journey

1. **Rezeptanzeige:**  
   Der Nutzer öffnet ein Rezept, das zunächst das Originalrezept mit Basisinformationen (Zutaten, Schritte, Nährwerte) anzeigt.

2. **Interaktion mit dem AI-Agenten:**  
   Über den integrierten Chat können:
   - Spezifische Fragen zu einzelnen Rezeptschritten gestellt werden.
   - Alternative Rezeptvarianten (z. B. „Erstelle die vegane Variante“) angefragt werden.
   - Detaillierte Ernährungsinformationen abgerufen werden.

3. **Ergebnisanzeige:**  
   - Der AI-Agent liefert in Echtzeit eine angepasste Schritt-für-Schritt-Anleitung und modifizierte Zutatenlisten.
   - Dynamisch berechnete Nährwerte und Optimierungsvorschläge werden angezeigt.
   - Optionale Anpassungen können zur direkten Übernahme in die Einkaufslistenfunktion integriert werden.

4. **Feedback und Anpassung:**  
   Nutzer können Feedback zu den Vorschlägen geben, das in zukünftige Anfragen einfließt, um die Personalisierung kontinuierlich zu verbessern.

---

## 4. Integration in weitere App-Komponenten

- **Einkaufslisten:**  
  Beim Bestätigen einer Rezeptvariante werden die angepassten Zutaten direkt in eine dynamisch generierte Einkaufslistenversion übernommen.

- **Personalisierter Content-Feed:**  
  Interaktionen mit dem AI-Agenten fließen in den Empfehlungsalgorithmus ein, sodass zukünftig bevorzugt Rezepte mit ähnlichen, agentenbasierten Interaktionen vorgeschlagen werden.

---

## Fazit

Durch die Integration von AI-Agenten wird das dynamische Rezeptvariationssystem schlanker und interaktiver. Anstatt separate statische Endpunkte für Rezeptvarianten, Nährwertberechnungen und Zubereitungsschritte zu pflegen, übernimmt ein intelligenter Agent diese Aufgaben in Echtzeit. Dies führt zu:

- **Flexibleren, personalisierten Rezeptempfehlungen**
- **Echtzeit-Interaktion und Feedback**
- **Nahtloser Integration in bestehende Komponenten wie Rezeptdetails, Einkaufslisten und den personalisierten Feed**

Durch diesen zentralen, agentenbasierten Ansatz wird das Nutzererlebnis deutlich interaktiver und anpassungsfähiger – ideal für die moderne Koch- und Rezeptnische.

