# Tomato's Zim Trip 🍅🚲

A Zimbabwe trivia ride by [ExploreLocally](https://explorelocally.co.zw).
Cycle from Victoria Falls to the Matobo Hills — ten stops, five questions and 60 seconds at each.
Two wrong answers at a stop and the trip is over.

**Live:** https://zimtrivia.explorelocally.co.zw

## How it plays
- 10 stops: Victoria Falls, Hwange, Lake Kariba, Mana Pools, Harare, Nyanga, Chimanimani, Gonarezhou, Great Zimbabwe, Matobo Hills.
- 5 random questions per stop from a bank of 15+; unseen questions come first, so you can play at least three times without repeats.
- Right answers move on automatically; wrong answers show the correct one and a fact.
- Every correct answer has a **Source** button linking to where the fact can be checked.
- Scoring: 100 per right answer + 20 per answer in your current streak, plus 5 points for every second left and 250 for a perfect stop.

## Project structure
```
index.html     the game (HTML/CSS/JS, no build step)
questions.js   question bank — edit this to add or fix questions
favicon.svg    icon
og-image.png   link-preview image
vercel.json    hosting config
CLAUDE.md      setup and maintenance notes for Claude Code
```

## Run locally
Open `index.html` in a browser, or run `npx serve .` and visit the printed URL.

## Deploy
Pushed to `main` → deployed by Vercel. DNS for `zimtrivia.explorelocally.co.zw` is a CNAME in Cloudflare (DNS only).
See `CLAUDE.md` for the full setup.
