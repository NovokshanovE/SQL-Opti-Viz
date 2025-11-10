import type { Suggestion } from '../../types/api';

interface SuggestionsListProps {
  suggestions: Suggestion[];
}

const severityTone: Record<Suggestion['severity'], string> = {
  High: 'suggestion-card__badge--high',
  Medium: 'suggestion-card__badge--medium',
  Low: 'suggestion-card__badge--low'
};

export function SuggestionsList({ suggestions }: SuggestionsListProps) {
  if (!suggestions.length) {
    return (
      <div className="results-placeholder results-placeholder--empty">
        <p>No optimization suggestions detected for this query.</p>
      </div>
    );
  }

  return (
    <div className="suggestions">
      {suggestions.map((item, index) => (
        <article key={`${item.title}-${index}`} className="suggestion-card">
          <header className="suggestion-card__header">
            <h3 className="suggestion-card__title">{item.title}</h3>
            <span className={`suggestion-card__badge ${severityTone[item.severity]}`}>
              {item.severity}
            </span>
          </header>
          <p className="suggestion-card__description">{item.description}</p>
          <p className="suggestion-card__recommendation">{item.recommendation}</p>
        </article>
      ))}
    </div>
  );
}
