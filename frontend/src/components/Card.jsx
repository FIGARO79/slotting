import React from 'react';

const Card = ({ children, title, description }) => (
  <div className="py-6 border-t border-black">
    {title && (
      <div className="mb-6">
        <h3 className="text-lg font-black text-black uppercase tracking-tighter">{title}</h3>
        {description && <p className="text-xs font-bold text-black mt-1 uppercase">{description}</p>}
      </div>
    )}
    <div>{children}</div>
  </div>
);

export default Card;
