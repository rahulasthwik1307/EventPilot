import React, { useState } from 'react';
import { RotateCcw, Compass, CheckCircle2 } from 'lucide-react';

export interface SampleBannerProps {
  onResetSample: () => void;
}

export function SampleBanner({ onResetSample }: SampleBannerProps) {
  const [resetting, setResetting] = useState(false);
  const [justReset, setJustReset] = useState(false);

  const handleReset = () => {
    setResetting(true);
    onResetSample();
    setTimeout(() => {
      setResetting(false);
      setJustReset(true);
      setTimeout(() => setJustReset(false), 3000);
    }, 300);
  };

  return (
    <div className="bg-primary-subtle/70 border-b border-primary/30 px-4 py-2.5 text-xs text-neutral-text">
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-primary-hover flex-shrink-0" />
          <span>
            <strong>Sample Celebration Sandbox:</strong> You are exploring pre-populated example data. Edits here are isolated and will never modify your personal saved events.
          </span>
        </div>

        <div className="flex items-center gap-2">
          {justReset ? (
            <span className="inline-flex items-center gap-1 text-status-success font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Restored!</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-1 text-primary-hover hover:text-white hover:bg-primary-hover font-semibold px-2.5 py-1 rounded border border-primary/40 bg-neutral-surface/80 transition-colors shadow-xs"
            >
              <RotateCcw className={`w-3 h-3 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset Sample</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
