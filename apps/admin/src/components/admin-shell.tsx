import type { ReactNode } from "react";

import { APP_NAME } from "@ctn/constants";

const plannedSections = [
  "Dashboard",
  "User approvals",
  "Item review",
  "Trades",
  "Disputes",
  "Recommendations",
  "Invites",
] as const;

export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <main className="admin-shell">
      <aside className="sidebar">
        <div className="brand">{APP_NAME}</div>
        <nav className="nav" aria-label="Admin sections">
          {plannedSections.map((section) => (
            <span className="nav-item" key={section}>
              {section}
            </span>
          ))}
        </nav>
      </aside>
      <div className="content">{children}</div>
    </main>
  );
}
