/*
 * Ledgerlands content: skills, items, assets, budget cards, quiz questions,
 * surprise events and glossary. Edit this file to change what the game teaches.
 * Quests live in game.js because their goals read the game state.
 */
window.LLDATA = (() => {
  const SKILLS = [
    { id: 'earning', name: 'Earning', color: '#e0b24f', glyph: 'E',
      how: 'Tally ledgers at the Counting House desks, then hand them to Foreman Gus for pay.',
      unlocks: [[1, 'Clerk’s desk · 4 coins gross per ledger'], [8, 'Auditor’s desk · 9 coins per report'], [18, 'Analyst’s orrery · 20 coins per analysis']] },
    { id: 'budgeting', name: 'Budgeting', color: '#7cc464', glyph: 'B',
      how: 'Sort expenses at the Budget Hall, and cover your monthly rent from your purse.',
      unlocks: [[1, 'Expense sorting at the Budget Hall'], [10, 'Landlady Pim knocks 2 coins off rent for reliable tenants']] },
    { id: 'saving', name: 'Saving', color: '#5ec2b1', glyph: 'S',
      how: 'Grow your balance at the Bank of Thrift. Interest and new savings both earn XP.',
      unlocks: [[1, 'Basic Savings · 2% APY'], [6, 'Thrift Vault · 5% APY']] },
    { id: 'investing', name: 'Investing', color: '#a88ddb', glyph: 'I',
      how: 'Hold assets from the Exchange. Holding two or more kinds earns a monthly bonus.',
      unlocks: [[1, 'Meadow Index Fund and Guildhall Bonds'], [5, 'Dragonfly Mining · a single, risky company']] },
    { id: 'credit', name: 'Credit', color: '#e06a4c', glyph: 'C',
      how: 'Borrow at the Credit Union and make every monthly payment on time.',
      unlocks: [[1, 'Loans priced by your credit score'], [10, 'Trusted borrower · 2 points off every loan APR']] },
    { id: 'knowledge', name: 'Knowledge', color: '#9fcbea', glyph: 'K',
      how: 'Answer Scholar Ines’s questions at the Academy, and learn to spot scams.',
      unlocks: [[1, 'Academy quizzes · 2 coins per correct answer'], [5, 'Advanced seminar · 5 coins per correct answer']] },
  ];

  const ITEMS = {
    coins: { name: 'Coins', ex: 'Ledgerlands crowns. Left sitting in a purse, they slowly lose buying power to inflation.' },
    ledger_clerk: { name: 'Tallied ledger', ex: 'A neatly totaled column of receipts. Foreman Gus pays 4 coins gross for it.', pay: 4, droppable: true },
    ledger_audit: { name: 'Audited report', ex: 'Every figure checked twice. Gus pays 9 coins gross.', pay: 9, droppable: true },
    ledger_analyst: { name: 'Market analysis', ex: 'Charts, ratios and a careful conclusion. Gus pays 20 coins gross.', pay: 20, droppable: true },
    stub: { name: 'First pay stub', ex: 'Gross pay, minus guild tax, equals net pay. You kept it as a souvenir.' },
    piggy: { name: 'Brass piggy bank', ex: 'Odile’s reward for building an emergency fund. It jingles reassuringly.' },
    certificate: { name: 'Meadow certificate', ex: 'Marlo’s souvenir for investors who hold through the ups and downs.' },
    oath: { name: 'Borrower’s oath', ex: '“Borrow only what you can repay, and repay it on time.” Signed by you.' },
    seal: { name: 'Scholar’s seal', ex: 'Proof that you know your APR from your APY.' },
    badge: { name: 'Scam-buster badge', ex: 'Warden Hale gave you this for reporting a pyramid scheme.' },
    sorter: { name: 'Budget quill', ex: 'Clerk Wren’s gift. It writes in three colors: needs, wants and saves.' },
  };

  const ASSETS = {
    MIDX: { name: 'Meadow Index Fund', mu: 0.07, sigma: 0.15, start: 50, req: 1, color: '#6a52a8',
      blurb: 'Owns a small slice of 200 Ledgerlands companies. Low fees, steady growth over years.' },
    BOND: { name: 'Guildhall Bonds', mu: 0.035, sigma: 0.05, start: 100, req: 1, color: '#2f857a',
      blurb: 'A loan to the town guild that pays steady interest. Calm, slow growth.' },
    DRGN: { name: 'Dragonfly Mining', mu: 0.09, sigma: 0.55, start: 20, req: 5, color: '#b8492f',
      blurb: 'One company digging for one mineral. Huge swings in both directions.' },
  };

  const BUDGET_CARDS = [
    { n: 'Monthly rent', a: 20, c: 'need', why: 'A roof over your head is an essential cost. Housing is usually the biggest need.' },
    { n: 'Groceries', a: 14, c: 'need', why: 'Basic food is a need. Fancy meals out are a want.' },
    { n: 'Lamp oil and heating', a: 6, c: 'need', why: 'Utilities keep your home livable, so they count as needs.' },
    { n: 'Cart fare to work', a: 4, c: 'need', why: 'Getting to the job that pays you is a need.' },
    { n: 'Healer’s insurance', a: 5, c: 'need', why: 'Insurance protects you from large surprise costs. Treat it as a need.' },
    { n: 'Minimum loan payment', a: 8, c: 'need', why: 'Required debt payments are obligations, so 50/30/20 places them with needs.' },
    { n: 'Winter coat (yours is torn)', a: 12, c: 'need', why: 'Replacing something you truly need is a need. Replacing it for style is a want.' },
    { n: 'Basic message-crow plan', a: 3, c: 'need', why: 'A basic way to be reached for work counts as a need.' },
    { n: 'Concert tickets', a: 15, c: 'want', why: 'Fun and worthwhile, but optional. That makes it a want.' },
    { n: 'Bard-song subscription', a: 3, c: 'want', why: 'Subscriptions feel small, but they are wants and they add up every month.' },
    { n: 'New boots (old ones are fine)', a: 18, c: 'want', why: 'Your current boots work, so new ones are a want.' },
    { n: 'Dinner at the Gilded Goose', a: 11, c: 'want', why: 'Eating out is a want. Groceries cover the need.' },
    { n: 'Fancy crow upgrade', a: 25, c: 'want', why: 'The basic plan meets the need. The upgrade is a want.' },
    { n: 'Cosmetic helmet plume', a: 7, c: 'want', why: 'Purely decorative, so it is a want.' },
    { n: 'Emergency fund deposit', a: 10, c: 'save', why: 'Money set aside for surprises belongs in the 20% savings slice.' },
    { n: 'Retirement chest contribution', a: 12, c: 'save', why: 'Saving for your future self is part of the 20%.' },
    { n: 'Index fund purchase', a: 10, c: 'save', why: 'Investing for the long term comes out of the savings slice.' },
    { n: 'Extra loan payment', a: 10, c: 'save', why: 'Paying more than the minimum on debt counts toward the 20% slice.' },
  ];

  const QUIZ = [
    { k: 'Compound interest', q: 'You save 100 coins at 10% interest per year, compounded yearly. How much do you have after 2 years?', o: ['120', '121', '110', '200'], a: 1, why: 'Year 1: 100 → 110. Year 2 earns interest on 110: 110 → 121. Interest on interest is compounding.' },
    { k: 'Diversification', q: 'What does diversification mainly protect you from?', o: ['One company’s failure wiping you out', 'All market risk', 'Paying taxes', 'Inflation'], a: 0, why: 'Spreading money across many holdings limits the damage from any single one. It cannot remove market-wide risk.' },
    { k: 'Emergency funds', q: 'An emergency fund is commonly suggested to cover about…', o: ['1 week of expenses', '3 to 6 months of essential expenses', '5 years of income', 'Only your rent'], a: 1, why: 'Three to six months of essential costs is a common guideline, so a job loss or big bill does not force you into debt.' },
    { k: 'APR', q: 'What does APR stand for?', o: ['Annual Percentage Rate', 'Average Payment Ratio', 'Automatic Payment Request', 'Annual Profit Return'], a: 0, why: 'APR is the yearly cost of borrowing. APY, used for savings, includes the effect of compounding.' },
    { k: 'Inflation', q: 'Inflation is 3% a year and your savings earn 1%. What happens to your buying power?', o: ['It grows by 4%', 'It stays the same', 'It falls by about 2% a year', 'It grows by 1%'], a: 2, why: 'Real return ≈ interest rate − inflation = 1% − 3% = −2%.' },
    { k: '50/30/20 budget', q: 'The 50/30/20 rule splits after-tax income into…', o: ['Rent / food / fun', 'Needs / wants / savings and debt repayment', 'Taxes / spending / gifts', 'Stocks / bonds / cash'], a: 1, why: '50% needs, 30% wants, 20% savings and extra debt payments. It is a starting point, not a law.' },
    { k: 'Interest rates', q: 'Which of these usually charges the highest interest rate?', o: ['A home mortgage', 'A credit card balance', 'A government bond', 'A savings account'], a: 1, why: 'Credit card balances usually carry much higher rates than secured loans like mortgages.' },
    { k: 'Minimum payments', q: 'What happens if you only ever pay the minimum on a credit card?', o: ['The debt disappears faster', 'You stay in debt longer and pay more interest', 'Your interest rate drops to zero', 'Nothing changes'], a: 1, why: 'Minimum payments mostly cover interest, so the balance shrinks slowly and costs much more over time.' },
    { k: 'Stocks', q: 'Buying a share of stock means you own…', o: ['A loan to the company', 'A small part of the company', 'A guaranteed payment', 'The company’s debt'], a: 1, why: 'A share is partial ownership. A bond is a loan.' },
    { k: 'Bonds', q: 'A bond is best described as…', o: ['Part ownership of a company', 'A loan you make to a government or company', 'A type of savings account', 'A lottery ticket'], a: 1, why: 'Bondholders lend money and usually receive interest plus their money back at the end.' },
    { k: 'Index funds', q: 'An index fund…', o: ['Picks one hot stock', 'Holds many securities to track a market index', 'Guarantees profits', 'Only holds cash'], a: 1, why: 'Index funds follow a whole index, which spreads risk and usually keeps fees low.' },
    { k: 'Rule of 72', q: 'Rule of 72: at 6% a year, money roughly doubles in about…', o: ['6 years', '12 years', '20 years', '72 years'], a: 1, why: 'Divide 72 by the yearly rate: 72 ÷ 6 = 12 years.' },
    { k: 'Scams', q: 'Someone promises guaranteed high returns with no risk. This is most likely…', o: ['A great deal', 'A sign of a scam', 'A government bond', 'An index fund'], a: 1, why: 'Real investments that can pay more also carry risk. A guarantee of high returns is a classic warning sign.' },
    { k: 'Credit scores', q: 'Which factor usually affects a credit score the most?', o: ['Your income', 'Payment history', 'Your age', 'Where you live'], a: 1, why: 'Paying on time, every time, is the biggest single factor in most scoring models.' },
    { k: 'Net worth', q: 'Net worth equals…', o: ['Income minus expenses', 'Assets minus liabilities', 'Savings plus income', 'Your salary'], a: 1, why: 'Add up what you own, subtract what you owe.' },
    { k: 'Liquidity', q: 'Liquidity describes…', o: ['How fast an asset turns into cash without losing value', 'How risky an asset is', 'How much tax you pay', 'A bank’s fees'], a: 0, why: 'Cash is fully liquid. A house is not: selling it takes time and money.' },
    { k: 'Dollar-cost averaging', q: 'Dollar-cost averaging means…', o: ['Investing a fixed amount at regular intervals', 'Waiting for the perfect moment to buy', 'Buying only when prices rise', 'Selling everything each year'], a: 0, why: 'Investing the same amount regularly buys more shares when prices are low and fewer when high.' },
    { k: 'Net pay', q: 'Your net income is…', o: ['Pay before taxes', 'What’s left after taxes and deductions', 'Your yearly bonus', 'Interest on savings'], a: 1, why: 'Gross pay is the full amount. Net pay is what actually reaches you.' },
    { k: 'Fees', q: 'A fund with a higher expense ratio…', o: ['Always performs better', 'Takes a bigger cut of your money each year', 'Has no risk', 'Pays more interest'], a: 1, why: 'Fees come out every year, and over decades even 1% adds up to a large amount.' },
    { k: 'Opportunity cost', q: 'Opportunity cost is…', o: ['The price on the tag', 'The value of the next-best option you give up', 'A bank fee', 'A tax refund'], a: 1, why: 'Spending 50 coins on boots also means not investing those 50 coins.' },
    { k: 'Risk and return', q: 'Why do riskier investments tend to offer higher expected returns?', o: ['Investors want to be paid for taking risk', 'They are guaranteed', 'Governments require it', 'They have no fees'], a: 0, why: 'If risky and safe assets paid the same, nobody would choose the risky one.' },
    { k: 'Simple interest', q: 'Simple interest on 200 coins at 5% a year for 3 years is…', o: ['15', '30', '31.5', '60'], a: 1, why: '200 × 0.05 × 3 = 30. Compounding would pay a little more: about 31.5.' },
    { k: 'Pay yourself first', q: '“Pay yourself first” means…', o: ['Buy treats before bills', 'Move money into savings as soon as you’re paid', 'Pay off friends first', 'Skip rent'], a: 1, why: 'Saving first, before spending, turns saving into a habit instead of a leftover.' },
    { k: 'Credit scores', q: 'A higher credit score usually gets you…', o: ['Higher interest rates', 'Lower interest rates on loans', 'More taxes', 'Nothing at all'], a: 1, why: 'Lenders see you as lower risk and offer better rates. Basil at the Credit Union works the same way.' },
  ];

  const MONTH_EVENTS = [
    { t: 'Your cart wheel snapped. The wheelwright charges', amt: 40 },
    { t: 'A fever kept you in bed. The healer charges', amt: 55 },
    { t: 'Your roof sprang a leak. Patching it costs', amt: 30 },
    { t: 'Your boots finally wore through. New ones cost', amt: 25 },
    { t: 'You found coins in an old coat pocket:', amt: -12 },
    { t: 'The guild pays everyone a small bonus:', amt: -20 },
  ];

  const FOLK_TIPS = [
    'I keep a little money in the bank and a little in the Meadow fund. I sleep better that way.',
    'The bard-song subscription is only 3 coins. And the crow plan is only 3. And… oh. Those add up.',
    'Did you know rent goes up with inflation? My grandmother paid 12 coins a month!',
    'I paid my loan late once. Basil still reminds me about it.',
    'My cousin put everything in Dragonfly Mining. Then it halved. Now he talks about diversification at dinner.',
    'I pay myself first: the moment Gus pays me, a few coins go straight to the bank.',
    'The fountain is full of coins. Not one of them is earning interest.',
    'Gus pays more for audited reports, but you need practice before he lets you near that desk.',
  ];

  const GLOSSARY = [
    ['APR', 'Annual Percentage Rate: the yearly cost of borrowing money.'],
    ['APY', 'Annual Percentage Yield: what savings earn in a year, including interest on interest.'],
    ['Asset', 'Something you own that has value: coins, savings, shares.'],
    ['Bond', 'A loan you make to a government or company in exchange for interest.'],
    ['Compound interest', 'Interest earned on your interest as well as on the original amount.'],
    ['Credit score', 'A 300–850 number lenders use to judge how reliably you repay.'],
    ['Diversification', 'Spreading money across many holdings so one failure can’t sink you.'],
    ['Emergency fund', 'Savings kept for surprises, often 3 to 6 months of essential costs.'],
    ['Gross vs net pay', 'Gross is what you earn; net is what you keep after taxes.'],
    ['Index fund', 'A fund that owns everything in a market index, usually with low fees.'],
    ['Inflation', 'The general rise in prices, which shrinks what each coin can buy.'],
    ['Liability', 'Something you owe, like a loan balance.'],
    ['Net worth', 'Assets minus liabilities.'],
    ['Volatility', 'How much and how fast a price swings up and down.'],
  ];

  return { SKILLS, ITEMS, ASSETS, BUDGET_CARDS, QUIZ, MONTH_EVENTS, FOLK_TIPS, GLOSSARY };
})();
