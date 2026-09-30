/** Properties for the {@link SizeSelector} component. */
export interface SizeSelectorProps {
  /** Group heading. */
  title: string;
  /** Helper text describing the format. */
  hint: string;
  /** Selectable sizes in pixels. */
  options: readonly number[];
  /** Currently selected sizes. */
  selected: readonly number[];
  /** Disables interaction while an image is loading. */
  disabled: boolean;
  /** Toggles a single size. */
  onToggle: (size: number) => void;
}

/**
 * Checkbox group for choosing which icon sizes to generate.
 *
 * @param props - Component properties.
 * @returns The fieldset element.
 */
export function SizeSelector({
  title,
  hint,
  options,
  selected,
  disabled,
  onToggle,
}: SizeSelectorProps) {
  return (
    <fieldset className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <legend className="px-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        {title}
      </legend>
      <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((size) => {
          const checked = selected.includes(size);

          return (
            <label
              key={size}
              className={`flex cursor-pointer items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-sm transition-colors ${
                checked
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:border-indigo-400 dark:bg-indigo-950/50 dark:text-indigo-300'
                  : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-600 dark:text-slate-300 dark:hover:border-slate-500'
              }`}
            >
              <input
                checked={checked}
                className="size-3.5 accent-indigo-600"
                disabled={disabled}
                onChange={() => {
                  onToggle(size);
                }}
                type="checkbox"
              />
              {size}px
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
