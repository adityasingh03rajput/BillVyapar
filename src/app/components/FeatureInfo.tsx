import { Info } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface FeatureInfoProps {
  title: string;
  steps: string[];
  className?: string;
}

export function FeatureInfo({ title, steps, className }: FeatureInfoProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          type="button"
          className={`p-1.5 rounded-xl hover:bg-accent hover:text-accent-foreground text-muted-foreground transition-all flex items-center justify-center ${className || ''}`}
          title="Learn more about this feature"
        >
          <Info className="h-4 w-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4 rounded-2xl shadow-xl border-accent" side="bottom" align="start">
        <h3 className="font-bold text-sm mb-3 text-foreground flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-primary" />
          {title}
        </h3>
        <ul className="space-y-2.5">
          {steps.map((s, i) => (
            <li key={i} className="text-[11px] leading-relaxed flex gap-2.5 text-muted-foreground">
              <span className="flex-shrink-0 w-4 h-4 rounded-md bg-secondary text-primary flex items-center justify-center font-bold text-[9px]">
                {i + 1}
              </span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
