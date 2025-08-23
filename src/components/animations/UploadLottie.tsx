import React from 'react';
import Lottie from 'lottie-react';

// Upload animation data
const uploadAnimationData = {
  v: "5.7.4",
  fr: 30,
  ip: 0,
  op: 90,
  w: 120,
  h: 120,
  nm: "upload",
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: "arrow",
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 0, k: 0 },
        p: { 
          a: 1,
          k: [
            { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 0, s: [60, 80, 0] },
            { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 30, s: [60, 40, 0] },
            { i: { x: [0.4], y: [1] }, o: { x: [0.6], y: [0] }, t: 60, s: [60, 80, 0] },
            { t: 90, s: [60, 80, 0] }
          ]
        },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] }
      },
      ao: 0,
      shapes: [
        {
          ty: "gr",
          it: [
            {
              ty: "sh",
              ks: {
                a: 0,
                k: {
                  i: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
                  o: [[0, 0], [0, 0], [0, 0], [0, 0], [0, 0], [0, 0]],
                  v: [[-8, 8], [0, 0], [8, 8], [4, 8], [4, 20], [-4, 20]],
                  c: true
                }
              }
            },
            {
              ty: "fl",
              c: { a: 0, k: [0.3, 0.6, 1, 1] },
              o: { a: 0, k: 100 }
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
      op: 90,
      st: 0,
      bm: 0
    }
  ]
};

interface UploadLottieProps {
  size?: number;
  className?: string;
}

export const UploadLottie: React.FC<UploadLottieProps> = ({ 
  size = 60, 
  className = ""
}) => {
  return (
    <div className={`inline-block ${className}`} style={{ width: size, height: size }}>
      <Lottie
        animationData={uploadAnimationData}
        loop={true}
        autoplay={true}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};