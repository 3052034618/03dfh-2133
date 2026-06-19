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

export const getRoleMatchScore = (member: Member, roleType: RoleType): number => {
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

export const getBestMatchedRole = (member: Member, requirements: RoleRequirement[]): RoleType | undefined => {
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

export const getFilledRoleCounts = (participants: Participant[], requirements: RoleRequirement[]): Record<RoleType, number> => {
  const filled: Record<string, number> = {}
  requirements.forEach(r => { filled[r.type] = 0 })
  participants.forEach(p => {
    const matchedRole = getBestMatchedRole(p.member, requirements)
    if (matchedRole && filled[matchedRole] < requirements.find(r => r.type === matchedRole)!.count) {
      filled[matchedRole]++
    }
  })
  return filled as Record<RoleType, number>
}

export interface RoleSlotAssignment {
  roleType: RoleType
  roleLabel: string
  index: number
  participant: Participant | null
}

export const getRoleSchedule = (
  participants: Participant[],
  requirements: RoleRequirement[]
): RoleSlotAssignment[] => {
  const assignments: RoleSlotAssignment[] = []
  const usedMemberIds = new Set<string>()

  for (const req of requirements) {
    const matched: Participant[] = []
    for (const p of participants) {
      if (usedMemberIds.has(p.memberId)) continue
      if (getRoleMatchScore(p.member, req.type) > 0) {
        matched.push(p)
      }
    }
    matched.sort((a, b) => {
      if (a.role === '车头') return -1
      if (b.role === '车头') return 1
      return 0
    })
    for (let i = 0; i < req.count; i++) {
      const p = matched[i]
      if (p) usedMemberIds.add(p.memberId)
      assignments.push({
        roleType: req.type,
        roleLabel: req.label,
        index: i,
        participant: p || null
      })
    }
  }

  return assignments
}

export interface PromotionRecommendation {
  participant: Participant
  rank: number
  reasons: string[]
  matchedGap?: RoleType
  canArriveConfirmedTime: boolean
}

export const getRecommendPromotion = (
  game: Game
): PromotionRecommendation[] => {
  if (game.waitlist.length === 0) return []
  const gapCounts = computeGapCounts(game.participants, game.roleRequirements)
  const confirmedTimeSlotId = game.confirmedTimeSlotId

  return game.waitlist.map((p, idx) => {
    const reasons: string[] = []
    const matchedGap = getBestMatchedRoleForGap(p.member, game.roleRequirements, gapCounts)
    const canArrive = confirmedTimeSlotId ? p.timeSlots.includes(confirmedTimeSlotId) : false

    if (matchedGap) {
      reasons.push(`匹配${game.roleRequirements.find(r => r.type === matchedGap)?.label || '缺口'}`)
    }
    if (p.member.recentSessionCount === 0) {
      reasons.push('本月未参车')
    } else if (p.member.recentSessionCount <= 1) {
      reasons.push('参车少')
    }
    if (canArrive) {
      reasons.push('可到确认时间')
    }
    if (p.member.ability.timelineExpert) reasons.push('时间线达人')
    if (p.member.ability.cipherExpert) reasons.push('密码破解')
    if (p.member.note.goodForNewbies) reasons.push('适合带新')

    return {
      participant: p,
      rank: idx + 1,
      reasons,
      matchedGap,
      canArriveConfirmedTime: canArrive
    }
  })
}

const getBestMatchedRoleForGap = (
  member: Member,
  requirements: RoleRequirement[],
  gapCounts: Record<RoleType, number>
): RoleType | undefined => {
  let bestRole: RoleType | undefined
  let bestScore = -1
  for (const req of requirements) {
    if (gapCounts[req.type] <= 0) continue
    const score = getRoleMatchScore(member, req.type)
    if (score > bestScore) {
      bestScore = score
      bestRole = req.type
    }
  }
  return bestScore > 0 ? bestRole : undefined
}

const computeGapCounts = (
  participants: Participant[],
  requirements: RoleRequirement[]
): Record<RoleType, number> => {
  const filled = getFilledRoleCounts(participants, requirements)
  const gaps: Record<string, number> = {}
  requirements.forEach(r => {
    gaps[r.type] = r.count - filled[r.type]
  })
  return gaps as Record<RoleType, number>
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
  getMyNotifications: () => Notification[]
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

const sortWaitlist = (
  waitlist: Participant[],
  requirements: RoleRequirement[],
  participants: Participant[]
): Participant[] => {
  const gapCounts = computeGapCounts(participants, requirements)

  return [...waitlist].sort((a, b) => {
    const aRoleMatch = getBestMatchedRoleForGap(a.member, requirements, gapCounts)
    const bRoleMatch = getBestMatchedRoleForGap(b.member, requirements, gapCounts)
    const aRoleScore = aRoleMatch ? getRoleMatchScore(a.member, aRoleMatch) * 50 : 0
    const bRoleScore = bRoleMatch ? getRoleMatchScore(b.member, bRoleMatch) * 50 : 0

    const scoreA = a.member.recentSessionCount * 100 + aRoleScore
      + (a.member.ability.timelineExpert ? 1 : 0) + (a.member.ability.cipherExpert ? 1 : 0)
    const scoreB = b.member.recentSessionCount * 100 + bRoleScore
      + (b.member.ability.timelineExpert ? 1 : 0) + (b.member.ability.cipherExpert ? 1 : 0)

    if (scoreA !== scoreB) return scoreA - scoreB
    return new Date(a.signupTime).getTime() - new Date(b.signupTime).getTime()
  }).map((p, idx) => {
    const gapCountsNow = computeGapCounts(participants, requirements)
    const matchedRole = getBestMatchedRoleForGap(p.member, requirements, gapCountsNow)
    return { ...p, waitlistRank: idx + 1, matchedRole }
  })
}

const recomputeGameStatus = (game: Game): Game => {
  let status: GameStatus = game.status
  if (game.status !== 'cancelled') {
    if (game.confirmedTime) {
      status = 'confirmed'
    } else if (game.currentPlayers >= game.totalPlayers && game.participants.length >= game.totalPlayers) {
      status = 'full'
    } else {
      status = 'recruiting'
    }
  }
  return { ...game, status }
}

const recomputeParticipantsRoles = (game: Game): Game => {
  const newParticipants = game.participants.map(p => ({
    ...p,
    matchedRole: getBestMatchedRole(p.member, game.roleRequirements)
  }))
  const newWaitlist = sortWaitlist(game.waitlist, game.roleRequirements, newParticipants)
  return { ...game, participants: newParticipants, waitlist: newWaitlist }
}

const initializeMockGames = (games: Game[]): Game[] => {
  return games.map(g => recomputeParticipantsRoles(recomputeGameStatus(g)))
}

const initialNotifications: Notification[] = []

export const useClubStore = create<ClubStore>((set, get) => ({
  members: JSON.parse(JSON.stringify(mockMembers)),
  games: initializeMockGames(JSON.parse(JSON.stringify(mockGames))),
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

      const newGames = state.games.map(g => {
        const updatedGame = {
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
        }
        return recomputeParticipantsRoles(updatedGame)
      })

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
          const newWaitlist = sortWaitlist([...g.waitlist, { ...newParticipant, waitlistRank: g.waitlist.length + 1 }], g.roleRequirements, g.participants)
          const rank = newWaitlist.find(p => p.memberId === memberId)?.waitlistRank
          result = { success: true, isWaitlist: true, waitlistRank: rank }
          return recomputeGameStatus({ ...g, waitlist: newWaitlist })
        } else {
          result = { success: true, isWaitlist: false }
          const updatedGame = recomputeGameStatus({
            ...g,
            currentPlayers: g.currentPlayers + 1,
            participants: [...g.participants, newParticipant]
          })
          return recomputeParticipantsRoles(updatedGame)
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
            newWaitlist = sortWaitlist(newWaitlist.slice(1), g.roleRequirements, newParticipants)
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

          const updatedGame = recomputeGameStatus({
            ...g,
            currentPlayers: newCurrentPlayers,
            participants: newParticipants,
            waitlist: newWaitlist
          })
          return recomputeParticipantsRoles(updatedGame)
        } else {
          const newWaitlist = sortWaitlist(g.waitlist.filter(p => p.memberId !== memberId), g.roleRequirements, g.participants)

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

        const newParticipants = [...g.participants, promoted]
        const newWaitlist = sortWaitlist(g.waitlist.filter(p => p.waitlistRank !== waitlistRank), g.roleRequirements, newParticipants)

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

        const updatedGame = recomputeGameStatus({
          ...g,
          currentPlayers: g.currentPlayers + 1,
          participants: newParticipants,
          waitlist: newWaitlist
        })
        return recomputeParticipantsRoles(updatedGame)
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
        return { ...g, waitlist: sortWaitlist(g.waitlist, g.roleRequirements, g.participants) }
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
          memberId,
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

  getMyNotifications: () => {
    const { notifications, currentUserId } = get()
    return notifications.filter(n => n.memberId === currentUserId).slice(0, 10)
  },

  markNotificationRead: (notificationId: string) => {
    const { currentUserId } = get()
    set(state => ({
      notifications: state.notifications.map(n =>
        n.id === notificationId && n.memberId === currentUserId ? { ...n, read: true } : n
      )
    }))
  },

  markAllNotificationsRead: () => {
    const { currentUserId } = get()
    set(state => ({
      notifications: state.notifications.map(n =>
        n.memberId === currentUserId ? { ...n, read: true } : n
      )
    }))
  },

  getUnreadCount: () => {
    const { notifications, currentUserId } = get()
    return notifications.filter(n => !n.read && n.memberId === currentUserId).length
  }
}))
