import React from 'react';

const Card = ({ children, title, icon: Icon, description }) => (
  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
    {(title || Icon) && (
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-5 h-5 text-indigo-600" />}
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        </div>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export default Card;
