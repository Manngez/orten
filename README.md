# ORTEN

**Dra linjen. Undvik krysset.**

Ett lokalt geografispel för 2–8 spelare. Nämn svenska orter i tur och ordning. Varje ny ort kopplas till den föregående; korsar den nya linjen en äldre linje blir spelaren utslagen.

## Nytt i 2.0

- Landval mellan Sverige och Norge i både lokalt spel och onlinerum
- 1 831 norska postorter och korrekt norsk kustlinje, helt offline i bygget
- Online för 2–8 spelare med rumskod
- Varje spelare skriver orten på sin egen mobil när det är deras tur
- Gemensamt synkroniserad karta, poäng, turordning och Blitz-timer
- Anslutningsstatus och återanslutning med samma rumskod
- Ny responsiv design för mobil och dator
- Klassisk och Blitz (15 sekunder per tur)
- Animerade linjer, markörer, korsningar och resultat
- Poäng baserade på sträckans längd, med avdrag vid utslagning
- Tydligare turstatus, resultattavla och mobil inmatning
- Förbättrad lokal statistik: poäng, rekord, orter och vinster
- Valfria diskreta ljudeffekter via Web Audio
- Offlinevänlig: ortsdata och spelkod ingår i bygget
- Enfilspaket i `dist/index.html`, lämpligt för GitHub Pages

## Kör lokalt

```bash
npm install
npm run dev
```

## Produktion

```bash
npm run build
```

Ladda upp innehållet i `dist` till GitHub Pages. Eftersom bygget skapar en fristående HTML-fil fungerar det även under ett projektnamn utan särskild `base`-inställning.
