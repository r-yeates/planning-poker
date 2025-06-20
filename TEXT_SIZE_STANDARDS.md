# Text Size Standards

This document defines the standardized text size hierarchy used throughout the Planning Poker application to ensure consistency and accessibility.

## Text Size Hierarchy

### 1. Page Titles
- **Class**: `text-2xl`
- **Size**: 24px
- **Usage**: Main page titles, modal headers
- **Examples**: "🃏 Planning Poker", "Create New Room", "Join Existing Room"

### 2. Section Headings  
- **Class**: `text-base`
- **Size**: 16px
- **Usage**: Section headers, card headers, component titles
- **Examples**: "Room Settings", "Participants", "Current Ticket", "Average Vote"

### 3. Body Text / Default
- **Class**: `text-sm`
- **Size**: 14px  
- **Usage**: Primary content, button labels, form labels, participant names
- **Examples**: Button text, form labels, setting descriptions, participant status

### 4. Secondary Text / Meta Information
- **Class**: `text-xs`
- **Size**: 12px
- **Usage**: Helper text, version numbers, small status indicators, keyboard shortcuts
- **Examples**: "Scale can be changed after votes are revealed", version info, keyboard shortcut hints

### 5. Special Cases
- **Large Values**: `text-xl` (20px) for important numerical values (votes, percentages)
- **Voting Cards**: `text-xl` (20px) for card values to ensure readability
- **Icons with Text**: Keep text proportional to icon size

## Accessibility Guidelines

- Never use text smaller than `text-xs` (12px) for any readable content
- Ensure sufficient color contrast for all text sizes
- Maintain proper font weights to improve readability
- Use semantic HTML elements with appropriate text sizes

## Implementation Notes

- All components should follow this hierarchy
- Avoid arbitrary text sizes - stick to the defined classes
- When in doubt, use `text-sm` for body content
- Test readability on different screen sizes and devices

## Component-Specific Standards

### AdminPanel
- Header: `text-base` 
- Setting labels: `text-sm`
- Helper text: `text-xs`

### ParticipantCard
- Name: `text-base`
- Status/Vote: `text-sm` 
- Badges: `text-xs`

### VotingCards
- Card values: `text-xl`
- Instructions: `text-sm`
- Helper text: `text-xs`

### Room Page
- Page title: `text-2xl`
- Section headers: `text-base`
- Content: `text-sm`
- Meta info: `text-xs`
