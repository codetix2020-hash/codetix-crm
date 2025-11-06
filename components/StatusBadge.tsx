import { getStatusColor, getStatusLabel, getStatusEmoji } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  showEmoji?: boolean
  className?: string
}

export default function StatusBadge({ status, showEmoji = true, className = '' }: StatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)} ${className}`}>
      {showEmoji && <span className="mr-1">{getStatusEmoji(status)}</span>}
      {getStatusLabel(status)}
    </span>
  )
}
