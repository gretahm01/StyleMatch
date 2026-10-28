export function Logo() {
  return (
    <a href="#inicio" className="group flex items-center gap-2.5" aria-label="StyleMatch AI, inicio">
      <span className="grid size-9 place-items-center rounded-xl bg-terracotta text-lg text-white shadow-sm transition-transform duration-300 group-hover:rotate-6">
        ✦
      </span>
      <span className="font-display text-xl font-semibold tracking-tight text-ink">StyleMatch <em className="font-normal text-terracotta">AI</em></span>
    </a>
  );
}
