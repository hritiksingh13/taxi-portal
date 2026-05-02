import React, { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

export const Label = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(
  ({ className = '', ...props }, ref) => {
    return <label ref={ref} className={`label ${className}`} {...props} />;
  }
);
Label.displayName = 'Label';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`input-field ${
          error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/10' : ''
        } ${className}`}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`input-field resize-none ${
          error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/10' : ''
        } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, wrapperClassName = '', children, ...props }, ref) => {
    return (
      <div className={`relative ${wrapperClassName}`}>
        <select
          ref={ref}
          className={`input-field appearance-none pr-9 ${
            error ? 'border-rose-500/50 focus:border-rose-500/50 focus:ring-rose-500/10' : ''
          } ${className}`}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none"
        />
      </div>
    );
  }
);
Select.displayName = 'Select';

export function FormInput({ label, id, containerClassName = '', ...props }: InputProps & { label?: React.ReactNode; containerClassName?: string }) {
  return (
    <div className={containerClassName}>
      {label && <Label htmlFor={id || props.name}>{label}</Label>}
      <Input id={id || props.name} {...props} />
    </div>
  );
}

export function FormTextarea({ label, id, containerClassName = '', ...props }: TextareaProps & { label?: React.ReactNode; containerClassName?: string }) {
  return (
    <div className={containerClassName}>
      {label && <Label htmlFor={id || props.name}>{label}</Label>}
      <Textarea id={id || props.name} {...props} />
    </div>
  );
}

export function FormSelect({ label, id, containerClassName = '', options, placeholder, ...props }: SelectProps & { label?: React.ReactNode; containerClassName?: string; options?: {value: string, label: string}[]; placeholder?: string }) {
  return (
    <div className={containerClassName}>
      {label && <Label htmlFor={id || props.name}>{label}</Label>}
      <Select id={id || props.name} {...props}>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((o) => (
          <option key={o.value} value={o.value} className="bg-slate-800">
            {o.label}
          </option>
        ))}
        {props.children}
      </Select>
    </div>
  );
}
