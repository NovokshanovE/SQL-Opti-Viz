import { JsonView, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

interface AstTreeProps {
  ast: unknown;
}

export function AstTree({ ast }: AstTreeProps) {
  if (!ast) {
    return (
      <div className="results-placeholder results-placeholder--empty">
        <p>No AST available for this query.</p>
      </div>
    );
  }

  return (
    <div className="ast-tree">
      <JsonView
        data={ast}
        style={darkStyles}
        shouldExpandNode={(level) => level < 2}
      />
    </div>
  );
}
