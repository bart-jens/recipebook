## ADDED Requirements

### Requirement: Duration detection in step text
The system SHALL parse step text to detect time durations. A `parseDuration(step: string): number | null` function SHALL return the total duration in minutes (as a decimal number) when a time reference is found, or null when no duration is present. Supported patterns: `"X minutes"`, `"X mins"`, `"X min"`, `"X hours"`, `"X hr"`, `"X h"`, `"X hours Y minutes"` compounds, and `"X to Y minutes"` ranges (use upper bound Y). Bare numbers without a time unit SHALL NOT be matched.

#### Scenario: Detects minutes
- **WHEN** `parseDuration("Simmer for 10 minutes")` is called
- **THEN** it SHALL return 10

#### Scenario: Detects hours
- **WHEN** `parseDuration("Bake for 1 hour")` is called
- **THEN** it SHALL return 60

#### Scenario: Detects compound duration
- **WHEN** `parseDuration("Cook for 1 hour 30 minutes")` is called
- **THEN** it SHALL return 90

#### Scenario: Detects range — returns upper bound
- **WHEN** `parseDuration("Simmer for 15 to 20 minutes")` is called
- **THEN** it SHALL return 20

#### Scenario: Returns null for steps without duration
- **WHEN** `parseDuration("Add salt and stir to combine")` is called
- **THEN** it SHALL return null

#### Scenario: Does not match bare numbers
- **WHEN** `parseDuration("Serves 4")` is called
- **THEN** it SHALL return null

### Requirement: Timer button on duration steps
In cooking mode, when the current step contains a parseable duration, a "Start timer" button SHALL be shown below the step text. If no duration is detected, no timer UI is shown. Tapping "Start timer" SHALL begin a countdown for the detected duration.

#### Scenario: Timer button appears on step with duration
- **WHEN** a user is on a cooking mode step with text "Simmer for 10 minutes"
- **THEN** a "Start timer — 10 min" button SHALL be visible below the step text

#### Scenario: No timer button on step without duration
- **WHEN** a user is on a cooking mode step with text "Add the garlic and stir"
- **THEN** no timer button SHALL be shown

#### Scenario: Tapping Start timer begins countdown
- **WHEN** a user taps "Start timer" on a step with a 10-minute duration
- **THEN** a countdown SHALL begin showing MM:SS format
- **AND** the "Start timer" button SHALL be replaced by the countdown display

### Requirement: Countdown display
While a timer is running, the current step SHALL show a prominent countdown in MM:SS format. The countdown color SHALL change to red (`colors.danger`) when under 30 seconds remain. A "Reset" button SHALL be available to cancel the timer and return to the "Start timer" button.

#### Scenario: Countdown counts down in real time
- **WHEN** a 10-minute timer is running
- **THEN** the display SHALL show the remaining time and decrement every second

#### Scenario: Countdown turns red under 30 seconds
- **WHEN** a timer has 29 seconds remaining
- **THEN** the countdown text color SHALL be `colors.danger`

#### Scenario: Reset cancels the timer
- **WHEN** a user taps "Reset" while a timer is running
- **THEN** the timer SHALL stop
- **AND** the "Start timer" button SHALL reappear

### Requirement: Timer alert on completion
When the countdown reaches zero, the app SHALL alert the user via vibration (haptic) and an audio chime. A visual "Time's up!" message SHALL replace the countdown display. The user SHALL be able to dismiss the alert by tapping a "Done" button.

#### Scenario: Timer completes with haptic and sound
- **WHEN** a cooking mode timer reaches zero
- **THEN** the device SHALL vibrate using `expo-haptics` (notification pattern)
- **AND** a short audio chime SHALL play via `expo-av`
- **AND** a "Time's up!" message SHALL be displayed

#### Scenario: User dismisses completion alert
- **WHEN** a timer has completed and the "Done" button is tapped
- **THEN** the timer state SHALL reset
- **AND** the "Start timer" button SHALL reappear

### Requirement: Timer persists across tab switch within cooking mode
The cooking mode timer SHALL continue running when the user switches from the Steps tab to the Ingredients tab. The countdown SHALL still be visible on the Steps tab when the user switches back.

#### Scenario: Timer survives tab switch
- **WHEN** a timer is running and the user switches to the Ingredients tab
- **THEN** the timer SHALL continue counting down
- **AND** when the user returns to the Steps tab, the countdown SHALL show the correct remaining time
