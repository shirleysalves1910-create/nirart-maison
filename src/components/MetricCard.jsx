export default function MetricCard({ icon: Icon, title, value, subtitle, color = 'green' }) {
  const colors = {
    green: 'border-l-nirart-green bg-gradient-to-br from-green-50 to-white',
    wine: 'border-l-nirart-wine bg-gradient-to-br from-red-50 to-white',
    blue: 'border-l-blue-500 bg-gradient-to-br from-blue-50 to-white',
    purple: 'border-l-purple-500 bg-gradient-to-br from-purple-50 to-white',
  }

  const iconColors = {
    green: 'bg-green-100 text-nirart-green',
    wine: 'bg-red-100 text-nirart-wine',
    blue: 'bg-blue-100 text-blue-500',
    purple: 'bg-purple-100 text-purple-500',
  }

  return (
    <div className={`rounded-lg p-6 shadow-sm border-l-4 border-gray-200 ${colors[color]} transition-transform hover:scale-105`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <p className="text-3xl font-bold text-nirart-text">{value}</p>
            {subtitle && (
              <p className="text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
        </div>
        <div className={`p-3 rounded-lg ${iconColors[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  )
}
