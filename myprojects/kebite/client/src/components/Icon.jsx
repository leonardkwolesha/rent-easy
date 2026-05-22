const PATHS = {
  // status / feedback
  check: <polyline points="4 12 10 18 20 6" />,
  x: (
    <>
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="8" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  warning: (
    <>
      <path d="M12 3 L22 20 L2 20 Z" />
      <line x1="12" y1="10" x2="12" y2="14" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),

  // order lifecycle
  clipboard: (
    <>
      <rect x="6" y="4" width="12" height="18" rx="2" />
      <rect x="9" y="2" width="6" height="4" rx="1" />
      <line x1="9" y1="11" x2="15" y2="11" />
      <line x1="9" y1="15" x2="14" y2="15" />
    </>
  ),
  chef: (
    <>
      <path d="M6 13 Q3 13 3 10 Q3 7 6 7 Q6 3 12 3 Q18 3 18 7 Q21 7 21 10 Q21 13 18 13" />
      <path d="M6 13 L6 20 L18 20 L18 13" />
      <line x1="9" y1="16" x2="9" y2="19" />
      <line x1="12" y1="16" x2="12" y2="19" />
      <line x1="15" y1="16" x2="15" y2="19" />
    </>
  ),
  box: (
    <>
      <path d="M3 7 L12 3 L21 7 L21 17 L12 21 L3 17 Z" />
      <polyline points="3 7 12 11 21 7" />
      <line x1="12" y1="11" x2="12" y2="21" />
    </>
  ),
  scooter: (
    <>
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M6 18 L10 18 L14 9 L19 9" />
      <path d="M14 9 L11 4 L8 4" />
    </>
  ),
  party: (
    <>
      <path d="M3 21 L8 8 L20 16 Z" />
      <line x1="14" y1="3" x2="14" y2="5" />
      <line x1="18" y1="5" x2="20" y2="3" />
      <line x1="20" y1="9" x2="22" y2="9" />
    </>
  ),

  // navigation / quick links
  receipt: (
    <>
      <path d="M5 3 L5 21 L8 19 L11 21 L13 19 L16 21 L19 19 L19 3 Z" />
      <line x1="8" y1="8" x2="16" y2="8" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <line x1="8" y1="16" x2="13" y2="16" />
    </>
  ),
  ticket: (
    <>
      <path d="M3 8 L3 11 Q5 11 5 13 Q5 15 3 15 L3 18 L21 18 L21 15 Q19 15 19 13 Q19 11 21 11 L21 8 Z" />
      <line x1="13" y1="8" x2="13" y2="18" strokeDasharray="2 2" />
    </>
  ),
  chat: <path d="M4 5 Q4 3 6 3 L18 3 Q20 3 20 5 L20 13 Q20 15 18 15 L11 15 L6 20 L6 15 Q4 15 4 13 Z" />,
  send: (
    <>
      <path d="M22 2 L11 13" />
      <path d="M22 2 L15 22 L11 13 L2 9 Z" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11 L8 7 Q8 3 12 3 Q16 3 16 7 L16 11" />
    </>
  ),
  wave: (
    <>
      <path d="M11 11 L11 4 Q11 2.5 12.5 2.5 Q14 2.5 14 4 L14 11" />
      <path d="M14 5 Q14 3.5 15.5 3.5 Q17 3.5 17 5 L17 12" />
      <path d="M17 7 Q17 5.5 18.5 5.5 Q20 5.5 20 7 L20 14 Q20 20 14 21 Q9 21.5 7 17 L4.5 12 Q3.5 10 5 9 Q6.5 8 7.5 10 L9 12.5" />
    </>
  ),

  // marketing / features
  bolt: <polygon points="13 2 4 13 11 13 9 22 20 11 13 11" />,
  store: (
    <>
      <path d="M3 9 L4 4 L20 4 L21 9" />
      <path d="M3 9 Q3 11 5 11 Q7 11 7 9 Q7 11 9 11 Q11 11 11 9 Q11 11 13 11 Q15 11 15 9 Q15 11 17 11 Q19 11 19 9 Q19 11 21 11 Q21 11 21 9" />
      <path d="M5 11 L5 20 L19 20 L19 11" />
      <line x1="9" y1="20" x2="9" y2="14" />
      <line x1="13" y1="14" x2="13" y2="20" />
    </>
  ),
  pin: (
    <>
      <path d="M12 2 Q5 2 5 9 Q5 14 12 22 Q19 14 19 9 Q19 2 12 2 Z" />
      <circle cx="12" cy="9" r="2.5" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="13" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </>
  ),

  // identity / contact
  phone: <path d="M5 4 Q5 3 6 3 L9 3 L11 8 L8 10 Q9 14 14 16 L16 13 L21 15 L21 18 Q21 19 20 19 Q9 19 5 8 Z" />,
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <polyline points="3 7 12 13 21 7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21 Q4 13 12 13 Q20 13 20 21" />
    </>
  ),
  gift: (
    <>
      <rect x="3" y="9" width="18" height="12" rx="1" />
      <line x1="3" y1="13" x2="21" y2="13" />
      <line x1="12" y1="9" x2="12" y2="21" />
      <path d="M12 9 Q9 6 7 6 Q5 6 5 8 Q5 9 7 9" />
      <path d="M12 9 Q15 6 17 6 Q19 6 19 8 Q19 9 17 9" />
    </>
  ),
  tag: (
    <>
      <path d="M21 11 L13 19 Q12 20 11 19 L4 12 L4 4 L12 4 L21 11 Z" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),

  // restaurant card metadata
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <polyline points="12 7 12 12 16 14" />
    </>
  ),
  star: <polygon points="12 2 15 9 22 10 17 15 18 22 12 18 6 22 7 15 2 10 9 9" />,
  truck: (
    <>
      <rect x="2" y="7" width="11" height="10" rx="1" />
      <path d="M13 10 L17 10 L20 13 L20 17 L13 17" />
      <circle cx="6" cy="19" r="2" />
      <circle cx="17" cy="19" r="2" />
    </>
  ),
  plate: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5.5" />
    </>
  ),

  // misc
  home: (
    <>
      <path d="M3 11 L12 3 L21 11" />
      <path d="M5 10 L5 21 L9 21 L9 15 L15 15 L15 21 L19 21 L19 10" />
    </>
  ),
  pencil: (
    <>
      <path d="M16 3 L21 8 L8 21 L3 21 L3 16 Z" />
      <line x1="14" y1="5" x2="19" y2="10" />
    </>
  ),
  chevronRight: <polyline points="9 6 15 12 9 18" />,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
};

export default function Icon({
  name,
  size = 20,
  color = 'currentColor',
  strokeWidth = 1.8,
  fill = 'none',
  style = {},
  ...rest
}) {
  const path = PATHS[name];
  if (!path) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: 'inline-block', flexShrink: 0, ...style }}
      aria-hidden="true"
      {...rest}
    >
      {path}
    </svg>
  );
}
