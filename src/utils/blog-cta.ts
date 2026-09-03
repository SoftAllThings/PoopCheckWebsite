/**
 * Posts that get a mid-article CTA, with copy written for that post's intent.
 *
 * Why a map instead of importing <AppCTA/> into each MDX file: the triage set
 * shifts every quarter as rankings move. Membership living in one file means a
 * re-triage is a one-line edit, not ten MDX edits plus ten copies of the markup.
 *
 * Seeded with the top 10 posts by impressions — 88% of blog impressions and 92%
 * of blog clicks. Every one is a "look at your own stool" query, where scanning
 * is genuinely the reader's next action rather than an interruption.
 *
 * Measured baseline before this shipped: blog landing sessions converted to a
 * store click at 0.57%, against the homepage's 17.79%.
 */
export const MID_ARTICLE_CTA: Record<string, { heading: string; body: string }> = {
  'pencil-thin-stools-when-to-worry': {
    heading: 'Not sure if the shape actually changed?',
    body: 'Most people are comparing against memory. Scan a photo and compare it against your own logged baseline instead of guessing.',
  },
  'mucus-in-stool': {
    heading: 'Track how often it actually happens',
    body: 'Occasional mucus is normal; a pattern is what matters. Log each entry and see the trend rather than reacting to one day.',
  },
  'exercise-and-bowel-movements': {
    heading: 'See how your training affects your gut',
    body: 'Log stool type alongside your training days and watch how consistency, transit and Bristol type move together.',
  },
  'how-hydration-affects-stool': {
    heading: 'Find out if dehydration is your pattern',
    body: 'Hydration shows up in stool consistency within a day or two. Track Bristol type over a week and the link gets obvious.',
  },
  'black-stool-causes': {
    heading: 'Document the colour before it changes',
    body: 'Colour is hard to describe to a doctor from memory. A dated photo log gives you something concrete to show.',
  },
  'high-protein-diet-constipation': {
    heading: 'Check whether your diet shift is the cause',
    body: 'Log Bristol type through a diet change and you will see within a week whether protein or fiber is the real variable.',
  },
  'what-causes-floating-stool': {
    heading: 'Is it every time, or just occasionally?',
    body: 'Floating stool matters mainly when it persists. Log it and find out whether this is a pattern or a one-off.',
  },
  'fermented-foods-vs-probiotic-supplements': {
    heading: 'Find out which one works for you',
    body: 'The only honest test is your own gut. Track Bristol type and regularity across a few weeks of each.',
  },
  'fiber-and-stool-consistency': {
    heading: 'See your fiber changes in the data',
    body: 'Consistency responds to fiber within days. Log each entry and watch your Bristol distribution shift.',
  },
  'yellow-stool-causes': {
    heading: 'Track the colour over a week',
    body: 'One yellow stool means little; a run of them means something. A dated log tells you which one you have.',
  },
};

export const hasMidArticleCta = (slug: string): boolean => slug in MID_ARTICLE_CTA;
