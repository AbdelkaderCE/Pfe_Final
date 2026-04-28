/*
  Skeleton — loading placeholder component.
  Uses design-system tokens (surface-300) instead of generic gray.
*/

import React from 'react';

const Skeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-surface-300 rounded ${className}`} />
  );
};

export default Skeleton;
