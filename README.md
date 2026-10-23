# AegisExam Sentinel

> **Browser-Enforced Anti-Capture, Targeted Question Obscurity, & Forensic Watermark System**

A pure web-based assessment security platform implementing the OPSWAT Anti-Screen Capture (ASC) pattern inside modern desktop web browsers.

---

## Quickstart

### 1. Launch the Server
```bash
npm start
# or
npx serve -l 3000 .
# or simply double-click index.html
```

### 2. Open in Browser
Visit **`http://localhost:3000`** in Google Chrome, Brave, Edge, or Firefox.

---

## Key Features

1. **Targeted Question Obscurity (OPSWAT ASC Model)**: Blacks out *only* the question canvas when screenshots or focus switches occur; the exam timer and answering workflow continue uninterrupted.
2. **0ms Synchronous Buffer Wiping**: Immediately flushes canvas pixel buffers to solid `#000000` black upon capture events.
3. **Chromium `keyup` & `keydown` Interception**: Captures `PrintScreen` (KeyCode 44), `Meta` (Windows key), and `Alt` in the capturing phase and purges the system clipboard buffer.
4. **Dynamic Forensic Watermark Matrix**: Irrevocably embeds candidate name, ID, IP address, session token, and live timestamp across question pixels to neutralize smartphone camera leaks.
5. **DOM Mutation Watchdog**: Automatically locks and restores the canvas if an attacker modifies the DOM via Inspect Element (F12).
6. **Anti-Print Shield**: `@media print` rules ensure print jobs or "Print to PDF" requests output a 100% black warning sheet.

---

## Detailed Documentation

For full architectural diagrams, implementation breakdowns, and operational workflows, see:
* [DOCUMENTATION.md](file:///c:/Users/raodi/Aris/DOCUMENTATION.md)
