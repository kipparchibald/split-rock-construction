import type { ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Split Rock Construction — Homes built on solid ground" },
      { name: "description", content: "Split Rock Construction builds residential homes and commercial shells & TI in Boise — ops suite for jobs, subs, pay apps, and crews." },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo-icon.svg", type: "image/svg+xml" },
    ],
  }),
  component: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body className="antialiased">
        {children}
        <Toaster position="bottom-right" toastOptions={{ className: "border border-border bg-bg-elevated text-fg" }} />
        <Scripts />
      </body>
    </html>
  );
}
