# Ledgerlands

A point-and-click market-town RPG about money. You walk around a small town, talk to its people and level six skills by actually doing the money thing: earning, budgeting, saving, investing, borrowing and learning.

It runs in the browser with no build step and no dependencies.

## Play

Open `index.html` in a browser. That's it.

If you prefer a local server (some browsers restrict files opened from disk):

```bash
python3 -m http.server 5173
```

Then visit <http://localhost:5173>.

## What's in the game

| Skill | How you train it | What it teaches |
| --- | --- | --- |
| Earning | Tally ledgers at the Counting House, hand them to Foreman Gus | Gross vs net pay, guild tax |
| Budgeting | Sort expenses at the Budget Hall; pay rent from your purse | 50/30/20, needs vs wants |
| Saving | Keep coins in the Bank of Thrift | Compound interest, APY, comparing accounts |
| Investing | Hold assets from the Exchange | Risk and return, diversification, fees |
| Credit | Borrow from the Credit Union and repay on time | APR, amortization, credit scores |
| Knowledge | Answer Scholar Ines's quiz; spot the pyramid scheme | Rule of 72, inflation, scams |

Every month-end (25, 40 or 60 seconds, your choice) rent is due, savings pay interest, prices move, loans come due, inflation nudges costs up and sometimes a surprise bill arrives. A month report shows exactly what happened to your net worth.

Seven quests lead you through the town. The **Next step** card in the corner always tells you what to do and walks you there when clicked.

## Controls

| Input | Action |
| --- | --- |
| Click | Walk, talk or use |
| Right-click / press and hold | All options, including Examine |
| WASD or arrow keys | Walk |
| 1–4, Enter | Pick a dialogue reply or quiz answer |
| P | Pause the clock |
| M | Town map |
| K I Q L J | Skills, pack, quests, ledger, journal tabs |
| Mouse wheel | Zoom |
| Esc | Close |

## Project layout

```
index.html          markup: world, HUD, side panel, title screen
styles.css          all styling (ink, gilt and ledger parchment)
src/data.js         content: skills, items, assets, budget cards, quiz, glossary
src/game.js         engine, world, rules, UI
scripts/bundle.mjs  makes a single-file build in dist/
```

To change what the game teaches, edit `src/data.js`. Quests live in `src/game.js` because their goals read the game state.

## Single-file build

```bash
npm run bundle            # dist/ledgerlands.html
npm run bundle:fragment   # dist/ledgerlands.fragment.html (no <html>/<head>/<body> wrapper)
```

## Notes

- Progress is saved in the browser's local storage. Settings → Start over erases it.
- Rates, prices and events are simplified and fictional. This is a teaching game, not financial advice.
