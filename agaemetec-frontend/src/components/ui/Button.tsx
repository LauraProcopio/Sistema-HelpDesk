import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline' | 'danger';
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  // Classes base (comuns a todos os botões)
  const baseStyles = "px-4 py-2 font-semibold transition-all duration-200 active:scale-95 shadow-sm rounded-std";
  
  // Variações de estilo baseadas na nossa paleta
  const variants = {
    primary: "bg-brand-primary text-white hover:bg-brand-accent",
    outline: "border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white",
    danger: "bg-error text-white hover:opacity-90"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`} 
      {...props}
    >
      {children}
    </button>
  );
}