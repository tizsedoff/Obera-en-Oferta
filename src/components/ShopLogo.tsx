import React from 'react';

interface ShopLogoProps {
  logo?: string;
  className?: string;
  fallbackSize?: string;
}

export default function ShopLogo({ logo, className = "text-xl", fallbackSize = "w-8 h-8" }: ShopLogoProps) {
  if (!logo) {
    return <span className={className}>🏪</span>;
  }

  const isUrl = logo.startsWith('http://') || 
                logo.startsWith('https://') || 
                logo.startsWith('/') || 
                logo.startsWith('data:image');

  if (isUrl) {
    return (
      <img
        src={logo}
        alt="Logo"
        className={`${fallbackSize} object-cover rounded-xl shrink-0`}
        referrerPolicy="no-referrer"
      />
    );
  }

  return <span className={className}>{logo}</span>;
}
