import React from 'react';
import styles from './Button.module.css';

/**
 * Componente Button Reutilizável
 * 
 * Props:
 * - children: ReactNode - Conteúdo do botão
 * - variant: string - Estilo do botão (primary, secondary, outline, ghost)
 * - size: string - Tamanho (sm, md, lg)
 * - isLoading: boolean - Estado de carregamento
 * - disabled: boolean - Botão desabilitado
 * - fullWidth: boolean - Largura total
 * - type: string - Tipo do botão (button, submit, reset)
 * - onClick: function - Handler de click
 * - icon: ReactNode - Ícone
 * - iconPosition: string - Posição do ícone (left, right)
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  fullWidth = false,
  type = 'button',
  onClick,
  icon,
  iconPosition = 'left',
  className = '',
  ...props
}) => {
  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    isLoading && styles.loading,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={buttonClasses}
      {...props}
    >
      {isLoading ? (
        <>
          <span className={styles.spinner}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" opacity="0.25" />
              <path d="M12 2 A10 10 0 0 1 22 12" strokeLinecap="round">
                <animateTransform 
                  attributeName="transform" 
                  type="rotate" 
                  from="0 12 12" 
                  to="360 12 12" 
                  dur="1s" 
                  repeatCount="indefinite"
                />
              </path>
            </svg>
          </span>
          <span className={styles.loadingText}>Carregando...</span>
        </>
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={styles.icon}>{icon}</span>
          )}
          <span className={styles.text}>{children}</span>
          {icon && iconPosition === 'right' && (
            <span className={styles.icon}>{icon}</span>
          )}
        </>
      )}
    </button>
  );
};

export default Button;
