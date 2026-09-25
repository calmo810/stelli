import React from 'react';
import HeroVideo from '@/components/home/HeroVideo';
import TwoDoors from '@/components/home/TwoDoors';
import TopRatedRail from '@/components/home/TopRatedRail';
import HowItWorks from '@/components/home/HowItWorks';
import FaqButton from '@/components/home/FaqButton';
import StarSprinkle from '@/components/home/StarSprinkle';

export default function Home() {
  return (
    <div className="relative bg-ink">
      <div className="relative">
        <StarSprinkle />
        <HeroVideo />
      </div>
      <TwoDoors />
      <TopRatedRail />
      <HowItWorks />
      <FaqButton />
    </div>
  );
}