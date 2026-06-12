export default function Button({ 
  children, 
  variant = 'primary', 
  size = 'md',
  className = '',
  ...props 
}) {
  const baseStyles = 'font-semibold rounded transition-colors'
  
  const variants = {
    primary: 'bg-nirart-green text-white hover:bg-opacity-90',
    secondary: 'bg-nirart-wine text-white hover:bg-opacity-90',
    outline: 'border-2 border-nirart-green text-nirart-green hover:bg-nirart-green hover:text-white',
  }

  const sizes = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg w-full',
  }

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
