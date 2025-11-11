import { useCallback } from 'react';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';

// Register Flip plugin
if (typeof window !== 'undefined') {
  gsap.registerPlugin(Flip);
}

export interface FlipAnimationOptions {
  duration?: number;
  ease?: string;
  scale?: boolean;
  onComplete?: () => void;
}

/**
 * Custom hook for GSAP Flip animations
 * Handles the "First, Last, Invert, Play" animation pattern
 */
export const useCardFlip = () => {
  /**
   * Animates an element expanding from a small card to full screen
   * @param element - The element to animate
   * @param options - Animation configuration options
   */
  const animateExpand = useCallback((
    element: HTMLElement | null,
    options: FlipAnimationOptions = {}
  ) => {
    if (!element || typeof window === 'undefined') return;

    const {
      duration = 0.8,
      ease = 'power2.inOut',
      scale = true,
      onComplete
    } = options;

    // Get the current state (FIRST)
    const state = Flip.getState(element);

    // Add full-screen class (LAST)
    element.classList.add('flip-expanded');

    // Animate from FIRST to LAST (INVERT & PLAY)
    Flip.from(state, {
      duration,
      ease,
      scale,
      absolute: true,
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }, []);

  /**
   * Animates an element collapsing from full screen back to card
   * @param element - The element to animate
   * @param options - Animation configuration options
   */
  const animateCollapse = useCallback((
    element: HTMLElement | null,
    options: FlipAnimationOptions = {}
  ) => {
    if (!element || typeof window === 'undefined') return;

    const {
      duration = 0.8,
      ease = 'power2.inOut',
      scale = true,
      onComplete
    } = options;

    // Get the current state (FIRST)
    const state = Flip.getState(element);

    // Remove full-screen class (LAST)
    element.classList.remove('flip-expanded');

    // Animate from FIRST to LAST (INVERT & PLAY)
    Flip.from(state, {
      duration,
      ease,
      scale,
      absolute: true,
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }, []);

  /**
   * Animates transition between two elements (morphing effect)
   * @param fromElement - The starting element
   * @param toElement - The target element
   * @param options - Animation configuration options
   */
  const animateMorph = useCallback((
    fromElement: HTMLElement | null,
    toElement: HTMLElement | null,
    options: FlipAnimationOptions = {}
  ) => {
    if (!fromElement || !toElement || typeof window === 'undefined') return;

    const {
      duration = 0.8,
      ease = 'power2.inOut',
      scale = true,
      onComplete
    } = options;

    // Get the state of both elements
    const state = Flip.getState([fromElement, toElement]);

    // Hide from element and show to element
    fromElement.style.display = 'none';
    toElement.style.display = 'flex';

    // Animate the transition
    Flip.from(state, {
      duration,
      ease,
      scale,
      absolute: true,
      onComplete: () => {
        if (onComplete) onComplete();
      }
    });
  }, []);

  return {
    animateExpand,
    animateCollapse,
    animateMorph
  };
};
