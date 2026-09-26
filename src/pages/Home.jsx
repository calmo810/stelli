import React from 'react';
import HeroVideo from '@/components/home/HeroVideo';
import BornTo from '@/components/home/BornTo';
import TwoDoors from '@/components/home/TwoDoors';
import MeetCreators from '@/components/home/MeetCreators';
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
      <BornTo />
      <TwoDoors />
      <MeetCreators />
      <HowItWorks />
      <FaqButton />
    </div>
  );
}