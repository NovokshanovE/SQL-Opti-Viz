import { InputHTMLAttributes } from 'react';
import clsx from 'clsx';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  helperText?: string;
  error?: string;
}

export function TextField({ label, helperText, error, ...rest }: TextFieldProps) {
  return (
    <label className="form-field">
      <span className="form-field__label">{label}</span>
      <input className={clsx('form-field__input', error && 'form-field__input--error')} {...rest} />
      {error ? <span className="form-field__error">{error}</span> : null}
      {!error && helperText ? <span className="form-field__helper">{helperText}</span> : null}
    </label>
  );
}
