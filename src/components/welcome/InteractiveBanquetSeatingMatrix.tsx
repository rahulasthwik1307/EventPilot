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
  UserCheck,
  UserMinus,
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

// 3D Perspective Chair Coordinates on the Isometric Banquet Canvas (in percentages)
const CHAIR_POSITIONS_3D = [
  { x: 50, y: 22 }, // Seat 1: Back Center Chair
  { x: 79, y: 31 }, // Seat 2: Top Right Chair
  { x: 88, y: 53 }, // Seat 3: Middle Right Chair
  { x: 74, y: 76 }, // Seat 4: Bottom Right Chair
  { x: 50, y: 84 }, // Seat 5: Bottom Center Chair
  { x: 23, y: 76 }, // Seat 6: Bottom Left Chair
  { x: 10, y: 53 }, // Seat 7: Middle Left Chair
  { x: 20, y: 31 }, // Seat 8: Top Left Chair
];

export function InteractiveBanquetSeatingMatrix() {
  const [selectedTableId, setSelectedTableId] = useState<TableEnvironmentId>('mandap');
  const [seatedByTable, setSeatedByTable] = useState<Record<TableEnvironmentId, string[]>>({
    mandap: ['m1', 'm2', 'm3', 'm4', 'm5'], // 5 of 8 seated initially
    sangeet: ['s1', 's2', 's3', 's4'], // 4 of 8 seated initially
    elders: ['e1', 'e2', 'e3', 'e4', 'e5', 'e6'], // 6 of 8 seated initially
  });
  const [hoveredSeat, setHoveredSeat] = useState<number | null>(null);
  const [activeSeatIndex, setActiveSeatIndex] = useState<number>(0);

  const currentTable = TABLE_ENVIRONMENTS[selectedTableId];

  const seatedIds = useMemo(() => {
    return seatedByTable[selectedTableId] || [];
  }, [seatedByTable, selectedTableId]);

  // Seated guests
  const seatedGuests = useMemo(() => {
    return TABLE_ENVIRONMENTS[selectedTableId].guests.filter((g) => seatedIds.includes(g.id));
  }, [selectedTableId, seatedIds]);

  const occupancyCount = seatedGuests.length;
  const capacity = currentTable.capacity;
  const occupancyPct = Math.round((occupancyCount / capacity) * 100);

  // Catering Math: seatedCount * thaliPrice
  const totalCatering = occupancyCount * currentTable.thaliPrice;

  // Dietary Breakdown
  const dietaryTally = useMemo(() => {
    const tally = { jain: 0, pureVeg: 0, standard: 0 };
    seatedGuests.forEach((g) => {
      if (g.dietary === 'jain') tally.jain += 1;
      else if (g.dietary === 'pure-veg') tally.pureVeg += 1;
      else tally.standard += 1;
    });
    return tally;
  }, [seatedGuests]);

  // Current inspected guest (defaults to hovered, or active index)
  const effectiveSeatIndex = hoveredSeat !== null ? hoveredSeat : activeSeatIndex;
  const inspectedGuest = currentTable.guests[effectiveSeatIndex] || currentTable.guests[0];
  const isInspectedSeated = inspectedGuest ? seatedIds.includes(inspectedGuest.id) : false;

  // Actions
  const handleToggleSeat = (seatIndex: number) => {
    setActiveSeatIndex(seatIndex);
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

    const unseatedIndex = currentTable.guests.findIndex((g) => g.id === firstUnseated.id);
    if (unseatedIndex >= 0) setActiveSeatIndex(unseatedIndex);

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
    const guestIndex = currentTable.guests.findIndex((g) => g.id === guestId);
    if (guestIndex >= 0) setActiveSeatIndex(guestIndex);

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
    <section className="space-y-4 sm:space-y-6" aria-label="Interactive Banquet Seating Matrix">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FAF8F5] border border-[#E7DFD5] text-[#9A3412] text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5 text-[#B45309]" />
          <span>Royal Banquet Orchestration · Live Seating Engine</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#1C1917] tracking-tight">
          Interactive Banquet Seating Matrix
        </h2>
        <p className="text-xs sm:text-sm text-[#57534E] leading-relaxed max-w-2xl mx-auto">
          Explore our live table orchestration engine. Tap chairs around the 3D royal banquet table
          or assign attendees from the roster to watch occupancy, dietary quotas, and catering ledgers calculate in real time.
        </p>
      </div>

      {/* Main Centerpiece Stage: Rich Royal Ivory Frame with Gold Accents */}
      <div className="bg-[#FAF8F5] border-2 border-[#D97706]/30 rounded-2xl overflow-hidden relative">
        {/* Subtle royal crown bar */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-[#D97706] to-transparent opacity-80" />

        {/* Table Environment Switcher & Quick Controls Header */}
        <div className="p-3 sm:p-3.5 bg-white border-b border-[#E7DFD5] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
          {/* Table Selector Pills */}
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
                  onClick={() => {
                    setSelectedTableId(tabId);
                    setActiveSeatIndex(0);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-[#1C1917] text-white border border-[#1C1917]'
                      : 'bg-white text-[#44403C] hover:text-[#1C1917] hover:bg-[#F5EFEB] border border-[#E7DFD5]'
                  }`}
                  aria-pressed={isSelected}
                >
                  <TabIcon
                    className={`w-3.5 h-3.5 ${
                      isSelected ? 'text-[#F59E0B]' : 'text-[#78716C]'
                    }`}
                  />
                  <span>{tab.name}</span>
                  <span
                    className={`text-xs px-1.5 py-0.2 rounded font-semibold ${
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#B45309] hover:bg-[#92400E] disabled:bg-[#D6CCC2] text-white transition-colors disabled:cursor-not-allowed"
              title="Seat the next available guest"
            >
              <Users className="w-3.5 h-3.5 text-white" />
              <span>Seat Next ({occupancyCount}/8)</span>
            </button>
            <button
              type="button"
              onClick={handleAutoFill}
              disabled={occupancyCount === capacity}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-[#FAF8F5] border border-[#E7DFD5] text-[#1C1917] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Seat all 8 guests"
            >
              <Check className="w-3.5 h-3.5 text-[#065F46]" />
              <span>Auto-Seat</span>
            </button>
            <button
              type="button"
              onClick={handleClear}
              disabled={occupancyCount === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-[#FEF2F2] border border-[#E7DFD5] hover:border-[#FCA5A5] text-[#57534E] hover:text-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reset all seats"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Center Stage: 3D Perspective Banquet Table (Left) + Place Inspector & Roster (Right) */}
        <div className="p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          {/* Column 1: 3D Isometric Banquet Table Canvas (6 Cols on lg) */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center">
            {/* Visual Table Canvas with 3D Perspective Background */}
            <div className="relative w-[300px] h-[300px] sm:w-[350px] sm:h-[350px] rounded-xl overflow-hidden border border-[#E7DFD5] select-none bg-[#1C1917]">
              {/* Background 3D Isometric Banquet Table Image */}
              <Image
                src="/assets/images/banquet/isometric_3d_banquet_table.jpg"
                alt="3D perspective view of royal Indian banquet table with chairs"
                fill
                sizes="(max-width: 640px) 300px, 350px"
                className="w-full h-full object-cover pointer-events-none"
                priority
              />

              {/* Table Name & Pricing Badge in Top-Left (Unobtrusive) */}
              <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md bg-[#1C1917]/85 backdrop-blur-xs border border-white/20 text-white text-xs font-medium z-10 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="font-semibold">{currentTable.name}</span>
                <span className="text-white/60">·</span>
                <span className="text-[#FED7AA]">₹{currentTable.thaliPrice.toLocaleString('en-IN')}/thali</span>
              </div>

              {/* 8 Perspective 3D Interactive Chairs & Guest Avatars */}
              {currentTable.guests.map((guest, idx) => {
                const isSeated = seatedIds.includes(guest.id);
                const pos = CHAIR_POSITIONS_3D[idx] || { x: 50, y: 50 };
                const isInspected = effectiveSeatIndex === idx;

                return (
                  <div
                    key={guest.id}
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                    style={{
                      left: `${pos.x}%`,
                      top: `${pos.y}%`,
                    }}
                    onMouseEnter={() => {
                      setHoveredSeat(idx);
                      setActiveSeatIndex(idx);
                    }}
                    onMouseLeave={() => setHoveredSeat(null)}
                  >
                    {/* Interactive 3D Chair Seat Button */}
                    <button
                      type="button"
                      data-testid={`chair-seat-${idx}`}
                      onClick={() => handleToggleSeat(idx)}
                      className={`relative w-11 h-11 sm:w-12 sm:h-12 rounded-full transition-all duration-200 flex flex-col items-center justify-center focus:outline-none ${
                        isSeated
                          ? isInspected
                            ? 'border-2 border-[#F59E0B] scale-110 bg-white'
                            : 'border-2 border-[#B45309] bg-white hover:scale-105'
                          : isInspected
                          ? 'bg-[#1C1917]/80 border-2 border-[#F59E0B] text-white scale-110'
                          : 'bg-[#1C1917]/60 border-2 border-[#FED7AA]/60 text-white hover:bg-[#B45309] hover:border-white hover:scale-105'
                      }`}
                      aria-label={`Seat ${idx + 1}: ${guest.name} (${guest.relation}), ${isSeated ? 'Occupied' : 'Available'}`}
                    >
                      {isSeated ? (
                        <>
                          {/* Seated 3D Character Avatar */}
                          <div className="relative w-full h-full rounded-full overflow-hidden">
                            <Image
                              src={guest.avatarImage}
                              alt={guest.name}
                              width={48}
                              height={48}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* VIP Tag */}
                          {guest.vip && (
                            <span
                              className="absolute -top-1 -right-1 px-1 py-0.2 bg-[#B45309] text-white rounded text-xs font-bold leading-none border border-white"
                              title="VIP Seat"
                            >
                              VIP
                            </span>
                          )}

                          {/* Dietary Mini Dot */}
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
                          <Plus className="w-3.5 h-3.5 text-white/90" />
                          <span className="text-xs text-white/90 font-semibold -mt-0.5">
                            S{idx + 1}
                          </span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {/* Bottom Instruction Bar */}
              <div className="absolute bottom-2 inset-x-2 py-1 px-2.5 rounded-md bg-[#1C1917]/80 backdrop-blur-xs text-white/80 text-xs text-center pointer-events-none">
                Tap any chair to seat or unseat guests with live banquet math
              </div>
            </div>
          </div>

          {/* Column 2: Active Place Inspector & Table Attendee Roster (6 Cols on lg) */}
          <div className="lg:col-span-6 space-y-2">
            {/* Active Place Setting Inspector Panel (Dedicated Space on Right) */}
            <div className="p-2.5 sm:p-3 bg-white border border-[#E7DFD5] rounded-xl flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Avatar */}
                <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0 border border-[#B45309]">
                  <Image
                    src={inspectedGuest.avatarImage}
                    alt={inspectedGuest.name}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Inspected Guest Meta */}
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-serif font-bold text-[#1C1917] text-xs sm:text-sm truncate">
                      {inspectedGuest.name}
                    </span>
                    {inspectedGuest.vip && (
                      <span className="text-xs px-1.5 py-0.2 rounded bg-[#FFEDD5] text-[#9A3412] font-semibold shrink-0">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-[#57534E] mt-0.5">
                    <span className="truncate">{inspectedGuest.relation}</span>
                    <span>·</span>
                    <span className="text-[#B45309] font-medium">Seat {effectiveSeatIndex + 1}</span>
                    <span>·</span>
                    <span
                      className={`px-1.5 py-0.2 rounded font-medium text-xs border ${
                        inspectedGuest.dietary === 'jain'
                          ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
                          : inspectedGuest.dietary === 'pure-veg'
                          ? 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]'
                          : 'bg-[#FAF8F5] text-[#57534E] border-[#E7DFD5]'
                      }`}
                    >
                      {inspectedGuest.dietaryLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button for Inspected Seat */}
              <button
                type="button"
                onClick={() => handleToggleSeat(effectiveSeatIndex)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 flex items-center gap-1 ${
                  isInspectedSeated
                    ? 'bg-[#FAF8F5] hover:bg-[#FEE2E2] text-[#991B1B] border border-[#E7DFD5]'
                    : 'bg-[#B45309] hover:bg-[#92400E] text-white'
                }`}
              >
                {isInspectedSeated ? (
                  <>
                    <UserMinus className="w-3.5 h-3.5" />
                    <span>Unseat</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Seat Guest</span>
                  </>
                )}
              </button>
            </div>

            {/* Table Attendee Roster (Clean 2-Column Grid - Zero Inner Scrollbars) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between pb-1 border-b border-[#E7DFD5]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#B45309]" />
                  <h4 className="font-serif text-xs sm:text-sm font-bold text-[#1C1917]">
                    Table Attendee Roster
                  </h4>
                </div>
                <span className="text-xs text-[#57534E] font-medium">
                  {occupancyCount} of 8 placed
                </span>
              </div>

              {/* All 8 Attendees in 2-Column Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {currentTable.guests.map((guest, gIdx) => {
                  const isSeated = seatedIds.includes(guest.id);
                  const isSelected = effectiveSeatIndex === gIdx;

                  return (
                    <div
                      key={guest.id}
                      data-testid={`roster-guest-${guest.id}`}
                      role="button"
                      tabIndex={0}
                      onMouseEnter={() => {
                        setHoveredSeat(gIdx);
                        setActiveSeatIndex(gIdx);
                      }}
                      onMouseLeave={() => setHoveredSeat(null)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggleGuest(guest.id);
                        }
                      }}
                      onClick={() => handleToggleGuest(guest.id)}
                      className={`p-1.5 sm:p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                        isSelected
                          ? 'border-2 border-[#B45309] bg-white'
                          : isSeated
                          ? 'bg-[#FFFBEB] border border-[#FED7AA]'
                          : 'bg-white border border-[#E7DFD5] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        {/* Avatar Thumbnail */}
                        <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-[#E7DFD5]">
                          <Image
                            src={guest.avatarImage}
                            alt={guest.name}
                            width={28}
                            height={28}
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Guest Meta */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-[#1C1917] truncate block text-xs">
                              {guest.name}
                            </span>
                            {guest.vip && (
                              <span className="text-xs px-1 py-0.2 rounded bg-[#FFEDD5] text-[#9A3412] font-semibold shrink-0">
                                VIP
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-[#57534E] block truncate">
                            {guest.relation}
                          </span>
                        </div>
                      </div>

                      {/* Dietary & Seat Indicator Badges */}
                      <div className="flex flex-col items-end gap-0.5 shrink-0">
                        <span
                          className={`text-xs px-1.5 py-0.2 rounded font-medium border leading-none ${
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
                          className={`text-xs px-1.5 py-0.2 rounded border leading-none ${
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
        </div>

        {/* Compact Single-Line Paisa-Exact Ledger Strip (Fits neatly in view) */}
        <div className="p-3 sm:p-3.5 bg-white border-t border-[#E7DFD5]">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            {/* Metric 1: Real-Time Occupancy Gauge */}
            <div className="p-2.5 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[#57534E]">
                <span className="text-xs font-semibold">Current table occupancy</span>
                <span data-testid="occupancy-percentage" className="font-bold text-[#1C1917] text-xs sm:text-sm">{occupancyPct}%</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#1C1917]">
                  {occupancyCount} of {capacity} seats
                </span>
                <span
                  className={`text-xs font-semibold px-1.5 py-0.2 rounded ${
                    occupancyCount === capacity
                      ? 'bg-[#ECFDF5] text-[#065F46]'
                      : 'bg-[#FEF3C7] text-[#92400E]'
                  }`}
                >
                  {occupancyCount === capacity ? 'Table full' : `${capacity - occupancyCount} open`}
                </span>
              </div>
              <div className="w-full bg-[#E7DFD5] rounded-full h-1 overflow-hidden">
                <div
                  className="bg-[#B45309] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${occupancyPct}%` }}
                />
              </div>
            </div>

            {/* Metric 2: Allocated Catering Math */}
            <div className="p-2.5 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[#57534E]">
                <span className="text-xs font-semibold">Allocated catering bill</span>
                <span className="text-xs text-[#9A3412] font-semibold">₹{currentTable.thaliPrice.toLocaleString('en-IN')}/thali</span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-bold text-[#9A3412]">
                  ₹{totalCatering.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-[#57534E]">
                  {occupancyCount} × ₹{currentTable.thaliPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <p className="text-xs text-[#57534E] leading-tight">
                Live seat multiplier · Instant billing accuracy
              </p>
            </div>

            {/* Metric 3: Live Dietary Balancing */}
            <div className="p-2.5 bg-[#FAF8F5] border border-[#E7DFD5] rounded-lg space-y-1">
              <div className="flex items-center justify-between text-[#57534E]">
                <span className="text-xs font-semibold">Dietary requirements</span>
                <Utensils className="w-3.5 h-3.5 text-[#065F46]" />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.2 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-[#065F46] font-semibold text-xs">
                  {dietaryTally.jain} Jain
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] font-semibold text-xs">
                  {dietaryTally.pureVeg} Pure Veg
                </span>
                <span className="px-1.5 py-0.2 rounded bg-[#FAF8F5] border border-[#E7DFD5] text-[#57534E] font-semibold text-xs">
                  {dietaryTally.standard} Standard
                </span>
              </div>
              <p className="text-xs text-[#065F46] font-medium leading-tight">
                100% cohort harmony · Zero dietary mismatch
              </p>
            </div>
          </div>

          {/* Engine Integrity Assurance Strip */}
          <div className="flex items-center justify-between text-xs text-[#57534E] pt-2 mt-2 border-t border-[#E7DFD5]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[#065F46]" />
              <span>
                Audited calculation: <strong className="text-[#065F46] font-semibold">Paisa-exact verified ledgers</strong>
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
