import React from 'react';

const Card = ({ 
  children, 
  className = '',
  hover = false,
  onClick,
  ...props 
}) => {
  const baseStyles = 'bg-gray-800 rounded-lg shadow-md border border-gray-700 transition-all';
  const hoverStyles = hover ? 'hover:shadow-lg hover:border-gray-600 cursor-pointer' : '';
  
  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;
