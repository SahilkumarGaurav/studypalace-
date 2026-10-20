/**
 * content.ts — the SEO content hub.
 *
 * These pages exist to rank for the exact phrases NIFT aspirants type into
 * Google ("nift gat syllabus pdf", "nift cat drawing practice", "situation test
 * material", "nift exam pattern 2027"). Each guide is genuinely useful and
 * free — then it funnels the reader into the matching paid PDF.
 *
 * `body` is a small, safe markdown-ish subset rendered by components/GuideBody.tsx:
 *   # H1 (ignored — we use guide.title)   ## H2   ### H3
 *   paragraphs, - bullets, 1. numbered lists, > callouts, **bold**, [link](url),
 *   and | tables |.
 */

export interface Guide {
  slug: string;
  title: string;
  seoTitle: string;
  description: string;
  keywords: string[];
  hero: string;
  readMinutes: number;
  updated: string;
  category: string;
  relatedCategory?: string;
  faqs: { q: string; a: string }[];
  body: string;
}

export const GUIDES: Guide[] = [
  {
    slug: 'nift-gat-syllabus-pdf',
    title: 'NIFT GAT Syllabus 2027 — Complete Topic-wise Checklist (PDF)',
    seoTitle: 'NIFT GAT Syllabus 2027 PDF | Topic-wise Checklist + Question Bank',
    description:
      'Complete NIFT GAT syllabus for B.Des and B.FTech: Quantitative Ability, English, Analytical & Logical Reasoning, General Knowledge, Current Affairs and Fashion/Design awareness — with a topic-wise priority table, daily study plan and a downloadable practice PDF.',
    keywords: [
      'NIFT GAT syllabus 2027',
      'NIFT GAT syllabus PDF',
      'NIFT general ability test syllabus',
      'GAT quantitative ability topics',
      'NIFT GAT question bank',
      'NIFT GAT preparation books',
      'NIFT current affairs PDF',
      'NIFT GK for fashion design',
    ],
    hero: 'Everything GAT tests — and the exact order to study it in.',
    readMinutes: 11,
    updated: '2026-10-20',
    category: 'GAT',
    relatedCategory: 'gat',
    faqs: [
      {
        q: 'Is the GAT syllabus different for B.Des and B.FTech?',
        a: 'The paper is the same GAT for both, but B.Des candidates sit GAT + CAT + Situation Test while B.FTech candidates sit GAT + CAT only (no Situation Test). Your preparation for GAT itself — Quant, English, Reasoning, GK and Current Affairs — is identical.',
      },
      {
        q: 'How many questions are in the NIFT GAT and what is the marking?',
        a: 'GAT is a 100-mark objective paper of roughly 2 hours covering Quantitative Ability, Communication Ability/English, Analytical & Logical Ability, General Knowledge & Current Affairs, and a Design/Creativity-oriented awareness section. Always confirm the exact pattern in the current year’s official NIFT prospectus, because NIFT does revise it.',
      },
      {
        q: 'Which topics should I finish first in GAT Quant?',
        a: 'Percentages, Ratio & Proportion, Profit & Loss, Averages, Simplification and Number System. These six are high-frequency, quick to learn, and they also make Time–Work and Mixtures much easier later.',
      },
      {
        q: 'Do I need separate books for Fashion GK?',
        a: 'Most general-Knowledge books ignore fashion entirely, which is exactly what NIFT tests. You need a dedicated list: Indian textiles (Chikankari, Kantha, Phulkari, Banarasi, Ajrakh, Bandhani, Pashmina), handloom clusters, famous Indian and international designers, fashion capitals, fashion weeks, fibres and sustainable fashion.',
      },
    ],
    body: `
## What is the NIFT GAT?

The **General Ability Test (GAT)** is the first stage for every NIFT applicant. It is an objective paper that checks your English, mathematics, reasoning, general knowledge, awareness of current affairs — and, uniquely for NIFT, your awareness of **design and fashion**.

B.Des selection is decided by GAT + CAT + Situation Test. B.FTech selection uses GAT + CAT. So no matter which programme you are aiming for, GAT is a large, very learnable chunk of your final merit score.

## GAT section-wise syllabus

| Section | What it checks | Rough weight |
| --- | --- | --- |
| Quantitative Ability | Arithmetic, basic algebra, geometry, data interpretation | ~20% |
| Communication Ability / English | Grammar, vocabulary, comprehension | ~20% |
| Analytical & Logical Ability | Series, coding, analogy, blood relations, directions, syllogisms | ~20% |
| General Knowledge & Current Affairs | Static GK, recent 6 months of news | ~20% |
| Design / Creativity-oriented awareness | Fashion, textiles, designers, aesthetics, observation | ~20% |

> Weights are indicative — NIFT changes the pattern between years. Check the current prospectus before you lock your plan.

## 1. Quantitative Ability — study in this order

| Priority | Topic | What to study |
| --- | --- | --- |
| High | Percentages | Increase/decrease, successive percentage change |
| High | Ratio & Proportion | Ratios, proportions, comparisons, partnership basics |
| High | Profit & Loss | CP, SP, discount, marked price |
| High | Average | Simple and weighted averages |
| High | Fractions & Decimals | Conversions and fast calculation |
| High | Simplification | BODMAS and arithmetic operations |
| High | Number System | Divisibility rules, factors, multiples, HCF/LCM |
| Medium | Simple Interest | Principal, rate, time |
| Medium | Compound Interest | Annual compounding, CI–SI difference |
| Medium | Time & Work | Efficiency, combined work, pipes |
| Medium | Time, Speed & Distance | Relative speed, trains, boats |
| Medium | Mixtures & Alligation | Replacement problems |
| Medium | Probability | Elementary probability |
| Medium | Permutation & Combination | Basic counting |
| Additional | Geometry | Lines, angles, triangles, circles |
| Additional | Mensuration | Area, perimeter, volume |
| Additional | Algebra | Basic linear and quadratic equations |
| Additional | Data Interpretation | Tables, bar charts, pie charts |

**Where most students go wrong:** they start with Probability and Permutation because those chapters look impressive. Start with Percentages, Ratios, Averages and Profit–Loss instead — they appear far more often and they are the foundation for Mixtures, Interest and Data Interpretation.

## 2. English (Communication Ability)

- Parts of speech: nouns, pronouns, verbs, adjectives, adverbs
- Tenses and subject–verb agreement
- Articles (a, an, the) and prepositions
- Conjunctions
- Active and passive voice
- Direct and indirect speech
- Synonyms and antonyms
- One-word substitutions
- Idioms and phrases
- Correct spelling
- Sentence correction and error spotting
- Fill in the blanks and sentence completion
- Reading comprehension
- Para jumbles

**Daily target:** learn 10–15 new words and solve 15–20 English questions. Vocabulary cannot be crammed in the last week; it compounds.

## 3. Analytical & Logical Reasoning

| Topic | What to practise |
| --- | --- |
| Number Series | Missing terms, difference-of-difference patterns |
| Alphabet Series | Letter skipping, positional value |
| Coding–Decoding | Letter shifts, number codes, substitution |
| Analogy | Word, number and figure analogies |
| Classification | Odd one out |
| Blood Relations | Family trees, coded relations |
| Direction Sense | Distance and final direction |
| Ranking & Order | Position-based questions |
| Seating Arrangement | Linear and circular |
| Syllogisms | All/some/none conclusions |
| Statement & Conclusion | Argument evaluation |
| Pattern Recognition | Visual and logical patterns |
| Calendar | Day-of-week reasoning |
| Clock | Angles between hands |
| Non-verbal Reasoning | Figure series, mirror and water images, paper folding |

Prioritise: **series → coding–decoding → analogy → classification → direction sense → blood relations.** These six alone usually carry the bulk of the reasoning section.

## 4. General Knowledge & Current Affairs

### Static GK
Indian states and capitals • Indian geography • Indian history • Constitution and polity • national institutions • festivals • traditional art forms • handicrafts • monuments • personalities • awards and honours • books and authors • important days • countries and capitals • international organisations • sports and tournaments.

### Fashion & Design awareness (the section nobody prepares for)
1. History of Indian clothing
2. Traditional Indian textiles and handloom traditions
3. Indian embroidery techniques
4. Traditional crafts and regional costumes
5. Textile-producing regions of India
6. Famous Indian fashion designers
7. International fashion designers
8. Fashion capitals of the world
9. Fashion weeks and major fashion events
10. Sustainable fashion
11. Natural and synthetic fibres
12. Fabric types and their properties
13. Fashion terminology
14. Famous brands and their founders
15. Traditional prints and motifs
16. Colour theory and colour terminology
17. Important design institutions
18. Government textile and handicraft initiatives

Learn the craft names properly: **Chikankari** (Lucknow), **Kantha** (Bengal), **Phulkari** (Punjab), **Kanjeevaram silk** (Tamil Nadu), **Banarasi brocade** (Varanasi), **Bandhani** (Gujarat/Rajasthan), **Ajrakh** (Kutch), **Pashmina** (Kashmir).

### Current Affairs
Cover the months leading up to the exam with extra attention on the most recent six months: national and international news, government schemes, awards, sports, science and technology, environment, fashion-industry news, cultural events, major appointments and economic developments.

> Do not just memorise headlines. For every item learn the **person, organisation, place and event** attached to it — that is how NIFT frames its options.

## A realistic GAT study plan

- **Months 1–3:** Finish Quant foundation + English grammar + Reasoning basics. One GK topic per week.
- **Months 4–5:** Full syllabus coverage, start sectional mock tests, begin monthly current-affairs capsules.
- **Final 6 weeks:** Full-length mocks under timing, error notebook revision, fashion-GK cramming, daily vocabulary.

## Get the practice PDFs

Syllabus reading is 10% of the work. The other 90% is questions. Grab the topic-wise GAT practice PDFs, previous year papers and current affairs capsules from our store — every file downloads instantly after payment.

- [Browse all GAT PDFs](/c/gat)
- [See everything in the shop](/shop)
`,
  },
  {
    slug: 'nift-cat-drawing-practice-pdf',
    title: 'NIFT CAT Drawing Practice Plan — Human Figures, Perspective & Composition',
    seoTitle: 'NIFT CAT 2027: Drawing Practice Plan + Creative Ability Test PDF',
    description:
      'A complete NIFT CAT preparation plan: drawing fundamentals, human figure proportion, one/two/three-point perspective, composition rules, colour theory, design thinking and fashion illustration — with daily practice prompts and downloadable CAT practice sheets.',
    keywords: [
      'NIFT CAT preparation',
      'NIFT creative ability test',
      'CAT drawing practice PDF',
      'NIFT CAT human figure drawing',
      'perspective drawing for NIFT',
      'fashion illustration for CAT',
      'NIFT CAT previous year questions',
      'how to prepare CAT for NIFT',
    ],
    hero: 'CAT carries 50% of your B.Des merit. Draw like it.',
    readMinutes: 12,
    updated: '2026-10-20',
    category: 'CAT',
    relatedCategory: 'cat',
    faqs: [
      {
        q: 'How much weight does CAT carry for B.Des?',
        a: 'For B.Des, the Creative Ability Test is worth 50% of the final merit, with GAT at 30% and the Situation Test at 20%. That makes CAT the single highest-leverage paper in the entire selection process.',
      },
      {
        q: 'I cannot draw people. Can I still crack CAT?',
        a: 'Yes. CAT rewards idea clarity, composition, perspective and use of space more than anatomical perfection. Start with simplified gesture figures (an oval head, a line spine, block limbs), get the pose and story right, then refine anatomy. A confident simple figure scores better than a hesitant detailed one.',
      },
      {
        q: 'What materials should I practise with?',
        a: 'Practise with exactly what you will use in the hall: pencils (HB, 2B, 4B, 6B), a black fineliner, eraser, sharpener and the colour medium you plan to use — colour pencils, sketch pens or watercolour. Do not experiment with new media on exam day.',
      },
      {
        q: 'How many CAT drawings should I complete per week?',
        a: 'Aim for 5–7 full compositions a week in the last three months, each timed to 30–40 minutes, plus daily 15-minute warm-ups of hands, faces and fabric folds. Volume plus feedback beats perfectionism.',
      },
    ],
    body: `
## Why CAT decides your NIFT rank

For **B.Des**, NIFT's final merit is built from **CAT 50% + GAT 30% + Situation Test 20%**. CAT is the Creative Ability Test: drawing, visualisation, imagination, observation and the communication of an idea on paper.

It is also the section most aspirants under-prepare, because you cannot memorise your way through it. You have to draw. Every day.

## A. Drawing fundamentals (do these first)

- Basic shapes: circles, squares, rectangles, triangles
- 3D forms: cube, cylinder, cone, sphere
- Light and shadow, shading techniques, line quality
- Proportion
- Perspective: one-point, two-point, three-point, and fish-eye
- Composition: foreground, middle ground, background

Practise drawing everyday things — furniture, rooms, streets, public spaces. Boring objects build the muscle that later makes exciting compositions look effortless.

## B. Human figure drawing

- Basic anatomy for artists
- Head-to-body proportions (the classic 7.5–8 head fashion figure)
- Standing, walking, running, sitting figures
- Bending, reaching, twisting poses
- Front, side and three-quarter views
- Male and female proportion differences
- Facial expressions
- Hands and feet
- Clothing folds and fabric movement
- Figures interacting with objects

> **Important:** do not wait until your humans are perfect before attempting full CAT compositions. Start with simplified gesture figures and gradually add anatomy, clothing and detail. Composition practice and figure practice must run in parallel.

## C. Perspective and environment drawing

Practise scenes with people doing things — never empty rooms:

- Classroom, bedroom, café
- Market, shopping street, mall
- Park, railway station, bus stop
- Fashion store, boutique, restaurant
- Festival ground, school, crowded street
- Indoor and outdoor scenes

Example brief: *draw a busy Indian marketplace with vendors, customers, stalls, hanging fabric rolls and hand-painted signboards.* Notice how much story you can put into one frame.

## D. Creative composition

Learn to arrange elements deliberately:

- Balance (symmetrical vs asymmetrical)
- Contrast, rhythm, repetition
- Emphasis and focal point
- Unity, proportion, visual hierarchy
- Foreground and background separation
- Positive and negative space

Build every composition around a **theme** instead of randomly filling the page. If the theme is "monsoon in Mumbai", every element you place should serve that idea.

## E. Colour theory

- Primary, secondary and tertiary colours
- Warm vs cool colours
- Complementary and analogous combinations
- Colour harmony and contrast
- Colour psychology
- Light and shadow in colour
- Building palettes for a collection

Practise small palettes for themes: a summer collection, a winter collection, a traditional Indian festival, a sustainable-fabric brand.

## F. Imagination and design thinking

This is where an idea becomes a visual answer.

- Unusual uses of everyday objects
- Product redesign
- Theme-based compositions
- Visual storytelling
- Poster concepts
- Creative problem-solving
- Object transformation
- Combining unrelated objects into a new concept
- Designing around social or environmental issues

Prompt: *imagine a future where clothing is engineered to reduce plastic waste — communicate that in one frame.*

## G. Fashion-design-specific practice

Because your goal is Fashion Design, also practise:

- Fashion figure croquis and garment silhouettes
- Shirt, trouser, dress and kurta variations
- Traditional Indian clothing and contemporary Indian fashion
- Sleeve and neckline variations
- Fabric patterns and textile motifs
- Accessories and footwear
- Seasonal clothing
- Sustainable fashion concepts
- Theme-based fashion illustration boards
- How garments behave when a person walks, sits or moves

> But do not spend all your CAT time drawing clothes on static figures. Environment drawing, perspective, composition and visual storytelling carry just as much weight.

## A weekly CAT routine that actually works

1. **Daily 15 min warm-up:** hands, faces, folds, ellipses.
2. **3 sessions/week — figure:** gesture, proportion, one full clothed figure.
3. **2 sessions/week — environment:** one-point and two-point perspective scenes with people.
4. **2 sessions/week — full timed composition:** 30–40 minutes, theme-based, colour included.
5. **Weekly review:** photograph your work, mark three things that improved and three that did not.

## Get the CAT practice sheets

Our CAT PDFs contain perspective grids, figure proportion templates, solved compositions, colour palette exercises and theme-based prompts — all printable so you can draw directly on them.

- [Browse CAT drawing PDFs](/c/cat)
- [See all study material](/shop)
`,
  },
  {
    slug: 'nift-situation-test-material',
    title: 'NIFT Situation Test Guide — 3D Model Making, Materials & Write-up Format',
    seoTitle: 'NIFT Situation Test 2027: Model Making Ideas, Materials & Write-up',
    description:
      'Everything about the NIFT Situation Test for B.Des: how the 3D model-making studio test works, the materials you get, structures to practise, 30 creative model themes, stability and finishing tips, and the exact write-up format examiners expect.',
    keywords: [
      'NIFT situation test',
      'situation test model making',
      'NIFT situation test material',
      'NIFT 3D model test',
      'situation test write up format',
      'NIFT B.Des situation test preparation',
      'situation test ideas',
      'NIFT studio test',
    ],
    hero: '20% of your B.Des merit happens with your hands, not your pen.',
    readMinutes: 10,
    updated: '2026-10-20',
    category: 'Situation Test',
    relatedCategory: 'situation-test',
    faqs: [
      {
        q: 'Who has to give the Situation Test?',
        a: 'Only shortlisted B.Des candidates. B.FTech applicants do not appear for it. For B.Des the final merit is CAT 50% + GAT 30% + Situation Test 20%.',
      },
      {
        q: 'What materials are provided in the Situation Test?',
        a: 'NIFT typically supplies a kit of basic craft materials — coloured paper, cardboard, thread, adhesive and similar items. You must work with what is given and follow the instructions on the sheet exactly, including which materials are permitted.',
      },
      {
        q: 'What do examiners actually evaluate?',
        a: 'The official criteria are creativity and innovation, model-making skill, material handling, composition, finishing, stability and conceptual clarity. A simple model that is stable, neatly finished and clearly explained beats an ambitious model that collapses.',
      },
      {
        q: 'How long do I get?',
        a: 'Usually around three hours including the write-up. Practise with a strict timer: 2 hours 15 minutes to build, 30 minutes to finish and write, 15 minutes buffer.',
      },
    ],
    body: `
## What the Situation Test is

The Situation Test is the practical, studio-based stage for **shortlisted B.Des candidates**. You are given a set of materials and a task, and you must build a **three-dimensional model** that communicates a concept — then explain it in writing.

It is worth **20% of the B.Des final merit** (CAT 50%, GAT 30%, ST 20%).

NIFT's own FAQ names the assessment areas: **creativity, innovation, model-making, material handling, composition, finishing, stability and conceptual clarity.**

## A. Basic shapes and structures

Practise making:

- Cubes, cuboids, triangular prisms
- Cylinders, cones, pyramids, spheres
- Arches, bridges, towers
- Simple buildings and enclosures

For each one, learn how to **cut, fold, join and reinforce** it. A cylinder that keeps its shape under a light press is worth more than a complicated form that buckles.

## B. Paper craft and construction techniques

- Paper folding and scoring before you fold (this is the single biggest finishing upgrade)
- Paper cutting and precise templates
- Paper strips, rolling paper into cylinders
- Paper weaving and braiding
- Tabs and slots — the strongest glue-free joint
- Layering and lamination for stiffness
- Simple pop-up structures
- Symmetrical and asymmetrical structures
- 3D geometric models and modular repeated units

## C. Model-making materials

Practise with the materials commonly used:

- Coloured paper, chart paper
- Cardboard, mount board
- Straws, sticks, skewers
- Thread, string, wire (only where provided)
- Clay
- Adhesives
- Recycled materials

> Always follow the actual exam instructions about which materials are permitted. Using something you brought from home can cost you the paper.

## D. 30 creative model themes to practise

1. Sustainable home
2. Futuristic bus stop
3. Community library
4. Smart classroom
5. Festival installation
6. Public garden
7. Eco-friendly shopping centre
8. Pedestrian bridge
9. Fashion exhibition space
10. Waste-management solution
11. Rainwater harvesting structure
12. Vertical farm
13. Emergency relief shelter
14. Children's play structure
15. Handloom weaver's workstation
16. Floating market
17. Metro station entrance
18. Urban tree house
19. Solar-powered street lamp cluster
20. Modular classroom for rural areas
21. Public drinking-water point
22. Textile recycling unit
23. Bird sanctuary structure
24. Cycle parking pod
25. Open-air amphitheatre
26. Street-vendor cart redesign
27. Disaster-resistant house
28. Sensory garden for the visually impaired
29. Pop-up fashion retail kiosk
30. Community composting station

The goal is not a pretty object. The goal is a **clearly communicated concept** in a **stable, well-finished** structure.

## E. The Situation Test write-up (use this exact structure)

1. **Title** — what is your model called?
2. **Concept** — what idea does it communicate?
3. **Purpose** — what problem does it solve, and for whom?
4. **Materials** — what did you use, and why those?
5. **Construction** — how did you assemble it, step by step?
6. **Innovation** — what makes this design different from the obvious answer?
7. **Sustainability** — how does it reduce waste or use resources efficiently?

Practise writing these in **concise, clear English**. Examiners read hundreds of sheets; a short confident paragraph per heading beats a rambling page.

## F. Exam-day discipline

- Read the brief twice before touching a single sheet.
- Sketch a 2-minute plan: form, scale, joint strategy, colour.
- Score every fold. Cut once, correctly.
- Build the load-bearing structure first, decorate last.
- Leave 30 minutes for finishing + the write-up. Never skip the write-up — it is marked.
- Keep the workspace tidy; finishing is judged visually.

## Get the Situation Test PDF

Our Situation Test PDF contains printable templates, joint diagrams, 50 theme briefs with concept notes, scoring rubrics and worked write-up examples.

- [Browse Situation Test PDFs](/c/situation-test)
- [See all study material](/shop)
`,
  },
  {
    slug: 'nift-exam-pattern-marks-weightage',
    title: 'NIFT Exam Pattern 2027 — Marks, Weightage & Merit Formula Explained',
    seoTitle: 'NIFT Exam Pattern 2027: GAT, CAT, Situation Test Marks & Weightage',
    description:
      'NIFT 2027 exam pattern explained: number of papers, duration, marks, negative marking, the B.Des merit formula (CAT 50% / GAT 30% / Situation Test 20%), B.FTech pattern, eligibility and how to plan your preparation around the weightage.',
    keywords: [
      'NIFT exam pattern 2027',
      'NIFT marks weightage',
      'NIFT B.Des merit formula',
      'NIFT CAT 50 percent weightage',
      'NIFT GAT pattern',
      'NIFT negative marking',
      'NIFT entrance exam syllabus',
      'NIFT eligibility criteria',
    ],
    hero: 'Know the weightage before you plan a single study hour.',
    readMinutes: 8,
    updated: '2026-10-20',
    category: 'Exam Info',
    faqs: [
      {
        q: 'What is the B.Des merit formula at NIFT?',
        a: 'For B.Des the final merit is CAT 50% + GAT 30% + Situation Test 20%. Only candidates shortlisted on GAT + CAT performance are called for the Situation Test.',
      },
      {
        q: 'Is there negative marking in NIFT GAT?',
        a: 'NIFT has, in recent cycles, applied a small deduction for incorrect answers in GAT. Because this changes, always confirm against the current year’s official prospectus before you decide your guessing strategy.',
      },
      {
        q: 'Which is harder to score in — GAT or CAT?',
        a: 'GAT is more predictable and rewards consistent practice, so most students plate around a similar band. CAT is worth more and separates ranks the most — a strong CAT drawing can move your merit dramatically.',
      },
    ],
    body: `
## The two papers everyone writes

- **GAT — General Ability Test:** objective, tests Quantitative Ability, Communication Ability (English), Analytical & Logical Ability, General Knowledge & Current Affairs, and design/fashion awareness.
- **CAT — Creative Ability Test:** descriptive, tests drawing, visualisation, imagination, observation and idea communication.

B.Des shortlisted candidates then appear for the **Situation Test** — a studio-based 3D model-making practical.

## B.Des merit formula

| Component | Weight |
| --- | --- |
| CAT — Creative Ability Test | 50% |
| GAT — General Ability Test | 30% |
| Situation Test | 20% |

Read that table again and plan accordingly. Half your rank comes from a drawing paper.

## B.FTech merit formula

| Component | Weight |
| --- | --- |
| GAT | 70% |
| CAT | 30% |

B.FTech candidates **do not** appear for the Situation Test.

## What this means for your timetable

- **If you are B.Des:** protect at least half of your weekly study hours for CAT drawing practice. Most students do the opposite — they study theory because it feels productive, then discover in the hall that they cannot compose a scene.
- **Situation Test:** practise model-making on weekends. It is 20% of your merit and is almost never prepared for, which makes it the easiest place to gain relative advantage.
- **GAT:** it is the most "coachable" paper. Systematic Quant + Reasoning + daily current affairs gives steady, predictable gains.

## Eligibility (B.Des)

You must have passed 10+2 from a recognised board. Age limits and relaxation rules apply and change between cycles — verify in the current prospectus. NIFT admissions are conducted through the NIFT entrance exam followed by counselling and seat allotment.

## Where to start

1. Print the syllabus pages: [GAT syllabus](/nift-gat-syllabus-pdf), [CAT practice plan](/nift-cat-drawing-practice-pdf), [Situation Test guide](/nift-situation-test-material).
2. Take one diagnostic GAT paper and one timed CAT composition to find your baseline.
3. Buy the practice PDFs for your weakest two sections and work them for six weeks.

- [Browse all PDFs](/shop)
- [See the complete bundles](/c/bundles)
`,
  },
  {
    slug: 'nift-current-affairs-fashion-gk-pdf',
    title: 'NIFT Current Affairs & Fashion GK — Monthly Capsule Topics List',
    seoTitle: 'NIFT Current Affairs PDF + Fashion GK Topics List (Monthly Capsule)',
    description:
      'The exact current affairs and fashion GK topics NIFT asks about: national and international news, government schemes, awards, sports, science, environment, plus Indian textiles, handlooms, embroidery, designers, fashion capitals, fibres and sustainable fashion.',
    keywords: [
      'NIFT current affairs PDF',
      'NIFT fashion GK',
      'fashion general knowledge for NIFT',
      'Indian textiles and handlooms list',
      'NIFT GK questions',
      'sustainable fashion GK',
      'famous Indian fashion designers',
      'NIFT monthly current affairs capsule',
    ],
    hero: 'The GK section nobody studies — and everyone loses marks in.',
    readMinutes: 9,
    updated: '2026-10-20',
    category: 'Current Affairs',
    relatedCategory: 'current-affairs',
    faqs: [
      {
        q: 'How many months of current affairs should I cover?',
        a: 'Cover the full run-up to the exam but give the most recent six months the deepest attention — that window is where most question setters pick from.',
      },
      {
        q: 'Do I really need fashion GK if I am applying for B.FTech?',
        a: 'Yes. The design and creativity-oriented awareness portion of GAT applies to all candidates, and fashion/textile questions are a NIFT speciality regardless of programme.',
      },
    ],
    body: `
## Why this section is free marks

Most NIFT aspirants prepare Quant, English and Reasoning seriously and treat General Knowledge as "whatever I happen to know". That is exactly why GK is where you gain the most relative ground: a focused six-week plan here moves your score more than another month on Percentages.

## Static GK checklist

- Indian states, capitals, and important cities
- Indian geography: rivers, mountains, national parks, soils
- Indian history: ancient, medieval, modern, freedom struggle
- Constitution and polity: fundamental rights, important articles, institutions
- Important national institutions and their headquarters
- Indian festivals and their states
- Traditional Indian art forms and dance styles
- Indian handicrafts and their regions
- Famous monuments and UNESCO World Heritage Sites
- Important personalities
- Awards and honours (national and international)
- Books and authors
- Important days and dates
- Countries, capitals and currencies
- International organisations
- Sports, tournaments, trophies and recent winners

## Fashion & Design awareness — the full list

1. History of Indian clothing
2. Traditional Indian textiles
3. Indian handloom traditions and weaving clusters
4. Indian embroidery techniques
5. Traditional Indian crafts
6. Regional costumes of India
7. Textile-producing regions
8. Famous Indian fashion designers
9. International fashion designers
10. Fashion capitals of the world
11. Fashion weeks and major fashion events
12. Sustainable fashion and circularity
13. Natural and synthetic fibres
14. Fabric types and their properties
15. Fashion terminology
16. Famous fashion brands and their founders
17. Traditional prints and motifs
18. Colour theory and colour terminology
19. Important design institutions
20. Government initiatives for textiles and handicrafts

### Crafts and textiles you must know by name

| Craft / Textile | Region |
| --- | --- |
| Chikankari | Lucknow, Uttar Pradesh |
| Kantha | West Bengal |
| Phulkari | Punjab |
| Kanjeevaram silk | Kanchipuram, Tamil Nadu |
| Banarasi brocade | Varanasi, Uttar Pradesh |
| Bandhani | Gujarat and Rajasthan |
| Ajrakh | Kutch, Gujarat |
| Pashmina | Kashmir |
| Patola | Patan, Gujarat |
| Ikat | Telangana, Odisha |
| Jamdani | Bengal |
| Kalamkari | Andhra Pradesh |
| Zardozi | Lucknow, Hyderabad |
| Muga silk | Assam |

### Fibres quick sheet

- **Natural:** cotton, silk, wool, linen (flax), jute, hemp, cashmere, pashmina, coir
- **Regenerated:** viscose/rayon, modal, lyocell (Tencel), bamboo viscose
- **Synthetic:** polyester, nylon (polyamide), acrylic, spandex/elastane, lycra

## Current affairs coverage plan

- National news
- International news
- Government initiatives and schemes
- Awards and honours
- Sports
- Science and technology
- Environmental developments
- Fashion industry news (collections, sustainability, retail, exports)
- Important cultural events
- Major appointments
- Key economic developments

> Do not just memorise headlines. For every item, learn the **person, organisation, location and event** attached to it — that is how NIFT builds its four options.

## How to revise it without drowning

1. One **monthly capsule** PDF, read twice: once in the month, once in the final fortnight.
2. A running **one-page sheet** of crafts, designers and fashion capitals — revise weekly.
3. Fifteen **GK questions a day**, mixed sources, with errors written into a notebook.
4. In the final two weeks, revise only your notebook. New material at that point does more harm than good.

- [Browse Current Affairs capsules](/c/current-affairs)
- [See all GAT PDFs](/c/gat)
`,
  },
  {
    slug: 'nift-previous-year-question-papers',
    title: 'NIFT Previous Year Question Papers — How to Use PYQs Properly',
    seoTitle: 'NIFT Previous Year Papers PDF: How to Use PYQs for GAT & CAT',
    description:
      'How to use NIFT previous year question papers effectively: what PYQs tell you about difficulty, question types and timing, a 6-week PYQ drill schedule for GAT, how to self-evaluate CAT papers, and where to download solved PYQ PDFs.',
    keywords: [
      'NIFT previous year question papers',
      'NIFT PYQ PDF',
      'NIFT GAT previous papers',
      'NIFT CAT previous year questions',
      'NIFT solved papers',
      'NIFT question papers with answers',
      'NIFT mock tests',
    ],
    hero: 'Past papers are the only honest predictor of the real exam.',
    readMinutes: 7,
    updated: '2026-10-20',
    category: 'Previous Year Papers',
    relatedCategory: 'previous-year-papers',
    faqs: [
      {
        q: 'Are official NIFT question papers released?',
        a: 'NIFT does not always release full official papers; most available sets are memory-based reconstructions from candidates. They are still extremely useful for question style, difficulty and topic distribution — just do not treat them as a complete syllabus map.',
      },
      {
        q: 'How many previous year papers should I solve?',
        a: 'Solve every set you can find, minimum five full-length GAT papers under strict timing. For CAT, work through at least ten past prompts as timed compositions, even without official answer keys.',
      },
    ],
    body: `
## Why PYQs matter more than any book

Previous year papers tell you four things no syllabus document can:

1. **Difficulty band** — how hard the arithmetic actually gets.
2. **Question archetypes** — NIFT repeats patterns, just with new numbers.
3. **Topic distribution** — which chapters reliably show up.
4. **Timing pressure** — how long a "normal" question is expected to take.

## A 6-week PYQ drill

- **Week 1:** One GAT paper, untimed, purely diagnostic. Mark every error by topic.
- **Week 2:** Fix the two weakest topics. Re-solve the same paper's questions from those sections.
- **Week 3:** One GAT paper, timed. Target: complete 85% within the time limit.
- **Week 4:** One GAT paper + two CAT prompts timed. Start an error notebook.
- **Week 5:** Two GAT papers in exam conditions. Analyse, don't just score.
- **Week 6:** Mixed revision — only your error notebook and past mistakes.

## How to self-evaluate a CAT paper

You have no answer key, so use a rubric:

| Criterion | Marks out of 10 | Ask yourself |
| --- | --- | --- |
| Idea / concept | 10 | Is the idea clear in 5 seconds of looking? |
| Composition | 10 | Is the page balanced, with an obvious focal point? |
| Perspective | 10 | Do objects sit correctly in space? |
| Figure drawing | 10 | Are proportions believable? |
| Line quality & shading | 10 | Confident strokes, consistent light source? |
| Colour use | 10 | Harmonious, purposeful, not muddy? |
| Finishing | 10 | Complete, clean, no half-drawn areas? |

Score honestly. Under 45/70 means your fundamentals need work before you attempt more full papers.

## The error notebook (non-negotiable)

For every mistake write: the question, why you got it wrong, and the rule that fixes it. In the last two weeks, revise **only** this notebook. It is the highest-yield study material you own — and you wrote it yourself.

- [Download Previous Year Paper PDFs](/c/previous-year-papers)
- [Browse everything](/shop)
`,
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

export function guideSlugs(): string[] {
  return GUIDES.map((g) => g.slug);
}
