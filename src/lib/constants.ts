// GAMES CATALOG (Valorant focused for V1, extensible for CS2/others)
export interface Game {
  id: string
  name: string
  slug: string
  icon: string
  isActive: boolean
}

export const GAMES: Game[] = [
  { id: 'valorant', name: 'Valorant', slug: 'valorant', icon: '🎯', isActive: true },
  { id: 'csgo', name: 'CS2', slug: 'cs2', icon: '🔫', isActive: false },
  { id: 'apexlegends', name: 'Apex Legends', slug: 'apex-legends', icon: '💫', isActive: false },
]

// VALORANT MERKEZİ VERİ KATALOĞU (CENTRAL AGENTS & RANKS)

export interface ValorantAgent {
  id: string
  name: string
  role: 'Düellocu' | 'Öncü' | 'Kontrol Uzmanı' | 'Gözcü'
  iconUrl?: string
  portraitUrl?: string
  color?: string
}

export const VALORANT_AGENTS: ValorantAgent[] = [
  // Düellocu (Duelists)
  {
    id: 'jett',
    name: 'Jett',
    role: 'Düellocu',
    iconUrl: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/add6443a-41bd-e414-f6ad-e58d267f4e95/fullportrait.png',
    color: '#89E4E5'
  },
  {
    id: 'reyna',
    name: 'Reyna',
    role: 'Düellocu',
    iconUrl: 'https://media.valorant-api.com/agents/a3bfb854-4376-aa96-365b-64ba52294f33/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/a3bfb854-4376-aa96-365b-64ba52294f33/fullportrait.png',
    color: '#C73887'
  },
  {
    id: 'raze',
    name: 'Raze',
    role: 'Düellocu',
    iconUrl: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/f94c3b30-42be-e959-889c-5aa313dba261/fullportrait.png',
    color: '#F47933'
  },
  {
    id: 'phoenix',
    name: 'Phoenix',
    role: 'Düellocu',
    iconUrl: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/eb93336a-449b-9c1b-0a54-a891f7921d69/fullportrait.png',
    color: '#E97232'
  },
  {
    id: 'yoru',
    name: 'Yoru',
    role: 'Düellocu',
    iconUrl: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/7f94d92c-4234-0a36-9646-3a87eb8b5c89/fullportrait.png',
    color: '#284697'
  },
  {
    id: 'neon',
    name: 'Neon',
    role: 'Düellocu',
    iconUrl: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d73a/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/bb2a4828-46eb-8cd1-e765-15848195d73a/fullportrait.png',
    color: '#498AE7'
  },
  {
    id: 'iso',
    name: 'Iso',
    role: 'Düellocu',
    iconUrl: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/0e38b510-41a8-5780-5e8f-568b2a4f2d6c/fullportrait.png',
    color: '#714BE3'
  },

  // Öncü (Initiators)
  {
    id: 'sova',
    name: 'Sova',
    role: 'Öncü',
    iconUrl: 'https://media.valorant-api.com/agents/ded3520f-4264-bfed-162d-a080e2abccf9/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/ded3520f-4264-bfed-162d-a080e2abccf9/fullportrait.png',
    color: '#346BEA'
  },
  {
    id: 'breach',
    name: 'Breach',
    role: 'Öncü',
    iconUrl: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-dd85703f06cb/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/5f8d3a7f-467b-97f3-062c-dd85703f06cb/fullportrait.png',
    color: '#B85834'
  },
  {
    id: 'skye',
    name: 'Skye',
    role: 'Öncü',
    iconUrl: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/6f2a04ca-43e0-be17-7f36-b3908627744d/fullportrait.png',
    color: '#609B6A'
  },
  {
    id: 'kayo',
    name: 'KAY/O',
    role: 'Öncü',
    iconUrl: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/601dbbe7-43ce-be57-2a40-4abd24953621/fullportrait.png',
    color: '#397EE7'
  },
  {
    id: 'fade',
    name: 'Fade',
    role: 'Öncü',
    iconUrl: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/dade69b4-4f5a-8528-247b-219e5a1facd6/fullportrait.png',
    color: '#284666'
  },
  {
    id: 'gekko',
    name: 'Gekko',
    role: 'Öncü',
    iconUrl: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/e370fa57-4757-3604-3648-499e1f642d3f/fullportrait.png',
    color: '#C6E455'
  },
  {
    id: 'tejo',
    name: 'Tejo',
    role: 'Öncü',
    iconUrl: 'https://media.valorant-api.com/agents/ded3520f-4264-bfed-162d-a080e2abccf9/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/ded3520f-4264-bfed-162d-a080e2abccf9/fullportrait.png',
    color: '#E06B38'
  },

  // Kontrol Uzmanı (Controllers)
  {
    id: 'brimstone',
    name: 'Brimstone',
    role: 'Kontrol Uzmanı',
    iconUrl: 'https://media.valorant-api.com/agents/9f0d8ba9-42c0-b1e3-ecef-46970ea22212/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/9f0d8ba9-42c0-b1e3-ecef-46970ea22212/fullportrait.png',
    color: '#C3542E'
  },
  {
    id: 'omen',
    name: 'Omen',
    role: 'Kontrol Uzmanı',
    iconUrl: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-169c-96b6ce0efeee/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/8e253930-4c05-31dd-169c-96b6ce0efeee/fullportrait.png',
    color: '#4B559F'
  },
  {
    id: 'viper',
    name: 'Viper',
    role: 'Kontrol Uzmanı',
    iconUrl: 'https://media.valorant-api.com/agents/707eab51-472e-f836-3835-969532707bfb/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/707eab51-472e-f836-3835-969532707bfb/fullportrait.png',
    color: '#36A257'
  },
  {
    id: 'astra',
    name: 'Astra',
    role: 'Kontrol Uzmanı',
    iconUrl: 'https://media.valorant-api.com/agents/41fb69c1-4152-47e3-920a-40773cc09772/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/41fb69c1-4152-47e3-920a-40773cc09772/fullportrait.png',
    color: '#703DA9'
  },
  {
    id: 'harbor',
    name: 'Harbor',
    role: 'Kontrol Uzmanı',
    iconUrl: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/fullportrait.png',
    color: '#137976'
  },
  {
    id: 'clove',
    name: 'Clove',
    role: 'Kontrol Uzmanı',
    iconUrl: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-ffb5da4244b2/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/1dbf2edd-4729-0984-3115-ffb5da4244b2/fullportrait.png',
    color: '#D863B8'
  },

  // Gözcü (Sentinels)
  {
    id: 'killjoy',
    name: 'Killjoy',
    role: 'Gözcü',
    iconUrl: 'https://media.valorant-api.com/agents/1e58de9c-4950-523e-f32c-70a380e7f4b4/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/1e58de9c-4950-523e-f32c-70a380e7f4b4/fullportrait.png',
    color: '#F4CA38'
  },
  {
    id: 'cypher',
    name: 'Cypher',
    role: 'Gözcü',
    iconUrl: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/117ed9e3-49f3-6512-3ccf-0cada7e3823b/fullportrait.png',
    color: '#C5A07A'
  },
  {
    id: 'sage',
    name: 'Sage',
    role: 'Gözcü',
    iconUrl: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/569fdd95-4d10-43ab-ca70-79becc718b46/fullportrait.png',
    color: '#49B39B'
  },
  {
    id: 'chamber',
    name: 'Chamber',
    role: 'Gözcü',
    iconUrl: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/22697a3d-45bf-8dd7-4fec-84a9e28c69d7/fullportrait.png',
    color: '#B69255'
  },
  {
    id: 'deadlock',
    name: 'Deadlock',
    role: 'Gözcü',
    iconUrl: 'https://media.valorant-api.com/agents/cc8b64d8-4b25-4ff9-6e7f-37b4da43c235/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/cc8b64d8-4b25-4ff9-6e7f-37b4da43c235/fullportrait.png',
    color: '#658E9C'
  },
  {
    id: 'vyse',
    name: 'Vyse',
    role: 'Gözcü',
    iconUrl: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/displayicon.png',
    portraitUrl: 'https://media.valorant-api.com/agents/95b78ed7-4637-86d9-7e41-71ba8c293152/fullportrait.png',
    color: '#C562DD'
  },
]

