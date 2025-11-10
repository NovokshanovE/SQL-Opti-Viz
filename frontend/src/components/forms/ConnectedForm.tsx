import { useMemo } from 'react';

import { SqlEditor } from './SqlEditor';
import { TextField } from './TextField';

export interface ConnectedFormValues {
  host: string;
  port: string;
  database: string;
  username: string;
  password: string;
  query: string;
}

interface ConnectedFormProps {
  values: ConnectedFormValues;
  onChange: (patch: Partial<ConnectedFormValues>) => void;
  errors?: Partial<Record<keyof ConnectedFormValues, string>>;
}

const defaultPort = '5432';

export function buildConnectionString(values: ConnectedFormValues) {
  const { host, port, database, username, password } = values;
  if (!host || !database || !username) {
    return '';
  }

  const safePassword = password ? `:${encodeURIComponent(password)}` : '';
  const safePort = port || defaultPort;
  return `postgres://${encodeURIComponent(username)}${safePassword}@${host}:${safePort}/${database}`;
}

export function ConnectedForm({ values, onChange, errors }: ConnectedFormProps) {
  const connectionString = useMemo(() => buildConnectionString(values), [values]);

  return (
    <div className="mode-form">
      <div className="mode-form__grid">
        <TextField
          label="Host"
          placeholder="db.internal"
          value={values.host}
          onChange={(event) => onChange({ host: event.target.value })}
          error={errors?.host}
          required
        />
        <TextField
          label="Port"
          placeholder={defaultPort}
          value={values.port}
          onChange={(event) => onChange({ port: event.target.value })}
          inputMode="numeric"
          pattern="\\d*"
          error={errors?.port}
        />
        <TextField
          label="Database"
          placeholder="app"
          value={values.database}
          onChange={(event) => onChange({ database: event.target.value })}
          error={errors?.database}
          required
        />
        <TextField
          label="Username"
          placeholder="postgres"
          value={values.username}
          onChange={(event) => onChange({ username: event.target.value })}
          error={errors?.username}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={values.password}
          onChange={(event) => onChange({ password: event.target.value })}
        />
      </div>

      <SqlEditor value={values.query} onChange={(query) => onChange({ query })} error={errors?.query} />

      <div className="mode-form__hint">
        <span className="mode-form__hint-label">Connection string preview</span>
        <code className="mode-form__hint-value">
          {connectionString || 'postgres://username[:password]@host:port/database'}
        </code>
      </div>
    </div>
  );
}
