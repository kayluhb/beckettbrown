import type { MetaFunction } from 'react-router';
import { NavLink } from 'react-router-dom';

export const meta: MetaFunction = () => {
  return [{ title: 'New React Router App' }, { name: 'description', content: 'Welcome to React Router!' }];
};

export default function Index() {
  return (
    <main>
      <header className="flex flex-col items-center gap-9">
        <h1 className="text-4xl text-gray-800 dark:text-gray-100 uppercase">Beckett</h1>
      </header>
    </main>
  );
}
