import { useId } from "react";

export function BrandLogo() {
  const heartColorFilterId = useId();

  return (
    <svg
      viewBox="230 240 590 1000"
      className="h-12 w-8 shrink-0 overflow-hidden rounded-md bg-white"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <filter id={heartColorFilterId} colorInterpolationFilters="sRGB">
          {/* Map the magenta heart to brand pink (#ff5e77), preserving black and white. */}
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0
                    0.368627451 0.631372549 0 0 0
                    0.466666667 0.533333333 0 0 0
                    0 0 0 1 0"
          />
        </filter>
      </defs>
      <image
        href="/charitable-logo.png"
        width="1046"
        height="1504"
        filter={`url(#${heartColorFilterId})`}
      />
    </svg>
  );
}
