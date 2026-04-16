import React from 'react';
import logoImg from '../assets/jiofinance-app-icon-hd.png';

export default function Logo({ size = 36, className = '' }) {
  return (
    <img
      src={logoImg}
      alt="Jio Finance"
      width={size}
      height={size}
      className={className}
      style={{ borderRadius: '22%', objectFit: 'cover' }}
    />
  );
}
