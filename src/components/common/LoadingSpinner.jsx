const LoadingSpinner = ({ 
  size = 'md', 
  text = '読み込み中...', 
  centered = true,
  className = '' 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };
  
  const containerClass = centered ? 'flex items-center justify-center py-12' : 'flex items-center';
  
  return (
    <div className={`${containerClass} ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-blue-600 ${sizes[size]}`}></div>
      {text && <span className="ml-3 text-gray-600">{text}</span>}
    </div>
  );
};

export default LoadingSpinner; 