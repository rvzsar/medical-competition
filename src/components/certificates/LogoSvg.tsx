import React from 'react';
import { Svg, Path } from '@react-pdf/renderer';

export const LogoSvg = () => (
  <Svg width="50" height="50" viewBox="0 0 120 123">
    <Path
      d="M60 10 C 45 10, 35 20, 35 35 C 35 45, 40 52, 45 58 L 45 70 C 45 85, 50 95, 60 100 C 70 95, 75 85, 75 70 L 75 58 C 80 52, 85 45, 85 35 C 85 20, 75 10, 60 10 Z M 60 60 C 50 60, 45 70, 45 80 C 45 90, 50 95, 60 95 C 70 95, 75 90, 75 80 C 75 70, 70 60, 60 60 Z"
      fill="#E91E63"
      stroke="#E91E63"
      strokeWidth="2"
    />
  </Svg>
);
