import React from 'react';

export interface CouponBadgeProps {
  children: React.ReactNode;
  variant?: 'terracotta' | 'marigold' | 'stone' | 'forest';
  className?: string;
}

export function CouponBadge({
  children,
  variant = 'terracotta',
  className = '',
}: CouponBadgeProps) {
  const variantStyles = {
    terracotta: 'bg-secondary-subtle text-secondary border-secondary',
    marigold: 'bg-primary-subtle text-primary-hover border-primary',
    stone: 'bg-neutral-subtle text-neutral-text border-neutral-border-strong',
    forest: 'bg-status-success-subtle text-status-success border-status-success',
  }[variant];

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-sm font-mono text-xs font-bold tracking-wider uppercase border border-dashed ${variantStyles} ${className}`}
    >
      {children}
    </span>
  );
}

export interface StatusPillProps {
  children: React.ReactNode;
  status?: 'neutral' | 'success' | 'warning' | 'danger';
  className?: string;
}

export function StatusPill({
  children,
  status = 'neutral',
  className = '',
}: StatusPillProps) {
  const statusStyles = {
    neutral: 'bg-neutral-subtle text-neutral-text border-neutral-border',
    success: 'bg-status-success-subtle text-status-success border-status-success/30',
    warning: 'bg-status-warning-subtle text-status-warning border-status-warning/30',
    danger: 'bg-status-danger-subtle text-status-danger border-status-danger/30',
  }[status];

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyles} ${className}`}
    >
      {children}
    </span>
  );
}
