import React, { useMemo } from 'react';

export const ParticleBackground: React.FC = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 28 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      animationDuration: `${8 + Math.random() * 12}s`,
      animationDelay: `${Math.random() * 10}s`,
      width: `${1 + Math.random() * 2.5}px`,
      height: `${1 + Math.random() * 2.5}px`
    }));
  }, []);

  return (
    <div className="particles" aria-hidden="true">
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: p.left,
            animationDuration: p.animationDuration,
            animationDelay: p.animationDelay,
            width: p.width,
            height: p.height
          }}
        />
      ))}
    </div>
  );
};
