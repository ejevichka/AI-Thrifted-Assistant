# Digs Hub - Expanding Card Animation Feature

## Overview

The Digs Hub is a modern, interactive interface that uses **GSAP Flip plugin** to create seamless "expanding card" animations. When users click on a category card, it smoothly morphs and expands to fill the entire screen, creating a magical transition that connects the card selection to the full experience.

## Features

### Three Dig Types

1. **Dig by Image** 🖼️
   - Upload a photo to find similar thrifted items
   - AI-powered visual recognition
   - Smart pattern and color matching

2. **Dig by Moodboard** 🎨
   - Create visual mood boards with multiple images
   - AI analyzes colors, patterns, and aesthetics
   - Combines multiple inspirations into cohesive recommendations

3. **Curated Digs** 👥
   - Explore collections curated by the community
   - Browse trending, recent, and popular collections
   - Discover hand-picked fashion finds from style experts

## Technical Architecture

### FLIP Animation (First, Last, Invert, Play)

The implementation uses GSAP's Flip plugin to create smooth, performant animations:

1. **First**: Capture the initial state of the card (position, size)
2. **Last**: Apply the final state (full-screen)
3. **Invert**: Calculate the difference between states
4. **Play**: Animate from First to Last

### File Structure

```
app/
├── components/
│   ├── DigsHub.tsx                 # Main hub component with animation logic
│   ├── DigCategoryCard.tsx         # Individual category card component
│   ├── hooks/
│   │   └── useCardFlip.ts          # Custom GSAP Flip animation hook
│   └── screens/
│       ├── DigByImageScreen.tsx    # Image search screen
│       ├── DigByMoodboardScreen.tsx # Moodboard creation screen
│       └── CuratedDigsScreen.tsx   # Curated collections screen
├── styles/
│   └── digs-hub.css                # Styles for FLIP animations
├── digs/
│   └── page.tsx                    # Next.js page route
└── globals.css                      # Updated to import digs-hub.css
```

## Usage

### Accessing the Digs Hub

Navigate to `/digs` in your browser:

```
http://localhost:3000/digs
```

### User Flow

1. User sees three category cards on the main screen
2. User clicks on a category card
3. The card animates and expands to full screen
4. The full experience loads (upload image, create moodboard, or browse collections)
5. User clicks "Back" button
6. The screen collapses back to the original card position

### Keyboard Shortcuts

- **ESC**: Return to category selection from any expanded screen

## Component API

### DigsHub

Main component that orchestrates the expanding card animation.

```tsx
import { DigsHub } from '@/components/DigsHub';

<DigsHub />
```

### useCardFlip Hook

Custom hook providing GSAP Flip animation utilities.

```tsx
const { animateExpand, animateCollapse, animateMorph } = useCardFlip();

// Expand a card to full screen
animateExpand(element, {
  duration: 0.8,
  ease: 'power2.inOut',
  scale: true,
  onComplete: () => console.log('Animation complete')
});

// Collapse back to original size
animateCollapse(element, options);

// Morph between two elements
animateMorph(fromElement, toElement, options);
```

### DigCategoryCard

Reusable category card component.

```tsx
interface DigCategory {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  accentColor: string;
}

<DigCategoryCard
  category={category}
  onClick={handleCategoryClick}
  isActive={false}
/>
```

## Customization

### Adding New Dig Types

1. Create a new screen component in `app/components/screens/`:

```tsx
export const NewDigScreen: React.FC<DigScreenProps> = ({
  onBack,
  gradient,
  accentColor
}) => {
  return (
    <div className="dig-screen-expanded" style={{ background: gradient }}>
      {/* Your screen content */}
    </div>
  );
};
```

2. Add the category to `DigsHub.tsx`:

```tsx
const categories: DigCategory[] = [
  // ... existing categories
  {
    id: 'new-dig-type',
    title: 'New Dig Type',
    description: 'Description of the new dig type',
    icon: YourIcon,
    gradient: 'linear-gradient(135deg, #color1 0%, #color2 100%)',
    accentColor: '#color1'
  }
];
```

3. Add the screen rendering logic:

```tsx
{activeCategory.id === 'new-dig-type' && (
  <NewDigScreen
    onBack={handleBack}
    gradient={activeCategory.gradient}
    accentColor={activeCategory.accentColor}
  />
)}
```

### Customizing Animation

Modify animation parameters in `DigsHub.tsx`:

```tsx
animateExpand(cardElement, {
  duration: 1.2,        // Slower animation
  ease: 'power3.out',   // Different easing
  scale: true,          // Enable scale animation
  onComplete: callback  // Callback function
});
```

### Styling

Edit `app/styles/digs-hub.css` to customize:

- Card dimensions
- Transition effects
- Responsive breakpoints
- Scrollbar styling

## Animation Performance

### Optimizations Applied

1. **GPU Acceleration**: Uses CSS transforms for smooth animations
2. **Will-change Property**: Pre-optimizes animated elements
3. **Backface Visibility**: Prevents flickering during animations
4. **Pointer Events**: Disables interactions during animation
5. **RAF (RequestAnimationFrame)**: GSAP automatically uses RAF for smooth 60fps

### Best Practices

- Keep card content lightweight
- Lazy-load images in expanded screens
- Use CSS containment for isolated components
- Minimize layout recalculations during animations

## Browser Compatibility

- **Chrome/Edge**: Full support
- **Firefox**: Full support
- **Safari**: Full support (iOS 12+)
- **Mobile**: Optimized for touch interactions

## Accessibility

- **Keyboard Navigation**: ESC key to close screens
- **Focus Management**: Proper focus trapping in expanded screens
- **Screen Readers**: ARIA labels on interactive elements
- **Reduced Motion**: Respects `prefers-reduced-motion` media query

## Future Enhancements

- [ ] Add shared element transitions for images
- [ ] Implement swipe gestures for mobile
- [ ] Add loading skeletons during transitions
- [ ] Create animation presets for different use cases
- [ ] Add page transition animations between digs
- [ ] Implement history API for browser back button support

## Dependencies

- **GSAP**: ^3.12.0 (Flip plugin included)
- **React**: ^18.0.0
- **Next.js**: ^14.0.0
- **Lucide React**: ^0.473.0 (icons)

## Troubleshooting

### Animation Not Working

1. Ensure GSAP is installed: `yarn add gsap`
2. Check that Flip plugin is registered in `useCardFlip.ts`
3. Verify CSS is imported in `globals.css`
4. Check browser console for errors

### Performance Issues

1. Reduce animation duration
2. Disable scale transformations
3. Minimize DOM nodes in expanded screens
4. Use CSS `contain: layout style paint`

### Layout Shifts

1. Ensure cards have fixed heights
2. Use `position: absolute` for overlays
3. Apply `transform-origin: center center`

## Credits

- **Animation Technique**: GSAP Flip Plugin
- **Design Inspiration**: Modern web animations
- **Icons**: Lucide React

## License

Part of the AI Thrifted Assistant project.
