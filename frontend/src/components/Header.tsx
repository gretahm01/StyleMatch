import { Logo } from './Logo';

export function Header() {
  return <header className="sticky top-0 z-30 bg-cream/90 backdrop-blur-lg"><div className="mx-auto flex h-[72px] max-w-7xl items-center px-5 sm:px-8"><Logo /></div></header>;
}
