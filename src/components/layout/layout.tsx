import React from "react";
import { Header } from "./header";
import { Footer } from "./footer";
import { cn } from "@/lib/utils/cn";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
  showHeader?: boolean;
  showFooter?: boolean;
}

export const Layout = ({ 
  children, 
  className,
  showHeader = true,
  showFooter = true 
}: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {showHeader && <Header />}
      
      <main className={cn("flex-1", className)}>
        {children}
      </main>
      
      {showFooter && <Footer />}
    </div>
  );
};
