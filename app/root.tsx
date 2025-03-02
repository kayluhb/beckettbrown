import { Links, Meta, NavLink, Outlet, Scripts, ScrollRestoration, type LinksFunction } from 'react-router';

import styles from './tailwind.css?url';
import CustomCursor from './components/CustomCursor';

export const links: LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  { rel: 'stylesheet', href: styles },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap',
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <nav>
          <NavLink to="/">Home</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
        {children}
        <ScrollRestoration />
        <Scripts />
        <CustomCursor />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
