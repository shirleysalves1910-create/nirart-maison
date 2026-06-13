export function formatDateBR(dateString) {
  const parts = getDateParts(dateString)
  if (!parts) return 'Não informada'

  const { day, month, year } = parts
  return `${padNumber(day)}/${padNumber(month)}/${year}`
}

export function getDaysFromToday(dateString) {
  const parts = getDateParts(dateString)
  if (!parts) return null

  const today = new Date()
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const eventUtc = Date.UTC(parts.year, parts.month - 1, parts.day)

  return Math.ceil((eventUtc - todayUtc) / 86400000)
}

function getDateParts(dateString) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || '')) return null

  const [year, month, day] = dateString.split('-').map(Number)
  if (
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > new Date(year, month, 0).getDate()
  ) {
    return null
  }

  return { year, month, day }
}

function padNumber(value) {
  return String(value).padStart(2, '0')
}
