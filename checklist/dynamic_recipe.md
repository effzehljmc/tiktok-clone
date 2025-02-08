# Dynamische Rezeptvariationen & Ernährungsoptimierung

Dieses Feature ermöglicht nicht nur die Erzeugung alternativer Rezeptvarianten (z. B. vegetarisch, vegan, kalorienreduziert) basierend auf dem Originalrezept, sondern bietet auch eine interaktive, agentenbasierte Benutzererfahrung, die sich nahtlos in die bestehende Koch- und Rezeptnische integriert.

---

## 1. Konzeptübersicht

Die dynamische Rezeptfunktion umfasst:

- **Dynamische Rezeptvariation:**  
  AI-Agenten generieren in Echtzeit alternative Varianten, die an individuelle Diätpräferenzen, Allergien oder Kalorienvorgaben angepasst sind.

- **Interaktiver Kochassistent (Geplant):**  
  Über ein Chat-Interface können Nutzer Fragen stellen (z. B. "Wie lange knete ich den Teig?" oder "Welches Öl passt als Butterersatz?") und erhalten sofort kontextbasierte Antworten.

- **Ernährungsprofiling (Geplant):**  
  Dynamisch kalkulierte Nährwertinformationen und Optimierungsvorschläge werden bereitgestellt – sei es durch automatische Berechnungen oder durch ergänzende AI-Antworten.

---

## 2. Technische Implementation

### a) AI-Agent Architektur

Die Implementation basiert auf einem modularen System mit spezialisierten Komponenten:

- **Prompt Builder System** (`services/prompts/recipePrompts.ts`):
  - ✓ Spezialisierte Prompt-Templates für verschiedene Anwendungsfälle
  - ✓ Kontextbasierte Prompt-Generierung
  - ✓ Unterstützung für:
    - Rezeptvariationen
    - Ernährungsanalyse (Vorbereitet, noch nicht aktiv)
    - Kochtechniken (Vorbereitet, noch nicht aktiv)
    - Zutatensubstitution

- **Fehlerbehandlung & Resilienz** (`services/safeAiAgent.ts`):
  - ✓ Exponentielles Backoff bei Fehlern
  - ✓ Typenspezifische Fehlerbehandlung
  - ✓ Detailliertes Error-Logging
  - ✓ Konfigurierbare Retry-Logik

### b) Backend-Integration

- **Zentraler API-Endpunkt:**  
  Ein einheitlicher Endpunkt (`/api/ai-agent`) verarbeitet alle Anfragen mit:
  - ✓ Caching-Mechanismus für häufige Anfragen
  - ✓ Fehlerbehandlung und Retry-Logik
  - ✓ Kontextbasierte Prompt-Generierung

### c) Geplante Features

- **Ernährungsoptimierung:**  
  Auf Basis des Originalrezepts und zusätzlicher Nutzerpräferenzen werden Zutatenlisten sowie Nährwerte angepasst und direkt visualisiert.

- **Kontextbezogene Antworten:**  
  Der Agent beantwortet spezifische Fragen zu Zubereitungsschritten und liefert detaillierte Anleitungen sowie alternative Vorschläge.

---

## 3. Konkrete Abläufe und User Journey

1. **Rezeptanzeige:**  
   Der Nutzer öffnet ein Rezept, das zunächst das Originalrezept mit Basisinformationen (Zutaten, Schritte, Nährwerte) anzeigt.

2. **Interaktion mit dem AI-Agenten:**  
   Über den integrierten Chat können:
   - Spezifische Fragen zu einzelnen Rezeptschritten gestellt werden.
   - Alternative Rezeptvarianten (z. B. "Erstelle die vegane Variante") angefragt werden.
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

