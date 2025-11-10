import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { SqlEditor } from './SqlEditor';
export function ManualForm({ values, onChange, errors }) {
    return (_jsxs("div", { className: "mode-form", children: [_jsx(SqlEditor, { value: values.query, onChange: (query) => onChange({ query }), error: errors?.query }), _jsxs("label", { className: "form-field", children: [_jsx("span", { className: "form-field__label", children: "EXPLAIN JSON (FORMAT JSON ...)" }), _jsx("textarea", { className: `form-field__textarea form-field__textarea--monospace${errors?.explainJson ? ' form-field__textarea--error' : ''}`, rows: 14, value: values.explainJson, onChange: (event) => onChange({ explainJson: event.target.value }), placeholder: "Paste EXPLAIN (FORMAT JSON) output here" }), errors?.explainJson ? _jsx("span", { className: "form-field__error", children: errors.explainJson }) : null] })] }));
}
