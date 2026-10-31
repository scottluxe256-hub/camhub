import { useState, useEffect, useCallback } from 'react';

export function useScroll(sectionIds: string[], offset: number = 85) {
  const [activeSection, setActiveSection] = useState('hero');

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + offset + 10;

      let current = 'hero';
      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (element) {
          const { top } = element.getBoundingClientRect();
          const elementTop = top + window.scrollY;
          if (scrollPosition >= elementTop) {
            current = id;
          }
        }
      }
      
      if (window.scrollY < 50) {
        current = 'hero';
      }

      setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [sectionIds, offset]);

  const scrollToSection = useCallback((id: string) => {
    if (id === 'hero') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const element = document.getElementById(id);
    if (element) {
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, [offset]);

  return { activeSection, scrollToSection };
}
