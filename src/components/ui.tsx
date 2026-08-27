import { cn } from '../lib/utils';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
}) {
  const variants = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30',
    secondary: 'bg-slate-700 hover:bg-slate-600 text-slate-100',
    danger: 'bg-red-600 hover:bg-red-500 text-white',
    ghost: 'bg-transparent hover:bg-slate-800 text-slate-300',
    success: 'bg-green-600 hover:bg-green-500 text-white',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('rounded-xl border border-slate-700/60 bg-slate-800/60 backdrop-blur-sm shadow-xl', className)}>
      {children}
    </div>
  );
}

export function Badge({ children, color = 'slate' }: { children: ReactNode; color?: string }) {
  const colors: Record<string, string> = {
    slate: 'bg-slate-700 text-slate-200',
    green: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
    yellow: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
    red: 'bg-red-900/60 text-red-300 border border-red-700/50',
    blue: 'bg-blue-900/60 text-blue-300 border border-blue-700/50',
    purple: 'bg-purple-900/60 text-purple-300 border border-purple-700/50',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', colors[color] || colors.slate)}>
      {children}
    </span>
  );
}
