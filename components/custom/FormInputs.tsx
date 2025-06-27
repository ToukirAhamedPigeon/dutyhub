import { useEffect, useState, useRef, InputHTMLAttributes } from "react"
import { Input } from "@/components/ui/input";
import {  Path, FieldError, UseFormRegisterReturn, UseFormSetValue } from "react-hook-form";
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from "framer-motion"
import { checkValueExists } from "@/lib/validations"
import { cn } from '@/lib/utils';
import { ChevronDown, Eye, EyeOff } from 'lucide-react';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Command, CommandInput, CommandItem, CommandList } from "../ui/command";
import { useSelect } from "@/hooks/useSelect";
import { capitalize } from "@/lib/helpers";


//Basic Input
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

//Unique Input
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

//Password Input
interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  isHidden?: boolean;
  registerProps?: any;
  inputClassName?: string;
  isRequiredStar?: boolean;
  placeholder?: string;
  model: string;
}

export const PasswordInput = ({ label, error, isHidden = true, registerProps, inputClassName, isRequiredStar, placeholder, model, ...rest }: PasswordInputProps) => {
  const [hidden, setHidden] = useState(isHidden);
  const t = useTranslations(model);
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

//Basic Select
type Option = {
  value: string;
  label: string;
  [key: string]: any;
};


interface BasicSelectProps<T extends Record<string, any>> {
  id: string
  label: string
  isRequired?: boolean
  placeholder?: string
  options: Option[]
  error?: FieldError
  setValue: UseFormSetValue<T>
  name: Path<T>
  model: string
  defaultOption?: Option
  value?: string
}

export const BasicSelect = <T extends Record<string, any>>({
  id,
  label,
  isRequired = false,
  placeholder = 'Select an option',
  options,
  error,
  setValue,
  name,
  model,
  defaultOption,
  value
}: BasicSelectProps<T>) => {
  const t = useTranslations(model)

  return (
    <div className="space-y-1 w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {t(label, { default: label })} {isRequired && <span className="text-red-500">*</span>}
      </label>

      <Select
        value={value ?? undefined}
        onValueChange={(val) => setValue(name, val === '__none__' ? '' : val as any)}
      >
        <SelectTrigger
          id={id}
          className="w-full border border-gray-500"
        >
          <SelectValue placeholder={t(placeholder, { default: placeholder })} />
        </SelectTrigger>

        <SelectContent>
          {!isRequired && (
            <SelectItem value={defaultOption?.value ?? '__none__'}>
              <span className="text-gray-400">
                {defaultOption?.label
                  ? t(defaultOption.label, { default: defaultOption.label })
                  :  t('None', { default: 'None' })}
              </span>
            </SelectItem>
          )}
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {/* {t(opt.label, { default: opt.label })} */}
              {capitalize(opt.label)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  )
}

export interface CustomSelectProps<T extends Record<string, any>> {
  id: string;
  label: string;
  name: Path<T>;
  setValue: UseFormSetValue<T>;
  error?: FieldError;
  isRequired?: boolean;
  placeholder?: string;
  model: string;
  value?: string | string[];
  multiple?: boolean;

  // 🔹 Static Options
  options?: { label: string; value: string }[];
  defaultOption?: { label: string; value: string };

  // 🔹 Dynamic/API Options (all optional)
  apiUrl?: string;
  collection?: string;
  labelFields?: string[];
  valueFields?: string[];
  label_con_str?: string;
  value_con_str?: string;
  where?: Record<string, any>;
  limit?: number;
  skip?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  filter?: Record<string, any>;
  optionValueKey?: string;
  optionLabelKeys?: string[];
  optionLabelSeparator?: string;
}

export function CustomSelect<T extends Record<string, any>>({
  id,
  label,
  name,
  collection,
  isRequired = false,
  placeholder = 'Select option(s)',
  error,
  setValue,
  model,
  value,
  options = [],
  apiUrl,
  defaultOption,
  limit = 50,
  filter = {},
  optionValueKey = '_id',
  optionLabelKeys = ['name'],
  optionLabelSeparator = ' ',
  multiple = false,
}: CustomSelectProps<T>) {
  const t = useTranslations(model);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    options: fetchedOptions,
    loading,
    selected,
    setSelected,
    getOptionLabel,
  } = useSelect({
    collection,
    apiUrl,
    search,
    filter,
    limit,
    multiple,
    optionValueKey,
    optionLabelKeys,
    optionLabelSeparator,
    initialValue: value,
  });

  const allOptions = apiUrl
    ? fetchedOptions
    : defaultOption
      ? [defaultOption, ...options]
      : options;

      // console.log('fetchedOptions',fetchedOptions)
      // console.log('allOptions',allOptions)

  const currentValue = apiUrl ? selected : value;

  const isSelected = (val: string) =>
    multiple
      ? Array.isArray(currentValue) && currentValue.includes(val)
      : currentValue === val;

    const handleChange = (val: string) => {
      if (multiple) {
        const prev = Array.isArray(currentValue) ? currentValue : currentValue ? [currentValue] : [];
        const exists = prev.includes(val);
        const updated = exists ? prev.filter((v) => v !== val) : [...prev, val];
        setValue(name, updated as any);
      } else {
        setValue(name, val as any);
        setOpen(false);
      }
    };

  return (
    <div className="space-y-1 w-full">
      <label htmlFor={id} className="block text-sm font-medium text-gray-700">
        {t(label, { default: label })} {isRequired && <span className="text-red-500">*</span>}
      </label>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative w-full">
            <Input
              readOnly
              ref={inputRef}
              className="text-left cursor-pointer hover:bg-slate-100 pr-10 border border-gray-500"
              value={
                multiple
                  ? allOptions
                      .filter((opt) => (currentValue as string[])?.includes(opt.value))
                      .map((opt) => capitalize(opt.label))
                      .join(', ')
                  : allOptions.find((opt) => opt.value === currentValue)?.label || ''
              }
              placeholder={t(placeholder, { default: placeholder })}
              onClick={() => setOpen(true)}
            />
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4 pointer-events-none" />
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 mt-[-4px] w-full max-h-[300px] overflow-auto"
          style={{ width: inputRef.current?.offsetWidth }}
        >
          <Command className="w-full">
            <CommandInput
              placeholder={t('Search', { default: 'Search' }) + '...'}
              value={search}
              onValueChange={setSearch}
              className="w-full"
            />
            <CommandList>
              {loading && (
                <CommandItem key="loading" disabled>
                  {t('Loading', { default: 'Loading' }) + '...'}
                </CommandItem>
              )}
              {!loading &&
                allOptions.map((opt,i) => (
                  <CommandItem
                    key={opt.value || i}
                    onSelect={() => handleChange(opt.value)}
                    className={`cursor-pointer hover:bg-blue-100 !rounded-none ${
                      isSelected(opt.value) ? '!bg-blue-400 hover:!bg-blue-400 !text-white' : ''
                    }`}
                  >
                    {capitalize(opt.label)}
                  </CommandItem>
                ))}
              {!loading && allOptions.length === 0 && (
                <CommandItem key="no-options" disabled>
                  {t('No options found', { default: 'No options found.' })}
                </CommandItem>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {error && <p className="text-red-500 text-sm">{error.message}</p>}
    </div>
  );
}


  
