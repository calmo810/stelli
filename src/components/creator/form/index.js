import '@/styles/creatorForm.css';
import YouSection from './YouSection';
import WorkSection from './WorkSection';
import PortfolioSection from './PortfolioSection';
import ContactSection from './ContactSection';
import AboutSection from './AboutSection';
import LookSection from './LookSection';
import PackagesSection from './PackagesSection';

/**
 * The body of each profile section (see SECTIONS in lib/creatorProfile.js).
 * The application renders four of these in a row; the portal renders one.
 */
export const SECTION_BODIES = {
  you: YouSection,
  work: WorkSection,
  portfolio: PortfolioSection,
  contact: ContactSection,
  about: AboutSection,
  look: LookSection,
  packages: PackagesSection,
};
