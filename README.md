# Kartkamp

Ett nytt geografiskt strategispel byggt på Ortens kartmotor och ortsdata.

## Poängjakten

Två till åtta spelare turas om att skriva svenska orter. Varje ort kopplas till den föregående med en linje. Sträckans längd ger poäng, minst 10 poäng per drag. En korsning drar av 100 poäng (poängen kan aldrig bli negativa), men spelaren fortsätter. Efter fem drag per spelare vinner den med högst poäng. Vid lika poäng vinner spelaren som först nådde poängen.

Originalreglerna finns som **Sista kvar**, med utslagning vid korsning. Blitz och Duell finns också kvar. Onlinerum använder tills vidare de tre ursprungliga lägena; Poängjakten är lokalt spel på samma skärm.

## Utveckling

```bash
npm ci
npm run dev
npm run build
```

GitHub Actions bygger och publicerar `dist` på GitHub Pages vid push till `main`. Appen använder React, Vite och en lokalt paketerad ortsdatabas. Onlinerum använder PeerJS/WebRTC och kan kompletteras med TURN via `VITE_TURN_URLS`, `VITE_TURN_USERNAME` och `VITE_TURN_CREDENTIAL`.
