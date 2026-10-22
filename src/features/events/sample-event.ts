/**
 * Event Pilot Sample Celebration Fixture
 * Plausible, editorial sample event demonstrating the planning workspace.
 * Isolated from personal events. Milestone 3 enabled with categories, expenses, milestones, tasks,
 * vendors, households, guests, tables, and seating assignments.
 */

import { Event, Expense } from './types';
import { generateStarterCategories } from './budget-engine';
import {
  generateStarterMilestones,
  generateStarterTasks,
} from './timeline-engine';
import { Vendor } from '../vendors/types';
import { Guest, GuestHousehold } from '../guests/types';
import { SeatingAssignment, SeatingTable } from '../seating/types';

/**
 * Returns a dynamically computed target date roughly 90 days in the future
 * formatted as strict YYYY-MM-DD.
 */
function getFutureSampleDate(daysAhead: number = 90): string {
  const d = new Date();
  d.setDate(d.getDate() + daysAhead);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const SAMPLE_EVENT_ID = 'sample-event-aarav-meera';

export function createFreshSampleEvent(): Event {
  const targetDate = '2027-01-19'; // Canonical date: 19 January 2027
  const budgetCap = 2500000; // ₹25,00,000 INR
  const guestTarget = 350;
  const now = new Date().toISOString();

  const categories = generateStarterCategories(budgetCap, 'wedding');
  const milestones = generateStarterMilestones('wedding');
  const starterTasks = generateStarterTasks(milestones, targetDate, 'wedding');

  // Mark first two tasks as completed for realistic sample progress
  const tasks = starterTasks.map((t, idx) => {
    if (idx === 0) {
      return {
        ...t,
        status: 'completed' as const,
        completedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
      };
    }
    if (idx === 1) {
      return {
        ...t,
        status: 'completed' as const,
        completedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
      };
    }
    return t;
  });

  // Realistic sample expenses illustrating settled, deposit_paid, and projected states
  const expenses: Expense[] = [
    {
      id: 'sample-exp-venue',
      categoryId: categories[0]?.id || 'cat-wedding-1',
      title: 'The Tamarind Tree Main Mandap Hall Booking',
      estimatedAmount: 650000,
      actualAmount: 650000,
      paymentStatus: 'settled',
      notes: 'Full hall rental confirmed including overnight bride/groom dressing suites.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-exp-catering',
      categoryId: categories[0]?.id || 'cat-wedding-1',
      title: 'Traditional Banana Leaf Sadya Catering Advance',
      estimatedAmount: 475000,
      actualAmount: 200000,
      paymentStatus: 'deposit_paid',
      notes: '50% advance for 350 guests + traditional sweet counters (mysore pak, payasam).',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-exp-mandap',
      categoryId: categories[1]?.id || 'cat-wedding-2',
      title: 'Temple Themed Wooden Mandap & Fresh Jasmine Stage',
      estimatedAmount: 300000,
      actualAmount: 150000,
      paymentStatus: 'deposit_paid',
      notes: 'South Indian temple pillar structure with aromatic tuberose & marigold garlands.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-exp-pathway',
      categoryId: categories[1]?.id || 'cat-wedding-2',
      title: 'Entrance Pathway Toranam & Brass Urli Florals',
      estimatedAmount: 120000,
      paymentStatus: 'projected',
      notes: 'Floating floral brass urlis and traditional banana stem entrance arches.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-exp-photo',
      categoryId: categories[2]?.id || 'cat-wedding-3',
      title: 'Vivaha Cinematography & Candid Photography Package',
      estimatedAmount: 280000,
      actualAmount: 140000,
      paymentStatus: 'deposit_paid',
      notes: 'Traditional album + teaser video + 4K cinematic highlights.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-exp-silk',
      categoryId: categories[3]?.id || 'cat-wedding-4',
      title: 'Kanchipuram Silk Sarees & Ceremonial Dhotis',
      estimatedAmount: 180000,
      actualAmount: 185000,
      paymentStatus: 'settled',
      notes: 'Handwoven pure zari bridal muhurtham saree and groom silk vesti.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-exp-music',
      categoryId: categories[4]?.id || 'cat-wedding-5',
      title: 'Traditional Nadaswaram & Thavil Troupe Booking',
      estimatedAmount: 65000,
      actualAmount: 30000,
      paymentStatus: 'deposit_paid',
      notes: 'Live acoustic accompaniment for morning mangala snanam and muhurtham.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-exp-transit',
      categoryId: categories[5]?.id || 'cat-wedding-6',
      title: 'Guest Shuttles from Kempegowda Airport',
      estimatedAmount: 75000,
      paymentStatus: 'projected',
      notes: '2 AC coaches booked for outstation relatives arriving morning of celebration.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Milestone 3: Curated Vendor Book
  const vendors: Vendor[] = [
    {
      id: 'sample-vnd-venue',
      name: 'The Tamarind Tree Estate',
      category: 'venue',
      contactPerson: 'Suresh Gowda',
      phone: '+91 98450 12345',
      email: 'events@thetamarindtree.in',
      website: 'https://thetamarindtree.in',
      status: 'booked',
      quotedCost: 700000,
      agreedCost: 650000,
      depositPaid: 250000,
      amountPaid: 650000, // Settled full contract
      linkedCategoryId: categories[0]?.id,
      notes: 'Exclusive heritage garden venue confirmed for full day and night reception.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-vnd-catering',
      name: 'Annapurna Heritage Caterers',
      category: 'catering',
      contactPerson: 'Raghavan Pillai',
      phone: '+91 98860 98765',
      email: 'raghavan@annapurnacaterers.com',
      status: 'booked',
      quotedCost: 500000,
      agreedCost: 475000,
      depositPaid: 200000,
      amountPaid: 200000,
      linkedCategoryId: categories[0]?.id,
      notes: 'Traditional banana leaf sadya menu with live filter coffee and payasam bar.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-vnd-photo',
      name: 'Drishti Wedding Cinema',
      category: 'photography',
      contactPerson: 'Aditi Roy',
      phone: '+91 97400 45678',
      email: 'hello@drishticinema.in',
      website: 'https://drishticinema.in',
      status: 'booked',
      quotedCost: 320000,
      agreedCost: 280000,
      depositPaid: 140000,
      amountPaid: 140000,
      linkedCategoryId: categories[2]?.id,
      notes: '2 candid photographers, 2 cinematic videographers, and drone ceremony coverage.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-vnd-decor',
      name: 'Rangoli Floral Sculptors',
      category: 'decoration',
      contactPerson: 'Manojit Dutta',
      phone: '+91 99000 87654',
      status: 'booked',
      quotedCost: 320000,
      agreedCost: 300000,
      depositPaid: 150000,
      amountPaid: 150000,
      linkedCategoryId: categories[1]?.id,
      notes: 'Temple pillar wooden stage, brass bell hanging accents, and fresh tuberose curtains.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-vnd-music',
      name: 'Taal & Sur Musical Troupe',
      category: 'entertainment',
      contactPerson: 'Ustad Farhan Ali',
      phone: '+91 98200 34567',
      status: 'negotiating',
      quotedCost: 80000,
      agreedCost: 70000,
      depositPaid: 0,
      amountPaid: 0,
      linkedCategoryId: categories[4]?.id,
      notes: 'Nadaswaram accompaniment for Muhurtham + acoustic flute & sitar for high tea.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-vnd-makeup',
      name: 'Shringar Bridal Studio',
      category: 'clothing_makeup',
      contactPerson: 'Kavitha Shenoy',
      phone: '+91 98440 65432',
      status: 'quote_received',
      quotedCost: 45000,
      depositPaid: 0,
      amountPaid: 0,
      notes: 'Bridal HD makeup and hairstyle for Muhurtham and evening reception.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Milestone 3: Curated Households
  const households: GuestHousehold[] = [
    {
      id: 'sample-hh-sharma',
      name: 'The Sharma Family',
      relationshipType: "Bride's Extended Family",
      notes: 'Outstation relatives staying at the courtyard villas.',
    },
    {
      id: 'sample-hh-verma',
      name: 'The Verma Family',
      relationshipType: "Groom's Immediate Family",
      notes: 'Arriving together on ceremonial coach.',
    },
    {
      id: 'sample-hh-college',
      name: 'College & Tech Circle',
      relationshipType: 'Friends & Batchmates',
      notes: 'Coordinating evening musical performance.',
    },
    {
      id: 'sample-hh-neighbors',
      name: 'Indiranagar Society Circle',
      relationshipType: 'Neighbors & Family Friends',
    },
  ];

  // Milestone 3: Curated Guests (14 guests across RSVP states and dietary preferences)
  const guests: Guest[] = [
    {
      id: 'sample-gst-priya',
      firstName: 'Priya',
      lastName: 'Sharma',
      householdId: 'sample-hh-sharma',
      relationship: 'Cousin',
      phone: '+91 98451 11001',
      email: 'priya.sharma@example.com',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: true,
      plusOneExpected: true,
      plusOneName: 'Vikram Malhotra',
      dietaryPreference: 'jain',
      dietaryNotes: 'Strict Jain sadya meal without root vegetables or onion.',
      notes: 'Coordinator for morning mehendi gifts.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-rajesh',
      firstName: 'Rajesh',
      lastName: 'Sharma',
      householdId: 'sample-hh-sharma',
      relationship: 'Maternal Uncle',
      phone: '+91 98451 11002',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'vegetarian',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-sunita',
      firstName: 'Sunita',
      lastName: 'Sharma',
      householdId: 'sample-hh-sharma',
      relationship: 'Aunt',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'vegetarian',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-arjun',
      firstName: 'Arjun',
      lastName: 'Verma',
      householdId: 'sample-hh-verma',
      relationship: 'Brother',
      phone: '+91 98861 22001',
      email: 'arjun.verma@example.com',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: true,
      plusOneExpected: true,
      plusOneName: 'Neha Verma',
      dietaryPreference: 'vegetarian',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-rohan',
      firstName: 'Rohan',
      lastName: 'Verma',
      householdId: 'sample-hh-verma',
      relationship: 'Cousin',
      phone: '+91 98861 22002',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'halal',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-ks-verma',
      firstName: 'Dr. K.S.',
      lastName: 'Verma',
      householdId: 'sample-hh-verma',
      relationship: 'Grandfather',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'vegetarian',
      dietaryNotes: 'Low salt, diabetic sadya portion requested.',
      notes: 'Needs seating close to the entrance ramp with armrest support.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-ananya',
      firstName: 'Ananya',
      lastName: 'Sen',
      householdId: 'sample-hh-college',
      relationship: 'College Roommate',
      phone: '+91 97401 33001',
      email: 'ananya.sen@example.com',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: true,
      plusOneExpected: true,
      plusOneName: 'Dhruv Roy',
      dietaryPreference: 'vegan',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-karthik',
      firstName: 'Karthik',
      lastName: 'Raman',
      householdId: 'sample-hh-college',
      relationship: 'Batchmate',
      phone: '+91 97401 33002',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'vegetarian',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-tanvi',
      firstName: 'Tanvi',
      lastName: 'Saxena',
      householdId: 'sample-hh-college',
      relationship: 'Friend',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'gluten_free',
      dietaryNotes: 'Severe celiac allergy; strict gluten-free preparation.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-sneha',
      firstName: 'Sneha',
      lastName: 'Reddy',
      householdId: 'sample-hh-neighbors',
      relationship: 'Neighbor',
      phone: '+91 99001 44001',
      rsvpStatus: 'pending',
      invitationStatus: 'sent',
      plusOneAllowed: true,
      plusOneExpected: false,
      dietaryPreference: 'none',
      notes: 'Awaiting travel leave confirmation from office.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-deepak',
      firstName: 'Deepak',
      lastName: 'Joshi',
      householdId: 'sample-hh-neighbors',
      relationship: 'Family Friend',
      rsvpStatus: 'pending',
      invitationStatus: 'sent',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'vegetarian',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-meenakshi',
      firstName: 'Meenakshi',
      lastName: 'Iyer',
      relationship: 'Vocal Teacher',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'jain',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-sameer',
      firstName: 'Sameer',
      lastName: 'Khan',
      relationship: 'Colleague',
      phone: '+91 98201 55001',
      email: 'sameer.khan@example.com',
      rsvpStatus: 'confirmed',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'halal',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'sample-gst-vikram',
      firstName: 'Vikram',
      lastName: 'Singhania',
      householdId: 'sample-hh-college',
      relationship: 'School Friend',
      rsvpStatus: 'declined',
      invitationStatus: 'delivered',
      plusOneAllowed: false,
      plusOneExpected: false,
      dietaryPreference: 'none',
      notes: 'Sending blessing card via mail; travelling internationally.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Milestone 3: Curated Tables
  const tables: SeatingTable[] = [
    {
      id: 'sample-tbl-mandap',
      name: 'Table 1 - Mandap Royal Front',
      capacity: 8,
      tableType: 'round',
      notes: 'Prime view of the ceremonial mandap pillars.',
    },
    {
      id: 'sample-tbl-elders',
      name: 'Table 2 - Elders & Family Dining',
      capacity: 8,
      tableType: 'round',
      notes: 'Quiet zone near the southern garden verandah.',
    },
    {
      id: 'sample-tbl-youth',
      name: 'Table 3 - Youth & Friends Circle',
      capacity: 8,
      tableType: 'round',
      notes: 'Adjacent to acoustic music stage.',
    },
    {
      id: 'sample-tbl-garden',
      name: 'Table 4 - Garden High-Top Banquet',
      capacity: 6,
      tableType: 'high_top',
      notes: 'Casual seating near the live mocktail counter.',
    },
  ];

  // Milestone 3: Seating Assignments
  const assignments: SeatingAssignment[] = [
    // Table 1: Priya + Priya Plus-One + Rajesh + Sunita (4 seats)
    { id: 'sample-asg-1', tableId: 'sample-tbl-mandap', guestId: 'sample-gst-priya', isPlusOne: false, assignedAt: now },
    { id: 'sample-asg-2', tableId: 'sample-tbl-mandap', guestId: 'sample-gst-priya', isPlusOne: true, assignedAt: now },
    { id: 'sample-asg-3', tableId: 'sample-tbl-mandap', guestId: 'sample-gst-rajesh', isPlusOne: false, assignedAt: now },
    { id: 'sample-asg-4', tableId: 'sample-tbl-mandap', guestId: 'sample-gst-sunita', isPlusOne: false, assignedAt: now },

    // Table 2: Arjun + Arjun Plus-One + Rohan + Dr. K.S. Verma (4 seats)
    { id: 'sample-asg-5', tableId: 'sample-tbl-elders', guestId: 'sample-gst-arjun', isPlusOne: false, assignedAt: now },
    { id: 'sample-asg-6', tableId: 'sample-tbl-elders', guestId: 'sample-gst-arjun', isPlusOne: true, assignedAt: now },
    { id: 'sample-asg-7', tableId: 'sample-tbl-elders', guestId: 'sample-gst-rohan', isPlusOne: false, assignedAt: now },
    { id: 'sample-asg-8', tableId: 'sample-tbl-elders', guestId: 'sample-gst-ks-verma', isPlusOne: false, assignedAt: now },

    // Table 3: Ananya + Ananya Plus-One + Karthik + Tanvi (4 seats)
    { id: 'sample-asg-9', tableId: 'sample-tbl-youth', guestId: 'sample-gst-ananya', isPlusOne: false, assignedAt: now },
    { id: 'sample-asg-10', tableId: 'sample-tbl-youth', guestId: 'sample-gst-ananya', isPlusOne: true, assignedAt: now },
    { id: 'sample-asg-11', tableId: 'sample-tbl-youth', guestId: 'sample-gst-karthik', isPlusOne: false, assignedAt: now },
    { id: 'sample-asg-12', tableId: 'sample-tbl-youth', guestId: 'sample-gst-tanvi', isPlusOne: false, assignedAt: now },
  ];

  return {
    id: 'sample-event-aarav-meera',
    type: 'wedding',
    title: "Aarav & Meera's Vivaha Celebration",
    date: targetDate,
    location: 'The Tamarind Tree, Kanakapura Road, Bengaluru',
    guestTarget,
    budgetCap,
    currency: 'INR',
    culturalContext: {
      traditionOrTheme: 'South Indian Vivaha with Contemporary Evening Reception',
      notes: 'Traditional morning Muhurtham followed by garden banquet and musical evening.',
    },
    isSample: true,
    categories,
    expenses,
    milestones,
    tasks,
    vendors,
    households,
    guests,
    tables,
    assignments,
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: now,
  };
}

export const createSampleEvent = createFreshSampleEvent;
