# Technologieradar Rail für SharePoint Online

SPFx 1.23.2 Webpart, Version 1.0.0, mit gemeinsamer Datenhaltung in einer SharePoint-Liste.

## Installation

Fertiges Paket: package/technologieradar-rail.sppkg im Repository beziehungsweise die gleichnamige Datei in der Lieferung. Schritt-für-Schritt-Anleitung: Installationsanleitung.pdf.

Das Paket über den App-Katalog freigeben, auf der Zielwebsite hinzufügen und das Webpart auf einer modernen Seite einfügen. Im Webpart einmalig **Liste einrichten** als Websitebesitzer ausführen. Standardname: **Technologieradar Rail**.

Keine zusätzlichen Graph-Berechtigungen oder externen Server. Zugriff erfolgt als angemeldeter Benutzer auf die aktuelle Website. Lesende benötigen Leserechte auf Seite und Liste; Redakteure zusätzlich Hinzufügen/Bearbeiten, die Einrichtung Listen verwalten. **Nur Anzeige** ersetzt keine Listenberechtigungen.

## Funktionen

- 20 Bewertungsstufen, 0 ausgeblendet; 20 außen, 1 im Zentrum.
- Kategoriencluster mit Beschriftung im Außenring, helle Ringflächen und zugehörige Legende.
- Aktueller Stand als Kreis, Ziel als Kreuz; Hinweise mit Begründung/Beschreibung beziehungsweise Projekt/Verantwortlichen/Beschreibung.
- Steckbrief-Links, Projekt, Verantwortliche, Verlauf, Archiv, Suche, Tabellenansicht.
- JSON-Sicherungen der Windows-Anwendung importieren, JSON sichern und Radar als PNG exportieren.
- Versionsprüfung gegen konkurrierende Änderungen (ETag), keine stillschweigende Überschreibung.

JSON-Import ergänzt neue IDs; vorhandene IDs werden übersprungen. Maximal 1.000 Einträge/10 MB je Import und 60.000 Zeichen je Datensatz. Kein Excel-Import, keine Live-Synchronisierung mit der Desktopanwendung. SharePoint-Listenversionen für Wiederherstellung einzelner Einträge verwenden. Radardaten nicht direkt in der Liste bearbeiten.

## Entwicklung

Node.js 22 verwenden. Im Projektordner:

```sh
npm ci
npm test
npm run build
```

Buildausgabe: sharepoint/solution/technologieradar-rail.sppkg. Die Lösung enthält ihre Client-Dateien. Für Updates die Paketversion in config/package-solution.json erhöhen und IDs beibehalten.

Lokale Vorschau mit ausschließlich fiktiven Daten: `node preview/build.cjs` und `node preview/serve.cjs`, anschließend http://127.0.0.1:8765. Diese Vorschau speichert nur im Arbeitsspeicher und prüft keine echte SharePoint-Verbindung.

## Prüfung und Grenzen

Produktionsbuild und Paketprüfung erfolgreich; neun automatisierte Tests für Datenmodell, Backup-Kompatibilität, SVG-Ausgabe, REST-Schreibkonflikte und Rechtefehler. Lokale Browserprüfung: Darstellung, Neuanlage und Speichern mit Mock-Daten. **Noch nicht in einem echten Microsoft-365-Tenant installiert und abgenommen.** Vor produktiver Nutzung Installation, Rechte und gleichzeitige Bearbeitung auf einer Testwebsite prüfen. Kein Paket für SharePoint Server vor Ort.
