import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useMemo, useState } from 'react';
import { ModeToggle } from '../components/ModeToggle';
import { ConnectedForm, buildConnectionString } from '../components/forms/ConnectedForm';
import { ManualForm } from '../components/forms/ManualForm';
import { ExplainPlanGraph } from '../components/results/ExplainPlanGraph';
import { SuggestionsList } from '../components/results/SuggestionsList';
import { AstTree } from '../components/results/AstTree';
import { ResultsTabs } from '../components/results/ResultsTabs';
const defaultConnectedValues = {
    host: '',
    port: '5432',
    database: '',
    username: '',
    password: '',
    query: ''
};
const defaultManualValues = {
    query: '',
    explainJson: ''
};
export function AnalyzerPage() {
    const [mode, setMode] = useState('manual');
    const [connectedValues, setConnectedValues] = useState(defaultConnectedValues);
    const [manualValues, setManualValues] = useState(defaultManualValues);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [response, setResponse] = useState(null);
    const [activeTab, setActiveTab] = useState('plan');
    const [connectedErrors, setConnectedErrors] = useState({});
    const [manualErrors, setManualErrors] = useState({});
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
    const handleModeChange = useCallback((nextMode) => {
        setMode(nextMode);
        setError(null);
        setActiveTab('plan');
        if (nextMode === 'connected') {
            setManualErrors({});
        }
        else {
            setConnectedErrors({});
        }
    }, []);
    const handleConnectedChange = useCallback((patch) => {
        if (!Object.keys(patch).length) {
            return;
        }
        setConnectedValues((prev) => ({ ...prev, ...patch }));
        setConnectedErrors((prev) => {
            const next = { ...prev };
            Object.keys(patch).forEach((key) => {
                delete next[key];
            });
            return next;
        });
    }, []);
    const handleManualChange = useCallback((patch) => {
        if (!Object.keys(patch).length) {
            return;
        }
        setManualValues((prev) => ({ ...prev, ...patch }));
        setManualErrors((prev) => {
            const next = { ...prev };
            Object.keys(patch).forEach((key) => {
                delete next[key];
            });
            return next;
        });
    }, []);
    const validateConnected = useCallback(() => {
        const errors = {};
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
        const errors = {};
        let parsedExplain;
        if (!manualValues.query.trim()) {
            errors.query = 'SQL query is required';
        }
        if (!manualValues.explainJson.trim()) {
            errors.explainJson = 'EXPLAIN JSON is required';
        }
        else {
            try {
                parsedExplain = JSON.parse(manualValues.explainJson);
            }
            catch {
                errors.explainJson = 'Invalid JSON payload';
            }
        }
        setManualErrors(errors);
        return {
            ok: Object.keys(errors).length === 0,
            explainJson: parsedExplain
        };
    }, [manualValues]);
    const postAnalyze = useCallback(async (body) => {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const payload = (await response.json().catch(() => null));
            const details = payload?.details ? `: ${payload.details}` : '';
            throw new Error(payload?.error ? `${payload.error}${details}` : 'Analysis failed');
        }
        return (await response.json());
    }, []);
    const submitConnected = useCallback(async () => {
        const connectionString = buildConnectionString(connectedValues);
        if (!connectionString) {
            throw new Error('Connection information is incomplete.');
        }
        const payload = {
            mode: 'connected',
            connection_string: connectionString,
            query: connectedValues.query
        };
        const data = await postAnalyze(payload);
        setResponse(data);
        setActiveTab('plan');
    }, [connectedValues, postAnalyze]);
    const submitManual = useCallback(async (explainJson) => {
        const payload = {
            mode: 'manual',
            query: manualValues.query,
            explain_json: explainJson
        };
        const data = await postAnalyze(payload);
        setResponse(data);
        setActiveTab('plan');
    }, [manualValues, postAnalyze]);
    const handleAnalyze = useCallback(async (event) => {
        event.preventDefault();
        if (!canSubmit || isLoading) {
            return;
        }
        if (mode === 'connected') {
            if (!validateConnected()) {
                return;
            }
        }
        let manualExplain;
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
            }
            else {
                await submitManual(manualExplain);
            }
        }
        catch (submitError) {
            const message = submitError instanceof Error ? submitError.message : 'Unexpected error';
            setError(message);
        }
        finally {
            setIsLoading(false);
        }
    }, [canSubmit, isLoading, mode, submitConnected, submitManual, validateConnected, validateManual]);
    const resultTabs = useMemo(() => {
        if (!response) {
            return [];
        }
        return [
            {
                key: 'plan',
                label: 'Explain Plan',
                content: _jsx(ExplainPlanGraph, { plan: response.explain_plan })
            },
            {
                key: 'suggestions',
                label: `Optimizer Suggestions (${response.suggestions.length})`,
                content: _jsx(SuggestionsList, { suggestions: response.suggestions })
            },
            {
                key: 'ast',
                label: 'AST Explorer',
                content: _jsx(AstTree, { ast: response.ast })
            }
        ];
    }, [response]);
    return (_jsxs("form", { className: "analyzer", onSubmit: handleAnalyze, children: [_jsxs("header", { className: "analyzer__header", children: [_jsxs("div", { children: [_jsx("h1", { className: "analyzer__title", children: "SQL-Opti-Viz" }), _jsx("p", { className: "analyzer__subtitle", children: "Visualize and optimize PostgreSQL queries locally." })] }), _jsx(ModeToggle, { mode: mode, onChange: handleModeChange })] }), _jsxs("section", { className: "analyzer__section", children: [_jsx("h2", { className: "analyzer__section-title", children: "Input" }), mode === 'connected' ? (_jsx(ConnectedForm, { values: connectedValues, onChange: handleConnectedChange, errors: connectedErrors })) : (_jsx(ManualForm, { values: manualValues, onChange: handleManualChange, errors: manualErrors }))] }), _jsxs("footer", { className: "analyzer__actions", children: [_jsx("button", { className: "primary-button", type: "submit", disabled: !canSubmit || isLoading, children: isLoading ? 'Analyzing…' : 'Analyze' }), !canSubmit ? _jsx("p", { className: "analyzer__hint", children: "Provide the required inputs to run analysis." }) : null, error ? _jsx("p", { className: "analyzer__error", children: error }) : null] }), _jsxs("section", { className: "analyzer__section analyzer__section--results", children: [_jsx("h2", { className: "analyzer__section-title", children: "Analysis results" }), response ? (_jsx(ResultsTabs, { activeTab: activeTab, onChange: setActiveTab, tabs: resultTabs })) : (_jsx("div", { className: "results-placeholder results-placeholder--empty", children: _jsx("p", { children: "Run an analysis to view explain plans, optimizer suggestions, and AST." }) }))] })] }));
}
