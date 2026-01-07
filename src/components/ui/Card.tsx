import { ReactNode } from 'react';
import clsx from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'glow' | 'glass' | 'gradient-border';
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  as?: 'div' | 'article' | 'section';
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

export function Card({
  children,
  className,
  variant = 'default',
  hover = true,
  padding = 'md',
  as: Component = 'div',
}: CardProps) {
  const baseClasses = clsx(
    'rounded-xl transition-all duration-200',
    paddingClasses[padding],
    {
      // Default variant
      'bg-slate-800 border border-slate-700/50': variant === 'default' || variant === 'glow',
      // Glass variant - frosted glass effect
      'glass': variant === 'glass',
      // Gradient border variant
      'gradient-border': variant === 'gradient-border',
    },
    hover && {
      'hover:border-slate-600 hover:shadow-lg hover:-translate-y-0.5': variant === 'default',
      'hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)]': variant === 'glow',
      'hover:bg-slate-800/90': variant === 'glass',
      'hover:shadow-lg hover:-translate-y-0.5': variant === 'gradient-border',
    },
    className
  );

  return <Component className={baseClasses}>{children}</Component>;
}

// Card Header component
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
}

export function CardHeader({ children, className, action }: CardHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between mb-4', className)}>
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

// Card Title component
interface CardTitleProps {
  children: ReactNode;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
}

export function CardTitle({ children, className, as: Component = 'h3' }: CardTitleProps) {
  return (
    <Component className={clsx('text-lg font-semibold text-white', className)}>
      {children}
    </Component>
  );
}

// Card Description component
interface CardDescriptionProps {
  children: ReactNode;
  className?: string;
}

export function CardDescription({ children, className }: CardDescriptionProps) {
  return (
    <p className={clsx('text-sm text-slate-400 mt-1', className)}>
      {children}
    </p>
  );
}

// Card Content component
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={clsx(className)}>{children}</div>;
}

// Card Footer component
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={clsx('mt-4 pt-4 border-t border-slate-700/50', className)}>
      {children}
    </div>
  );
}

// Stat Card - specialized for dashboard stats
interface StatCardProps {
  label: string;
  value: string | number;
  icon?: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const colorClasses = {
  default: 'text-white',
  success: 'text-emerald-400',
  warning: 'text-amber-400',
  danger: 'text-rose-400',
  info: 'text-blue-400',
};

const iconBgClasses = {
  default: 'bg-slate-700',
  success: 'bg-emerald-500/20',
  warning: 'bg-amber-500/20',
  danger: 'bg-rose-500/20',
  info: 'bg-blue-500/20',
};

export function StatCard({ label, value, icon, trend, color = 'default', className }: StatCardProps) {
  return (
    <Card className={clsx('relative overflow-hidden', className)} variant="default">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 mb-1">{label}</p>
          <p className={clsx('text-2xl font-bold stat-number', colorClasses[color])}>
            {value}
          </p>
          {trend && (
            <p className={clsx(
              'text-xs mt-1 flex items-center gap-1',
              trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
            )}>
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{Math.abs(trend.value)}%</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={clsx(
            'p-2 rounded-lg',
            iconBgClasses[color]
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
