import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {/* Label seguindo a tipografia e cor do Blueprint */}
      <label className="text-xs font-bold tracking-wide uppercase text-brand-dark opacity-70">
        {label}
      </label>
      
      <input
        className={`
          w-full px-4 py-2 bg-white border border-gray-200 
          rounded-std text-sm transition-all outline-none
          focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/10
          placeholder:text-gray-400
          ${error ? 'border-error' : 'hover:border-gray-300'}
          ${className}
        `}
        {...props}
      />
      
      {/* Mensagem de erro condicional */}
      {error && (
        <span className="text-xs font-medium text-error mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}