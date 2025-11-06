'use client'

const statuses = ['NEW', 'CONTACTED', 'DEMO', 'WON', 'LOST']

interface LeadFiltersProps {
  activeStatus: string
  onStatusChange: (status: string) => void
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  activeStatus,
  onStatusChange,
}) => {
  return (
    <div className="flex space-x-2 bg-gray-100 p-2 rounded-lg">
      <button
        onClick={() => onStatusChange('ALL')}
        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
          activeStatus === 'ALL'
            ? 'bg-indigo-600 text-white shadow'
            : 'text-gray-600 hover:bg-gray-200'
        }`}
      >
        Todos
      </button>
      {statuses.map((status) => (
        <button
          key={status}
          onClick={() => onStatusChange(status)}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeStatus === status
              ? 'bg-indigo-600 text-white shadow'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {status}
        </button>
      ))}
    </div>
  )
}
