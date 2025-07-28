import React from 'react';
import Navbar from '@/components/Layout/Navbar';
import Footer from '@/components/Layout/Footer';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const About = () => {
  const { t } = useTranslation();

  // Restaurant history milestones
  const timeline = [
    {
      year: '2010',
      title: t('about_timeline1_title'),
      description: t('about_timeline1_desc')
    },
    {
      year: '2013',
      title: t('about_timeline2_title'),
      description: t('about_timeline2_desc')
    },
    {
      year: '2016',
      title: t('about_timeline3_title'),
      description: t('about_timeline3_desc')
    },
    {
      year: '2019',
      title: t('about_timeline4_title'),
      description: t('about_timeline4_desc')
    },
    {
      year: '2022',
      title: t('about_timeline5_title'),
      description: t('about_timeline5_desc')
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <Navbar />
      
      {/* Page Header */}
      <div className="pt-32 pb-12 md:pt-40 md:pb-20 bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-display font-bold gradient-text mb-4">
              {t('about_title')}
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-400 max-w-3xl mx-auto">
              {t('about_subtitle')}
            </p>
          </div>
        </div>
      </div>
      
      {/* About Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24">
        {/* Introduction */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div className="glass-card p-8 animate-fade-in-up">
            <h2 className="text-3xl font-display font-bold mb-6 text-black dark:text-white">{t('about_experience_title')}</h2>
            <p className="text-gray-800 dark:text-gray-300 leading-relaxed mb-6">
              {t('about_experience_p1')}
            </p>
            <p className="text-gray-800 dark:text-gray-300 leading-relaxed mb-6">
              {t('about_experience_p2')}
            </p>
            <p className="text-gray-800 dark:text-gray-300 leading-relaxed">
              {t('about_experience_p3')}
            </p>
          </div>
          
          <div className="glass-card overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Chef_Anton_Mosimann_OBE_DL.jpg/1200px-Chef_Anton_Mosimann_OBE_DL.jpg" 
              alt="Portrait of Chef Gordon Ramsay" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Mission & Values */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-6">
              {t('about_mission_title')}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="text-2xl font-display font-bold mb-4 text-yellow-400">{t('about_vision_title')}</h3>
              <p className="text-gray-800 dark:text-gray-300 leading-relaxed">
                {t('about_vision_text')}
              </p>
            </div>
            
            <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-2xl font-display font-bold mb-4 text-yellow-400">{t('about_mission_subtitle')}</h3>
              <p className="text-gray-800 dark:text-gray-300 leading-relaxed">
                {t('about_mission_text')}
              </p>
            </div>
            
            <div className="glass-card p-8 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
              <h3 className="text-2xl font-display font-bold mb-4 text-yellow-400">{t('about_values_title')}</h3>
              <ul className="text-gray-800 dark:text-gray-300 space-y-2">
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  {t('about_value1')}
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  {t('about_value2')}
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  {t('about_value3')}
                </li>
                <li className="flex items-start">
                  <span className="text-yellow-400 mr-2">•</span>
                  {t('about_value4')}
                </li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Timeline */}
        <div className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-display font-bold gradient-text mb-6">
              {t('about_journey_title')}
            </h2>
          </div>
          
          <div className="relative">
            {/* Timeline center line */}
            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-gray-300 dark:bg-white/10"></div>
            
            {/* Timeline items */}
            <div className="space-y-16">
              {timeline.map((item, index) => (
                <div 
                  key={index}
                  className={`relative flex items-center ${
                    index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'
                  } animate-fade-in-up`}
                  style={{ animationDelay: `${0.1 * index}s` }}
                >
                  <div className="w-1/2"></div>
                  
                  {/* Timeline point */}
                  <div className="absolute left-1/2 transform -translate-x-1/2 w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center z-10">
                    <span className="text-slate-900 font-bold">{item.year}</span>
                  </div>
                  
                  {/* Content */}
                  <div className={`w-1/2 glass-card p-6 ${
                    index % 2 === 0 ? 'text-right pr-8' : 'text-left pl-8'
                  }`}>
                    <h3 className="text-xl font-display font-bold mb-2 text-black dark:text-white">{item.title}</h3>
                    <p className="text-gray-800 dark:text-gray-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* CTA */}
        <div className="glass-card p-12 text-center animate-fade-in-up">
          <h2 className="text-3xl font-display font-bold mb-6 text-black dark:text-white">{t('about_cta_title')}</h2>
          <p className="text-gray-800 dark:text-gray-300 max-w-3xl mx-auto mb-8">
            {t('about_cta_text')}
          </p>
          <Button asChild className="bg-gradient-to-r from-yellow-400 to-amber-500 text-slate-900 hover:from-yellow-500 hover:to-amber-600 font-semibold px-8 py-6 h-auto text-lg">
            <Link to="/reservations">{t('about_cta_button')}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default About;
