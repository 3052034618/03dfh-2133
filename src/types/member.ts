export type PlayCountLevel = '0-5' | '6-20' | '21-50' | '50+'

export type GameType = '本格推理' | '变格推理' | '硬核推理' | '情感本' | '机制本' | '恐怖本' | '欢乐本'

export interface AbilityTags {
  timelineExpert: boolean
  cipherExpert: boolean
  canLongSession: boolean
}

export interface MemberNote {
  goodForNewbies: boolean
  goodForHardcore: boolean
  customNote?: string
}

export interface Member {
  id: string
  name: string
  avatar: string
  studentId?: string
  department?: string
  joinDate: string
  playCountLevel: PlayCountLevel
  playCount: number
  preferredTypes: GameType[]
  ability: AbilityTags
  note: MemberNote
  recentSessionCount: number
  totalSessions: number
}
