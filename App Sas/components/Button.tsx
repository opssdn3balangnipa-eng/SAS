import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  className = '',
  size = 'md',
  fullWidth = false,
}) => {
  const baseStyles = "font-bold rounded-2xl shadow-md transform transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-primary text-white hover:bg-sky-400 focus:ring-sky-300 shadow-sky-200",
    secondary: "bg-secondary text-teal-800 hover:bg-emerald-300 focus:ring-emerald-200 shadow-emerald-100",
    accent: "bg-accent text-yellow-900 hover:bg-yellow-300 focus:ring-yellow-200 shadow-yellow-100",
    outline: "bg-white border-2 border-primary text-primary hover:bg-sky-50 shadow-sm",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-xl",
  };

  const width = fullWidth ? "w-full" : "";

  return (
    <button
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${width} ${className}`}
    >
      {children}
    </button>
  );
};