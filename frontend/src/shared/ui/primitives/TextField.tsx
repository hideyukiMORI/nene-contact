import { useId, type InputHTMLAttributes, type ReactNode, type Ref } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | undefined;
  // React 19 passes ref as a regular prop; React Hook Form's register() supplies it.
  ref?: Ref<HTMLInputElement>;
}

export function TextField({ label, error, ref, ...props }: TextFieldProps): ReactNode {
  const id = useId();
  const errorId = `${id}-error`;
  return (
    <div className="nc-field">
      <label className="nc-label" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className="nc-input"
        aria-invalid={error !== undefined}
        aria-describedby={error !== undefined ? errorId : undefined}
        {...props}
      />
      {error !== undefined ? (
        <span id={errorId} className="nc-field-error">
          {error}
        </span>
      ) : null}
    </div>
  );
}
