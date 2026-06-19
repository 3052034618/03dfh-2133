import { create } from 'zustand'
import type { Member, AbilityTags, MemberNote, GameType, PlayCountLevel } from '@/types/member'
import type { Game, Participant, CreateGameForm, GameStatus } from '@/types/game'
import { mockMembers, currentUserId as initialUserId } from '@/data/members'
import { mockGames } from '@/data/games'

interface MemberUpdateData {
  playCount?: number
  preferredTypes?: GameType[]
  ability?: Partial<AbilityTags>
  note?: Partial<MemberNote>
}

interface ClubStore {
  members: Member[]
  games: Game[]
  currentUserId: string
  isPresident: boolean

  getCurrentMember: () => Member | undefined
  getMemberById: (id: string) => Member | undefined
  updateMemberProfile: (memberId: string, data: MemberUpdateData) => void

  addGame: (form: CreateGameForm) => Game
  getGameById: (id: string) => Game | undefined

  signupToGame: (gameId: string, memberId: string, timeSlots: string[]) => { success: boolean; isWaitlist: boolean; waitlistRank?: number }
  cancelSignup: (gameId: string, memberId: string) => void
  promoteWaitlist: (gameId: string, waitlistRank: number) => void

  moveWaitlistUp: (gameId: string, waitlistRank: number) => void
  moveWaitlistDown: (gameId: string, waitlistRank: number) => void

  recomputeWaitlistRank: (gameId: string) => void
}

const getPlayCountLevel = (count: number): PlayCountLevel => {
  if (count <= 5) return '0-5'
  if (count <= 20) return '6-20'
  if (count <= 50) return '21-50'
  return '50+'
}

const sortWaitlist = (waitlist: Participant[]): Participant[] => {
  return [...waitlist].sort((a, b) => {
    const scoreA = a.member.recentSessionCount * 100 + (a.member.ability.timelineExpert ? 1 : 0) + (a.member.ability.cipherExpert ? 1 : 0)
    const scoreB = b.member.recentSessionCount * 100 + (b.member.ability.timelineExpert ? 1 : 0) + (b.member.ability.cipherExpert ? 1 : 0)
    if (scoreA !== scoreB) return scoreA - scoreB
    return new Date(a.signupTime).getTime() - new Date(b.signupTime).getTime()
  }).map((p, idx) => ({ ...p, waitlistRank: idx + 1 }))
}

const recomputeGameStatus = (game: Game): Game => {
  let status: GameStatus = game.status
  if (game.status !== 'cancelled') {
    if (game.currentPlayers >= game.totalPlayers && game.participants.length >= game.totalPlayers) {
      status = 'full'
    } else if (game.confirmedTime) {
      status = 'confirmed'
    } else {
      status = 'recruiting'
    }
  }
  return { ...game, status }
}

