'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Users,
  Sparkles,
  RotateCcw,
  Check,
  Utensils,
  Crown,
  Music,
  Heart,
  Plus,
  ShieldCheck,
} from 'lucide-react';

export type TableEnvironmentId = 'mandap' | 'sangeet' | 'elders';

export interface BanquetGuest {
  id: string;
  name: string;
  relation: string;
  avatarText: string;
  avatarImage: string;
  dietary: 'jain' | 'pure-veg' | 'standard';
  dietaryLabel: string;
  vip?: boolean;
}

export interface TableEnvironment {
  id: TableEnvironmentId;
  name: string;
  subtitle: string;
  tagline: string;
  thaliPrice: number;
  capacity: number;
  accentColor: string;
  icon: React.ComponentType<{ className?: string }>;
  guests: BanquetGuest[];
}

const TABLE_ENVIRONMENTS: Record<TableEnvironmentId, TableEnvironment> = {
  mandap: {
    id: 'mandap',
    name: 'Mandap Royal Front',
    subtitle: 'Table 1 · Front Row Pavilion',
    tagline: 'VVIP immediate family dining',
    thaliPrice: 2400,
    capacity: 8,
    accentColor: '#C2410C',
    icon: Crown,
    guests: [
      { id: 'm1', name: 'Aarav Sharma', relation: 'Groom', avatarText: 'AS', avatarImage: '/assets/images/banquet/avatar_groom.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg', vip: true },
      { id: 'm2', name: 'Meera Patel', relation: 'Bride', avatarText: 'MP', avatarImage: '/assets/images/banquet/avatar_bride.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg', vip: true },
      { id: 'm3', name: 'Kavita Devi', relation: 'Nani (Maternal)', avatarText: 'KD', avatarImage: '/assets/images/banquet/avatar_grandmother.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali', vip: true },
      { id: 'm4', name: 'Ramesh Patel', relation: 'Nana (Maternal)', avatarText: 'RP', avatarImage: '/assets/images/banquet/avatar_grandfather.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali', vip: true },
      { id: 'm5', name: 'Vikram Sharma', relation: "Father's Brother (Chacha)", avatarText: 'VS', avatarImage: '/assets/images/banquet/avatar_uncle.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
      { id: 'm6', name: 'Sunita Sharma', relation: "Father's Sister (Chachi)", avatarText: 'SS', avatarImage: '/assets/images/banquet/avatar_aunt.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali' },
      { id: 'm7', name: 'Dev Patel', relation: "Bride's Brother", avatarText: 'DP', avatarImage: '/assets/images/banquet/avatar_young_man.jpg', dietary: 'standard', dietaryLabel: 'Standard Thali' },
      { id: 'm8', name: 'Ananya Sen', relation: 'Chief Bridesmaid', avatarText: 'AS', avatarImage: '/assets/images/banquet/avatar_young_woman.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
    ],
  },
  sangeet: {
    id: 'sangeet',
    name: 'Sangeet Courtyard Lounge',
    subtitle: 'Table 2 · Center Stage Circle',
    tagline: 'Cousins and friends circle',
    thaliPrice: 1850,
    capacity: 8,
    accentColor: '#D97706',
    icon: Music,
    guests: [
      { id: 's1', name: 'Rohan Mehra', relation: 'Best Man', avatarText: 'RM', avatarImage: '/assets/images/banquet/avatar_young_man.jpg', dietary: 'standard', dietaryLabel: 'Standard Thali' },
      { id: 's2', name: 'Pooja Verma', relation: 'Friend', avatarText: 'PV', avatarImage: '/assets/images/banquet/avatar_young_woman.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
      { id: 's3', name: 'Kabir Kapoor', relation: 'College Crew', avatarText: 'KK', avatarImage: '/assets/images/banquet/avatar_uncle.jpg', dietary: 'standard', dietaryLabel: 'Standard Thali' },
      { id: 's4', name: 'Ishita Roy', relation: "Bride's Cousin", avatarText: 'IR', avatarImage: '/assets/images/banquet/avatar_bride.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
      { id: 's5', name: 'Varun Joshi', relation: "Groom's Cousin", avatarText: 'VJ', avatarImage: '/assets/images/banquet/avatar_groom.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali' },
      { id: 's6', name: 'Rhea Sen', relation: 'Sangeet Host', avatarText: 'RS', avatarImage: '/assets/images/banquet/avatar_young_woman.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
      { id: 's7', name: 'Aditya Rao', relation: 'Musician Friend', avatarText: 'AR', avatarImage: '/assets/images/banquet/avatar_young_man.jpg', dietary: 'standard', dietaryLabel: 'Standard Thali' },
      { id: 's8', name: 'Simran Gill', relation: 'Childhood Friend', avatarText: 'SG', avatarImage: '/assets/images/banquet/avatar_aunt.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
    ],
  },
  elders: {
    id: 'elders',
    name: 'Elders Heritage Pavilion',
    subtitle: 'Table 3 · Quiet Garden Wing',
    tagline: 'Senior family and traditional dining',
    thaliPrice: 1650,
    capacity: 8,
    accentColor: '#059669',
    icon: Heart,
    guests: [
      { id: 'e1', name: 'Harish Chandra', relation: 'Grandfather (Dada)', avatarText: 'HC', avatarImage: '/assets/images/banquet/avatar_grandfather.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali', vip: true },
      { id: 'e2', name: 'Saraswati Devi', relation: 'Grandmother (Dadi)', avatarText: 'SD', avatarImage: '/assets/images/banquet/avatar_grandmother.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali', vip: true },
      { id: 'e3', name: 'Om Prakash', relation: 'Elder Uncle', avatarText: 'OP', avatarImage: '/assets/images/banquet/avatar_uncle.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
      { id: 'e4', name: 'Kamla Devi', relation: 'Elder Aunt', avatarText: 'KD', avatarImage: '/assets/images/banquet/avatar_aunt.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali' },
      { id: 'e5', name: 'Bhagwan Das', relation: 'Family Priest', avatarText: 'BD', avatarImage: '/assets/images/banquet/avatar_grandfather.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali', vip: true },
      { id: 'e6', name: 'Shanti Devi', relation: 'Family Matriarch', avatarText: 'SD', avatarImage: '/assets/images/banquet/avatar_grandmother.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
      { id: 'e7', name: 'Kailash Nath', relation: 'Senior Trustee', avatarText: 'KN', avatarImage: '/assets/images/banquet/avatar_uncle.jpg', dietary: 'pure-veg', dietaryLabel: 'Pure Veg' },
      { id: 'e8', name: 'Urmila Nath', relation: 'Senior Guest', avatarText: 'UN', avatarImage: '/assets/images/banquet/avatar_aunt.jpg', dietary: 'jain', dietaryLabel: 'Jain Thali' },
    ],
  },
};

export function InteractiveBanquetSeatingMatrix() {
  const [selectedTableId, setSelectedTableId] = useState<TableEnvironmentId>('mandap');
  const [seatedByTable, setSeatedByTable] = useState<Record<TableEnvironmentId, string[]>>({
    mandap: ['m1', 'm2', 'm3', 'm4', 'm5'], // 5 of 8 seated initially
    sangeet: ['s1', 's2', 's3', 's4'], // 4 of 8 seated initially
    elders: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'], // 6 of 8 seated initially
  });
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);

  const currentTable = TABLE_ENVIRONMENTS[selectedTableId];

  const seatedIds = useMemo(() => {
    return seatedByTable[selectedTableId] || [];
  }, [seatedByTable, selectedTableId]);

  // Deterministic seated guests
  const seatedGuests = useMemo(() => {
    return TABLE_ENVIRONMENTS[selectedTableId].guests.filter((g) => seatedIds.includes(g.id));
  }, [selectedTableId, seatedIds]);

  const occupancyCount = seatedGuests.length;
  const capacity = currentTable.capacity;
  const occupancyPct = Math.round((occupancyCount / capacity) * 100);

  // Deterministic Catering Math: seatedCount * thaliPrice
  const totalCatering = occupancyCount * currentTable.thaliPrice;

  // Deterministic Dietary Breakdown
  const dietaryTally = useMemo(() => {
    const tally = { jain: 0, pureVeg: 0, standard: 0 };
    seatedGuests.forEach((g) => {
      if (g.dietary === 'jain') tally.jain += 1;
      else if (g.dietary === 'pure-veg') tally.pureVeg += 1;
      else tally.standard += 1;
    });
    return tally;
  }, [seatedGuests]);

  // Actions
  const handleToggleSeat = (seatIndex: number) => {
    const guestAtSeat = currentTable.guests[seatIndex];
    if (!guestAtSeat) return;

    setSeatedByTable((prev) => {
      const currentList = prev[selectedTableId] || [];
      const isSeated = currentList.includes(guestAtSeat.id);
      const updated = isSeated
        ? currentList.filter((id) => id !== guestAtSeat.id)
        : [...currentList, guestAtSeat.id];

      return {
        ...prev,
        [selectedTableId]: updated,
      };
    });
  };

  const handleSeatNext = () => {
    const firstUnseated = currentTable.guests.find((g) => !seatedIds.includes(g.id));
    if (!firstUnseated) return;

    setSeatedByTable((prev) => ({
      ...prev,
      [selectedTableId]: [...(prev[selectedTableId] || []), firstUnseated.id],
    }));
  };

  const handleAutoFill = () => {
    setSeatedByTable((prev) => ({
      ...prev,
      [selectedTableId]: currentTable.guests.map((g) => g.id),
    }));
  };

  const handleClear = () => {
    setSeatedByTable((prev) => ({
      ...prev,
      [selectedTableId]: [],
    }));
  };

  const handleToggleGuest = (guestId: string) => {
    setSeatedByTable((prev) => {
      const currentList = prev[selectedTableId] || [];
      const isSeated = currentList.includes(guestId);
      const updated = isSeated
        ? currentList.filter((id) => id !== guestId)
        : [...currentList, guestId];

      return {
        ...prev,
        [selectedTableId]: updated,
      };
    });
  };

  return (
    <section className="space-y-6 sm:space-y-8" aria-label="Interactive Banquet Seating Matrix">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E7DFD5] text-[#9A3412] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Interactive seating engine · Deterministic arithmetic</span>
        </div>
        <h2 className="font-display text-3xl sm:text-4xl font-bold text-[#1C1917] tracking-tight">
          Interactive Banquet Seating Matrix
        </h2>
        <p className="text-sm sm:text-base text-[#57534E] leading-relaxed max-w-2xl mx-auto">
          Explore our live table orchestration engine. Tap place settings around the Royal Mandala table
          or assign attendees from the roster to watch occupancy, dietary quotas, and catering ledgers calculate
          in deterministic TypeScript.
        </p>
      </div>

      {/* Main Centerpiece Stage */}
      <div className="bg-white border border-[#E7DFD5] rounded-xl overflow-hidden shadow-xs">
        {/* Table Environment Switcher & Quick Controls Header */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#E7DFD5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Table Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(TABLE_ENVIRONMENTS) as TableEnvironmentId[]).map((tabId) => {
              const tab = TABLE_ENVIRONMENTS[tabId];
              const isSelected = selectedTableId === tabId;
              const TabIcon = tab.icon;
              const tableSeatedCount = (seatedByTable[tabId] || []).length;

              return (
                <button
                  key={tabId}
                  type="button"
                  onClick={() => setSelectedTableId(tabId)}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#1C1917] text-white border border-[#1C1917]'
                      : 'bg-white text-[#44403C] hover:text-[#1C1917] hover:bg-[#F5EFEB] border border-[#E7DFD5]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <TabIcon
                    className={`w-4 h-4 ${
                      isSelected ? 'text-[#F59E0B]' : 'text-[#78716C]'
                    }`}
                  />
                  <span>{tab.name}</span>
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded font-medium ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-[#F5EFEB] text-[#44403C]'
                    }`}
                  >
                    {tableSeatedCount}/8
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleSeatNext}
              disabled={occupancyCount >= capacity}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-medium bg-[#B45309] hover:bg-[#92400E] disabled:bg-[#D6CCC2] text-white transition-colors disabled:cursor-not-allowed"
              title="Seat the next available guest"
            >
              <Users className="w-3.5 h-3.5 text-white" />
              <span>Seat Next ({occupancyCount}/8)</span>
            </button>
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={occupancyCount === capacity}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white hover:bg-[#FAF8F5] border border-[#E7DFD5] text-[#1C1917] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Seat all 8 guests"
            >
              <Check className="w-3.5 h-3.5 text-[#065F46]" />
              <span className="hidden sm:inline">Auto-Seat</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={occupancyCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium bg-white hover:bg-[#FEF2F2] border border-[#E7DFD5] hover:border-[#FCA5A5] text-[#57534E] hover:text-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset all seats"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </div>
        </div>

        {/* Center Stage: Radial 3D Banquet Canvas (Left) + 2-Column Guest Roster (Right) */}
        <div className="p-4 sm:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white">
          {/* Column 1: Royal 3D Banquet Table Centerpiece (6 Cols on desktop) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            {/* Visual Table Canvas Container */}
            <div className="relative w-[340px] h-[340px] sm:w-[400px] sm:h-[400px] flex items-center justify-center select-none my-2 sm:my-3">
              {/* Outer Decorative Floor Ring & Ambient Glow */}
              <div className="absolute inset-0 rounded-full border border-[#E7DFD5] bg-[#FAF8F5]/80 -z-10 scale-105 shadow-inner" />

              {/* Photorealistic Luxury Circular Banquet Table */}
              <div className="w-[230px] h-[230px] sm:w-[270px] sm:h-[270px] rounded-full overflow-hidden border-2 border-[#D97706]/40 relative z-10 flex items-center justify-center">
                <Image
                  src="/assets/images/banquet/royal_banquet_table.jpg"
                  alt="Royal Indian wedding banquet table top-down view with brass lamp and marigold garlands"
                  width={270}
                  height={270}
                  className="w-full h-full object-cover select-none pointer-events-none"
                  priority
                />

                {/* Translucent Centerpiece Medallion */}
                <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-[#1C1917]/90 backdrop-blur-xs border border-[#D97706]/40 text-center pointer-events-none">
                  <h3 className="font-serif text-xs sm:text-sm font-bold text-white tracking-wide truncate">
                    {currentTable.name}
                  </h3>
                  <p className="text-xs text-[#FED7AA] font-medium truncate mt-0.5">
                    {currentTable.tagline}
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 text-xs font-medium text-white">
                    <span
                      className={`w-2 h-2 rounded-full ${
                        occupancyCount === capacity
                          ? 'bg-[#10B981]'
                          : occupancyCount > 0
                          ? 'bg-[#F59E0B]'
                          : 'bg-[#9CA3AF]'
                      }`}
                    />
                    <span>
                      {occupancyCount} of {capacity} seated
                    </span>
                  </div>
                </div>
              </div>

              {/* 8 Radially Positioned Chairs & 3D Character Avatars */}
              {currentTable.guests.map((guest, idx) => {
                const isSeated = seatedIds.includes(guest.id);
                // Calculate radial angle: 8 seats evenly divided around 360 deg, offset by -90 deg (start at top)
                const angleDeg = (idx * (360 / 8)) - 90;
                const angleRad = (angleDeg * Math.PI) / 180;

                // Radius from center in percentage: 43% places the chairs right at the table rim
                const radiusPct = 43;
                const leftPct = 50 + radiusPct * Math.cos(angleRad);
                const topPct = 50 + radiusPct * Math.sin(angleRad);

                const isHovered = hoveredSeat === idx;

                return (
                  <div
                    key={guest.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group"
                    style={{
                      left: `${leftPct}%`,
                      top: `${topPct}%`,
                    }}
                    onMouseEnter={() => setHoveredSeat(idx)}
                    onMouseLeave={() => setHoveredSeat(null)}
                  >
                    {/* Interactive Chair Node */}
                    <button
                      type="button"
                      data-testid={`chair-seat-${idx}`}
                      onClick={() => handleToggleSeat(idx)}
                      className={`relative w-12 h-12 sm:w-13 sm:h-13 rounded-full transition-all duration-200 flex flex-col items-center justify-center focus:outline-none focus:ring-2 focus:ring-[#B45309] ${
                        isSeated
                          ? 'ring-2 ring-[#B45309] ring-offset-2 ring-offset-white bg-white hover:scale-105'
                          : 'bg-white/95 border-2 border-dashed border-[#D6CCC2] hover:border-[#B45309] hover:bg-[#FAF8F5] hover:scale-105'
                      }`}
                      aria-label={`Seat ${idx + 1}: ${guest.name} (${guest.relation}), ${isSeated ? 'Occupied' : 'Available'}`}
                    >
                      {isSeated ? (
                        <>
                          {/* Occupied: 3D Character Avatar Image */}
                          <div className="relative w-full h-full rounded-full overflow-hidden">
                            <Image
                              src={guest.avatarImage}
                              alt={guest.name}
                              width={52}
                              height={52}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* VIP Accent Badge */}
                          {guest.vip && (
                            <span
                              className="absolute -top-1 -right-1 px-1 py-0.2 bg-[#B45309] text-white rounded font-mono text-[11px] font-bold leading-none border border-white"
                              title="VIP Seat"
                            >
                              VIP
                            </span>
                          )}

                          {/* Dietary Mini Dot at bottom */}
                          <span
                            className={`absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full border border-white ${
                              guest.dietary === 'jain'
                                ? 'bg-[#065F46]'
                                : guest.dietary === 'pure-veg'
                                ? 'bg-[#B45309]'
                                : 'bg-[#57534E]'
                            }`}
                            title={guest.dietaryLabel}
                          />
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 text-[#78716C] group-hover:text-[#B45309] transition-colors" />
                          <span className="text-[11px] font-mono text-[#78716C] group-hover:text-[#B45309] -mt-0.5">
                            S{idx + 1}
                          </span>
                        </>
                      )}
                    </button>

                    {/* Hover Place Card Popover */}
                    <div
                      className={`absolute left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-200 z-30 min-w-[160px] p-2.5 bg-[#1C1917] text-white rounded-lg text-center text-xs space-y-0.5 border border-[#57534E] ${
                        isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                      } ${
                        topPct > 50 ? '-top-16 sm:-top-18' : 'top-14 sm:top-16'
                      }`}
                    >
                      <div className="font-semibold text-xs leading-tight text-white flex items-center justify-center gap-1">
                        <span>{guest.name}</span>
                        {guest.vip && <span className="text-xs text-[#F59E0B] font-bold">VIP</span>}
                      </div>
                      <div className="text-xs text-[#D6CCC2] leading-tight">
                        {guest.relation}
                      </div>
                      <div className="flex items-center justify-center gap-1 pt-1">
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium ${
                            guest.dietary === 'jain'
                              ? 'bg-[#065F46] text-[#A7F3D0]'
                              : guest.dietary === 'pure-veg'
                              ? 'bg-[#9A3412] text-[#FED7AA]'
                              : 'bg-neutral-800 text-neutral-300'
                          }`}
                        >
                          {guest.dietaryLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Instruction Beneath Table */}
            <p className="text-xs text-[#57534E] mt-2 flex items-center gap-1.5 text-center">
              <span className="w-2 h-2 rounded-full bg-[#065F46]" />
              <span>Tap any plate to toggle seat reservation with live banquet math</span>
            </p>
          </div>

          {/* Column 2: Guest Table Roster (NO INNER SCROLLBAR - 2 Column Balanced Grid, 6 Cols) */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#E7DFD5]">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#B45309]" />
                <h4 className="font-serif text-sm font-bold text-[#1C1917]">
                  Table Attendee Roster
                </h4>
              </div>
              <span className="text-xs font-mono text-[#57534E]">
                {occupancyCount} of 8 placed
              </span>
            </div>

            {/* All 8 Attendees in 2-Column Grid with NO inner scrollbar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentTable.guests.map((guest, gIdx) => {
                const isSeated = seatedIds.includes(guest.id);
                return (
                  <div
                    key={guest.id}
                    data-testid={`roster-guest-${guest.id}`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleToggleGuest(guest.id);
                      }
                    }}
                    onClick={() => handleToggleGuest(guest.id)}
                    className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2.5 text-xs ${
                      isSeated
                        ? 'bg-[#FFFBEB] border-[#FED7AA] shadow-xs'
                        : 'bg-white border-[#E7DFD5] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {/* Character Avatar Thumbnail */}
                      <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0 border border-[#E7DFD5]">
                        <Image
                          src={guest.avatarImage}
                          alt={guest.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Guest Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-[#1C1917] truncate block text-xs">
                            {guest.name}
                          </span>
                          {guest.vip && (
                            <span className="text-[11px] px-1.5 py-0.2 rounded bg-[#FFEDD5] text-[#9A3412] font-semibold shrink-0">
                              VIP
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#57534E] block truncate">
                          {guest.relation}
                        </span>
                      </div>
                    </div>

                    {/* Dietary & Seat Indicator Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`text-[11px] px-1.5 py-0.5 rounded font-medium border leading-none ${
                          guest.dietary === 'jain'
                            ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                            : guest.dietary === 'pure-veg'
                            ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                            : 'bg-[#FAF8F5] text-[#57534E] border-[#E7DFD5]'
                        }`}
                      >
                        {guest.dietaryLabel}
                      </span>
                      <span
                        className={`text-[11px] font-mono px-1.5 py-0.5 rounded border leading-none ${
                          isSeated
                            ? 'bg-[#FAF8F5] border-[#A7F3D0] text-[#065F46] font-semibold'
                            : 'bg-[#FAF8F5] border-[#E7DFD5] text-[#78716C]'
                        }`}
                      >
                        {isSeated ? `Seat ${gIdx + 1}` : 'Available'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Real-Time Deterministic Math Readout HUD (Bottom Bar) */}
        <div className="p-4 sm:p-5 bg-[#FAF8F5] border-t border-[#E7DFD5] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Metric 1: Real-Time Occupancy Gauge */}
            <div className="p-3.5 bg-white border border-[#E7DFD5] rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-[#57534E]">
                <span className="text-xs font-semibold">Current table occupancy</span>
                <span data-testid="occupancy-percentage" className="font-bold text-[#1C1917] text-sm">{occupancyPct}%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-[#1C1917]">
                  {occupancyCount} of {capacity} seats
                </span>
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    occupancyCount === capacity
                      ? 'bg-[#ECFDF5] text-[#065F46]'
                      : 'bg-[#FEF3C7] text-[#92400E]'
                  }`}
                >
                  {occupancyCount === capacity ? 'Table full' : `${capacity - occupancyCount} open`}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-[#E7DFD5] rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-[#B45309] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Allocated Catering Math */}
            <div className="p-3.5 bg-white border border-[#E7DFD5] rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-[#57534E]">
                <span className="text-xs font-semibold">Allocated catering bill</span>
                <span className="text-xs text-[#9A3412] font-semibold">₹{currentTable.thaliPrice.toLocaleString('en-IN')}/thali</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-base font-bold text-[#9A3412]">
                  ₹{totalCatering.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#57534E]">
                  {occupancyCount} × ₹{currentTable.thaliPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-[#57534E] leading-tight">
                Deterministic live multiplier · Instant billing accuracy
              </p>
            </div>

            {/* Metric 3: Live Dietary Balancing */}
            <div className="p-3.5 bg-white border border-[#E7DFD5] rounded-lg space-y-1.5">
              <div className="flex items-center justify-between text-[#57534E]">
                <span className="text-xs font-semibold">Dietary requirements</span>
                <Utensils className="w-4 h-4 text-[#065F46]" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                <span className="px-2 py-0.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-semibold text-xs">
                  {dietaryTally.jain} Jain
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-semibold text-xs">
                  {dietaryTally.pureVeg} Pure Veg
                </span>
                <span className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#E7DFD5] text-[#57534E] font-semibold text-xs">
                  {dietaryTally.standard} Standard
                </span>
              </div>
              <p className="text-xs text-[#065F46] font-medium leading-tight pt-0.5">
                100% cohort harmony · Zero dietary mismatch
              </p>
            </div>
          </div>

          {/* Engine Integrity Assurance Strip */}
          <div className="flex items-center justify-between text-xs text-[#57534E] pt-2 border-t border-[#E7DFD5]">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#065F46]" />
              <span>
                Arithmetic engine: <strong className="text-[#065F46] font-semibold">Deterministic TypeScript (Zero AI Drift)</strong>
              </span>
            </div>
            <span className="hidden sm:inline text-xs text-[#57534E]">
              Client-side event matrix · Immediate state recalculation
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
