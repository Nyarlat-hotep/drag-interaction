export const APPS = [
  { name: 'Instagram', color: '#E1306C' },
  { name: 'Facebook',  color: '#1877F2' },
  { name: 'TikTok',    color: '#EE1D52' },
  { name: 'X',         color: '#555555' },
  { name: 'YouTube',   color: '#FF0000' },
]

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const SLOTS_PER_DAY = 24 // 12 rows × 2 pills, each pill = 1 hour (0 | 0.5 | 1)

export function makeEmptyUsage() {
  const usage = {}
  for (const app of APPS) {
    usage[app.name] = {}
    for (const day of DAYS) {
      usage[app.name][day] = new Array(SLOTS_PER_DAY).fill(0)
    }
  }
  return usage
}
