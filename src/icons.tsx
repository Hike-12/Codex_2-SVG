import type { SVGProps } from 'react';
const icons: Record<string, string> = {
  server:'M4 5h16v5H4z M4 14h16v5H4z M7 7.5h.01 M7 16.5h.01 M11 7.5h6 M11 16.5h6',
  database:'M12 3c-4.4 0-8 1.3-8 3s3.6 3 8 3 8-1.3 8-3-3.6-3-8-3z M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6 M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  postgres:'M6 6c1-3 11-3 12 0l1 10-3 4h-3l-1-5-2 2v3H7l-2-4z M9 8h.01 M15 8h.01',
  redis:'M4 8l8-4 8 4-8 4z M4 12l8 4 8-4 M4 16l8 4 8-4',
  queue:'M4 6h13l3 3-3 3H4z M4 14h13l3 3-3 3H4z',
  globe:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M3 12h18 M12 3c5 5 5 13 0 18 M12 3c-5 5-5 13 0 18',
  client:'M5 4h14v12H5z M9 20h6 M12 16v4',
  mobile:'M7 3h10v18H7z M10 6h4 M11 18h2',
  cloud:'M6 18h12a4 4 0 0 0 .2-8 6.5 6.5 0 0 0-12.4 1.5A3.5 3.5 0 0 0 6 18z',
  docker:'M3 12h18 M6 9h3v3H6z M10 9h3v3h-3z M10 5h3v3h-3z M14 9h3v3h-3z M4 15h15c-.8 4-4 5-8 5s-6-2-7-5z',
  kubernetes:'M12 3l8 4.5v9L12 21l-8-4.5v-9z M12 8v8 M8.5 10l7 4 M15.5 10l-7 4',
  lambda:'M6 19l5-14h4l4 14 M9 12h7',
  lock:'M5 10h14v11H5z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3',
  key:'M14 10a5 5 0 1 1-2-4 M14 10l7-7 M17 7l2 2',
  shield:'M12 3l8 3v5c0 5-3 8-8 10-5-2-8-5-8-10V6z M9 12l2 2 4-4',
  cpu:'M7 7h10v10H7z M9 10h6v4H9z M9 2v5 M15 2v5 M9 17v5 M15 17v5 M2 9h5 M2 15h5 M17 9h5 M17 15h5',
  ai:'M12 3v18 M4 8l16 8 M4 16l16-8 M7 4l10 16 M17 4L7 20',
  brain:'M12 5a4 4 0 0 0-7 3 4 4 0 0 0 0 7 4 4 0 0 0 7 3z M12 5a4 4 0 0 1 7 3 4 4 0 0 1 0 7 4 4 0 0 1-7 3z M12 5v14',
  user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
  users:'M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z M2 20a7 7 0 0 1 14 0 M16 5a3.5 3.5 0 0 1 0 7 M17 14a6 6 0 0 1 5 6',
  webhook:'M12 4a3 3 0 1 0-3 3 M12 4v2 M6 9l-3 5a3 3 0 1 0 3 3h3 M6 17l2-3 M14 17h4a3 3 0 1 0-1-6l-2 1 M16 12l-2-3',
  terminal:'M4 5h16v14H4z M7 9l3 3-3 3 M12 15h5',
  git:'M12 3v18 M12 7l6 4v9 M12 8l-5 4v6 M12 5a2 2 0 1 0 0-4 2 2 0 0 0 0 4z M18 13a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  github:'M8 19c-5 1-5-3-7-4 M16 21v-3a3 3 0 0 0-1-2c4 0 7-2 7-6a5 5 0 0 0-1-3 5 5 0 0 0-.1-4S19 2 16 4a13 13 0 0 0-8 0C5 2 3 3 3 3a5 5 0 0 0-.1 4A5 5 0 0 0 2 10c0 4 3 6 7 6a3 3 0 0 0-1 2v3',
  storage:'M4 5h16v14H4z M8 9h8 M8 13h8 M8 17h4',
  bucket:'M4 8h16l-2 12H6z M3 8l9-5 9 5 M9 12v4 M15 12v4',
  cache:'M5 5h14v14H5z M8 8h8v8H8z M2 8h3 M19 8h3 M2 16h3 M19 16h3',
  gateway:'M3 12h6 M15 12h6 M9 6l6 6-6 6 M12 3v3 M12 18v3',
  router:'M4 6h16v12H4z M8 10l-2 2 2 2 M16 10l2 2-2 2 M11 12h2',
  search:'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z M16 16l5 5',
  chart:'M4 20V4 M4 20h17 M7 15l4-5 4 3 5-7',
  bell:'M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',
  mail:'M3 5h18v14H3z M3 6l9 7 9-7',
  code:'M8 6l-6 6 6 6 M16 6l6 6-6 6 M14 4l-4 16',
  file:'M6 3h8l5 5v13H6z M14 3v6h5 M9 13h6 M9 17h6',
  spark:'M12 3l1.8 6.2L20 11l-6.2 1.8L12 19l-1.8-6.2L4 11l6.2-1.8z M19 16l.7 2.3L22 19l-2.3.7L19 22l-.7-2.3L16 19l2.3-.7z'
};
export const iconNames = Object.keys(icons);
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name?: string }) {
  const path = icons[name || ''] || icons.server;
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}><path d={path} /></svg>;
}
