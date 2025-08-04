# **App Name**: Automata Control Center

## Core Features:

- Login Card: A welcome card with fields for email and password, and a login button.
- Error Message: Display an error message on the card when the login fails. The message disappears when the user starts typing again.
- Firebase Authentication: Handle form submission and authentication using Firebase Auth.

## Style Guidelines:

- Primary color: Deep Blue #1F3B73.
- Accent color: Light Blue #5AA9E6 for interactive elements.
- Background color: Very Light Gray #F7F9FC to provide a clean backdrop.
- Center the login card on the screen for a balanced layout.
- Use a minimalistic gear icon with a lightning bolt inside for the logo placeholder.
- Subtle shadow animation on hover for buttons.

## Original User Request:
Objective:
Create the Login Page for the Automation Control App. At the same time, establish the global branding (design system) that will be consistently applied across all future pages.

🎨 Branding & Design Guidelines:
App Name: Automata Control Center (or placeholder if not finalized)

Primary Color: Deep Blue #1F3B73

Accent Color: Light Blue #5AA9E6

Background Color: Very Light Gray #F7F9FC

Typography:

Headings: Poppins (Semi-Bold)

Body Text: Inter (Regular)

Button Style: Rounded corners (border-radius: 8px), medium shadow, clear hover state

Card/Panel Style: Soft white with light shadow (box-shadow: rgba(0, 0, 0, 0.05) 0px 4px 12px)

Logo Placeholder: Simple minimalistic gear icon with lightning bolt inside (you can use any placeholder SVG for now)

🧩 Page Requirements: Login Page
Centered login card on screen.

Welcome Text (e.g., Welcome to Automata Control Center)

Form Fields:

Email

Password

Actions:

Login Button (Primary Color)

Forgot Password? (small text link)

Form Validation (simple required fields, email format)

Responsive: Should look good on both mobile and desktop

If login fails, show an error message inline in the card.

🛠️ Technical Stack:
Frontend: React.js (or Next.js if using SSR)

UI Framework: Material UI (MUI v5) preferred

Firebase Authentication: Connect Email/Password login via Firebase Auth SDK

State Management: Context API for user auth status (simple for now)

🔥 Additional Branding Elements Setup (for re-use):
Global ThemeProvider (if using MUI) with colors, fonts, shadows

Global Button and Card components styled according to branding

Add basic SEO title: "Automata Control Center - Login"

📄 Deliverables for this Task:
Login Page Component with connected Firebase Auth

Global Theme Setup for the app (colors, typography, button styles)

Basic Routing setup (so later pages like Dashboard can be added easily)

Sample Protected Route Setup (redirect if not authenticated)

Brand Style Guide (small MD file or comment with theme tokens)
  