export const VALORANT_ROLES = [
  { id: 'duelist', name: 'Düellocu', icon: '⚔️', color: '#F87171' },
  { id: 'controller', name: 'Kontrol Uzmanı', icon: '🌫️', color: '#A855F7' },
  { id: 'sentinel', name: 'Gözcü', icon: '🛡️', color: '#38BDF8' },
  { id: 'initiator', name: 'Öncü', icon: '🎯', color: '#FBBF24' },
]

export const VALORANT_RANKS = [
  { id: 'iron', name: 'Demir', tiers: ['Demir 1', 'Demir 2', 'Demir 3'], color: '#94A3B8' },
  { id: 'bronze', name: 'Bronz', tiers: ['Bronz 1', 'Bronz 2', 'Bronz 3'], color: '#B45309' },
  { id: 'silver', name: 'Gümüş', tiers: ['Gümüş 1', 'Gümüş 2', 'Gümüş 3'], color: '#CBD5E1' },
  { id: 'gold', name: 'Altın', tiers: ['Altın 1', 'Altın 2', 'Altın 3'], color: '#EAB308' },
  { id: 'platinum', name: 'Platin', tiers: ['Platin 1', 'Platin 2', 'Platin 3'], color: '#06B6D4' },
  { id: 'diamond', name: 'Elmas', tiers: ['Elmas 1', 'Elmas 2', 'Elmas 3'], color: '#818CF8' },
  { id: 'ascendant', name: 'Yücelik', tiers: ['Yücelik 1', 'Yücelik 2', 'Yücelik 3'], color: '#10B981' },
  { id: 'immortal', name: 'Ölümsüzlük', tiers: ['Ölümsüzlük 1', 'Ölümsüzlük 2', 'Ölümsüzlük 3'], color: '#F43F5E' },
  { id: 'radiant', name: 'Radyant', tiers: ['Radyant'], color: '#FACC15' },
]

