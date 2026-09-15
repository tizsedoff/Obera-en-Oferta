import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
}

export default function BrandLogo({ className = "h-11 sm:h-12 w-auto" }: BrandLogoProps) {
  return (
    <img
      src="/logo-obera-en-oferta.png"
      alt="Oberá en Oferta"
      className={`${className} object-contain select-none`}
      draggable={false}
    />
  );
}
