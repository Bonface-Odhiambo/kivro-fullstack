import React from 'react';
import { Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'footer' | 'dashboard';
  to?: string;
  showIcon?: boolean;
}

const sizeClasses = { sm: 'h-8', md: 'h-12', lg: 'h-16', xl: 'h-20' };

const Logo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  variant = 'default',
  to = '/',
  showIcon = false,
}) => {
  const { tenant } = useTenant();

  const logoSrc = tenant.logo_url || '/kivro-logo.jpg';
  const altText = `${tenant.app_name} Logo`;

  if (variant === 'default' && showIcon) {
    return (
      <Link to={to} className={`inline-flex items-center gap-3 group ${className}`}>
        <div className="relative">
          <div
            className="absolute -inset-1 rounded-xl blur opacity-20 group-hover:opacity-30 transition duration-300"
            style={{ background: `linear-gradient(to right, ${tenant.primary_color}, ${tenant.primary_color}99)` }}
          />
          <img
            src={logoSrc}
            alt={altText}
            className={`relative ${sizeClasses[size]} w-auto object-contain rounded-lg shadow-md ring-1 ring-white/50 group-hover:scale-105 transition-all duration-300`}
          />
        </div>
      </Link>
    );
  }

  return (
    <Link to={to} className={`inline-flex items-center hover:opacity-80 transition-opacity ${className}`}>
      <img
        src={logoSrc}
        alt={altText}
        className={`${sizeClasses[size]} w-auto object-contain ${variant === 'footer' ? 'rounded-lg' : ''}`}
      />
    </Link>
  );
};

export default Logo;
