'use client';

import { useState, useEffect } from 'react';

interface CustomTextTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function CustomTextTransition({ 
  children, 
  className = '' 
}: CustomTextTransitionProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [currentText, setCurrentText] = useState(children);

  useEffect(() => {
    if (currentText !== children) {
      // Fade out
      setIsVisible(false);
      
      // After fade out, change text and fade in
      const timeout = setTimeout(() => {
        setCurrentText(children);
        setIsVisible(true);
      }, 150); // Half of the transition duration
      
      return () => clearTimeout(timeout);
    }
  }, [children, currentText]);

  return (
    <div 
      className={`transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'} ${className}`}
    >
      {currentText}
    </div>
  );
}
