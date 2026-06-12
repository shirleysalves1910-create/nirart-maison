export default function SectionCard({ title, children, icon: Icon, action }) {
  return (
    <div className="rounded-lg bg-nirart-card border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-gray-100 rounded-lg text-nirart-green">
              <Icon size={20} />
            </div>
          )}
          <h3 className="text-lg font-semibold text-nirart-text">{title}</h3>
        </div>
        {action && action}
      </div>

      {/* Content */}
      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
