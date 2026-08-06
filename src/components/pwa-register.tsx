import { useEffect } from "react";

/** Registers the light offline shell service worker (production + preview). */
export function PwaRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Skip in pure unit tests / playwright when disabled
    if (window.localStorage.getItem("src-disable-sw") === "1") return;

    const onLoad = () => {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        /* silent — SW is progressive enhancement */
      });
    };

    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);

  return null;
}
