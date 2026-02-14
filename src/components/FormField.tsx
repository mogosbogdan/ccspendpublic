import type { ChangeEvent } from 'react';

interface FormFieldProps {
  label: string;
  type: 'text' | 'number' | 'date';
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  step?: string;
}

export function FormField({
  label,
  type,
  value,
  onChange,
  placeholder,
  min,
  step,
}: FormFieldProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <label>
      {label}
      <input
        type={type}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        min={min}
        step={step}
      />
    </label>
  );
}
