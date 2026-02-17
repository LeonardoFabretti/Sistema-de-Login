import React, { forwardRef } from 'react';
import styles from './Input.module.css';

/**
 * Componente Input Reutilizável
 * 
 * Props:
 * - label: string - Texto do label
 * - type: string - Tipo do input (text, email, password, etc)
 * - name: string - Nome do campo
 * - value: string - Valor controlado
 * - onChange: function - Handler de mudança
 * - onBlur: function - Handler de blur (validação)
 * - error: string - Mensagem de erro
 * - icon: ReactNode - Ícone SVG
 * - placeholder: string - Placeholder
 * - required: boolean - Campo obrigatório
 * - disabled: boolean - Campo desabilitado
 * - autoComplete: string - Autocomplete HTML5
 * - showPasswordToggle: boolean - Mostrar toggle de senha
 */
const Input = forwardRef(({
  label,
  type = 'text',
  name,
  value,
  onChange,
  onBlur,
  error,
  icon,
  placeholder,
  required = false,
  disabled = false,
  autoComplete,
  showPasswordToggle = false,
  className = '',
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const inputType = showPasswordToggle && showPassword ? 'text' : type;

  const togglePassword = () => {
    setShowPassword(prev => !prev);
  };

  return (
    <div className={`${styles.formGroup} ${className}`}>
      {label && (
        <label htmlFor={name} className={styles.label}>
          {icon && <span className={styles.labelIcon}>{icon}</span>}
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}
      
      <div className={styles.inputWrapper}>
        <input
          ref={ref}
          type={inputType}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`${styles.input} ${error ? styles.error : ''} ${disabled ? styles.disabled : ''}`}
          {...props}
        />
        
        {showPasswordToggle && (
          <button
            type="button"
            onClick={togglePassword}
            className={styles.togglePassword}
            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
            tabIndex={-1}
          >
            {showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <span id={`${name}-error`} className={styles.errorMessage} role="alert">
          {error}
        </span>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
