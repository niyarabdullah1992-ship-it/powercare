# NiroVera ERP — promo assets

Marketing assets for NiroVera ERP (brand navy `#14284B` + green `#1E9E63`, Arabic RTL).

- `nirovera-promo-vertical.mp4` — cinematic vertical promo (1080×1920, ~28s, H.264 Main + AAC, faststart). Plays in any modern browser/player (VLC, phones, social apps). No voiceover embedded — see the script below to dub it.
- `nirovera-promo-voiceover-ar.md` — timed Arabic (and English) voiceover script matching the video.
- `nirovera-ad-instagram-square.png` — 1080×1080 static ad.
- `nirovera-ad-story-portrait.png` — 1080×1350 static ad.

## Open the video
Double-click `nirovera-promo-vertical.mp4`, or open it in a browser / VLC. If a preview panel won't play it, download the file first, then open locally.

## Add a human voiceover
Record the script (human or an AI‑voice service) at ~28s, then mux it:
```bash
ffmpeg -i nirovera-promo-vertical.mp4 -i voice.mp3 -map 0:v -map 1:a -c:v copy -c:a aac -shortest nirovera-promo-voiced.mp4
```
