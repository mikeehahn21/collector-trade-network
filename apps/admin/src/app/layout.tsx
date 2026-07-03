import type { Metadata } from "next";
import type { ReactNode } from "react";

import { APP_NAME } from "@ctn/constants";

import { AuthProvider } from "@/components/auth-provider";

import "./styles.css";

export const metadata: Metadata = {
  title: `${APP_NAME} Admin`,
  description: "Internal admin tools for collector trade operations.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <html lang="en">
        <body>{children}</body>
      </html>
    </AuthProvider>
  );
}
