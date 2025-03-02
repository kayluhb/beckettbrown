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
      <body className="overflow-x-hidden">
        <nav className="flex px-3 py-2 sticky top-0 left-0 bg-white z-10 justify-between items-center uppercase w-full">
          <div className="flex gap-3">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/about">About</NavLink>
          </div>
          <div className="text-4xl text-gray-800 dark:text-gray-100 ">Beckett</div>
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
