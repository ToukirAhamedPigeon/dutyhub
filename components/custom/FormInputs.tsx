import { useEffect, useState, InputHTMLAttributes } from "react"
import { Input } from "@/components/ui/input";
import { FieldError, UseFormRegisterReturn } from "react-hook-form";
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from "framer-motion"
import { checkValueExists } from "@/lib/validations"
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';

interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string;
  type?: string;
  label: string;
  placeholder?: string;
  isRequired?: boolean;
  error?: FieldError;
  register: UseFormRegisterReturn;
  model: string;
}

export const BasicInput=({
    id,
    type='text',
    label,
    placeholder,
    isRequired = false,
    error,
    register,
    model,
    ...rest
  }: FormInputProps) => {
    const t = useTranslations(model);
  
    const getErrorMessage = () => {
      if (!error?.message) return null;
  
      const message = error.message.toString();
  
      // Try translating, fallback to raw message if not found
      return t(message, { default: message });
    };
  
    return (
      <div className="w-full space-y-1 ">
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {t(label, { default: label })} {isRequired && <span className="text-red-500">*</span>}
        </label>
        <Input type={type} id={id} placeholder={placeholder && t(placeholder, { default: placeholder })} {...register} {...rest}/>
        {error && <p className="text-red-500 text-sm">{getErrorMessage()}</p>}
      </div>
    );
}

interface UniqueInputProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  type?: string
  label: string
  placeholder?: string
  isRequired?: boolean
  error?: FieldError
  register: UseFormRegisterReturn
  model: string
  field: string
  watchValue: string
  uniqueErrorMessage: string
}

export const UniqueInput = ({
  id,
  type = "text",
  label,
  placeholder,
  isRequired = false,
  error,
  register,
  model,
  field,
  watchValue,
  uniqueErrorMessage,
  ...rest
}: UniqueInputProps) => {
  const t = useTranslations(model)
  const [checking, setChecking] = useState(false)
  const [exists, setExists] = useState(false)

  useEffect(() => {
    if (!watchValue || watchValue.length < 3) {
      setExists(false)
      return
    }

    const timer = setTimeout(async () => {
      setChecking(true)
      const found = await checkValueExists(model, field, watchValue)
      setExists(found)
      setChecking(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [watchValue, model, field])

  const getErrorMessage = () => {
    if (exists) {
      return t(uniqueErrorMessage, { default: uniqueErrorMessage })
    }

    if (!error?.message) return null
    const message = error.message.toString()
    return t(message, { default: message })
  }

  return (
    <div className="space-y-1 w-full relative">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {t(label, { default: label })} {isRequired && <span className="text-red-500">*</span>}
      </label>

      <Input
        type={type}
        id={id}
        placeholder={placeholder && t(placeholder, { default: placeholder })}
        {...register}
        {...rest}
        className={`${exists ? 'border-red-500' : ''} ${rest.className || ''}`}
      />

      {checking && (
        <div className="absolute right-3 top-9">
          <svg className="h-4 w-4 animate-spin text-gray-400" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path d="M4 12a8 8 0 018-8v8H4z" fill="currentColor" opacity="0.75" />
          </svg>
        </div>
      )}

      <AnimatePresence>
        {(exists || error) && (
          <motion.p
            className="text-red-500 text-sm mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
          >
            {getErrorMessage()}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  )
}

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isHidden?: boolean;
  registerProps?: any;
  inputClassName?: string;
  isRequiredStar?: boolean;
  placeholder?: string;
}

export const PasswordInput = ({ label, error, isHidden = true, registerProps, inputClassName, isRequiredStar, placeholder, ...rest }: PasswordInputProps) => {
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
          placeholder={placeholder && t(placeholder)}
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
  
