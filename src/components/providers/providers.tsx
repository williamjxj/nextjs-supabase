"use client";

import React from "react";
import { AuthProvider } from "@/hooks/use-auth";
import { ToastProvider } from "@/components/ui/toast";
import { Layout } from "@/components/layout/layout";
import { ErrorBoundary } from "@/components/ui/error-boundary";

interface ProvidersProps {
  children: React.ReactNode;
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ToastProvider>
          <Layout>
            {children}
          </Layout>
        </ToastProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
};
