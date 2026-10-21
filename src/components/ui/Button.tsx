import React, { forwardRef } from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    className = '',
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref
) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none rounded-md';

  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }[size];

  const variantStyles = {
    primary:
      'bg-primary text-neutral-text hover:bg-primary-hover shadow-sm font-semibold active:translate-y-px',
    secondary:
      'bg-secondary text-white hover:opacity-95 shadow-sm font-semibold active:translate-y-px',
    outline:
      'border border-neutral-border bg-neutral-surface text-neutral-text hover:bg-neutral-subtle active:translate-y-px',
    ghost:
      'text-neutral-text hover:bg-neutral-subtle hover:text-neutral-text',
    danger:
      'bg-status-danger text-white hover:opacity-95 shadow-sm font-medium active:translate-y-px',
  }[variant];

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});

export default Button;
