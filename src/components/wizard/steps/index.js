import StepPhoto from './StepPhoto';
import StepName from './StepName';
import StepOneLiner from './StepOneLiner';
import StepWhere from './StepWhere';
import StepWhat from './StepWhat';
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
  photo: StepPhoto,
  name: StepName,
  line: StepOneLiner,
  where: StepWhere,
  what: StepWhat,
  pf: StepPortfolio,
  price: StepPricing,
  bio: StepBio,
  kit: StepKit,
  prompt: StepPrompt,
  dont: StepDont,
  look: StepLook,
  priv: StepPrivate,
};