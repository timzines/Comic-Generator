import React from 'react';

type BaseProps = {
  label?: string;
  error?: string;
  className?: string;
};
type InputProps = BaseProps & React.InputHTMLAttributes<HTMLInputElement> & { multiline?: false };
type TextareaProps = BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement> & { multiline: true };

export function Input(props: InputProps | TextareaProps) {
  const { label, error, className = '' } = props;
  const base =
    'w-full bg-surface border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-accent transition placeholder:text-white/30';

  return (
    <div>
      {label && <label className="block text-xs text-white/60 mb-1">{label}</label>}
      {props.multiline ? (
        <textarea
          {...(props as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
          className={`${base} min-h-[120px] ${className}`}
        />
      ) : (
        <input {...(props as React.InputHTMLAttributes<HTMLInputElement>)} className={`${base} ${className}`} />
      )}
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
    </div>
  );
}
