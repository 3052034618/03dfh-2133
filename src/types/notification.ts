export type NotificationType =
  | 'promoted'
  | 'waitlist_moved'
  | 'time_confirmed'
  | 'game_cancelled'
  | 'new_game'

export interface Notification {
  id: string
  memberId: string
  type: NotificationType
  title: string
  content: string
  gameId?: string
  gameTitle?: string
  createdAt: string
  read: boolean
  metadata?: Record<string, any>
}
