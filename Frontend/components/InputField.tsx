import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface InputFieldProps {
  id: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
  isPassword?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  id,
  type,
  placeholder,
  value,
  onChange,
  icon,
  isPassword = false,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Determine the actual type for the input element
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className="relative group">
      {/* Icon Wrapper */}
      {icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-opacity duration-200">
          {icon}
        </div>
      )}

      {/* Input Element */}
      <input
        id={id}
        type={inputType}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full bg-white text-gray-700 placeholder-gray-400 border border-transparent shadow-sm rounded-lg py-3.5 ${
          icon ? 'pl-12' : 'pl-4'
        } ${
          isPassword ? 'pr-12' : 'pr-4'
        } focus:outline-none focus:ring-2 focus:ring-[#00A0E3] focus:border-transparent focus:bg-white transition-all duration-200 font-medium`}
      />

      {/* Password Visibility Toggle */}
      {isPassword && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#00A0E3] hover:text-[#0072BC] focus:outline-none transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};

export default InputField;