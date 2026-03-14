# Forensic toolkit

A browser-based collection of cryptography and forensic utilities. Everything runs locally — no data is transmitted, no backend, no accounts.

## Tools

| Tool | Description |
|------|-------------|
| Hash Generator | MD5, SHA-1, SHA-256, SHA-384, SHA-512 — file or text input |
| Base64 | Encode and decode Base64 strings |
| Caesar Cipher | Encrypt, decrypt, or brute-force all 25 shifts |
| Password Generator | Cryptographically random passwords via `crypto.getRandomValues()` |
| Folder Archiver | Compress any folder to `.tar.gz` entirely in-browser |

## Stack

Vanilla JS · No frameworks · No dependencies · No server

The hash tool uses the WebCrypto API for SHA variants and a pure-JS implementation for MD5. The password generator guarantees all four character classes with rejection sampling to avoid lookalike characters.

## Running locally

```bash
git clone https://github.com/grayguava/forensic-toolkit
cd forensic-toolkit
npx serve .
```

Then open `http://localhost:3000`.

## Structure

```
/
├── index.html          # SPA shell — sidebar + iframe viewport
├── toolkit.css         # Unified stylesheet
├── hash/               # File hash computer
├── base64/             # Base64 encoder / decoder
├── caesar/             # Caesar cipher
├── password/           # Password generator
└── archiver/           # Folder → .tar.gz
```

Each tool is a self-contained page that also works standalone via direct URL.

## Privacy

- Zero network requests
- No analytics or tracking
- No data leaves the browser
- All processing is client-side

## Status

Work in progress. Tools are functional. More planned.