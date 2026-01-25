import React from 'react';

// All icons are minimal black-outline SVGs using currentColor for easy theming
const base = {
  width: 18,
  height: 18,
  stroke: 'currentColor',
  fill: 'none',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
};

export const IconSmile = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 14c1.333 1.333 2.667 2 4 2s2.667-.667 4-2" />
    <path d="M9 10h.01M15 10h.01" />
  </svg>
);

export const IconFrown = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M8 16c1.333-1.333 2.667-2 4-2s2.667.667 4 2" />
    <path d="M9 10h.01M15 10h.01" />
  </svg>
);

export const IconMeh = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 15h6" />
    <path d="M9 10h.01M15 10h.01" />
  </svg>
);

export const IconChat = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M21 12a7 7 0 0 1-7 7H8l-4 3v-5a7 7 0 0 1 7-7h3a7 7 0 0 1 7 7Z" />
  </svg>
);

export const IconRefresh = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M20 12a8 8 0 1 1-2.343-5.657" />
    <path d="M20 4v6h-6" />
  </svg>
);

export const IconChartBar = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M4 20h16" />
    <rect x="6" y="10" width="3" height="6" rx="1" />
    <rect x="11" y="7" width="3" height="9" rx="1" />
    <rect x="16" y="12" width="3" height="4" rx="1" />
  </svg>
);

export const IconInbox = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <path d="M3 12l3-7h12l3 7v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6Z" />
    <path d="M3 12h6l2 2h2l2-2h6" />
  </svg>
);

export const IconXCircle = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9 9l6 6M15 9l-6 6" />
  </svg>
);

export const IconClipboard = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <rect x="6" y="7" width="12" height="14" rx="2" />
    <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);

export const IconClock = (props) => (
  <svg viewBox="0 0 24 24" {...base} {...props}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </svg>
);

// A small helper wrapper to keep icon + label consistent
export const Icon = ({ children, size = 18, className = '', style = {} }) => (
  <span className={`ui-icon ${className}`} style={{ display: 'inline-flex', alignItems: 'center', color: 'var(--text-primary)', ...style }}>
    {React.cloneElement(children, { width: size, height: size })}
  </span>
);

export default {
  IconSmile,
  IconFrown,
  IconMeh,
  IconChat,
  IconRefresh,
  IconChartBar,
  IconInbox,
  IconXCircle,
  IconClipboard,
  IconClock,
  Icon
};
