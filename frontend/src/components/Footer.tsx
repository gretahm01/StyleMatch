import { Logo } from './Logo';

export function Footer() {
  return <footer className="border-t border-sand bg-white px-5 py-8 sm:px-8"><div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><Logo /><p className="text-sm text-stone-500">Proyecto académico · Interfaz de demostración</p><p className="text-sm text-stone-400">© 2026 StyleMatch AI</p></div></footer>;
}
