import { ReactNode } from 'react';

export type ResultTabKey = 'plan' | 'suggestions' | 'ast';

interface ResultsTabsProps {
  activeTab: ResultTabKey;
  onChange: (tab: ResultTabKey) => void;
  tabs: Array<{
    key: ResultTabKey;
    label: string;
    content: ReactNode;
  }>;
}

export function ResultsTabs({ activeTab, onChange, tabs }: ResultsTabsProps) {
  return (
    <div className="results-tabs">
      <div className="results-tabs__list" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.key}
            className={
              activeTab === tab.key
                ? 'results-tabs__button results-tabs__button--active'
                : 'results-tabs__button'
            }
            onClick={() => onChange(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="results-tabs__panel" role="tabpanel">
        {tabs.find((tab) => tab.key === activeTab)?.content}
      </div>
    </div>
  );
}
