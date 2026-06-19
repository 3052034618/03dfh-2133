import { create } from 'zustand'
import type { Member, AbilityTags, MemberNote, GameType, PlayCountLevel } from '@/types/member'
import type { Game, Participant, CreateGameForm, GameStatus, RoleType, RoleRequirement } from '@/types/game'
import type { Notification, NotificationType } from '@/types/notification'
import { mockMembers, currentUserId as initialUserId } from '@/data/members'
import { mockGames } from '@/data/games'

interface MemberUpdateData {
  playCount?: number
  preferredTypes?: GameType[]
  ability?: Partial<AbilityTags>
  note?: Partial<MemberNote>
}

const getRoleMatchScore = (member: Member, roleType: RoleType): number => {
  switch (roleType) {
    case 'timeline':
      return member.ability.timelineExpert ? 1 : 0
    case 'cipher':
      return member.ability.cipherExpert ? 1 : 0
    case 'hardcore':
      return member.ability.canLongSession ? 1 : 0
    case 'mentor':
      return member.note.goodForNewbies ? 1 : 0
    default:
      return 0
  }
}

const getBestMatchedRole = (member: Member, requirements: RoleRequirement[]): RoleType | undefined => {
  let bestRole: RoleType | undefined
  let bestScore = -1
  for (const req of requirements) {
    const score = getRoleMatchScore(member, req.type)
    if (score > bestScore) {
      bestScore = score
      bestRole = req.type
    }
  }
  return bestScore > 0 ? bestRole : undefined
}

const getFilledRoleCounts = (participants: Participant[], requirements: RoleRequirement[]): Record<RoleType, number> => {
  const counts: Record<string, number> = {}
  requirements.forEach(r => { counts[r.type] = 0 })
  participants.forEach(p => {
    if (p.matchedRole && counts[p.matchedRole] !== undefined) {
      counts[p.matchedRole]++
    }
  })
  return counts as Record<RoleType, number>
}

interface ClubStore {
  members: Member[]
  games: Game[]
  currentUserId: string
  isPresident: boolean
  notifications: Notification[]

  getCurrentMember: () => Member | undefined
  getMemberById: (id: string) => Member | undefined
  updateMemberProfile: (memberId: string, data: MemberUpdateData) => void

  addGame: (form: CreateGameForm) => Game
  getGameById: (id: string) => Game | undefined
  confirmGameTime: (gameId: string, timeSlotId: string) => void

  signupToGame: (gameId: string, memberId: string, timeSlots: string[]) => { success: boolean; isWaitlist: boolean; waitlistRank?: number }
  cancelSignup: (gameId: string, memberId: string) => void
  promoteWaitlist: (gameId: string, waitlistRank: number) => void

  moveWaitlistUp: (gameId: string, waitlistRank: number) => void
  moveWaitlistDown: (gameId: string, waitlistRank: number) => void

  recomputeWaitlistRank: (gameId: string) => void

  addNotification: (memberId: string, type: NotificationType, title: string, content: string, gameId?: string, metadata?: Record<string, any>) => void
  markNotificationRead: (notificationId: string) => void
  markAllNotificationsRead: () => void
  getUnreadCount: () => number
}

const getPlayCountLevel = (count: number): PlayCountLevel => {
  if (count <= 5) return '0-5'
  if (count <= 20) return '6-20'
  if (count <= 50) return '21-50'
  return '50+'
}

