## Why

The recipe detail screen works for browsing but not for cooking. In the kitchen with messy hands, you need large text, easy step navigation, and a screen that stays awake. Cooking mode is the feature that makes EefEats the app you reach for *while cooking* — not just when browsing. This is the core differentiator from recipe websites.

## What Changes

- **Cooking mode screen**: Full-screen step-by-step instruction view with large text, swipe/tap to navigate between steps
- **Keep screen awake**: Prevent screen dimming/locking while in cooking mode
- **Ingredient reference**: Persistent ingredient list accessible at any step (slide-up or side panel)
- **Step progress**: Visual indicator showing current step and total steps
- **Quick exit**: Easy way to return to the full recipe detail
- **Entry point**: "Start Cooking" button on recipe detail (both web and mobile)
- **Timer integration (mobile)**: Detect time mentions in steps ("bake for 25 minutes") and offer a quick-start timer

## Capabilities

### New Capabilities
- `cooking-mode`: Step-by-step cooking view with large text, screen-awake, step navigation, ingredient reference, and timer detection

### Modified Capabilities
(none)

## Impact

- **Web**: New cooking mode view/route, entry button on recipe detail
- **Mobile**: New cooking mode screen, keep-awake API, timer integration, entry button on recipe detail
- **No database changes**: All data already exists (recipe instructions, ingredients). Cooking mode is purely a presentation layer.
