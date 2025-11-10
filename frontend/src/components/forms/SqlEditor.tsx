interface SqlEditorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export function SqlEditor({ value, onChange, label = 'SQL Query', placeholder, error }: SqlEditorProps) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      <textarea
        className={`form-field__textarea form-field__textarea--monospace${error ? ' form-field__textarea--error' : ''}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={10}
        spellCheck={false}
        placeholder={placeholder ?? 'SELECT * FROM users WHERE age > 20;'}
      />
      {error ? <span className="form-field__error">{error}</span> : null}
    </label>
  );
}
