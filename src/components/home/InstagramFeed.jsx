import React from 'react';

// Elfsight's platform script (loaded in index.html) finds this node by class
// and fills it with the Instagram feed.
const APP_CLASS = 'elfsight-app-efe30f5a-1a48-4606-94ac-9716811a0f11';

/** The live Instagram feed, sat beside the closing question on the home page. */
export default function InstagramFeed() {
  return <div className={`${APP_CLASS} w-full`} data-elfsight-app-lazy />;
}