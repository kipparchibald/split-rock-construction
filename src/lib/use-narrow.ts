import { useEffect, useState } from "react";

/** True below the given breakpoint (default: Tailwind `lg` = 1024px). SSR-safe: starts false. */
export function useNarrow(query = "(max-width: 1023px)") {
  const [narrow, setNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia(query);
    const apply = () => setNarrow(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [query]);

  return narrow;
}

/** Phone / small tablet — used for WebGL quality and tap targets. */
export function usePhone() {
  return useNarrow("(max-width: 767px)");
}
