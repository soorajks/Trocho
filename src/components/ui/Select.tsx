import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  children: ReactNode;
}

export function Select({ value, onChange, children }: SelectProps) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full appearance-none rounded-md border border-white/[0.08] bg-white/[0.03] px-3 pr-9 text-sm text-neutral-100 outline-none transition-colors hover:border-white/[0.16] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
      >
        {children}
      </select>
      <ChevronDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500" />
    </div>
  );
}
