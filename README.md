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

## GitHub Pages

Die App kann ohne Build-Schritt direkt ueber GitHub Pages laufen:

1. Repository auf GitHub oeffnen.
2. `Settings` -> `Pages` oeffnen.
3. Source auf `Deploy from a branch` stellen.
4. Branch `main` und Ordner `/root` auswaehlen.
5. Speichern.
