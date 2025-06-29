import { formatDate, isToday, changeDate } from '../../utils/dateUtils';

const DateNavigation = ({ selectedDate, onDateChange, showDataStatus = false, hasData = false }) => {
  const handleDateChange = (direction) => {
    const directionValue = direction === 'prev' ? -1 : 1;
    const newDate = changeDate(selectedDate, directionValue);
    if (newDate !== selectedDate) {
      onDateChange(newDate);
    }
  };

  return (
    <div className="flex items-center justify-center">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => handleDateChange('prev')}
          className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="前の日"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className="text-center min-w-[120px]">
          <p className="text-base font-medium text-gray-800">{formatDate(selectedDate)}</p>
        </div>
        
        <button
          onClick={() => handleDateChange('next')}
          disabled={isToday(selectedDate)}
          className={`p-2 rounded-full transition-colors ${
            isToday(selectedDate) 
              ? 'text-gray-300 cursor-not-allowed' 
              : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-label="次の日"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default DateNavigation; 