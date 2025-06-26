import { InputHTMLAttributes } from "react";
import { Input } from "@/components/ui/input";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { useTranslations } from 'next-intl';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  type?: string;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  error?: FieldError;
  register: UseFormRegisterReturn;
  translateKey: string;
}

export default function FormInput({
    id,
    type='text',
    label,
    placeholder,
    isRequired = false,
    error,
    register,
    translateKey,
    ...rest
  }: FormInputProps) {
    const t = useTranslations(translateKey);
  
    const getErrorMessage = () => {
      if (!error?.message) return null;
  
      const message = error.message.toString();
  
      // Try translating, fallback to raw message if not found
      return t(message, { default: message });
    };
  
    return (
      <div className="w-full">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {t(label, { default: label })} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <Input type={type} id={id} placeholder={placeholder && t(placeholder, { default: placeholder })} {...register} {...rest}/>
        {error && <p className="text-red-500 text-sm">{getErrorMessage()}</p>}
      </div>
    );
  }
  
