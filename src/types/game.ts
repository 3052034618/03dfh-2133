import type { Member, GameType } from './member'

export type GameStatus = 'recruiting' | 'confirmed' | 'full' | 'cancelled'

export type RoleType = 'timeline' | 'cipher' | 'mentor' | 'hardcore'

export interface RoleRequirement {
  type: RoleType
  label: string
  count: number
  description: string
}

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
  matchedRole?: RoleType
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
  confirmedTimeSlotId?: string
  participants: Participant[]
  waitlist: Participant[]
  publishTime: string
  sessionDate: string
  description?: string
  roleRequirements: RoleRequirement[]
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
  roleRequirements: RoleRequirement[]
}