export const ALL_VALORANT_TIERS = VALORANT_RANKS.flatMap((r) => r.tiers)

export const VALORANT_MODES = [
  { id: 'competitive', name: 'Rekabetçi', maxTeamSize: 5 },
  { id: 'unrated', name: 'Derecesiz', maxTeamSize: 5 },
  { id: 'swiftplay', name: 'Hızlı Oyun', maxTeamSize: 5 },
  { id: 'premier', name: 'Premier', maxTeamSize: 5 },
  { id: 'custom', name: 'Özel Oyun', maxTeamSize: 10 },
]

export const SERVERS = [
  { id: 'tr', name: 'İstanbul (TR)' },
  { id: 'eu-frankfurt', name: 'Frankfurt (EU)' },
  { id: 'eu-london', name: 'Londra (EU)' },
  { id: 'eu-paris', name: 'Paris (EU)' },
  { id: 'eu-warsaw', name: 'Varşova (EU)' },
  { id: 'eu-madrid', name: 'Madrid (EU)' },
]

export const PLAY_STYLES = [
  { id: 'serious', name: 'Ciddi Rank Kasma', icon: '🎯' },
  { id: 'tactical', name: 'Taktik Odaklı', icon: '🧠' },
  { id: 'balanced', name: 'Dengeli & Sakin', icon: '⚖️' },
  { id: 'aggressive', name: 'Agresif & Entry', icon: '🔥' },
  { id: 'casual', name: 'Rahat / Chill', icon: '😎' },
  { id: 'fun', name: 'Eğlence Odaklı', icon: '🎉' },
]

export const REVIEW_TAGS_POSITIVE = [
  { id: 'good_communication', name: 'İyi İletişim', emoji: '💬' },
  { id: 'team_player', name: 'Takım Oyuncusu', emoji: '🤝' },
  { id: 'positive_mindset', name: 'Pozitif', emoji: '✨' },
  { id: 'good_tactics', name: 'Taktik Bilgisi İyi', emoji: '🧠' },
  { id: 'respectful', name: 'Saygılı', emoji: '🛡️' },
  { id: 'no_tilt', name: 'Tilt Olmuyor', emoji: '🧊' },
]

export const REVIEW_TAGS_NEGATIVE = [
  { id: 'toxic', name: 'Toksik Davranış', emoji: '☠️' },
  { id: 'leaves_early', name: 'Maçtan Erken Ayrılma', emoji: '🚪' },
  { id: 'blames_team', name: 'Takımı Suçluyor', emoji: '😤' },
  { id: 'no_teamplay', name: 'Takım Oyununa Uymama', emoji: '🚫' },
  { id: 'troll', name: 'Troll Davranış', emoji: '🃏' },
]

export const NOTIFICATION_TYPES = {
  GROUP_APPLICATION: 'group_application',
  APPLICATION_ACCEPTED: 'application_accepted',
  APPLICATION_REJECTED: 'application_rejected',
  GROUP_FULL: 'group_full',
  GROUP_COMPLETED: 'group_completed',
  REVIEW_AVAILABLE: 'review_available',
  KICKED_FROM_GROUP: 'kicked_from_group',
  REPORT_RESOLVED: 'report_resolved',
} as const
