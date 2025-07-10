import { useDeviceAvatar } from '../../hooks/useDeviceAvatar';

const DeviceAvatar = ({ deviceId, size = 'medium', onClick, isSelected = false }) => {
  const { avatarUrl, loading } = useDeviceAvatar(deviceId);
  
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-24 h-24'
  };
  
  const iconSizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-12 w-12'
  };
  
  const containerClass = sizeClasses[size] || sizeClasses.medium;
  const iconClass = iconSizeClasses[size] || iconSizeClasses.medium;
  
  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation();
      onClick();
    }
  };
  
  return (
    <div className={`relative ${onClick ? 'cursor-pointer' : ''}`} onClick={handleClick}>
      {loading ? (
        <div className={`${containerClass} rounded-full animate-pulse bg-gray-300`} />
      ) : avatarUrl ? (
        <img 
          src={avatarUrl} 
          alt={`Device ${deviceId}`} 
          className={`${containerClass} rounded-full object-cover ${onClick ? 'hover:opacity-90 transition-opacity' : ''}`}
        />
      ) : (
        <div className={`${containerClass} rounded-full bg-gray-300 flex items-center justify-center ${onClick ? 'hover:bg-gray-400 transition-colors' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`${iconClass} text-gray-600`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
        </div>
      )}
      
      {/* カメラアイコン - 編集可能な場合は常に表示 */}
      {onClick && (
        <div className={`absolute bottom-0 right-0 bg-blue-500 rounded-full shadow-lg ${
          size === 'small' ? 'p-1' : size === 'large' ? 'p-2' : 'p-1.5'
        }`}>
          <svg xmlns="http://www.w3.org/2000/svg" className={`text-white ${
            size === 'small' ? 'h-3 w-3' : size === 'large' ? 'h-5 w-5' : 'h-4 w-4'
          }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
      )}
    </div>
  );
};

export default DeviceAvatar;