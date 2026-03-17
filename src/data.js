export const APPS = [
  { name: 'Instagram', color: '#EE1D52' },
  { name: 'Facebook',  color: '#1877F2' },
  { name: 'TikTok',    color: '#69C9D0' },
  { name: 'YouTube',   color: '#FF0000' },
  { name: 'X',         color: '#555555' },
]

export const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const SLOTS_PER_DAY = 6 // 3 rows × 2 pills, each pill = 1 hour (0 | 0.5 | 1)

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
