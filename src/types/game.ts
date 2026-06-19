import type { Member, GameType } from './member'

export type GameStatus = 'recruiting' | 'confirmed' | 'full' | 'cancelled'

export interface TimeSlot {
  id: string
  label: string
  time: string
}

export interface Participant {
  memberId: string
  member: Member
  timeSlots: string[]
  signupTime: string
  status: 'confirmed' | 'waitlist'
  waitlistRank?: number
  role?: string
}

export interface Game {
  id: string
  title: string
  type: GameType
  cover: string
  totalPlayers: number
  currentPlayers: number
  location: string
  aaFee: number
  readingRequirement: string
  noSpoilerNotice: string
  hostId: string
  host: Member
  status: GameStatus
  availableTimeSlots: TimeSlot[]
  confirmedTime?: string
  participants: Participant[]
  waitlist: Participant[]
  publishTime: string
  sessionDate: string
  description?: string
}

export interface CreateGameForm {
  title: string
  type: GameType
  totalPlayers: number
  location: string
  aaFee: number
  readingRequirement: string
  noSpoilerNotice: string
  availableTimeSlots: { label: string; time: string }[]
  sessionDate: string
  description?: string
}
