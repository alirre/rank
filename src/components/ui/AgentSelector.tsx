'use client'

import { useState } from 'react'
import { VALORANT_AGENTS, VALORANT_ROLES, type ValorantAgent } from '@/lib/constants'
import { Check, Search, Sparkles } from 'lucide-react'

interface AgentSelectorProps {
  mode?: 'single' | 'multiple'
  selectedAgents: string[] // agent names (e.g. ['Jett', 'Omen'])
  onChange: (selected: string[]) => void
  maxSelection?: number
  label?: string
  subtitle?: string
}

export default function AgentSelector({
  mode = 'multiple',
  selectedAgents = [],
  onChange,
  maxSelection,
  label,
  subtitle,
}: AgentSelectorProps) {
  const [activeRoleFilter, setActiveRoleFilter] = useState<string>('Tümü')
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [imgErrorMap, setImgErrorMap] = useState<Record<string, boolean>>({})

  const handleSelect = (agent: ValorantAgent) => {
    if (mode === 'single') {
      onChange([agent.name])
      return
    }

    if (selectedAgents.includes(agent.name)) {
      onChange(selectedAgents.filter((a) => a !== agent.name))
    } else {
      if (maxSelection && selectedAgents.length >= maxSelection) {
        // Swap last if max reached or ignore
        return
      }
      onChange([...selectedAgents, agent.name])
    }
  }

  const filteredAgents = VALORANT_AGENTS.filter((agent) => {
    const matchesRole = activeRoleFilter === 'Tümü' || agent.role === activeRoleFilter
    const matchesQuery = agent.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
    return matchesRole && matchesQuery
  })

  return (
    <div className="space-y-3.5">
      {(label || subtitle) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            {label && (
              <label className="text-xs font-semibold text-[#F5F5FA] block">
                {label}
              </label>
            )}
            {subtitle && (
              <span className="text-[11px] text-[#686E80] block mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
          {maxSelection && mode === 'multiple' && (
            <span className="text-[11px] text-[#A855F7] font-mono tabular-numbers">
              {selectedAgents.length} / {maxSelection} seçildi
            </span>
          )}
        </div>
      )}

      {/* Role Tabs & Search */}
      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {['Tümü', 'Düellocu', 'Öncü', 'Kontrol Uzmanı', 'Gözcü'].map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setActiveRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                activeRoleFilter === role
                  ? 'bg-[#A855F7] text-white shadow-[0_0_12px_rgba(168,85,247,0.35)]'
                  : 'bg-[#0E1018] text-[#A1A6B5] hover:text-white border border-[rgba(255,255,255,0.06)]'
              }`}
            >
              {role}
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-[180px]">
          <Search size={13} className="absolute left-2.5 top-2.5 text-[#686E80]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ajan ara..."
            className="input-game pl-7 py-1.5 text-xs w-full bg-[#0E1018]"
          />
        </div>
      </div>

      {/* Visual Agents Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-2.5 max-h-72 overflow-y-auto p-1 pr-1.5 rounded-xl border border-[rgba(255,255,255,0.06)] bg-[#0A0C13]">
        {filteredAgents.map((agent) => {
          const isSelected = selectedAgents.includes(agent.name)
          const hasError = imgErrorMap[agent.id]

          return (
            <button
              key={agent.id}
              type="button"
              onClick={() => handleSelect(agent)}
              className={`relative group rounded-xl p-2 flex flex-col items-center justify-center transition-all cursor-pointer text-center outline-none ${
                isSelected
                  ? 'bg-[#A855F7]/20 border-2 border-[#A855F7] shadow-[0_0_16px_rgba(168,85,247,0.4)] scale-[1.02]'
                  : 'bg-[#141722]/80 border border-[rgba(255,255,255,0.06)] hover:border-[#A855F7]/40 hover:bg-[#191D2A]'
              }`}
              title={`${agent.name} - ${agent.role}`}
            >
              {/* Checkmark icon for selected */}
              {isSelected && (
                <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#A855F7] flex items-center justify-center text-white z-10 shadow-sm">
                  <Check size={11} strokeWidth={3} />
                </div>
              )}

              {/* Agent Portrait Image with Graceful SVG Fallback */}
              <div className="w-12 h-12 rounded-lg overflow-hidden mb-1.5 flex items-center justify-center bg-[#0E1018] border border-[rgba(255,255,255,0.04)] relative">
                {!hasError && agent.iconUrl ? (
                  <img
                    src={agent.iconUrl}
                    alt={agent.name}
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={() => setImgErrorMap((prev) => ({ ...prev, [agent.id]: true }))}
                    loading="lazy"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-xs font-bold font-mono"
                    style={{ color: agent.color || '#A855F7' }}
                  >
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>

              {/* Agent Name */}
              <span className={`text-[11px] font-bold truncate max-w-full leading-tight ${
                isSelected ? 'text-white' : 'text-[#F5F5FA] group-hover:text-white'
              }`}>
                {agent.name}
              </span>

              {/* Role Indicator */}
              <span className="text-[9px] text-[#686E80] truncate max-w-full">
                {agent.role}
              </span>
            </button>
          )
        })}

        {filteredAgents.length === 0 && (
          <div className="col-span-full py-8 text-center text-xs text-[#686E80]">
            Eşleşen ajan bulunamadı.
          </div>
        )}
      </div>
    </div>
  )
}
