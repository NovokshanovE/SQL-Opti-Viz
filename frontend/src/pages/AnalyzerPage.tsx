import { FormEvent, useCallback, useMemo, useState } from 'react';

import { ModeToggle } from '../components/ModeToggle';
import {
  ConnectedForm,
  buildConnectionString,
  type ConnectedFormValues
} from '../components/forms/ConnectedForm';
import { ManualForm, type ManualFormValues } from '../components/forms/ManualForm';
import { ExplainPlanGraph } from '../components/results/ExplainPlanGraph';
import { SuggestionsList } from '../components/results/SuggestionsList';
import { AstTree } from '../components/results/AstTree';
import { ResultsTabs, type ResultTabKey } from '../components/results/ResultsTabs';
import type { AnalyzeMode, AnalyzeResponse, AnalyzeError } from '../types/api';

const defaultConnectedValues: ConnectedFormValues = {
  host: '',
  port: '5432',
  database: '',
  username: '',
  password: '',
  query: ''
};

const defaultManualValues: ManualFormValues = {
  query: '',
  explainJson: ''
};

export function AnalyzerPage() {
  const [mode, setMode] = useState<AnalyzeMode>('manual');
  const [connectedValues, setConnectedValues] = useState<ConnectedFormValues>(defaultConnectedValues);
  const [manualValues, setManualValues] = useState<ManualFormValues>(defaultManualValues);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<AnalyzeResponse | null>(null);
  const [activeTab, setActiveTab] = useState<ResultTabKey>('plan');
  const [connectedErrors, setConnectedErrors] = useState<
    Partial<Record<keyof ConnectedFormValues, string>>
  >({});
  const [manualErrors, setManualErrors] = useState<Partial<Record<keyof ManualFormValues, string>>>(
    {}
  );

  const activeQuery = useMemo(() => {
    return mode === 'connected' ? connectedValues.query : manualValues.query;
  }, [mode, connectedValues.query, manualValues.query]);

  const canSubmit = useMemo(() => {
    if (!activeQuery.trim()) {
      return false;
    }

    if (mode === 'connected') {
      const connString = buildConnectionString(connectedValues);
      return Boolean(connString);
    }

    return Boolean(manualValues.explainJson.trim());
  }, [mode, activeQuery, manualValues.explainJson, connectedValues]);

  const handleModeChange = useCallback(
    (nextMode: AnalyzeMode) => {
      setMode(nextMode);
      setError(null);
      setActiveTab('plan');

      if (nextMode === 'connected') {
        setManualErrors({});
      } else {
        setConnectedErrors({});
      }
    },
    []
  );

  const handleConnectedChange = useCallback((patch: Partial<ConnectedFormValues>) => {
    if (!Object.keys(patch).length) {
      return;
    }

    setConnectedValues((prev) => ({ ...prev, ...patch }));
    setConnectedErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => {
        delete next[key as keyof ConnectedFormValues];
      });
      return next;
    });
  }, []);

  const handleManualChange = useCallback((patch: Partial<ManualFormValues>) => {
    if (!Object.keys(patch).length) {
      return;
    }

    setManualValues((prev) => ({ ...prev, ...patch }));
    setManualErrors((prev) => {
      const next = { ...prev };
      Object.keys(patch).forEach((key) => {
        delete next[key as keyof ManualFormValues];
      });
      return next;
    });
  }, []);

  const validateConnected = useCallback(() => {
    const errors: Partial<Record<keyof ConnectedFormValues, string>> = {};

    if (!connectedValues.host.trim()) {
      errors.host = 'Host is required';
    }

    if (connectedValues.port && !/^[0-9]+$/.test(connectedValues.port.trim())) {
      errors.port = 'Port must be numeric';
    }

    if (!connectedValues.database.trim()) {
      errors.database = 'Database is required';
    }

    if (!connectedValues.username.trim()) {
      errors.username = 'Username is required';
    }

    if (!connectedValues.query.trim()) {
      errors.query = 'SQL query is required';
    }

    setConnectedErrors(errors);
    return Object.keys(errors).length === 0;
  }, [connectedValues]);

  const validateManual = useCallback(() => {
    const errors: Partial<Record<keyof ManualFormValues, string>> = {};
    let parsedExplain: unknown;

    if (!manualValues.query.trim()) {
      errors.query = 'SQL query is required';
    }

    if (!manualValues.explainJson.trim()) {
      errors.explainJson = 'EXPLAIN JSON is required';
    } else {
      try {
        parsedExplain = JSON.parse(manualValues.explainJson);
      } catch {
        errors.explainJson = 'Invalid JSON payload';
      }
    }

    setManualErrors(errors);

    return {
      ok: Object.keys(errors).length === 0,
      explainJson: parsedExplain
    };
  }, [manualValues]);

  const postAnalyze = useCallback(async (body: Record<string, unknown>) => {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as AnalyzeError | null;
      const details = payload?.details ? `: ${payload.details}` : '';
      throw new Error(payload?.error ? `${payload.error}${details}` : 'Analysis failed');
    }

    return (await response.json()) as AnalyzeResponse;
  }, []);

  const submitConnected = useCallback(async () => {
    const connectionString = buildConnectionString(connectedValues);
    if (!connectionString) {
      throw new Error('Connection information is incomplete.');
    }

    const payload = {
      mode: 'connected' as const,
      connection_string: connectionString,
      query: connectedValues.query
    };

    const data = await postAnalyze(payload);
    setResponse(data);
    setActiveTab('plan');
  }, [connectedValues, postAnalyze]);

  const submitManual = useCallback(
    async (explainJson: unknown) => {
    const payload = {
      mode: 'manual' as const,
      query: manualValues.query,
      explain_json: explainJson
    };

    const data = await postAnalyze(payload);
    setResponse(data);
    setActiveTab('plan');
    },
    [manualValues, postAnalyze]
  );

  const handleAnalyze = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!canSubmit || isLoading) {
        return;
      }

      if (mode === 'connected') {
        if (!validateConnected()) {
          return;
        }
      }

      let manualExplain: unknown;
      if (mode === 'manual') {
        const validation = validateManual();
        if (!validation.ok) {
          return;
        }
        manualExplain = validation.explainJson;
      }

      setIsLoading(true);
      setError(null);
      setResponse(null);
      setActiveTab('plan');

      try {
        if (mode === 'connected') {
          await submitConnected();
        } else {
          await submitManual(manualExplain);
        }
      } catch (submitError) {
        const message = submitError instanceof Error ? submitError.message : 'Unexpected error';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [canSubmit, isLoading, mode, submitConnected, submitManual, validateConnected, validateManual]
  );

  const resultTabs = useMemo(() => {
    if (!response) {
      return [];
    }

    return [
      {
        key: 'plan' as const,
        label: 'Explain Plan',
        content: <ExplainPlanGraph plan={response.explain_plan} />
      },
      {
        key: 'suggestions' as const,
        label: `Optimizer Suggestions (${response.suggestions.length})`,
        content: <SuggestionsList suggestions={response.suggestions} />
      },
      {
        key: 'ast' as const,
        label: 'AST Explorer',
        content: <AstTree ast={response.ast} />
      }
    ];
  }, [response]);

  return (
    <form className="analyzer" onSubmit={handleAnalyze}>
      <header className="analyzer__header">
        <div>
          <h1 className="analyzer__title">SQL-Opti-Viz</h1>
          <p className="analyzer__subtitle">Visualize and optimize PostgreSQL queries locally.</p>
        </div>
        <ModeToggle mode={mode} onChange={handleModeChange} />
      </header>

      <section className="analyzer__section">
        <h2 className="analyzer__section-title">Input</h2>
        {mode === 'connected' ? (
          <ConnectedForm
            values={connectedValues}
            onChange={handleConnectedChange}
            errors={connectedErrors}
          />
        ) : (
          <ManualForm
            values={manualValues}
            onChange={handleManualChange}
            errors={manualErrors}
          />
        )}
      </section>

      <footer className="analyzer__actions">
        <button className="primary-button" type="submit" disabled={!canSubmit || isLoading}>
          {isLoading ? 'Analyzing…' : 'Analyze'}
        </button>
        {!canSubmit ? <p className="analyzer__hint">Provide the required inputs to run analysis.</p> : null}
        {error ? <p className="analyzer__error">{error}</p> : null}
      </footer>

      <section className="analyzer__section analyzer__section--results">
        <h2 className="analyzer__section-title">Analysis results</h2>
        {response ? (
          <ResultsTabs activeTab={activeTab} onChange={setActiveTab} tabs={resultTabs} />
        ) : (
          <div className="results-placeholder results-placeholder--empty">
            <p>Run an analysis to view explain plans, optimizer suggestions, and AST.</p>
          </div>
        )}
      </section>
    </form>
  );
}
