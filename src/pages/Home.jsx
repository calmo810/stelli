import React from 'react';
import HeroVideo from '@/components/home/HeroVideo';
import TwoDoors from '@/components/home/TwoDoors';
import MeetCreators from '@/components/home/MeetCreators';
import CaseStudy from '@/components/home/CaseStudy';
import FaqButton from '@/components/home/FaqButton';
import StarSprinkle from '@/components/home/StarSprinkle';
import Reveal from '@/components/shared/Reveal';

export default function Home() {
  return (
    <div className="relative bg-ink">
      <div className="relative">
        <StarSprinkle />
        <HeroVideo />
      </div>
      <Reveal><TwoDoors /></Reveal>
      <Reveal><MeetCreators /></Reveal>
      <Reveal><CaseStudy /></Reveal>
      <Reveal><FaqButton /></Reveal>
    </div>
  );
}