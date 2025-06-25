// components/custom/PasswordInput.tsx
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isHidden?: boolean;
  registerProps?: any;
  inputClassName?: string;
  isRequiredStar?: boolean;
  placeHolder?: string;
}

export const PasswordInput = ({ label, error, isHidden = true, registerProps, inputClassName, isRequiredStar, placeHolder, ...rest }: PasswordInputProps) => {
  const [hidden, setHidden] = useState(isHidden);
  const t = useTranslations('SignInPage');
  return (
    <div className="space-y-1 w-full">
      <label className="block text-sm font-medium text-gray-700">
        {t(label)} {isRequiredStar && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <Input
          type={hidden ? 'password' : 'text'}
          className={cn(inputClassName,"pr-10")}
          placeholder={placeHolder && placeHolder.length>0?t(placeHolder):''}
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