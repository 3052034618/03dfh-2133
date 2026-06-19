import type { Game } from '@/types/game'
import { mockMembers } from './members'

export const mockGames: Game[] = [
  {
    id: 'g1',
    title: '月光下的谋杀案',
    type: '硬核推理',
    cover: 'https://picsum.photos/id/1/750/500',
    totalPlayers: 6,
    currentPlayers: 5,
    location: '东区大学生活动中心302',
    aaFee: 35,
    readingRequirement: '人均阅读量约2万字，建议预留30分钟读本时间',
    noSpoilerNotice: '严禁剧透！禁止讨论任何关于凶手身份、作案手法的信息',
    hostId: 'm1',
    host: mockMembers[0],
    status: 'recruiting',
    availableTimeSlots: [
      { id: 't1', label: '周六下午', time: '2026-06-21 14:00' },
      { id: 't2', label: '周六晚上', time: '2026-06-21 19:00' },
      { id: 't3', label: '周日下午', time: '2026-06-22 14:00' }
    ],
    participants: [
      { memberId: 'm1', member: mockMembers[0], timeSlots: ['t1', 't2'], signupTime: '2026-06-18 10:00', status: 'confirmed', role: '车头/DM' },
      { memberId: 'm2', member: mockMembers[1], timeSlots: ['t1', 't2', 't3'], signupTime: '2026-06-18 10:30', status: 'confirmed' },
      { memberId: 'm3', member: mockMembers[2], timeSlots: ['t2', 't3'], signupTime: '2026-06-18 11:00', status: 'confirmed' },
      { memberId: 'm5', member: mockMembers[4], timeSlots: ['t1'], signupTime: '2026-06-18 11:15', status: 'confirmed' },
      { memberId: 'm7', member: mockMembers[6], timeSlots: ['t1', 't2'], signupTime: '2026-06-18 11:30', status: 'confirmed' }
    ],
    waitlist: [
      { memberId: 'm6', member: mockMembers[5], timeSlots: ['t2'], signupTime: '2026-06-18 12:00', status: 'waitlist', waitlistRank: 1 },
      { memberId: 'm9', member: mockMembers[8], timeSlots: ['t2', 't3'], signupTime: '2026-06-18 12:15', status: 'waitlist', waitlistRank: 2 }
    ],
    publishTime: '2026-06-18 09:00',
    sessionDate: '2026-06-21',
    description: '经典本格硬核推理本，三重密室反转，适合喜欢烧脑推理的同学。DM全程跟进，保证体验。',
    roleRequirements: [
      { type: 'timeline', label: '时间线位', count: 2, description: '擅长梳理复杂时间线' },
      { type: 'cipher', label: '密码题位', count: 1, description: '擅长破解密码和谜题' },
      { type: 'hardcore', label: '硬核推理位', count: 2, description: '耐6小时+长本' },
      { type: 'mentor', label: '带新位', count: 1, description: '适合带新人熟悉规则' }
    ]
  },
  {
    id: 'g2',
    title: '第七号嫌疑人',
    type: '本格推理',
    cover: 'https://picsum.photos/id/2/750/500',
    totalPlayers: 6,
    currentPlayers: 6,
    location: '南门桌游吧二楼VIP室',
    aaFee: 58,
    readingRequirement: '人均约1.5万字，分幕式剧本',
    noSpoilerNotice: '禁止场外信息，禁止使用手机搜索相关内容',
    hostId: 'm7',
    host: mockMembers[6],
    status: 'confirmed',
    availableTimeSlots: [
      { id: 't4', label: '周六下午', time: '2026-06-21 13:00' },
      { id: 't5', label: '周日下午', time: '2026-06-22 13:00' }
    ],
    confirmedTime: '2026-06-21 13:00',
    participants: [
      { memberId: 'm7', member: mockMembers[6], timeSlots: ['t4', 't5'], signupTime: '2026-06-17 10:00', status: 'confirmed', role: '车头/DM' },
      { memberId: 'm1', member: mockMembers[0], timeSlots: ['t4'], signupTime: '2026-06-17 10:15', status: 'confirmed' },
      { memberId: 'm2', member: mockMembers[1], timeSlots: ['t4', 't5'], signupTime: '2026-06-17 10:30', status: 'confirmed' },
      { memberId: 'm3', member: mockMembers[2], timeSlots: ['t4'], signupTime: '2026-06-17 10:45', status: 'confirmed' },
      { memberId: 'm5', member: mockMembers[4], timeSlots: ['t4', 't5'], signupTime: '2026-06-17 11:00', status: 'confirmed' },
      { memberId: 'm9', member: mockMembers[8], timeSlots: ['t4'], signupTime: '2026-06-17 11:15', status: 'confirmed' }
    ],
    waitlist: [],
    publishTime: '2026-06-17 09:00',
    sessionDate: '2026-06-21',
    description: '经典硬核本，层层递进的逻辑链，细节控狂喜。预计时长6-7小时。',
    roleRequirements: [
      { type: 'timeline', label: '时间线位', count: 2, description: '擅长梳理复杂时间线' },
      { type: 'cipher', label: '密码题位', count: 2, description: '擅长破解密码和谜题' },
      { type: 'hardcore', label: '硬核推理位', count: 2, description: '耐6小时+长本' }
    ]
  },
  {
    id: 'g3',
    title: '病娇男孩的精分日记',
    type: '变格推理',
    cover: 'https://picsum.photos/id/3/750/500',
    totalPlayers: 7,
    currentPlayers: 3,
    location: '西区咖啡屋包间',
    aaFee: 45,
    readingRequirement: '分幕式，每幕阅读量较小，共约1万字',
    noSpoilerNotice: '禁止剧透，建议不场外讨论剧情',
    hostId: 'm9',
    host: mockMembers[8],
    status: 'recruiting',
    availableTimeSlots: [
      { id: 't6', label: '周六晚上', time: '2026-06-21 18:30' },
      { id: 't7', label: '周日晚上', time: '2026-06-22 18:30' }
    ],
    participants: [
      { memberId: 'm9', member: mockMembers[8], timeSlots: ['t6', 't7'], signupTime: '2026-06-19 09:00', status: 'confirmed', role: '车头' },
      { memberId: 'm6', member: mockMembers[5], timeSlots: ['t6', 't7'], signupTime: '2026-06-19 09:30', status: 'confirmed' },
      { memberId: 'm10', member: mockMembers[9], timeSlots: ['t6'], signupTime: '2026-06-19 10:00', status: 'confirmed' }
    ],
    waitlist: [],
    publishTime: '2026-06-19 08:00',
    sessionDate: '2026-06-21',
    description: '微恐变格推理，新手友好，氛围拉满。预计时长4-5小时。',
    roleRequirements: [
      { type: 'timeline', label: '时间线位', count: 1, description: '擅长梳理时间线' },
      { type: 'mentor', label: '带新位', count: 2, description: '适合带新人熟悉规则' },
      { type: 'hardcore', label: '硬核推理位', count: 1, description: '主推理位' }
    ]
  },
  {
    id: 'g4',
    title: '漓川怪谈簿',
    type: '变格推理',
    cover: 'https://picsum.photos/id/8/750/500',
    totalPlayers: 7,
    currentPlayers: 7,
    location: '东区大学生活动中心305',
    aaFee: 40,
    readingRequirement: '人均阅读量约1.2万字，日式怪谈背景',
    noSpoilerNotice: '严禁剧透，尊重他人体验',
    hostId: 'm2',
    host: mockMembers[1],
    status: 'full',
    availableTimeSlots: [
      { id: 't8', label: '周日下午', time: '2026-06-22 13:30' }
    ],
    confirmedTime: '2026-06-22 13:30',
    participants: [
      { memberId: 'm2', member: mockMembers[1], timeSlots: ['t8'], signupTime: '2026-06-18 14:00', status: 'confirmed', role: '车头' },
      { memberId: 'm1', member: mockMembers[0], timeSlots: ['t8'], signupTime: '2026-06-18 14:10', status: 'confirmed' },
      { memberId: 'm3', member: mockMembers[2], timeSlots: ['t8'], signupTime: '2026-06-18 14:20', status: 'confirmed' },
      { memberId: 'm4', member: mockMembers[3], timeSlots: ['t8'], signupTime: '2026-06-18 14:30', status: 'confirmed' },
      { memberId: 'm5', member: mockMembers[4], timeSlots: ['t8'], signupTime: '2026-06-18 14:40', status: 'confirmed' },
      { memberId: 'm7', member: mockMembers[6], timeSlots: ['t8'], signupTime: '2026-06-18 14:50', status: 'confirmed' },
      { memberId: 'm8', member: mockMembers[7], timeSlots: ['t8'], signupTime: '2026-06-18 15:00', status: 'confirmed' }
    ],
    waitlist: [
      { memberId: 'm6', member: mockMembers[5], timeSlots: ['t8'], signupTime: '2026-06-18 15:10', status: 'waitlist', waitlistRank: 1 },
      { memberId: 'm10', member: mockMembers[9], timeSlots: ['t8'], signupTime: '2026-06-18 15:20', status: 'waitlist', waitlistRank: 2 }
    ],
    publishTime: '2026-06-18 13:00',
    sessionDate: '2026-06-22',
    description: '日式妖怪背景的硬核推理本，诡计精巧，逻辑闭环。口碑神作！',
    roleRequirements: [
      { type: 'timeline', label: '时间线位', count: 2, description: '擅长梳理复杂时间线' },
      { type: 'cipher', label: '密码题位', count: 1, description: '擅长破解密码和谜题' },
      { type: 'hardcore', label: '硬核推理位', count: 2, description: '耐6小时+长本' },
      { type: 'mentor', label: '带新位', count: 2, description: '适合带新人熟悉规则' }
    ]
  },
  {
    id: 'g5',
    title: '搞钱！',
    type: '机制本',
    cover: 'https://picsum.photos/id/9/750/500',
    totalPlayers: 10,
    currentPlayers: 6,
    location: '南门桌游吧大包间',
    aaFee: 68,
    readingRequirement: '轻松阅读，人均约8000字，主打机制和互动',
    noSpoilerNotice: '禁止泄露个人任务和底牌',
    hostId: 'm5',
    host: mockMembers[4],
    status: 'recruiting',
    availableTimeSlots: [
      { id: 't9', label: '周六下午', time: '2026-06-21 14:30' },
      { id: 't10', label: '周日上午', time: '2026-06-22 10:00' }
    ],
    participants: [
      { memberId: 'm5', member: mockMembers[4], timeSlots: ['t9', 't10'], signupTime: '2026-06-19 15:00', status: 'confirmed', role: '车头' },
      { memberId: 'm10', member: mockMembers[9], timeSlots: ['t9', 't10'], signupTime: '2026-06-19 15:20', status: 'confirmed' },
      { memberId: 'm4', member: mockMembers[3], timeSlots: ['t10'], signupTime: '2026-06-19 15:40', status: 'confirmed' },
      { memberId: 'm6', member: mockMembers[5], timeSlots: ['t9', 't10'], signupTime: '2026-06-19 16:00', status: 'confirmed' },
      { memberId: 'm8', member: mockMembers[7], timeSlots: ['t9'], signupTime: '2026-06-19 16:20', status: 'confirmed' },
      { memberId: 'm3', member: mockMembers[2], timeSlots: ['t10'], signupTime: '2026-06-19 16:40', status: 'confirmed' }
    ],
    waitlist: [],
    publishTime: '2026-06-19 14:00',
    sessionDate: '2026-06-21',
    description: '超级欢乐机制本，搞钱为主，推理为辅。适合团建和新朋友破冰！新手也能玩。',
    roleRequirements: [
      { type: 'mentor', label: '带新位', count: 3, description: '适合带新人熟悉规则' },
      { type: 'hardcore', label: '硬核推理位', count: 1, description: '负责关键推理' },
      { type: 'timeline', label: '时间线位', count: 1, description: '梳理机制时间线' }
    ]
  }
]
