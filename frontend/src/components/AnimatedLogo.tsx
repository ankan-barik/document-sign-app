import { useState, useEffect } from "react";
import { Edit3, CheckCircle2 } from "lucide-react";

interface AnimatedLogoProps {
  size?: number;
  showText?: boolean;
}

export const AnimatedLogo = ({ size = 64, showText = false }: AnimatedLogoProps) => {
  const [time, setTime] = useState(0);
  const [hover, setHover] = useState(false);
  const [isFlowing, setIsFlowing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(prev => prev + 0.06);
    }, 16);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const flowInterval = setInterval(() => {
      setIsFlowing(prev => !prev);
    }, 4000);

    return () => clearInterval(flowInterval);
  }, []);

  const floatY = Math.sin(time * 0.7) * 4;
  const rotateZ = Math.sin(time * 0.5) * 8;
  const flowProgress = (Math.sin(time * 1.2) + 1) / 2;

  return (
    <div className="flex items-center gap-3">
      {/* Logo Container */}
      <div 
        className="relative cursor-pointer select-none"
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{ 
          width: size, 
          height: size,
          transform: `translateY(${floatY}px) rotate(${rotateZ}deg)`,
          transition: 'all 0.3s ease'
        }}
      >
        {/* Flow trail effect */}
        <div 
          className="absolute inset-0 rounded-full opacity-70"
          style={{
            background: `conic-gradient(from ${time * 60}deg, 
              rgba(236, 72, 153, 0.5) 0%, 
              rgba(251, 146, 60, 0.7) 25%, 
              rgba(34, 197, 94, 0.5) 50%, 
              rgba(59, 130, 246, 0.6) 75%, 
              rgba(236, 72, 153, 0.5) 100%)`,
            filter: 'blur(15px)',
            transform: `scale(${hover ? 1.5 : 1.2})`,
            transition: 'transform 0.4s ease'
          }}
        />
        
        {/* Main logo circle */}
        <div 
          className="relative w-full h-full rounded-full overflow-hidden"
          style={{ 
            background: `linear-gradient(135deg, 
              #ec4899 0%, 
              #f59e0b 35%, 
              #10b981 70%, 
              #3b82f6 100%)`,
            transform: `scale(${hover ? 1.08 : 1})`,
            boxShadow: `
              0 15px 35px rgba(236, 72, 153, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              0 0 30px rgba(251, 146, 60, 0.3),
              0 5px 15px rgba(34, 197, 94, 0.2)
            `,
            transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)'
          }}
        >
          {/* Inner glow ring */}
          <div 
            className="absolute inset-2 rounded-full"
            style={{
              background: `radial-gradient(circle at 30% 30%, 
                rgba(255, 255, 255, 0.6) 0%, 
                rgba(255, 255, 255, 0.2) 40%, 
                rgba(251, 146, 60, 0.1) 70%, 
                transparent 90%)`,
            }}
          />
          
          {/* Flowing signature path */}
          <div className="absolute inset-0 flex items-center justify-center">
            <svg
              width={size * 0.5}
              height={size * 0.3}
              viewBox="0 0 80 40"
              className="overflow-visible"
            >
              {/* Background path */}
              <path
                d="M10,25 Q25,10 40,20 Q55,30 70,15"
                fill="none"
                stroke="rgba(255, 255, 255, 0.2)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              
              {/* Animated flowing path */}
              <path
                d="M10,25 Q25,10 40,20 Q55,30 70,15"
                fill="none"
                stroke="rgba(255, 255, 255, 1)"
                strokeWidth="2.5"
                strokeLinecap="round"
                style={{
                  strokeDasharray: '20 10',
                  strokeDashoffset: isFlowing ? -time * 10 : 0,
                  filter: 'drop-shadow(0 0 6px rgba(251, 146, 60, 0.8)) drop-shadow(0 0 12px rgba(236, 72, 153, 0.4))',
                  transition: 'stroke-dashoffset 0.5s ease'
                }}
              />
              
              {/* Flow particles */}
              <circle
                cx={10 + flowProgress * 60}
                cy={25 + Math.sin(flowProgress * Math.PI * 2) * 8}
                r="2"
                fill="white"
                style={{
                  opacity: isFlowing ? 1 : 0.4,
                  filter: 'drop-shadow(0 0 4px rgba(251, 146, 60, 0.9)) drop-shadow(0 0 8px rgba(236, 72, 153, 0.6))'
                }}
              />
            </svg>
          </div>
          
          {/* Center status icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
              {isFlowing ? (
                <Edit3 
                  size={size * 0.25} 
                  className="text-white opacity-80"
                  style={{
                    transform: `rotate(${Math.sin(time * 2) * 10}deg)`,
                    filter: 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.3))'
                  }}
                />
              ) : (
                <CheckCircle2 
                  size={size * 0.25} 
                  className="text-white"
                  style={{
                    transform: 'scale(1.1)',
                    filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                  }}
                />
              )}
            </div>
          </div>
          
          {/* Rotating highlight */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(${time * 80}deg, 
                transparent 0%, 
                rgba(255, 255, 255, 0.2) 30%, 
                transparent 60%)`
            }}
          />
        </div>
      </div>
      
      {/* Text Logo */}
      {showText && (
        <div className="flex flex-col">
          <div className="text-2xl font-bold bg-gradient-to-r from-pink-500 via-orange-400 to-emerald-500 bg-clip-text text-transparent">
            SignFlow
          </div>
          <div className="text-xs text-gray-600 font-medium tracking-wider">
            DIGITAL SIGNATURES
          </div>
        </div>
      )}
    </div>
  );
};

export default AnimatedLogo;