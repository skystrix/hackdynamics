
import React from 'react';
import { BriefcaseIcon } from 'lucide-react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div className={`text-primary ${className}`}>
      <BriefcaseIcon className="w-full h-full" />
    </div>
  );
};

export default Logo;
