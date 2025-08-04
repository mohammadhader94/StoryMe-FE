# Automata Control Center - Style Guide

This document outlines the core design tokens used in the application based on the `globals.css` theme setup.

## Colors

Colors are defined using HSL values in CSS variables.

### Primary Palette
- **Background**: `hsl(var(--background))` (#F7F9FC) - Very Light Gray
- **Foreground**: `hsl(var(--foreground))` (#212936) - Dark Gray (for text)
- **Card Background**: `hsl(var(--card))` (#FFFFFF) - Soft White
- **Card Foreground**: `hsl(var(--card-foreground))` (#212936) - Dark Gray (text on cards)

### Accent & Interaction Colors
- **Primary**: `hsl(var(--primary))` (#1F3B73) - Deep Blue (buttons, primary actions)
- **Primary Foreground**: `hsl(var(--primary-foreground))` (#FFFFFF) - White (text on primary buttons)
- **Accent**: `hsl(var(--accent))` (#5AA9E6) - Light Blue (links, highlights, focus rings)
- **Accent Foreground**: `hsl(var(--accent-foreground))` (#212936) - Dark Gray (text on accent backgrounds, if needed)

### Secondary & Muted Colors
- **Secondary**: `hsl(var(--secondary))` - Light Gray (secondary buttons, less important elements)
- **Secondary Foreground**: `hsl(var(--secondary-foreground))` - Dark Gray
- **Muted**: `hsl(var(--muted))` - Lighter Gray (muted backgrounds, borders)
- **Muted Foreground**: `hsl(var(--muted-foreground))` - Gray (muted text, descriptions)

### Other
- **Border**: `hsl(var(--border))` - Gray border color
- **Input**: `hsl(var(--input))` - Input field border color
- **Ring**: `hsl(var(--ring))` - Focus ring color (uses Accent)
- **Destructive**: `hsl(var(--destructive))` - Red (error states, destructive actions)
- **Destructive Foreground**: `hsl(var(--destructive-foreground))` - White (text on destructive elements)

## Typography

Defined via CSS variables in `layout.tsx` and applied in `globals.css`.

- **Headings** (`h1`-`h6`): `var(--font-poppins)`, sans-serif (Semi-Bold recommended)
- **Body Text**: `var(--font-inter)`, sans-serif (Regular recommended)

## Spacing & Radius

- **Border Radius**: `var(--radius)` (0.5rem / 8px) - Applied to buttons, cards, inputs etc. via ShadCN components.

## Shadows

- **Card Shadow**: `rgba(0, 0, 0, 0.05) 0px 4px 12px` (Applied via `.card` class in `globals.css`)
- **Button Shadow**: `shadow-md` (Tailwind utility)
- **Button Hover Shadow**: `hover:shadow-lg` (Tailwind utility)

## Components

Utilizes **ShadCN UI** components which inherit the theme colors and styles defined above. Key styled components include:
- **Button**: Rounded corners (`--radius`), primary color background, subtle shadow on hover (`.btn` class).
- **Card**: Soft white background, light shadow (`.card` class), rounded corners.
- **Input**: Standard input styling with themed border and focus ring.
- **Alert**: Styled for error messages (`variant="destructive"`).

Refer to `globals.css` for the full CSS variable definitions.
