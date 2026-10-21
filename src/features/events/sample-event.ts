/**
 * Event Pilot Sample Celebration Fixture
 * Plausible, editorial sample event demonstrating the planning workspace.
 * Isolated from personal events. Milestone 2 enabled with categories, expenses, milestones, and tasks.
 */

import { Event, Expense } from './types';
import { generateStarterCategories } from './budget-engine';
import {
  calculateMilestoneDate,
  generateStarterMilestones,
  generateStarterTasks,
} from './timeline-engine';

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

export function createFreshSampleEvent(): Event {
  const targetDate = getFutureSampleDate(90);
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
    createdAt: '2026-10-21T10:00:00.000Z',
    updatedAt: now,
  };
}
