'use client';

import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface ConfettiCelebrationProps {
  trigger: boolean;
  onComplete?: () => void;
}

export default function ConfettiCelebration({ trigger, onComplete }: ConfettiCelebrationProps) {
  useEffect(() => {
    if (!trigger) return;

    const fireConfetti = () => {
      // First burst from the bottom left edge
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 1 },
        colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
      });

      // Second burst from the bottom right edge
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 1 },
        colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
      });

      // Central burst with card-like shapes from bottom center
      setTimeout(() => {
        confetti({
          particleCount: 30,
          spread: 80,
          origin: { x: 0.5, y: 1 },
          shapes: ['square'],
          colors: ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444']
        });
      }, 200);

      // Final sparkle burst from bottom center with wider spread
      setTimeout(() => {
        confetti({
          particleCount: 25,
          spread: 120,
          startVelocity: 45,
          origin: { x: 0.5, y: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347', '#98FB98', '#87CEEB']
        });
      }, 400);
    };

    fireConfetti();
    
    // Call onComplete after all confetti animations
    if (onComplete) {
      setTimeout(onComplete, 1000);
    }
  }, [trigger, onComplete]);

  return null; // This component doesn't render anything
}

// Utility function for custom confetti effects
export const triggerVoteRevealConfetti = () => {
  // Planning poker themed confetti with card-like particles
  const colors = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  
  // Multiple bursts to create a celebration effect across full width
  const burst1 = confetti({
    particleCount: 80,
    angle: 60,
    spread: 55,
    origin: { x: 0, y: 1 },
    colors: colors,
    shapes: ['square', 'circle'],
    scalar: 1.2
  });

  const burst2 = confetti({
    particleCount: 80,
    angle: 120,
    spread: 55,
    origin: { x: 1, y: 1 },
    colors: colors,
    shapes: ['square', 'circle'],
    scalar: 1.2
  });

  // Center burst with planning poker card numbers from bottom
  setTimeout(() => {
    confetti({
      particleCount: 50,
      spread: 90,
      origin: { x: 0.5, y: 1 },
      colors: colors,
      shapes: ['square'],
      scalar: 0.8
    });
  }, 150);

  // Additional side bursts for fuller coverage
  setTimeout(() => {
    confetti({
      particleCount: 40,
      angle: 75,
      spread: 45,
      origin: { x: 0.25, y: 1 },
      colors: colors,
      shapes: ['circle'],
      scalar: 0.9
    });
    
    confetti({
      particleCount: 40,
      angle: 105,
      spread: 45,
      origin: { x: 0.75, y: 1 },
      colors: colors,
      shapes: ['circle'],
      scalar: 0.9
    });
  }, 200);

  // Final celebratory burst from bottom center with maximum spread
  setTimeout(() => {
    confetti({
      particleCount: 40,
      spread: 140,
      startVelocity: 35,
      origin: { x: 0.5, y: 1 },
      colors: ['#FFD700', '#FFA500', '#FF6347'],
      scalar: 0.6
    });
  }, 300);

  return Promise.all([burst1, burst2]);
};
