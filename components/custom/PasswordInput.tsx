// components/custom/PasswordInput.tsx
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isHidden?: boolean;
  registerProps?: any;
  inputClassName?: string;
}

export const PasswordInput = ({ label, error, isHidden = true, registerProps, inputClassName, ...rest }: PasswordInputProps) => {
  const [hidden, setHidden] = useState(isHidden);

  return (
    <div className="space-y-1 w-full">
      <label className="block text-sm font-medium text-gray-700">
        {label} <span className="text-red-500">*</span>
      </label>
      <div className="relative">
        <Input
          type={hidden ? 'password' : 'text'}
          className={cn(inputClassName,"pr-10")}
          {...registerProps}
          {...rest}
        />
        <button
          type="button"
          onClick={() => setHidden(!hidden)}
          className="absolute inset-y-0 right-2 flex items-center text-gray-500"
        >
          {hidden ? <Eye className="h-4 w-4 cursor-pointer" /> : <EyeOff className="h-4 w-4 cursor-pointer" />}
        </button>
      </div>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
};