import { CT, DISPLAY } from "~/lib/c-tokens";

export function BaziSectionHeading({
  index,
  title,
  id,
}: {
  index: number;
  title: string;
  id?: string;
}) {
  return (
    <div
      className="flex items-baseline gap-2.5 border-b pb-1.5"
      style={{ borderColor: CT.ink }}
    >
      <span
        className="font-mono text-[11.5px]"
        style={{ color: CT.goldDeep, letterSpacing: "0.18em" }}
      >
        {String(index).padStart(2, "0")}
      </span>
      <span id={id} className="text-lg font-extrabold uppercase tracking-tight" style={DISPLAY}>
        {title}
      </span>
    </div>
  );
}

export function BaziChapterEmpty({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-3 font-serif text-sm leading-relaxed"
      style={{ color: CT.muted }}
    >
      {message}
    </p>
  );
}

export function BaziChapterProse({ text }: { text: string }) {
  return (
    <p
      className="mt-3 text-[14px] leading-relaxed whitespace-pre-wrap"
      style={{ color: CT.ink2 }}
    >
      {text}
    </p>
  );
}
