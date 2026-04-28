/*
  Card — simple card wrapper.
  Converted from friend's TS. Uses design tokens.
*/

import React from 'react';

const Card = ({ children, className = '', onClick }) => {
  return (
    <div
      className={`bg-surface rounded-lg shadow-card border border-edge overflow-hidden ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
