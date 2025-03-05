
import React from 'react';
import { cn } from '@/lib/utils';

type HeaderProps = {
  className?: string;
}

const Header: React.FC<HeaderProps> = ({ className }) => {
  return (
    <header className={cn('w-full py-6 animate-fade-in', className)}>
      <div className="container flex flex-col items-center justify-center text-center space-y-2">
        <div className="inline-flex items-center justify-center px-2 py-1 mb-2 rounded-full bg-accent text-accent-foreground text-xs font-medium">
          <span>AI-Powered Image Recognition</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
          Wardrobe Cutter
        </h1>
        <p className="text-muted-foreground max-w-md">
          Extract clothing items and accessories from your photos with precision
        </p>
      </div>
    </header>
  );
};

export default Header;
