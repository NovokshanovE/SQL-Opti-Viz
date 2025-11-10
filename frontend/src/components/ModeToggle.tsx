import type { AnalyzeMode } from '../types/api';

interface ModeToggleProps {
  mode: AnalyzeMode;
  onChange: (mode: AnalyzeMode) => void;
}

const modes: AnalyzeMode[] = ['connected', 'manual'];

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  return (
    <div className="mode-toggle" role="tablist" aria-label="Analysis mode">
      {modes.map((itemMode) => {
        const isActive = mode === itemMode;
        return (
          <button
            key={itemMode}
            type="button"
            aria-selected={isActive}
            role="tab"
            className={isActive ? 'mode-toggle__button mode-toggle__button--active' : 'mode-toggle__button'}
            onClick={() => onChange(itemMode)}
          >
            {itemMode === 'connected' ? 'Connected mode' : 'Manual mode'}
          </button>
        );
      })}
    </div>
  );
}
