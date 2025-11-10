import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function SqlEditor({ value, onChange, label = 'SQL Query', placeholder, error }) {
    return (_jsxs("label", { className: "form-field", children: [_jsx("span", { className: "form-field__label", children: label }), _jsx("textarea", { className: `form-field__textarea form-field__textarea--monospace${error ? ' form-field__textarea--error' : ''}`, value: value, onChange: (event) => onChange(event.target.value), rows: 10, spellCheck: false, placeholder: placeholder ?? 'SELECT * FROM users WHERE age > 20;' }), error ? _jsx("span", { className: "form-field__error", children: error }) : null] }));
}
