import { SqlEditor } from './SqlEditor';

export interface ManualFormValues {
  query: string;
  explainJson: string;
}

interface ManualFormProps {
  values: ManualFormValues;
  onChange: (patch: Partial<ManualFormValues>) => void;
  errors?: Partial<Record<keyof ManualFormValues, string>>;
}

export function ManualForm({ values, onChange, errors }: ManualFormProps) {
  return (
    <div className="mode-form">
      <SqlEditor value={values.query} onChange={(query) => onChange({ query })} error={errors?.query} />

      <label className="form-field">
        <span className="form-field__label">EXPLAIN JSON (FORMAT JSON ...)</span>
        <textarea
          className={`form-field__textarea form-field__textarea--monospace${
            errors?.explainJson ? ' form-field__textarea--error' : ''
          }`}
          rows={14}
          value={values.explainJson}
          onChange={(event) => onChange({ explainJson: event.target.value })}
          placeholder="Paste EXPLAIN (FORMAT JSON) output here"
        />
        {errors?.explainJson ? <span className="form-field__error">{errors.explainJson}</span> : null}
      </label>
    </div>
  );
}
