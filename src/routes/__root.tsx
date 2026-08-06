import type { ReactNode } from "react";
import { Outlet, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { Toaster } from "sonner";
import { PwaRegister } from "@/components/pwa-register";
import appCss from "@/styles.css?url";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { title: "Split Rock Construction — Built well. Documented clearly." },
      {
        name: "description",
        content:
          "Split Rock Construction: lots and build-to-suit homes in Rigby & Jefferson County. Quality craftsmanship, transparent budgets and draws, and communication you don't have to chase.",
      },
      { name: "referrer", content: "strict-origin-when-cross-origin" },
      { name: "theme-color", content: "#1a1a18" },
      { name: "mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-status-bar-style", content: "default" },
      { name: "application-name", content: "Split Rock" },
      { name: "apple-mobile-web-app-title", content: "Split Rock" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/logo-app-mark.jpg", type: "image/jpeg" },
      { rel: "apple-touch-icon", href: "/logo-app-mark.jpg" },
      { rel: "manifest", href: "/manifest.webmanifest" },
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
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        {children}
        <PwaRegister />
        <Toaster
          position="top-center"
          mobileOffset={{ top: 56 }}
          toastOptions={{ className: "border border-border bg-bg-elevated text-fg" }}
        />
        <Scripts />
      </body>
    </html>
  );
}
