import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
  return [{ title: 'About - Beckett Brown' }, { name: 'description', content: 'About Beckett' }];
};

export default function About() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">About</h1>
    </div>
  );
}
