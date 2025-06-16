import React from 'react';

interface ActionButtonProps {
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
  variant?: 'default' | 'test'; // For specific styling like test buttons
  fullWidth?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, children, disabled, className, variant = 'default', fullWidth = true, type = 'button' }) => {
  const baseStyle = `block ${fullWidth ? 'w-full' : ''} p-3 mb-2 rounded-lg text-center font-semibold border transition-all duration-200 ease-in-out`;
  const enabledStyle = "text-gray-200 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800";
  const disabledStyle = "bg-[#2a2a2a] text-[#6a6a6a] cursor-not-allowed border-[#4a4a4a]";

  let variantStyle = "";
  if (variant === 'default') {
    variantStyle = `bg-gradient-to-br from-[#3a3a3a] to-[#2c2c2c] border-[#5a5a5a] ${!disabled ? 'hover:from-[#f3b63a] hover:to-[#e09a1d] hover:shadow-[0_0_10px_#f3b63a] hover:translate-y-[-2px]' : ''}`;
  } else if (variant === 'test') {
    variantStyle = `bg-gradient-to-br from-[#4c1d95] to-[#312e81] border-[#6d28d9] ${!disabled ? 'hover:from-[#6d28d9] hover:to-[#4c1d95] hover:shadow-[0_0_10px_#8b5cf6]' : ''}`;
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyle} ${disabled ? disabledStyle : `${enabledStyle} ${variantStyle}`} ${className}`}
    >
      {children}
    </button>
  );
};

export default ActionButton;
