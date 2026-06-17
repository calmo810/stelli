import React from 'react';
import HeroSection from '../components/home/HeroSection';
import MarqueeStrip from '../components/home/MarqueeStrip';
import EditorialProblem from '../components/home/EditorialProblem';
import EditorialMoments from '../components/home/EditorialMoments';
import FeaturedWork from '../components/home/FeaturedWork';
import GroupBookingFeature from '../components/home/GroupBookingFeature';
import Testimonials from '../components/home/Testimonials';
import CTASection from '../components/home/CTASection';
import PhoneMockup from '../components/home/PhoneMockup';

export default function Home() {
  return (
    <div>
      <HeroSection />
      <MarqueeStrip />
      <PhoneMockup />
      <EditorialProblem />
      <EditorialMoments />
      <FeaturedWork />
      <GroupBookingFeature />
      <Testimonials />
      <CTASection />
    </div>
  );
}