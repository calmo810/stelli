import StepYou from './StepYou';
import StepWork from './StepWork';
import StepOneLiner from './StepOneLiner';
import StepPortfolio from './StepPortfolio';
import StepPricing from './StepPricing';
import StepBio from './StepBio';
import StepKit from './StepKit';
import StepPrompt from './StepPrompt';
import StepDont from './StepDont';
import StepLook from './StepLook';
import StepPrivate from './StepPrivate';

/** Which body each step key renders. */
export const STEP_BODIES = {
  you: StepYou,
  work: StepWork,
  pf: StepPortfolio,
  priv: StepPrivate,
  line: StepOneLiner,
  bio: StepBio,
  kit: StepKit,
  prompt: StepPrompt,
  dont: StepDont,
  look: StepLook,
  price: StepPricing,
};
