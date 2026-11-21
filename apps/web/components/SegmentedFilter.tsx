"use client";

/** Native radio group styled as a segmented control: keyboard arrows, screen readers and forms work for free. */
export function SegmentedFilter<T extends string>({ legend, name, value, options, onChange }: {
  legend: string; name: string; value: T; options: readonly { value: T; label: string }[]; onChange: (v: T) => void;
}) {
  return (
    <fieldset className="fo-segmented">
      <legend className="fo-sr-only">{legend}</legend>
      {options.map(o => (
        <label key={o.value} className="fo-segmented__option">
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
          <span>{o.label}</span>
        </label>
      ))}
    </fieldset>
  );
}
