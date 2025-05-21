import type { SVGProps } from 'react';

export function ArtiaLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width="40"
      height="40"
      {...props}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
      <path
        fill="url(#logoGradient)"
        d="M50 5 C62.4 5 72.9 11.7 78.3 21.4 L66.4 28.3 C62.9 21.7 56.9 17.5 50 17.5 C37.6 17.5 27.5 27.6 27.5 40 C27.5 52.4 37.6 62.5 50 62.5 C56.9 62.5 62.9 58.3 66.4 51.7 L78.3 58.6 C72.9 68.3 62.4 75 50 75 C30.7 75 15 59.3 15 40 C15 20.7 30.7 5 50 5 Z M70 40 C70 31.7 63.3 25 55 25 L55 55 C63.3 55 70 48.3 70 40 Z M85 40 C85 20.7 69.3 5 50 5 L50 75 C69.3 75 85 59.3 85 40Z"
      />
    </svg>
  );
}