const sortWaitlist = (waitlist: Participant[], requirements: RoleRequirement[]): Participant[] => {
  return [...waitlist].sort((a, b) => {
    const aRoleMatch = getBestMatchedRole(a.member, requirements)
    const bRoleMatch = getBestMatchedRole(b.member, requirements)
    const aRoleScore = aRoleMatch ? getRoleMatchScore(a.member, aRoleMatch) * 10 : 0
    const bRoleScore = bRoleMatch ? getRoleMatchScore(b.member, bRoleMatch) * 10 : 0

    const scoreA = a.member.recentSessionCount * 100 + aRoleScore
      + (a.member.ability.timelineExpert ? 1 : 0) + (a.member.ability.cipherExpert ? 1 : 0)
    const scoreB = b.member.recentSessionCount * 100 + bRoleScore
      + (b.member.ability.timelineExpert ? 1 : 0) + (b.member.ability.cipherExpert ? 1 : 0)

    if (scoreA !== scoreB) return scoreA - scoreB
    return new Date(a.signupTime).getTime() - new Date(b.signupTime).getTime()
  }).map((p, idx) => {
    const matchedRole = getBestMatchedRole(p.member, requirements)
    return { ...p, waitlistRank: idx + 1, matchedRole }
  })
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

const initialNotifications: Notification[] = []

export const useClubStore = create<ClubStore>((set, get) => ({
  members: JSON.parse(JSON.stringify(mockMembers)),
  games: JSON.parse(JSON.stringify(mockGames)),
  currentUserId: initialUserId,
  isPresident: true,
  notifications: initialNotifications,

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
          member: p.member.id === memberId ? newMembers.find(m => m.id === memberId)! : p.member,
          matchedRole: p.member.id === memberId ? getBestMatchedRole(newMembers.find(m => m.id === memberId)!, g.roleRequirements) : p.matchedRole
        })),
        waitlist: g.waitlist.map(p => ({
          ...p,
          member: p.member.id === memberId ? newMembers.find(m => m.id === memberId)! : p.member,
          matchedRole: p.member.id === memberId ? getBestMatchedRole(newMembers.find(m => m.id === memberId)!, g.roleRequirements) : p.matchedRole
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
      role: '车头',
      matchedRole: getBestMatchedRole(currentUser, form.roleRequirements)
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
      description: form.description,
      roleRequirements: form.roleRequirements
    }

    set(state => ({ games: [newGame, ...state.games] }))
    return newGame
  },

  getGameById: (id: string) => {
    return get().games.find(g => g.id === id)
  },

  confirmGameTime: (gameId: string, timeSlotId: string) => {
    console.log('[Store] confirmGameTime:', gameId, timeSlotId)
    const { addNotification } = get()
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        const timeSlot = g.availableTimeSlots.find(t => t.id === timeSlotId)
        if (!timeSlot) return g

        g.participants.forEach(p => {
          addNotification(
            p.memberId,
            'time_confirmed',
            '开车时间已确认',
            `《${g.title}》已确认时间：${timeSlot.time}`,
            g.id,
            { confirmedTime: timeSlot.time }
          )
        })
        g.waitlist.forEach(p => {
          addNotification(
            p.memberId,
            'time_confirmed',
            '开车时间已确认',
            `《${g.title}》已确认时间：${timeSlot.time}`,
            g.id,
            { confirmedTime: timeSlot.time }
          )
        })

        return recomputeGameStatus({
          ...g,
          confirmedTime: timeSlot.time,
          confirmedTimeSlotId: timeSlotId
        })
      })
      return { games: newGames }
    })
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
        const matchedRole = getBestMatchedRole(member, g.roleRequirements)

        const newParticipant: Participant = {
          memberId,
          member,
          timeSlots,
          signupTime: new Date().toISOString(),
          status: isFull ? 'waitlist' : 'confirmed',
          matchedRole
        }

        if (isFull) {
          const newWaitlist = sortWaitlist([...g.waitlist, { ...newParticipant, waitlistRank: g.waitlist.length + 1 }], g.roleRequirements)
          const rank = newWaitlist.find(p => p.memberId === memberId)?.waitlistRank
          result = { success: true, isWaitlist: true, waitlistRank: rank }
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
    const { addNotification } = get()
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
            newWaitlist = sortWaitlist(newWaitlist.slice(1), g.roleRequirements)
            newCurrentPlayers += 1

            addNotification(
              promoted.memberId,
              'promoted',
              '🎉 候补转正成功',
              `《${g.title}》有成员取消报名，你已自动递补为正式成员！`,
              g.id
            )

            newWaitlist.forEach((p, idx) => {
              const oldRank = p.waitlistRank
              const newRank = idx + 1
              if (oldRank !== newRank) {
                addNotification(
                  p.memberId,
                  'waitlist_moved',
                  '候补位次变动',
                  `《${g.title}》候补位次变化：第 ${oldRank} 位 → 第 ${newRank} 位`,
                  g.id,
                  { oldRank, newRank }
                )
              }
            })
          }

          return recomputeGameStatus({
            ...g,
            currentPlayers: newCurrentPlayers,
            participants: newParticipants,
            waitlist: newWaitlist
          })
        } else {
          const newWaitlist = sortWaitlist(g.waitlist.filter(p => p.memberId !== memberId), g.roleRequirements)

          newWaitlist.forEach((p, idx) => {
            const oldRank = p.waitlistRank
            const newRank = idx + 1
            if (oldRank !== newRank) {
              addNotification(
                p.memberId,
                'waitlist_moved',
                '候补位次变动',
                `《${g.title}》候补位次变化：第 ${oldRank} 位 → 第 ${newRank} 位`,
                g.id,
                { oldRank, newRank }
              )
            }
          })

          return { ...g, waitlist: newWaitlist }
        }
      })

      return { games: newGames }
    })
  },

  promoteWaitlist: (gameId: string, waitlistRank: number) => {
    console.log('[Store] promoteWaitlist:', gameId, waitlistRank)
    const { addNotification } = get()
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        if (g.currentPlayers >= g.totalPlayers) return g

        const toPromote = g.waitlist.find(p => p.waitlistRank === waitlistRank)
        if (!toPromote) return g

        const promoted: Participant = { ...toPromote, status: 'confirmed' }
        delete promoted.waitlistRank

        const newWaitlist = sortWaitlist(g.waitlist.filter(p => p.waitlistRank !== waitlistRank), g.roleRequirements)

        addNotification(
          toPromote.memberId,
          'promoted',
          '🎉 被社长提拔转正',
          `《${g.title}》社长已将你从候补提拔为正式成员！`,
          g.id
        )

        newWaitlist.forEach((p, idx) => {
          const oldRank = p.waitlistRank
          const newRank = idx + 1
          if (oldRank !== newRank) {
            addNotification(
              p.memberId,
              'waitlist_moved',
              '候补位次变动',
              `《${g.title}》候补位次变化：第 ${oldRank} 位 → 第 ${newRank} 位`,
              g.id,
              { oldRank, newRank }
            )
          }
        })

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
    const { addNotification } = get()
    if (waitlistRank <= 1) return
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        const target = g.waitlist.find(p => p.waitlistRank === waitlistRank)
        const swapped = g.waitlist.find(p => p.waitlistRank === waitlistRank - 1)

        const newWaitlist = g.waitlist.map(p => {
          if (p.waitlistRank === waitlistRank) return { ...p, waitlistRank: waitlistRank - 1 }
          if (p.waitlistRank === waitlistRank - 1) return { ...p, waitlistRank: waitlistRank }
          return p
        }).sort((a, b) => (a.waitlistRank || 0) - (b.waitlistRank || 0))

        if (target) {
          addNotification(
            target.memberId,
            'waitlist_moved',
            '候补位次提升',
            `《${g.title}》社长将你上移：第 ${waitlistRank} 位 → 第 ${waitlistRank - 1} 位`,
            g.id,
            { oldRank: waitlistRank, newRank: waitlistRank - 1 }
          )
        }
        if (swapped) {
          addNotification(
            swapped.memberId,
            'waitlist_moved',
            '候补位次变动',
            `《${g.title}》候补位次变化：第 ${waitlistRank - 1} 位 → 第 ${waitlistRank} 位`,
            g.id,
            { oldRank: waitlistRank - 1, newRank: waitlistRank }
          )
        }

        return { ...g, waitlist: newWaitlist }
      })
      return { games: newGames }
    })
  },

  moveWaitlistDown: (gameId: string, waitlistRank: number) => {
    console.log('[Store] moveWaitlistDown:', gameId, waitlistRank)
    const { addNotification } = get()
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        const maxRank = g.waitlist.length
        if (waitlistRank >= maxRank) return g

        const target = g.waitlist.find(p => p.waitlistRank === waitlistRank)
        const swapped = g.waitlist.find(p => p.waitlistRank === waitlistRank + 1)

        const newWaitlist = g.waitlist.map(p => {
          if (p.waitlistRank === waitlistRank) return { ...p, waitlistRank: waitlistRank + 1 }
          if (p.waitlistRank === waitlistRank + 1) return { ...p, waitlistRank: waitlistRank }
          return p
        }).sort((a, b) => (a.waitlistRank || 0) - (b.waitlistRank || 0))

        if (target) {
          addNotification(
            target.memberId,
            'waitlist_moved',
            '候补位次变动',
            `《${g.title}》社长将你下移：第 ${waitlistRank} 位 → 第 ${waitlistRank + 1} 位`,
            g.id,
            { oldRank: waitlistRank, newRank: waitlistRank + 1 }
          )
        }
        if (swapped) {
          addNotification(
            swapped.memberId,
            'waitlist_moved',
            '候补位次提升',
            `《${g.title}》候补位次变化：第 ${waitlistRank + 1} 位 → 第 ${waitlistRank} 位`,
            g.id,
            { oldRank: waitlistRank + 1, newRank: waitlistRank }
          )
        }

        return { ...g, waitlist: newWaitlist }
      })
      return { games: newGames }
    })
  },

  recomputeWaitlistRank: (gameId: string) => {
    set(state => {
      const newGames = state.games.map(g => {
        if (g.id !== gameId) return g
        return { ...g, waitlist: sortWaitlist(g.waitlist, g.roleRequirements) }
      })
      return { games: newGames }
    })
  },

  addNotification: (memberId: string, type: NotificationType, title: string, content: string, gameId?: string, metadata?: Record<string, any>) => {
    console.log('[Store] addNotification:', memberId, type, title)
    const game = gameId ? get().games.find(g => g.id === gameId) : undefined
    set(state => ({
      notifications: [
        {
          id: `n${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          title,
          content,
          gameId,
          gameTitle: game?.title,
          createdAt: new Date().toISOString(),
          read: false,
          metadata
        },
        ...state.notifications
      ]
    }))
  },

  markNotificationRead: (notificationId: string) => {
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    }))
  },

  markAllNotificationsRead: () => {
    const { currentUserId } = get()
    set(state => ({
      notifications: state.notifications.map(n => ({ ...n, read: true }))
    }))
  },

  getUnreadCount: () => {
    const { notifications, currentUserId } = get()
    return notifications.filter(n => !n.read).length
  }
}))
