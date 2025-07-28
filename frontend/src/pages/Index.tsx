import React from 'react';
import Hero from '@/components/Home/Hero';
import FeaturedDishes from '@/components/Home/FeaturedDishes';
import Testimonials from '@/components/Home/Testimonials';
import AboutMini from '../components/Home/AboutMini';
import Location from '../components/Home/Location';

const Index = () => {
  return (
    <main>
      <Hero />
      <AboutMini />
      <FeaturedDishes />
      <Testimonials />
      <Location />
    </main>
  );
};

export default Index;
