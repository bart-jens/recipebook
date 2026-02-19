# Cooking Mode

A focused, kitchen-optimized step-by-step instruction view. Designed for messy hands, bright kitchens, and the need to glance at the next step without scrolling through an entire recipe page.

---

## ADDED Requirements

### Requirement: Cooking mode entry point
The recipe detail page SHALL display a "Start Cooking" button between the ingredients section and the instructions section. The button SHALL only appear when the recipe has instructions (at least one step). The button SHALL be prominent and visually distinct from other actions.

#### Scenario: Recipe with instructions
- **WHEN** user views a recipe that has instructions
- **THEN** a "Start Cooking" button SHALL be displayed below the ingredients

#### Scenario: Recipe without instructions
- **WHEN** user views a recipe with no instructions
- **THEN** the "Start Cooking" button SHALL NOT be displayed

### Requirement: Step-by-step navigation
Cooking mode SHALL display one instruction step at a time in large, readable text. The user SHALL be able to navigate forward and backward between steps. The first step SHALL be shown when cooking mode opens.

#### Scenario: View first step
- **WHEN** user enters cooking mode on a recipe with 5 steps
- **THEN** step 1 SHALL be displayed with large text

#### Scenario: Navigate to next step
- **WHEN** user is on step 2 of 5
- **AND** user navigates forward
- **THEN** step 3 SHALL be displayed

#### Scenario: Navigate to previous step
- **WHEN** user is on step 3 of 5
- **AND** user navigates backward
- **THEN** step 2 SHALL be displayed

#### Scenario: At last step
- **WHEN** user is on step 5 of 5
- **AND** user navigates forward
- **THEN** a completion screen SHALL be displayed with a "Done" action

#### Scenario: At first step
- **WHEN** user is on step 1
- **AND** user navigates backward
- **THEN** step 1 SHALL remain displayed (no wrap-around)

### Requirement: Step navigation controls (mobile)
On mobile, the user SHALL be able to navigate steps by: (1) swiping left/right on the step content, (2) tapping large tap targets on the left/right edges of the screen (minimum 60pt wide). Both gestures SHALL advance or go back one step.

#### Scenario: Swipe to advance
- **WHEN** user swipes left on the step content
- **THEN** the next step SHALL be displayed with a slide transition

#### Scenario: Tap right edge to advance
- **WHEN** user taps the right 60pt of the screen
- **THEN** the next step SHALL be displayed

### Requirement: Step navigation controls (web)
On web, the user SHALL be able to navigate steps by: (1) clicking left/right arrow buttons, (2) pressing left/right arrow keys on the keyboard, (3) clicking/tapping the step content area left/right halves. Escape key SHALL exit cooking mode.

#### Scenario: Arrow key navigation
- **WHEN** user presses the right arrow key
- **THEN** the next step SHALL be displayed

#### Scenario: Escape to exit
- **WHEN** user presses the Escape key
- **THEN** cooking mode SHALL close and return to recipe detail

### Requirement: Step progress indicator
Cooking mode SHALL display a progress indicator showing the current step number and total steps. The indicator SHALL be visible at all times without obscuring the step content. Format: "Step N of M" or a progress bar.

#### Scenario: Progress display
- **WHEN** user is on step 3 of 7
- **THEN** the indicator SHALL show "3 / 7" or equivalent visual

### Requirement: Ingredient reference
While in cooking mode, the user SHALL be able to view the full ingredient list without leaving cooking mode. The ingredient list SHALL show all ingredients with quantities and units.

#### Scenario: View ingredients on mobile
- **WHEN** user taps an "Ingredients" button or swipes up from the bottom
- **THEN** a bottom sheet SHALL slide up showing all ingredients

#### Scenario: View ingredients on web
- **WHEN** cooking mode is active on a wide screen (desktop)
- **THEN** ingredients SHALL be displayed in a persistent sidebar

