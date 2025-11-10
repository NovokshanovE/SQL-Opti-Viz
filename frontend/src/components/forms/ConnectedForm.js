import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { SqlEditor } from './SqlEditor';
import { TextField } from './TextField';
const defaultPort = '5432';
export function buildConnectionString(values) {
    const { host, port, database, username, password } = values;
    if (!host || !database || !username) {
        return '';
    }
    const safePassword = password ? `:${encodeURIComponent(password)}` : '';
    const safePort = port || defaultPort;
    return `postgres://${encodeURIComponent(username)}${safePassword}@${host}:${safePort}/${database}`;
}
export function ConnectedForm({ values, onChange, errors }) {
    const connectionString = useMemo(() => buildConnectionString(values), [values]);
    return (_jsxs("div", { className: "mode-form", children: [_jsxs("div", { className: "mode-form__grid", children: [_jsx(TextField, { label: "Host", placeholder: "db.internal", value: values.host, onChange: (event) => onChange({ host: event.target.value }), error: errors?.host, required: true }), _jsx(TextField, { label: "Port", placeholder: defaultPort, value: values.port, onChange: (event) => onChange({ port: event.target.value }), inputMode: "numeric", pattern: "\\\\d*", error: errors?.port }), _jsx(TextField, { label: "Database", placeholder: "app", value: values.database, onChange: (event) => onChange({ database: event.target.value }), error: errors?.database, required: true }), _jsx(TextField, { label: "Username", placeholder: "postgres", value: values.username, onChange: (event) => onChange({ username: event.target.value }), error: errors?.username, required: true }), _jsx(TextField, { label: "Password", type: "password", value: values.password, onChange: (event) => onChange({ password: event.target.value }) })] }), _jsx(SqlEditor, { value: values.query, onChange: (query) => onChange({ query }), error: errors?.query }), _jsxs("div", { className: "mode-form__hint", children: [_jsx("span", { className: "mode-form__hint-label", children: "Connection string preview" }), _jsx("code", { className: "mode-form__hint-value", children: connectionString || 'postgres://username[:password]@host:port/database' })] })] }));
}
