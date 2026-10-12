import React, { useRef } from 'react';

export function SpotlightCard({ as: Component = 'div', className = '', children, ...props }) {
  const cardRef = useRef(null);

  const updateSpotlight = (event) => {
    const bounds = cardRef.current?.getBoundingClientRect();
    if (!bounds) return;
    cardRef.current.style.setProperty('--spotlight-x', `${event.clientX - bounds.left}px`);
    cardRef.current.style.setProperty('--spotlight-y', `${event.clientY - bounds.top}px`);
  };

  return (
    <Component
      ref={cardRef}
      className={`spotlight-card ${className}`}
      onPointerMove={updateSpotlight}
      {...props}
    >
      {children}
    </Component>
  );
}
