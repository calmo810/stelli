import React from 'react';
import HeroSection from '../components/home/HeroSection';
import MarqueeStrip from '../components/home/MarqueeStrip';
import HowItWorks from '../components/home/HowItWorks';
import FeaturedWork from '../components/home/FeaturedWork';
import Testimonials from '../components/home/Testimonials';
import CTASection from '../components/home/CTASection';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <MarqueeStrip />
      <HowItWorks />
      <FeaturedWork />
      <Testimonials />
      <CTASection />
    </div>
  );
}