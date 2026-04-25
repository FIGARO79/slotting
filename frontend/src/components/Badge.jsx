import React from 'react';

const Badge = ({ children, variant = 'gray' }) => {
  const variants = {
    Alta: 'bg-green-100 text-green-800 border-green-200',
    Media: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Baja: 'bg-red-100 text-red-800 border-red-200',
    gray: 'bg-gray-100 text-gray-800 border-gray-200'
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${variants[children] || variants.gray}`}>
      {children}
    </span>
  );
};

export default Badge;
