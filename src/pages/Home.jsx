import React from 'react';
import HeroVideo from '@/components/home/HeroVideo';
import BornTo from '@/components/home/BornTo';
import TwoDoors from '@/components/home/TwoDoors';
import TopRatedRail from '@/components/home/TopRatedRail';
import HowItWorks from '@/components/home/HowItWorks';
import FaqButton from '@/components/home/FaqButton';

export default function Home() {
  return (
    <div className="bg-ink">
      <HeroVideo />
      <BornTo />
      <TwoDoors />
      <TopRatedRail />
      <HowItWorks />
      <FaqButton />
    </div>
  );
}