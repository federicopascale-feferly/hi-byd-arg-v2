"use client";

interface Mark {
  value: number;
  label: string;
}

interface Props {
  id: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  /** Emoji que reemplaza al thumb (ej. 🔋 o ⚡) */
  emoji: string;
  /** Hitos marcados como cortes sobre la barra (ej. 20% y 80%) */
  marks?: Mark[];
  ariaDescribedby?: string;
}

const THUMB_PX = 30;

export function EmojiRange({ id, min, max, step, value, onChange, emoji, marks, ariaDescribedby }: Props) {
  const toPct = (v: number) => ((v - min) / (max - min)) * 100;
  const pct = toPct(value);
  const offset = (p: number) => `calc(${p}% + ${(0.5 - p / 100) * THUMB_PX}px)`;

  return (
    <div className={`relative ${marks?.length ? "mb-4" : ""}`}>
      <div className="relative h-11">
        {/* Track visual (el input real es transparente encima, con área táctil completa) */}
        <div
          className="pointer-events-none absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 rounded-full"
          style={{
            background: `linear-gradient(to right, var(--primary) ${pct}%, rgba(255,255,255,0.12) ${pct}%)`,
          }}
          aria-hidden
        />

        {marks?.map((m) => (
          <div
            key={m.value}
            className="pointer-events-none absolute top-0 bottom-0"
            style={{ left: offset(toPct(m.value)) }}
            aria-hidden
          >
            <div className="absolute top-1/2 h-5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-fill" />
            <span className="absolute -bottom-3.5 -translate-x-1/2 whitespace-nowrap font-mono text-[10px] text-accent">
              {m.label}
            </span>
          </div>
        ))}

        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-describedby={ariaDescribedby}
          className="emoji-range absolute inset-0 h-full w-full cursor-pointer"
        />

        <span
          className="pointer-events-none absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-2xl leading-none drop-shadow"
          style={{ left: offset(pct) }}
          aria-hidden
        >
          {emoji}
        </span>
      </div>
    </div>
  );
}
