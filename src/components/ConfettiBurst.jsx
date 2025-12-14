import { useState, useEffect, useRef } from 'react';
import { CheckIcon } from './Icons';

// SVG Shape Components (unchanged)
const Snowflake = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M12 2v20M2 12h20M6 6l12 12M18 6L6 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

const Star = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

const Circle = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const MiniCheck = ({ size, color }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <path
      d="M5 13l4 4L19 7"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// Shape selector (omitting for brevity, no changes here)
const shapes = ['snowflake', 'star', 'circle', 'checkmark'];
const christmasColors = ['#31A24C', '#FFD700', '#FFFFFF', '#FF6B6B', '#2D7A3E'];

const ParticleComponent = ({ particle }) => {
  // ... [ParticleComponent logic remains the same] ...
  const ShapeComponent = {
    snowflake: Snowflake,
    star: Star,
    circle: Circle,
    checkmark: MiniCheck
  }[particle.shape];

  return (
    <div
      style={{
        position: 'absolute',
        left: particle.x,
        top: particle.y,
        transform: `translate(-50%, -50%) rotate(${particle.rotation}deg) scale(${particle.scale})`,
        opacity: particle.opacity,
        pointerEvents: 'none',
        zIndex: 100
      }}
    >
      <ShapeComponent size={particle.size} color={particle.color} />
    </div>
  );
};

function ConfettiBurst({ isActive, triggerId, originX, originY, onComplete }) {
  // 🟢 FIX: Keep particles in state for rendering, but introduce a mutable ref 
  // for the physics data to make the closure stable.
  const [particles, setParticles] = useState([]);
  const particleDataRef = useRef([]); // Mutable data for physics loop
  
  const animationRef = useRef(null);
  const startTimeRef = useRef(null);

  // 🟢 NEW useEffect: This effect only manages the animation start and stop.
  useEffect(() => {
    // 1. Activation Check (Runs ONLY when triggerId changes AND is active)
    if (!isActive || triggerId === 0) {
        // Cleanup all references if inactive
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setParticles([]);
        particleDataRef.current = [];
        return;
    }

    // --- Animation Start Logic (Runs ONCE per triggerId) ---

    // Initialize particles directly into the mutable ref
    particleDataRef.current = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: originX,
      y: originY,
      vx: (Math.random() - 0.5) * 16,
      vy: Math.random() * -15 - 8,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 30,
      scale: Math.random() * 0.6 + 0.6,
      opacity: 1,
      color: christmasColors[Math.floor(Math.random() * christmasColors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 16 + 12,
      lifetime: 0
    }));

    // Trigger the initial render
    setParticles(particleDataRef.current);
    startTimeRef.current = Date.now();

    // Physics simulation
    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      
      const updatedParticles = particleDataRef.current.map(p => {
        // --- PHYSICS CALCULATION ---
        const newVx = p.vx * 0.98;
        const newVy = p.vy + 0.3;
        const newX = p.x + newVx;
        const newY = p.y + newVy;
        const newRotation = p.rotation + p.rotationSpeed;
        const newRotationSpeed = p.rotationSpeed * 0.99;
        
        const fadeStartTime = 1500;
        const fadeDuration = 1500;
        let newOpacity = 1;
        if (elapsed > fadeStartTime) {
          newOpacity = Math.max(0, 1 - (elapsed - fadeStartTime) / fadeDuration);
        }

        return {
          ...p,
          x: newX,
          y: newY,
          vx: newVx,
          vy: newVy,
          rotation: newRotation,
          rotationSpeed: newRotationSpeed,
          opacity: newOpacity,
          lifetime: elapsed
        };
      });

      // Update the mutable ref with new positions and remove faded particles
      particleDataRef.current = updatedParticles.filter(p => p.opacity > 0.01);
      
      // 🟢 CRITICAL FIX: Only update the state *if the array reference changes* // or if we're near the end. For now, we update every frame for the original implementation.
      // The true fix is forcing the DOM update.

      // 🟢 SOLUTION: We must force a re-render from the loop to display the changes.
      setParticles(particleDataRef.current);
      
      // Continue animation if particles remain and under 3 seconds
      if (elapsed < 3000 && particleDataRef.current.length > 0) {
        animationRef.current = requestAnimationFrame(animate);
      } else {
        // Animation finished
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
            animationRef.current = null;
        }
        setParticles([]); // Final cleanup for render
        onComplete?.();
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      // 🟢 CRITICAL CLEANUP: When the component is torn down (which the old bug did),
      // we must ensure the RAF is cancelled.
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  // We use triggerId to ensure this effect runs only when the animation is intentionally started.
  }, [isActive, triggerId, originX, originY, onComplete]);

  if (!isActive || particles.length === 0) return null;

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 100 }}>
      {particles.map(particle => (
        <ParticleComponent key={particle.id} particle={particle} />
      ))}
    </div>
  );
}

export default ConfettiBurst;