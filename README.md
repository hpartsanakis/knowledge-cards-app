# Knowledge Cards App

Eine kleine Vanilla-HTML/CSS/JS-App zum Erstellen, Lesen, Bearbeiten und Loeschen von Lernkarten.

## Funktionen

- Karten mit Titel, Kategorie, Inhalt, Tags und Favorit-Status
- Suche ueber Titel, Kategorie, Inhalt und Tags
- Kategorie-Filter
- Favoriten-Filter
- Spaced Repetition mit Bewertungen: Nochmal, Schwer, Gut, Einfach
- Anzeige faelliger Karten
- Pomodoro-Timer mit Fokus- und Pausenzeit
- PWA-ready fuer iPhone Home Screen und Offline-Nutzung
- Optionaler Supabase Sync fuer MacBook und iPhone
- Bearbeiten und Loeschen
- Speicherung im Browser per LocalStorage

## Lernmethode

Die App kombiniert Active Recall mit Spaced Repetition und Pomodoro:

- Eine Karte aktiv erinnern.
- Danach mit Nochmal, Schwer, Gut oder Einfach bewerten.
- Die App plant automatisch den naechsten Wiederholungstermin.
- Mit dem Pomodoro-Timer lernst du in konzentrierten Fokus-Einheiten.

## Start

Oeffne `index.html` im Browser.

## iPhone Installation

Nach dem Deployment ueber HTTPS, zum Beispiel GitHub Pages:

1. Seite in Safari oeffnen.
2. Teilen-Button antippen.
3. `Zum Home-Bildschirm` waehlen.
4. App starten.

Die Karten bleiben lokal im Browser gespeichert.

## Supabase Sync

1. In Supabase ein neues Projekt erstellen.
2. `SQL Editor` oeffnen.
3. Den Inhalt aus `supabase-schema.sql` ausfuehren.
4. In `Project Settings` -> `API` die Project URL und den `anon public` Key kopieren.
5. In `supabase-config.js` eintragen:

```js
window.KNOWLEDGE_CARDS_SUPABASE = {
  url: "https://DEIN-PROJEKT.supabase.co",
  anonKey: "DEIN-ANON-PUBLIC-KEY"
};
```

Danach neu pushen. Auf MacBook und iPhone mit derselben E-Mail anmelden, dann synchronisieren sich die Karten ueber Supabase.

## GitHub Pages

Die App kann ohne Build-Schritt direkt ueber GitHub Pages laufen:

1. Repository auf GitHub oeffnen.
2. `Settings` -> `Pages` oeffnen.
3. Source auf `Deploy from a branch` stellen.
4. Branch `main` und Ordner `/root` auswaehlen.
5. Speichern.
