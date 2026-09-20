import React from 'react';
import HeroVideo from '@/components/home/HeroVideo';
import TwoDoors from '@/components/home/TwoDoors';
import TopRatedRail from '@/components/home/TopRatedRail';
import HowItWorks from '@/components/home/HowItWorks';
import Formats from '@/components/home/Formats';
import FaqButton from '@/components/home/FaqButton';

export default function Home() {
  return (
    <div className="bg-ink">
      <HeroVideo />
      <TwoDoors />
      <TopRatedRail />
      <HowItWorks />
      <Formats />
      <FaqButton />
    </div>
  );
}