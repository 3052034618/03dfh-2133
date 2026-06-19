import type { PlayCountLevel } from '@/types/member'
import type { GameStatus } from '@/types/game'

export const formatPlayCountLevel = (level: PlayCountLevel): string => {
  const map: Record<PlayCountLevel, string> = {
    '0-5': '新手 0-5本',
    '6-20': '进阶 6-20本',
    '21-50': '老手 21-50本',
    '50+': '大神 50本+'
  }
  return map[level]
}

export const formatGameStatus = (status: GameStatus): { text: string; color: string } => {
  const map: Record<GameStatus, { text: string; color: string }> = {
    recruiting: { text: '招募中', color: '#FF7D00' },
    confirmed: { text: '已成车', color: '#00B42A' },
    full: { text: '已满员', color: '#F53F3F' },
    cancelled: { text: '已取消', color: '#86909C' }
  }
  return map[status]
}

export const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  const month = date.getMonth() + 1
  const day = date.getDate()
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const weekDay = weekDays[date.getDay()]
  return `${month}月${day}日 ${weekDay}`
}

export const formatTime = (timeStr: string): string => {
  return timeStr
}
