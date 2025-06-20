export function formatDateTime(dateStr: string): string {
    const date = new Date(dateStr)
    const day = date.getDate().toString().padStart(2, '0')
    const month = date.getMonth().toString().padStart(2, '0')
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')
    const seconds = date.getSeconds().toString().padStart(2, '0')
  
    return `${year}/${month}/${day} ${hours}:${minutes}:${seconds}`
  }

  export function formatDateTimeDisplay(dateStr: string): string {
    const date = new Date(dateStr)
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ]

    const dayName = days[date.getDay()]
    const day = date.getDate()
    const monthName = months[date.getMonth()]
    const year = date.getFullYear()
    const hours = date.getHours().toString().padStart(2, '0')
    const minutes = date.getMinutes().toString().padStart(2, '0')

    // Get ordinal suffix
    const getOrdinal = (n: number) => {
      const s = ["th", "st", "nd", "rd"]
      const v = n % 100
      return s[(v - 20) % 10] || s[v] || s[0]
    }

    const ordinal = getOrdinal(day)

    return `${dayName}, ${day}${ordinal} ${monthName}, ${year} ${hours}:${minutes}`
  }

  export function getCreatedAtId(createdAt: Date): number {
    const pad = (n: number) => String(n).padStart(2, '0')

    const createdAtId = 
      createdAt.getFullYear().toString() +
      pad(createdAt.getMonth() + 1) +
      pad(createdAt.getDate()) +
      pad(createdAt.getHours()) +
      pad(createdAt.getMinutes()) +
      pad(createdAt.getSeconds())
    return parseInt(createdAtId)
  }
  