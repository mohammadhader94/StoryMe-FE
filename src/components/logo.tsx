import type { FC } from 'react';
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string; // Allow passing additional classes
}

/**
 * Renders the Automata Control Center logo (Gear with Lightning Bolt).
 * Uses the primary theme color by default. Can be overridden via className.
 */
const Logo: FC<LogoProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    // Combine default classes with any passed className using cn utility
    className={cn("w-10 h-10 text-primary", className)}
    aria-hidden="true" // Hide decorative SVG from screen readers
    focusable="false" // Prevent focusing decorative SVG
  >
    <title>Automata Control Center Logo</title> {/* Provide title for accessibility */}
    {/* Gear Path */}
    <path d="M19.48 8.47a7.5 7.5 0 0 0-1.06-2.06l1.42-1.42a.5.5 0 0 0-.71-.71l-1.42 1.42a7.5 7.5 0 0 0-2.06-1.06L15.53 3.5a.5.5 0 0 0-.5-.5h-6a.5.5 0 0 0-.5.5L8.47 4.64a7.5 7.5 0 0 0-2.06 1.06L4.99 4.28a.5.5 0 0 0-.71.71l1.42 1.42a7.5 7.5 0 0 0-1.06 2.06L3.5 8.47a.5.5 0 0 0 0 .5l.14 1.56a7.5 7.5 0 0 0 1.06 2.06l-1.42 1.42a.5.5 0 0 0 .71.71l1.42-1.42a7.5 7.5 0 0 0 2.06 1.06l.14 1.56a.5.5 0 0 0 .5.5h6a.5.5 0 0 0 .5-.5l.06-.14.14-1.56a7.5 7.5 0 0 0 2.06-1.06l1.42 1.42a.5.5 0 0 0 .71-.71l-1.42-1.42a7.5 7.5 0 0 0 1.06-2.06l.06-.14.14-1.56a.5.5 0 0 0 0-.5l-.14-1.56zM12 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7z"/>
    {/* Lightning Bolt Path (inside the gear center) */}
    <path d="M13.27 10.57l-2.4 3.6a.5.5 0 0 1-.87-.5L11.27 11H9.5a.5.5 0 0 1-.43-.73l2.4-3.6a.5.5 0 0 1 .87.5L12.73 10h1.77a.5.5 0 0 1 .43.73l-1.7 2.84z"/>
  </svg>
);

export default Logo;