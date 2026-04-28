import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import PublicLayout from '../components/public/PublicLayout';
import HeroSection from '../components/home/HeroSection';
import BannerSection from '../components/home/BannerSection';
import FeaturesSection from '../components/home/FeaturesSection';
import GallerySection from '../components/home/GallerySection';
import StatisticsSection from '../components/home/StatisticsSection';
import HomeLoginOverlay from '../components/home/HomeLoginOverlay';
import HomeForgotPasswordOverlay from '../components/home/HomeForgotPasswordOverlay';

export default function HomePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [overlayMode, setOverlayMode] = useState(null);

  /* Open login/forgot overlays from query params for deep-link compatibility. */
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('forgot') === '1') {
      setOverlayMode('forgot');
      return;
    }
    if (params.get('login') === '1') {
      setOverlayMode('login');
      return;
    }
    setOverlayMode(null);
  }, [location.search]);

  /* Custom events allow deeply nested components to open overlays without prop drilling. */
  useEffect(() => {
    const openLogin = () => setOverlayMode('login');
    const openForgot = () => setOverlayMode('forgot');
    window.addEventListener('home:openLogin', openLogin);
    window.addEventListener('home:openForgotPassword', openForgot);
    return () => {
      window.removeEventListener('home:openLogin', openLogin);
      window.removeEventListener('home:openForgotPassword', openForgot);
    };
  }, []);

  const closeOverlay = () => {
    setOverlayMode(null);
    if (location.search.includes('login=1') || location.search.includes('forgot=1')) {
      navigate('/home', { replace: true });
    }
  };

  return (
    <PublicLayout>
      <HeroSection />
      <BannerSection />
      <FeaturesSection />
      <GallerySection />
      <StatisticsSection />

      <HomeLoginOverlay open={overlayMode === 'login'} onClose={closeOverlay} />
      <HomeForgotPasswordOverlay open={overlayMode === 'forgot'} onClose={closeOverlay} />
    </PublicLayout>
  );
}