export const useClubStore = create<ClubStore>((set, get) => ({
  members: JSON.parse(JSON.stringify(mockMembers)),
  games: JSON.parse(JSON.stringify(mockGames)),
  currentUserId: initialUserId,
  isPresident: true,

  getCurrentMember: () => {
    const { members, currentUserId } = get()
    return members.find(m => m.id === currentUserId)
  },

  getMemberById: (id: string) => {
    return get().members.find(m => m.id === id)
  },

  updateMemberProfile: (memberId: string, data: MemberUpdateData) => {
    console.log('[Store] updateMemberProfile:', memberId, data)
    set(state => {
      const newMembers = state.members.map(m => {
        if (m.id !== memberId) return m
        const playCount = data.playCount ?? m.playCount
        return {
          ...m,
          playCount,
          playCountLevel: getPlayCountLevel(playCount),
          preferredTypes: data.preferredTypes ?? m.preferredTypes,
          ability: { ...m.ability, ...(data.ability ?? {}) },
          note: { ...m.note, ...(data.note ?? {}) }
        }
      })

      const newGames = state.games.map(g => ({
        ...g,
        host: g.host.id === memberId ? newMembers.find(m => m.id === memberId)! : g.host,
        participants: g.participants.map(p => ({
          ...p,
          member: p.member.id === memberId ? newMembers.find(m => m.id === memberId)! : p.member
        })),
        waitlist: g.waitlist.map(p => ({
          ...p,
          member: p.member.id === memberId ? newMembers.find(m => m.id === memberId)! : p.member
        }))
      }))

      return { members: newMembers, games: newGames }
    })
  },

  addGame: (form: CreateGameForm) => {
    console.log('[Store] addGame:', form)
    const { getCurrentMember, games } = get()
    const currentUser = getCurrentMember()!
    const newGameId = `g${Date.now()}`

    const availableTimeSlots = form.availableTimeSlots.map((ts, idx) => ({
      id: `t${Date.now()}-${idx}`,
      label: ts.label,
      time: `${form.sessionDate} ${ts.time}`
    }))

    const hostParticipant: Participant = {
      memberId: currentUser.id,
      member: currentUser,
      timeSlots: availableTimeSlots.map(t => t.id),
      signupTime: new Date().toISOString(),
      status: 'confirmed',
      role: '车头'
    }

    const newGame: Game = {
      id: newGameId,
      title: form.title,
      type: form.type,
      cover: `https://picsum.photos/id/${Math.floor(Math.random() * 100) + 10}/750/500`,
      totalPlayers: form.totalPlayers,
      currentPlayers: 1,
      location: form.location,
      aaFee: form.aaFee,
      readingRequirement: form.readingRequirement,
      noSpoilerNotice: form.noSpoilerNotice,
      hostId: currentUser.id,
      host: currentUser,
      status: 'recruiting',
      availableTimeSlots,
      participants: [hostParticipant],
      waitlist: [],
      publishTime: new Date().toISOString(),
      sessionDate: form.sessionDate,
      description: form.description
    }

    set(state => ({ games: [newGame, ...state.games] }))
    return newGame
  },

  getGameById: (id: string) => {
    return get().games.find(g => g.id === id)
  },

  signupToGame: (gameId: string, memberId: string, timeSlots: string[]) => {
    console.log('[Store] signupToGame:', gameId, memberId, timeSlots)
    const { getMemberById } = get()
    const member = getMemberById(memberId)!
    let result = { success: false, isWaitlist: false, waitlistRank: undefined as number | undefined }

    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g

        const alreadyIn = g.participants.some(p => p.memberId === memberId) ||
          g.waitlist.some(p => p.memberId === memberId)
        if (alreadyIn) return g

        const isFull = g.currentPlayers >= g.totalPlayers

        const newParticipant: Participant = {
          memberId,
          member,
          timeSlots,
          signupTime: new Date().toISOString(),
          status: isFull ? 'waitlist' : 'confirmed'
        }

        if (isFull) {
          const newWaitlist = sortWaitlist([...g.waitlist, { ...newParticipant, waitlistRank: g.waitlist.length + 1 }])
          result = { success: true, isWaitlist: true, waitlistRank: newWaitlist.find(p => p.memberId === memberId)?.waitlistRank }
          return recomputeGameStatus({ ...g, waitlist: newWaitlist })
        } else {
          result = { success: true, isWaitlist: false }
          return recomputeGameStatus({
            ...g,
            currentPlayers: g.currentPlayers + 1,
            participants: [...g.participants, newParticipant]
          })
        }
      })

      return { games: newGames }
    })

    return result
  },

  cancelSignup: (gameId: string, memberId: string) => {
    console.log('[Store] cancelSignup:', gameId, memberId)
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g

        const inParticipants = g.participants.find(p => p.memberId === memberId)
        const inWaitlist = g.waitlist.find(p => p.memberId === memberId)

        if (!inParticipants && !inWaitlist) return g

        if (inParticipants) {
          const newParticipants = g.participants.filter(p => p.memberId !== memberId)
          let newWaitlist = g.waitlist
          let newCurrentPlayers = g.currentPlayers - 1

          if (newWaitlist.length > 0 && newCurrentPlayers < g.totalPlayers) {
            const promoted = { ...newWaitlist[0], status: 'confirmed' as const }
            delete promoted.waitlistRank
            newParticipants.push(promoted)
            newWaitlist = sortWaitlist(newWaitlist.slice(1))
            newCurrentPlayers += 1
          }

          return recomputeGameStatus({
            ...g,
            currentPlayers: newCurrentPlayers,
            participants: newParticipants,
            waitlist: newWaitlist
          })
        } else {
          const newWaitlist = sortWaitlist(g.waitlist.filter(p => p.memberId !== memberId))
          return { ...g, waitlist: newWaitlist }
        }
      })

      return { games: newGames }
    })
  },

  promoteWaitlist: (gameId: string, waitlistRank: number) => {
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        if (g.currentPlayers >= g.totalPlayers) return g

        const toPromote = g.waitlist.find(p => p.waitlistRank === waitlistRank)
        if (!toPromote) return g

        const promoted: Participant = { ...toPromote, status: 'confirmed' }
        delete promoted.waitlistRank

        const newWaitlist = sortWaitlist(g.waitlist.filter(p => p.waitlistRank !== waitlistRank))

        return recomputeGameStatus({
          ...g,
          currentPlayers: g.currentPlayers + 1,
          participants: [...g.participants, promoted],
          waitlist: newWaitlist
        })
      })
      return { games: newGames }
    })
  },

  moveWaitlistUp: (gameId: string, waitlistRank: number) => {
    console.log('[Store] moveWaitlistUp:', gameId, waitlistRank)
    if (waitlistRank <= 1) return
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        const newWaitlist = g.waitlist.map(p => {
          if (p.waitlistRank === waitlistRank) return { ...p, waitlistRank: waitlistRank - 1 }
          if (p.waitlistRank === waitlistRank - 1) return { ...p, waitlistRank: waitlistRank }
          return p
        }).sort((a, b) => (a.waitlistRank || 0) - (b.waitlistRank || 0))
        return { ...g, waitlist: newWaitlist }
      })
      return { games: newGames }
    })
  },

  moveWaitlistDown: (gameId: string, waitlistRank: number) => {
    console.log('[Store] moveWaitlistDown:', gameId, waitlistRank)
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        const maxRank = g.waitlist.length
        if (waitlistRank >= maxRank) return g
        const newWaitlist = g.waitlist.map(p => {
          if (p.waitlistRank === waitlistRank) return { ...p, waitlistRank: waitlistRank + 1 }
          if (p.waitlistRank === waitlistRank + 1) return { ...p, waitlistRank: waitlistRank }
          return p
        }).sort((a, b) => (a.waitlistRank || 0) - (b.waitlistRank || 0))
        return { ...g, waitlist: newWaitlist }
      })
      return { games: newGames }
    })
  },

  recomputeWaitlistRank: (gameId: string) => {
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        return { ...g, waitlist: sortWaitlist(g.waitlist) }
      })
      return { games: newGames }
    })
  }
}))
