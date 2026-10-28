export function HeroSection() {
  return (
    <section id="inicio" className="relative overflow-hidden px-5 pb-14 pt-8 sm:px-8 sm:pb-20 sm:pt-12">
      <div className="absolute -right-32 top-6 -z-10 size-80 rounded-full bg-peach/50 blur-3xl" />
      <div className="absolute -left-24 bottom-0 -z-10 size-64 rounded-full bg-sand/50 blur-3xl" />
      <div className="mx-auto max-w-3xl text-center">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sand bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-terracotta">
          <span className="size-1.5 rounded-full bg-terracotta" /> Tu inspiración, bien combinada
        </p>
        <h1 className="font-display text-4xl font-semibold leading-[1.06] tracking-tight text-ink sm:text-6xl">
          Encuentra piezas que <span className="text-terracotta italic">hablan tu estilo.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-stone-600 sm:text-lg">
          Sube una imagen de tu look o espacio favorito y descubre ideas de nuestro catálogo para complementar tu visión.
        </p>
      </div>
    </section>
  );
}
