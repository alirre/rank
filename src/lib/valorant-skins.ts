// VALORANT FAVORITE SKINS CATALOG
// Official Valorant-API display icons

export interface ValorantSkin {
  id: string
  name: string
  weapon: 'Vandal' | 'Phantom' | 'Operator' | 'Sheriff' | 'Bıçak / Melee'
  iconUrl: string
  rarityColor?: string
}

export const POPULAR_VALORANT_SKINS: ValorantSkin[] = [
  // VANDAL
  {
    id: 'vandal-kuronami',
    name: 'Kuronami Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskinlevels/78e58a2d-4171-897c-9b62-1faea72b4f2c/displayicon.png',
    rarityColor: '#F59E0B'
  },
  {
    id: 'vandal-reaver',
    name: 'Yağmacı (Reaver) Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskins/b007d937-4b77-3e4b-74eb-3796d8b02227/displayicon.png',
    rarityColor: '#A855F7'
  },
  {
    id: 'vandal-prime',
    name: 'Asil (Prime) Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskins/9d31c0e7-4971-8848-0ca9-0e9641777263/displayicon.png',
    rarityColor: '#FBBF24'
  },
  {
    id: 'vandal-araxys',
    name: 'Araxys Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskins/775f560e-44db-6c53-b0e6-a08ea5b967aa/displayicon.png',
    rarityColor: '#F59E0B'
  },
  {
    id: 'vandal-glitchpop',
    name: 'Delipop (Glitchpop) Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskins/83431d10-441d-e069-b7b5-0c9f1396f4e6/displayicon.png',
    rarityColor: '#EC4899'
  },
  {
    id: 'vandal-ion',
    name: 'İyon (Ion) Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskins/5162a5b2-4d2a-c215-618a-9388df67e817/displayicon.png',
    rarityColor: '#38BDF8'
  },
  {
    id: 'vandal-chronovoid',
    name: 'Zamanın Ötesi (ChronoVoid) Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskins/f073fa83-4903-5182-e64e-0a955787fa67/displayicon.png',
    rarityColor: '#F59E0B'
  },
  {
    id: 'vandal-gaias',
    name: 'Gaia’nın İntikamı Vandal',
    weapon: 'Vandal',
    iconUrl: 'https://media.valorant-api.com/weaponskins/c897f1f9-4b13-8fc3-b54c-83b6f28eb444/displayicon.png',
    rarityColor: '#34D399'
  },

  // PHANTOM
  {
    id: 'phantom-oni',
    name: 'Oni Phantom',
    weapon: 'Phantom',
    iconUrl: 'https://media.valorant-api.com/weaponskins/1b730f06-4447-4952-475c-37bc8be62d29/displayicon.png',
    rarityColor: '#EF4444'
  },
  {
    id: 'phantom-recon',
    name: 'Keşif (Recon) Phantom',
    weapon: 'Phantom',
    iconUrl: 'https://media.valorant-api.com/weaponskins/b0580a82-4211-137b-967a-debe89d8ccf2/displayicon.png',
    rarityColor: '#9CA3AF'
  },
  {
    id: 'phantom-spectrum',
    name: 'Spektrum Phantom (Zedd)',
    weapon: 'Phantom',
    iconUrl: 'https://media.valorant-api.com/weaponskins/775ef248-43d0-8f92-5eb3-938f38120b22/displayicon.png',
    rarityColor: '#38BDF8'
  },
  {
    id: 'phantom-prime2',
    name: 'Asil//2.0 (Prime) Phantom',
    weapon: 'Phantom',
    iconUrl: 'https://media.valorant-api.com/weaponskins/092cf44b-48a5-d86b-4e00-26bc595914fa/displayicon.png',
    rarityColor: '#FBBF24'
  },
  {
    id: 'phantom-champions',
    name: 'Champions Phantom',
    weapon: 'Phantom',
    iconUrl: 'https://media.valorant-api.com/weaponskins/660c1844-42b7-a3a8-a3bc-13b02008323a/displayicon.png',
    rarityColor: '#F59E0B'
  },

  // OPERATOR
  {
    id: 'operator-elderflame',
    name: 'Ejder Ateşi (Elderflame) Operator',
    weapon: 'Operator',
    iconUrl: 'https://media.valorant-api.com/weaponskins/c693a129-45e0-1647-7977-17b5f102ee81/displayicon.png',
    rarityColor: '#F97316'
  },
  {
    id: 'operator-ion',
    name: 'İyon (Ion) Operator',
    weapon: 'Operator',
    iconUrl: 'https://media.valorant-api.com/weaponskins/5162a5b2-4d2a-c215-618a-9388df67e817/displayicon.png',
    rarityColor: '#38BDF8'
  },
  {
    id: 'operator-araxys',
    name: 'Araxys Operator',
    weapon: 'Operator',
    iconUrl: 'https://media.valorant-api.com/weaponskins/492dc0bb-4a7b-3b76-47eb-cb8c87fdf008/displayicon.png',
    rarityColor: '#F59E0B'
  },
  {
    id: 'operator-reaver',
    name: 'Yağmacı (Reaver) Operator',
    weapon: 'Operator',
    iconUrl: 'https://media.valorant-api.com/weaponskins/e06b3a9a-4f51-b883-8472-a7bc314a51eb/displayicon.png',
    rarityColor: '#A855F7'
  },

  // SHERIFF
  {
    id: 'sheriff-neo-frontier',
    name: 'Yeni Sınır (Neo Frontier) Sheriff',
    weapon: 'Sheriff',
    iconUrl: 'https://media.valorant-api.com/weaponskins/1183c501-4be3-2ce1-df22-48a58ec2d5e3/displayicon.png',
    rarityColor: '#EAB308'
  },
  {
    id: 'sheriff-kuronami',
    name: 'Kuronami Sheriff',
    weapon: 'Sheriff',
    iconUrl: 'https://media.valorant-api.com/weaponskins/369792fe-45a7-96a8-f80e-66bf825227a8/displayicon.png',
    rarityColor: '#F59E0B'
  },
  {
    id: 'sheriff-reaver',
    name: 'Yağmacı (Reaver) Sheriff',
    weapon: 'Sheriff',
    iconUrl: 'https://media.valorant-api.com/weaponskins/052e46b6-4554-e659-42b7-a3843e9894e6/displayicon.png',
    rarityColor: '#A855F7'
  },
  {
    id: 'sheriff-ion',
    name: 'İyon (Ion) Sheriff',
    weapon: 'Sheriff',
    iconUrl: 'https://media.valorant-api.com/weaponskins/f553f49b-44ec-6b22-8178-0cb93325c347/displayicon.png',
    rarityColor: '#38BDF8'
  },

  // BIÇAK / MELEE
  {
    id: 'knife-kuronami',
    name: 'Kuronami no Yaiba',
    weapon: 'Bıçak / Melee',
    iconUrl: 'https://media.valorant-api.com/weaponskins/2c2c0182-41e9-22a7-f277-2da364239841/displayicon.png',
    rarityColor: '#F59E0B'
  },
  {
    id: 'knife-reaver-karambit',
    name: 'Yağmacı Karambit',
    weapon: 'Bıçak / Melee',
    iconUrl: 'https://media.valorant-api.com/weaponskins/31adbe6e-41a4-da23-9524-749e7b275d3d/displayicon.png',
    rarityColor: '#A855F7'
  },
  {
    id: 'knife-xenohunter',
    name: 'Uzaylı Avcısı (Xenohunter) Bıçağı',
    weapon: 'Bıçak / Melee',
    iconUrl: 'https://media.valorant-api.com/weaponskins/81691ea4-4866-c956-613b-aa8a221f0088/displayicon.png',
    rarityColor: '#10B981'
  },
  {
    id: 'knife-ignite-fan',
    name: 'Ateş Püsküren Yelpaze (Ignite Fan)',
    weapon: 'Bıçak / Melee',
    iconUrl: 'https://media.valorant-api.com/weaponskins/d1e19d71-4601-09fc-f0fc-df80e9a11880/displayicon.png',
    rarityColor: '#EF4444'
  },
]

export const WEAPON_CATEGORIES = [
  'Tümü',
  'Vandal',
  'Phantom',
  'Operator',
  'Sheriff',
  'Bıçak / Melee'
] as const
