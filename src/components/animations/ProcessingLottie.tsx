import React, { useEffect, useState } from 'react';
import Lottie from 'lottie-react';

// Simple processing animation data
const processingAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 60,
  w: 100,
  h: 100,
  nm: "processing",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "circle",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { 
          a: 1, 
          k: [
            { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 0, s: [0] },
            { t: 60, s: [360] }
          ] 
        },
        p: { a: 0, k: [50, 50, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "el",
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [40, 40] }
            },
            {
              ty: "st",
              c: { a: 0, k: [0.5, 0.7, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 3 },
              lc: 2,
              lj: 2
            },
            {
              ty: "tr",
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 }
            }
          ]
        }
      ],
      ip: 0,
      op: 60,
      st: 0,
      bm: 0
    }
  ]
};

interface ProcessingLottieProps {
  size?: number;
  className?: string;
  color?: string;
}

export const ProcessingLottie: React.FC<ProcessingLottieProps> = ({ 
  size = 40, 
  className = "",
  color = "hsl(217, 91%, 60%)"
}) => {
  const [animationData, setAnimationData] = useState(processingAnimationData);

  useEffect(() => {
    // Dynamically update color if needed
    const updatedData = { ...processingAnimationData };
    setAnimationData(updatedData);
  }, [color]);

  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <Lottie
        animationData={animationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};