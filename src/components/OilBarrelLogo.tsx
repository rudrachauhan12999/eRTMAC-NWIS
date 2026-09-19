import React from 'react';

interface OilBarrelLogoProps {
  className?: string;
  size?: number | string;
  alt?: string;
}

export const OilBarrelLogo: React.FC<OilBarrelLogoProps> = ({ 
  className = 'w-10 h-10', 
  size,
  alt = 'eRTMAC-NWIS Crude Oil Intelligence Logo'
}) => {
  return (
    <img
      src="/oil_barrel_logo.svg"
      alt={alt}
      className={`object-contain select-none shrink-0 ${className}`}
      style={size ? { width: size, height: size } : undefined}
      referrerPolicy="no-referrer"
    />
  );
};