#### Scenario: View ingredients on web (narrow)
- **WHEN** cooking mode is active on a narrow screen (mobile web)
- **AND** user clicks the "Ingredients" button
- **THEN** a modal or overlay SHALL show the ingredient list

### Requirement: Keep screen awake
While cooking mode is active, the device screen SHALL NOT dim or lock automatically. On mobile, this SHALL use the `expo-keep-awake` API. On web, this SHALL use the Screen Wake Lock API when available. When cooking mode is exited, normal screen behavior SHALL resume.

#### Scenario: Screen stays on during cooking
- **WHEN** cooking mode is active
- **AND** 10 minutes pass without user interaction
- **THEN** the screen SHALL remain on and visible

#### Scenario: Screen behavior restored on exit
- **WHEN** user exits cooking mode
- **THEN** normal screen dimming/locking behavior SHALL resume

### Requirement: Timer detection
Cooking mode SHALL scan each step's text for time-related patterns (e.g. "25 minutes", "10 min", "1 hour"). When a time is detected, a timer button SHALL appear on that step. Tapping the timer button SHALL start a countdown for the detected duration.

#### Scenario: Time mention detected
- **GIVEN** step 3 says "Bake for 25 minutes at 180C"
- **WHEN** user views step 3 in cooking mode
- **THEN** a "25 min" timer button SHALL be displayed

#### Scenario: Start timer
- **WHEN** user taps the timer button for "25 min"
- **THEN** a countdown timer SHALL start from 25:00

#### Scenario: Timer completion (mobile)
- **WHEN** the timer reaches 0:00
- **THEN** a local notification SHALL alert the user
- **AND** haptic feedback SHALL be triggered

#### Scenario: Timer completion (web)
- **WHEN** the timer reaches 0:00
- **THEN** an audible alert SHALL play
- **AND** the timer display SHALL flash or animate

#### Scenario: No time mention
- **GIVEN** step 2 says "Mix the dry ingredients together"
- **WHEN** user views step 2
- **THEN** no timer button SHALL be shown

#### Scenario: Multiple timers
- **WHEN** user starts a timer on step 3 and navigates to step 4
- **THEN** the step 3 timer SHALL continue running
- **AND** a small timer indicator SHALL be visible on all steps

### Requirement: Completion screen
When the user advances past the last step, a completion screen SHALL be shown. The screen SHALL congratulate the user and offer: (1) exit cooking mode, (2) log "Cooked It" if not already logged for this recipe today. On mobile, exiting SHALL trigger success haptic feedback.

#### Scenario: Complete all steps
- **WHEN** user advances past the final step
- **THEN** the completion screen SHALL be shown with "Done" and "Cooked It" options

#### Scenario: Log cook from completion
- **WHEN** user taps "Cooked It" on the completion screen
- **THEN** a cook log entry SHALL be created for today
- **AND** cooking mode SHALL close

### Requirement: Exit cooking mode
The user SHALL be able to exit cooking mode at any time. On mobile, a close/X button SHALL be visible in the top area. On web, an "Exit" button and the Escape key SHALL close cooking mode. Exiting SHALL return to the recipe detail view.

#### Scenario: Close button on mobile
- **WHEN** user taps the X button in cooking mode
- **THEN** cooking mode SHALL close and return to recipe detail

#### Scenario: Exit on web
- **WHEN** user clicks "Exit" or presses Escape
- **THEN** cooking mode SHALL close and return to recipe detail

### Requirement: Large text and kitchen readability
Step text in cooking mode SHALL use a minimum font size of 22pt (mobile) / 24px (web). Text SHALL have high contrast against the background. The layout SHALL have generous padding to avoid accidental taps on adjacent elements.

#### Scenario: Text readability
- **WHEN** cooking mode is active
- **THEN** the step text SHALL be at least 22pt on mobile and 24px on web
- **AND** contrast ratio SHALL meet WCAG AA standards (4.5:1 minimum)
