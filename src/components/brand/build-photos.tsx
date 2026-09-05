const PHOTOS = [
  {
    src: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1400&q=80",
    alt: "Wood framing going up on a new single-family home",
    label: "Framing",
  },
  {
    src: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1400&q=80",
    alt: "Crew working a residential construction site",
    label: "On the job",
  },
  {
    src: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80",
    alt: "Finished modern home with clean lines and a two-car garage",
    label: "Ready for keys",
  },
] as const;

export function BuildPhotos() {
  return (
    <section className="border-b border-border bg-bg-elevated" aria-label="Construction photos">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-12">
        <p className="label-caps-accent">The work</p>
        <h2 className="mt-2 max-w-lg text-xl font-medium tracking-[-0.02em] text-fg sm:text-2xl">
          From lot to framed walls to a house you can walk.
        </h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          {PHOTOS.map((p) => (
            <figure key={p.label} className="overflow-hidden rounded-md border border-sand">
              <div className="aspect-[4/3] w-full overflow-hidden bg-earth-light">
                <img
                  src={p.src}
                  alt={p.alt}
                  className="h-full w-full object-cover"
                  width={800}
                  height={600}
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="border-t border-sand bg-earth-light/40 px-3 py-2 text-[11px] font-medium tracking-wide text-fg-muted">
                {p.label}
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
