import React from 'react';

export const FormField = ({
  id,
  label,
  error,
  hint,
  required = false,
  children,
  type = 'text',
  value,
  onChange,
  placeholder,
  disabled = false,
  ...rest
}) => {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="form-group">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && (
            <span aria-hidden="true" style={{ color: 'var(--color-danger)', marginLeft: '4px' }}>
              *
            </span>
          )}
        </label>
      )}

      {children ? (
        React.isValidElement(children) ? (
          React.cloneElement(children, {
            id,
            'aria-invalid': Boolean(error),
            'aria-describedby': describedBy,
            required,
            disabled,
            ...children.props,
          })
        ) : (
          children
        )
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className="form-input"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...rest}
        />
      )}

      {hint && !error && (
        <div id={hintId} className="form-hint">
          {hint}
        </div>
      )}

      {error && (
        <div id={errorId} className="form-error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

export default FormField;
