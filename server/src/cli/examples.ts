// src/cli/examples.ts
// Purpose: Store default test examples

import { IArticleMetadata } from "@utils/types";

/**
 * Default example article for testing
 * Contains multiple biases and fallacies for demonstration
 */
export const DEFAULT_EXAMPLE_ARTICLE = `
Breaking News: Economy in Shambles Under Current Administration

This proves what I've been saying all along - the economy is failing under this administration's disastrous policies. Anyone could have seen this coming, but the liberal media refuses to report the truth.

Experts we trust have confirmed that the current approach is destroying jobs and hurting American families. All the signs were there, and I knew this would happen from day one.


We've already invested too much in these failed policies to give up now, according to government officials. But critics say this is just throwing good money after bad.

Looking back, it's obvious that this was inevitable. The writing was on the wall for anyone paying attention. This reminds me of the economic crisis of 2008 - history repeating itself.

You're either with us in fighting for economic freedom, or you're against prosperity for all Americans. There's no middle ground on this issue.
`.trim();

export const SECOND_DEFAULT_EXAMPLE_ARTICLE = `
The Gaza cease-fire was only days old when Hamas made it clear it had no intention of disarming, giving up power or following the letter or the spirit of the international peace plan.

Indeed, the terrorists seem keen to pick up where they left off, attacking Israelis — troops if civilians aren’t available — and re-establishing dominance over the people of Gaza.

First of all, Hamas didn’t return the bodies of all the hostages it murdered, one key of the peace plan’s very first step. Then, less than a week after the release of the last living hostages, Hamas fighters outside Rafah fired on Israeli soldiers across the Yellow Line, which marks the portion of Gaza under military control, killing two.

Israel responded by targeting Hamas tunnel systems and briefly closing border crossings into Gaza.


 The usual suspects in the West howl that Israel had already broken the cease-fire “dozens” of times and seemed eager to proclaim that the peace plan — which they didn’t like in the first place — has failed.

The “pro-Palestine” crowd must be the first peace movement ever to pray for war to resume.

In the next phase of the peace plan, Hamas’ combatants are supposed to lay down their arms and exit Gaza — but that’s not happening anytime soon.


At least, not voluntarily — and who’s going to make them?

Images of Hamas terrorists publicly executing local Palestinian “collaborators” did not emerge by accident: The brutal Islamists staged this savagery to let everyone — inside as well as outside Gaza — know that they mean business.
Anyone who accepted food aid outside of Hamas-approved channels counts as a collaborator, as do members of families that have historically challenged the terrorists’ rule.

Meanwhile, Hamas has re-opened detention and “interrogation” facilities at Al-Shifa and other Gaza hospitals.

It’s telling the world, Yes, we are the bad guys. What are you going to do about it?

President Donald Trump has said Hamas better behave or “we’ll take care of it.” But he’s not going to send US troops to pacify the territory.

Perhaps the Muslim nations that signed on to the peace plan will deal with Hamas, though what that force would look like is a mystery, with no historical precedent.

Waging war with unprecedented caution for civilian casualties and world opinion, the IDF in two years failed to wipe out the terror group that conducted the Oct. 7 attack.

Yet the Jewish State has redeemed the hostages, defanged Hamas’ ability to strike outside Gaza and established a protective buffer zone.

Israel has every right to finish the job if Hamas won’t go, but it has no duty to save the poor people of Gaza from the terrorists’ rule.

If “pro-Palestine” folks won’t save them, how about some of the governments that just recognized that Palestinian state?
`.trim();

/**
 * Default metadata for the example article
 */
export const DEFAULT_METADATA: IArticleMetadata = {
  title: "Economy in Shambles Under Current Administration",
  source: "Example News Network",
  author: "Test Author",
  publishDate: new Date().toISOString(),
};

export const SECOND_DEFAULT_METADATA: IArticleMetadata = {
  title:
    "The ‘pro-Palestine’ crowd must be the first peace movement ever to pray for war to resume",
  source: "New York Post Opinion",
  author: "post editorial board",
  publishDate: "oct 20, 2025",
};

/**
 * Additional example articles for different use cases
 */
export const EXAMPLES = {
  /**
   * Example with confirmation bias
   */
  CONFIRMATION_BIAS: `
    I knew this study would prove my point. The research validates exactly what I've been saying all along about climate change. The evidence confirms my beliefs, and anyone who disagrees is just ignoring the facts.
  `.trim(),

  /**
   * Example with ad hominem fallacy
   */
  AD_HOMINEM: `
    You're too young to understand these complex issues. She's clearly biased because she works for that company. He's just a conspiracy theorist, so we can dismiss his arguments entirely.
  `.trim(),

  /**
   * Example with multiple fallacies
   */
  MULTIPLE_FALLACIES: `
    Either we implement this policy immediately, or our economy will collapse. The old methods were so much better - look at all these successful people who used them. I've invested too much time in this approach to change now.
  `.trim(),
};
