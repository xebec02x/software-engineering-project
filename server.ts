import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  User,
  UserRole,
  Member,
  Trainer,
  WorkoutPlan,
  DietPlan,
  AttendanceRecord,
  LoggedMeal,
  PaymentRecord,
  HealthProgress,
  SysNotification,
  AIChatMessage,
  FoodDatabaseEntry
} from './src/types';

// Initialize Express app
const app = express();
app.use(express.json());

// Initialize Gemini SDK with client telemetry User-Agent header
const apiKey = process.env.GEMINI_API_KEY || '';
let ai: GoogleGenAI | null = null;
if (apiKey) {
  try {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("Gemini API Client initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize GoogleGenAI client:", err);
  }
} else {
  console.log("No GEMINI_API_KEY found, running in AI simulation mode.");
}

// ----------------------------------------------------
// Mock Database / In-Memory State
// ----------------------------------------------------

let users: User[] = [
  { id: 'usr-admin-1', email: 'admin@gym.com', name: 'Alex Jordan', role: 'Admin', createdAt: '2026-01-10T08:00:00Z' },
  { id: 'usr-trainer-1', email: 'trainer@gym.com', name: 'Sarah Miller', role: 'Trainer', createdAt: '2026-01-12T09:00:00Z' },
  { id: 'usr-member-1', email: 'marcus@gym.com', name: 'Marcus Vance', role: 'Member', createdAt: '2026-03-15T07:30:00Z' },
];

let members: Member[] = [
  {
    id: 'mem-1',
    userId: 'usr-member-1',
    name: 'Marcus Vance',
    email: 'marcus@gym.com',
    avatar: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=200&auto=format&fit=crop',
    gender: 'Male',
    age: 28,
    height: 182,
    weight: 84,
    fitnessGoal: 'muscle-building',
    activityLevel: 'moderately-active',
    bmi: 25.4,
    membershipType: 'Premium Gold Member',
    membershipStatus: 'Active',
    membershipExpiry: '2026-12-31',
    trainerId: 'trn-1'
  }
];

let trainers: Trainer[] = [
  {
    id: 'trn-1',
    userId: 'usr-trainer-1',
    name: 'Sarah Miller',
    email: 'trainer@gym.com',
    avatar: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=200&auto=format&fit=crop',
    specialties: ['Bodybuilding', 'HIIT', 'Custom Nutrition Styling', 'Weight Loss Coaching'],
    rating: 4.9,
    biography: 'Certified Master Personal Trainer with 7+ years of experience helping clients achieve sustainable fat loss and muscular hypertrophy.',
    memberIds: ['mem-1']
  }
];

let attendance: AttendanceRecord[] = [
  { id: 'att-1', memberId: 'mem-1', date: '2026-05-20', checkInTime: '06:15', status: 'Present' },
  { id: 'att-2', memberId: 'mem-1', date: '2026-05-21', checkInTime: '06:20', status: 'Present' },
  { id: 'att-3', memberId: 'mem-1', date: '2026-05-22', checkInTime: '06:12', status: 'Present' },
  { id: 'att-4', memberId: 'mem-1', date: '2026-05-23', checkInTime: '06:10', status: 'Present' },
  { id: 'att-5', memberId: 'mem-1', date: '2026-05-24', checkInTime: '06:05', status: 'Present' },
];

let workoutPlans: WorkoutPlan[] = [
  {
    id: 'wrk-1',
    memberId: 'mem-1',
    trainerId: 'trn-1',
    title: 'Hypertrophy Builder Plan A',
    createdAt: '2026-05-18T12:00:00Z',
    exercises: [
      { day: 'Monday', name: 'Barbell Bench Press', sets: 4, reps: 8, weight: '80kg', notes: 'Keep elbows slightly tucked' },
      { day: 'Monday', name: 'Incline Dumbbell Press', sets: 3, reps: 10, weight: '30kg each', notes: 'Squeeze upper chest' },
      { day: 'Monday', name: 'Cable Crossover', sets: 3, reps: 12, weight: '20kg', notes: 'Focus on peak contraction' },
      { day: 'Wednesday', name: 'Barbell Squats', sets: 4, reps: 8, weight: '100kg', notes: 'Hit full depth below parallel' },
      { day: 'Wednesday', name: 'Leg Press', sets: 3, reps: 10, weight: '180kg', notes: 'Controlled eccentric phase' },
      { day: 'Wednesday', name: 'Leg Extensions', sets: 3, reps: 15, weight: '45kg', notes: 'Squeeze quads at top' },
      { day: 'Friday', name: 'Deadlifts', sets: 4, reps: 5, weight: '140kg', notes: 'Keep spinal column straight' },
      { day: 'Friday', name: 'Lat Pulldowns', sets: 3, reps: 10, weight: '65kg', notes: 'Pull with elbows' },
      { day: 'Friday', name: 'Seated Cable Row', sets: 3, reps: 10, weight: '60kg', notes: 'Squeeze shoulder blades' },
    ]
  }
];

let dietPlans: DietPlan[] = [
  {
    id: 'dt-1',
    memberId: 'mem-1',
    trainerId: 'trn-1',
    title: 'Lean Muscle Macro Diet (3000 kcal)',
    dailyCalorieTarget: 3000,
    proteinTarget: 180,
    carbTarget: 370,
    fatTarget: 80,
    createdAt: '2026-05-18T12:00:00Z',
    meals: [
      { category: 'Breakfast', name: 'Peanut Butter Oatmeal with Whey', description: '80g oats, 1 scoop vanilla whey protein, 2 tbsp peanut butter, 1 sliced banana.', calories: 650, protein: 42, carbs: 75, fat: 22 },
      { category: 'Pre-workout', name: 'Rice Cakes & Almonds', description: '4 simple brown rice cakes with 30g whole almonds.', calories: 280, protein: 8, carbs: 32, fat: 14 },
      { category: 'Lunch', name: 'Chicken Breast, Jasmine Rice & Broccoli', description: '200g grilled skinless chicken breast, 150g steamed jasmine rice, 100g green broccoli.', calories: 720, protein: 55, carbs: 90, fat: 12 },
      { category: 'Post-workout', name: 'Recovery Protein Shake', description: '1.5 scoops whey isolate, 1 large apple, 1 serving dextrose powder.', calories: 350, protein: 38, carbs: 45, fat: 2 },
      { category: 'Dinner', name: 'Baked Salmon & Sweet Potato Rings', description: '180g Atlantic salmon fillet, 200g sweet potato, garden salad with olive oil spray.', calories: 680, protein: 40, carbs: 55, fat: 28 },
      { category: 'Snacks', name: 'Greek Yogurt & Walnuts', description: '200g non-fat plain Greek yogurt with 15g walnuts.', calories: 320, protein: 25, carbs: 20, fat: 12 }
    ]
  }
];

let loggedMeals: LoggedMeal[] = [
  { id: 'lm-1', memberId: 'mem-1', date: '2026-05-24', category: 'Breakfast', name: 'Protein Oats', calories: 650, protein: 42, carbs: 75, fat: 22, servingSize: '1 Bowl' },
  { id: 'lm-2', memberId: 'mem-1', date: '2026-05-24', category: 'Lunch', name: 'Chicken & Jasmine Rice', calories: 720, protein: 55, carbs: 90, fat: 12, servingSize: '1 Plate' },
];

let payments: PaymentRecord[] = [
  { id: 'pay-1', memberId: 'mem-1', amount: 99, date: '2026-05-01', status: 'Paid', method: 'Credit Card', planName: 'Premium Gym Access' },
  { id: 'pay-2', memberId: 'mem-1', amount: 150, date: '2026-05-15', status: 'Paid', method: 'Credit Card', planName: 'Personal Trainer Sarah Session Pack' },
  { id: 'pay-4', memberId: 'mem-1', amount: 99, date: '2026-04-01', status: 'Paid', method: 'Credit Card', planName: 'Premium Gym Access' },
];

let progressLogs: HealthProgress[] = [
  {
    id: 'prg-1',
    memberId: 'mem-1',
    date: '2026-05-01',
    weight: 86.5,
    bmi: 26.1,
    chest: 42,
    waist: 34.5,
    hips: 38,
    biceps: 15.2,
    sleepHours: 7,
    steps: 8200,
    waterMl: 2500,
  },
  {
    id: 'prg-2',
    memberId: 'mem-1',
    date: '2026-05-10',
    weight: 85.2,
    bmi: 25.7,
    chest: 42,
    waist: 34.1,
    hips: 37.8,
    biceps: 15.3,
    sleepHours: 8,
    steps: 10500,
    waterMl: 3000,
  },
  {
    id: 'prg-3',
    memberId: 'mem-1',
    date: '2026-05-24',
    weight: 84.0,
    bmi: 25.4,
    chest: 42.5,
    waist: 33.5,
    hips: 37.5,
    biceps: 15.5,
    sleepHours: 8,
    steps: 11200,
    waterMl: 1500,
  }
];

let notifications: SysNotification[] = [
  { id: 'not-1', userId: 'usr-member-1', title: 'Schedule Updated', message: 'Coach Sarah Miller uploaded a new workout plan for you: Hypertrophy Builder Plan A.', createdAt: '2026-05-18T12:05:00Z', read: false },
  { id: 'not-2', userId: 'usr-member-1', title: 'Payment Receipt', message: 'Your payment of $150.00 for Personal Training has been successfully processed.', createdAt: '2026-05-15T15:00:00Z', read: true },
  { id: 'not-4', userId: 'usr-trainer-1', title: 'New Booking', message: 'Marcus Vance marked attendance today and logged an intensive chest workout.', createdAt: '2026-05-24T06:30:00Z', read: false },
];

let aiChatHistory: AIChatMessage[] = [
  { id: 'ch-1', userId: 'usr-member-1', role: 'user', text: 'Hi! Can you recommend some tips for muscle gain?', createdAt: '2026-05-24T05:00:00Z' },
  { id: 'ch-2', userId: 'usr-member-1', role: 'model', text: 'Hello Marcus! Based on your target (muscle building), height of 182 cm, and weight of 84 kg (BMI: 25.4), here is what I recommend:\n\n1. **Caloric Surplus**: Aim for approximately 3,000 calories daily.\n2. **Protein High**: Target 160-180g of premium protein daily to reconstruct muscle fibers.\n3. **Progressive Overload**: Try to add weight or extra repetitions to your squats and presses every week!\n\nWould you like me to suggest a fast meal high in protein right now?', createdAt: '2026-05-24T05:01:00Z' },
];

let globalFoodDatabase: FoodDatabaseEntry[] = [
  { name: 'Grilled Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, servingSize: '100g' },
  { name: 'White Jasmine Rice (Cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, servingSize: '100g' },
  { name: 'Brown Oats (Raw)', calories: 389, protein: 16.9, carbs: 66, fat: 6.9, servingSize: '100g' },
  { name: 'Whey Protein Isolate Powder', calories: 120, protein: 25, carbs: 2, fat: 1, servingSize: '1 Scoop (30g)' },
  { name: 'Whole Liquid Egg', calories: 143, protein: 12.6, carbs: 0.7, fat: 9.5, servingSize: '100g' },
  { name: 'Organic Peanut Butter', calories: 588, protein: 25, carbs: 20, fat: 50, servingSize: '100g' },
  { name: 'Greek Yogurt (Non-fat)', calories: 59, protein: 10, carbs: 3.6, fat: 0.4, servingSize: '100g' },
  { name: 'Fresh Avocado', calories: 160, protein: 2, carbs: 9, fat: 15, servingSize: '100g' },
  { name: 'Sweet Potato (Baked)', calories: 86, protein: 1.6, carbs: 20, fat: 0.1, servingSize: '100g' },
  { name: 'Atlantic Salmon Fillet', calories: 208, protein: 20, carbs: 0, fat: 13, servingSize: '100g' },
  { name: 'Whole Raw Almonds', calories: 579, protein: 21, carbs: 22, fat: 49, servingSize: '100g' },
];

// Helper to calculate BMI
function calculateAndSetBMI(weight: number, height: number): number {
  const m = height / 100;
  return parseFloat((weight / (m * m)).toFixed(1));
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// System health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', api: !!ai, time: new Date() });
});

// Authentication
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = users.find(u => u.email.toLowerCase() === email.trim().toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Account not found with this email' });
  }

  // Validate password
  let isCorrect = false;
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === 'admin@gym.com' && password === 'admin123') {
    isCorrect = true;
  } else if (normalizedEmail === 'trainer@gym.com' && password === 'trainer123') {
    isCorrect = true;
  } else if (normalizedEmail === 'marcus@gym.com' && password === 'member123') {
    isCorrect = true;
  } else if (password === 'password123' || password === 'member123') {
    // general default passwords for registered/test users
    isCorrect = true;
  }

  if (!isCorrect) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  // Return user with simulated JWT token and its role details
  let memberDetails: Member | null = null;
  let trainerDetails: Trainer | null = null;

  if (user.role === 'Member') {
    memberDetails = members.find(m => m.userId === user.id) || null;
  } else if (user.role === 'Trainer') {
    trainerDetails = trainers.find(t => t.userId === user.id) || null;
  }

  res.json({
    message: 'Login successful',
    token: `simulated-jwt-token-for-${user.id}`,
    user,
    member: memberDetails,
    trainer: trainerDetails
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { email, name, role, gender, age, height, weight, fitnessGoal, activityLevel } = req.body;

  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Missing email, name or role parameter' });
  }

  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'This email is already registered' });
  }

  const newUserId = `usr-${Date.now()}`;
  const newUser: User = {
    id: newUserId,
    email,
    name,
    role: role as UserRole,
    createdAt: new Date().toISOString()
  };

  users.push(newUser);

  let newMember: Member | null = null;
  let newTrainer: Trainer | null = null;

  if (role === 'Member') {
    const calculatedBMI = calculateAndSetBMI(Number(weight) || 75, Number(height) || 175);
    newMember = {
      id: `mem-${Date.now()}`,
      userId: newUserId,
      name,
      email,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
      gender: gender || 'Male',
      age: Number(age) || 25,
      height: Number(height) || 175,
      weight: Number(weight) || 75,
      fitnessGoal: fitnessGoal || 'muscle-building',
      activityLevel: activityLevel || 'moderately-active',
      bmi: calculatedBMI,
      membershipType: 'Standard Monthly', // Default standard
      membershipStatus: 'Active',
      membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
      trainerId: trainers[0]?.id || null // Assign Sarah by default
    };
    members.push(newMember);

    // Add first health progress entry
    progressLogs.push({
      id: `prg-${Date.now()}`,
      memberId: newMember.id,
      date: new Date().toISOString().split('T')[0],
      weight: newMember.weight,
      bmi: newMember.bmi,
      sleepHours: 8,
      steps: 5000,
      waterMl: 1000,
    });

    // Notify trainer
    if (newMember.trainerId) {
      const activeTr = trainers.find(t => t.id === newMember!.trainerId);
      if (activeTr) {
        activeTr.memberIds.push(newMember.id);
        notifications.push({
          id: `not-${Date.now()}`,
          userId: activeTr.userId,
          title: 'New Member Assigned',
          message: `${name} has signed up and is assigned to you! Create a workout and diet plan for them now.`,
          createdAt: new Date().toISOString(),
          read: false
        });
      }
    }

  } else if (role === 'Trainer') {
    newTrainer = {
      id: `trn-${Date.now()}`,
      userId: newUserId,
      name,
      email,
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
      specialties: ['General Fitness Training', 'Functional Bodyweight Exercises'],
      rating: 5.0,
      biography: 'Elite coaching companion aiming to assist individuals on physical recovery and mental strength.',
      memberIds: []
    };
    trainers.push(newTrainer);
  }

  res.status(201).json({
    message: 'User registered successfully',
    token: `simulated-jwt-token-for-${newUserId}`,
    user: newUser,
    member: newMember,
    trainer: newTrainer
  });
});

// Reset password simulation
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) {
    return res.status(404).json({ error: 'No account registered with this email address' });
  }
  res.json({ message: 'Success! An email verification code has been dispatched to reset your password.' });
});

// Update Profile API
app.post('/api/users/profile', (req, res) => {
  const { userId, name, gender, age, height, weight, fitnessGoal, activityLevel, specialties, biography, avatarUrl } = req.body;

  const user = users.find(u => u.id === userId);
  if (!user) {
    return res.status(404).json({ error: 'User profile not found' });
  }

  user.name = name || user.name;

  let memberDetails: Member | null = null;
  let trainerDetails: Trainer | null = null;

  if (user.role === 'Member') {
    const member = members.find(m => m.userId === userId);
    if (member) {
      member.name = name || member.name;
      if (gender) member.gender = gender;
      if (age) member.age = Number(age);
      if (height) member.height = Number(height);
      if (weight) member.weight = Number(weight);
      if (fitnessGoal) member.fitnessGoal = fitnessGoal;
      if (activityLevel) member.activityLevel = activityLevel;
      if (avatarUrl) member.avatar = avatarUrl;
      member.bmi = calculateAndSetBMI(member.weight, member.height);

      // Add a progress log for the weight update
      const todayDate = new Date().toISOString().split('T')[0];
      const existingToday = progressLogs.find(p => p.memberId === member.id && p.date === todayDate);
      if (existingToday) {
        existingToday.weight = member.weight;
        existingToday.bmi = member.bmi;
      } else {
        progressLogs.push({
          id: `prg-${Date.now()}`,
          memberId: member.id,
          date: todayDate,
          weight: member.weight,
          bmi: member.bmi,
          sleepHours: 8,
          steps: 8000,
          waterMl: 2000
        });
      }
      memberDetails = member;
    }
  } else if (user.role === 'Trainer') {
    const trainer = trainers.find(t => t.userId === userId);
    if (trainer) {
      trainer.name = name || trainer.name;
      if (specialties) trainer.specialties = Array.isArray(specialties) ? specialties : specialties.split(',').map((s: string) => s.trim());
      if (biography) trainer.biography = biography;
      if (avatarUrl) trainer.avatar = avatarUrl;
      trainerDetails = trainer;
    }
  }

  res.json({
    message: 'Profile updated successfully',
    user,
    member: memberDetails,
    trainer: trainerDetails
  });
});

// Notifications
app.get('/api/notifications/:userId', (req, res) => {
  const uId = req.params.userId;
  const filtered = notifications.filter(n => n.userId === uId).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
  res.json(filtered);
});

app.post('/api/notifications/read', (req, res) => {
  const { id } = req.body;
  const notif = notifications.find(n => n.id === id);
  if (notif) {
    notif.read = true;
  }
  res.json({ success: true });
});

app.post('/api/notifications/read-all', (req, res) => {
  const { userId } = req.body;
  notifications.forEach(n => {
    if (n.userId === userId) n.read = true;
  });
  res.json({ success: true });
});

// ----------------------------------------------------
// ADMIN USER MANAGEMENT & DIRECTORY API
// ----------------------------------------------------
app.get('/api/admin/users', (req, res) => {
  res.json(users);
});

app.post('/api/admin/users', (req, res) => {
  const { name, email, role } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: 'Missing parameter' });
  }
  const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'This email is already registered' });
  }
  const newUserObj: User = {
    id: `usr-${Date.now()}`,
    name,
    email,
    role: role as UserRole,
    createdAt: new Date().toISOString()
  };
  users.push(newUserObj);
  res.status(201).json(newUserObj);
});

app.delete('/api/admin/users/:id', (req, res) => {
  const uId = req.params.id;
  const index = users.findIndex(u => u.id === uId);
  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }
  const userObj = users[index];
  users.splice(index, 1);
  
  if (userObj.role === 'Member') {
    const memIndex = members.findIndex(m => m.userId === uId);
    if (memIndex !== -1) {
      const mem = members[memIndex];
      if (mem.trainerId) {
        const tr = trainers.find(t => t.id === mem.trainerId);
        if (tr) tr.memberIds = tr.memberIds.filter(id => id !== mem.id);
      }
      members.splice(memIndex, 1);
    }
  } else if (userObj.role === 'Trainer') {
    const trIndex = trainers.findIndex(t => t.userId === uId);
    if (trIndex !== -1) {
      const tr = trainers[trIndex];
      members.forEach(m => {
        if (m.trainerId === tr.id) m.trainerId = null;
      });
      trainers.splice(trIndex, 1);
    }
  }
  res.json({ message: 'User deleted successfully' });
});

// Notifications extensions
app.post('/api/notifications', (req, res) => {
  const { userId, title, message } = req.body;
  if (!userId || !title || !message) {
    return res.status(400).json({ error: 'Missing notification parameters' });
  }
  const not: SysNotification = {
    id: `not-${Date.now()}`,
    userId,
    title,
    message,
    createdAt: new Date().toISOString(),
    read: false
  };
  notifications.push(not);
  res.status(201).json(not);
});

app.post('/api/notifications/clear/:userId', (req, res) => {
  const uId = req.params.userId;
  notifications = notifications.filter(n => n.userId !== uId);
  res.json({ success: true });
});


// ----------------------------------------------------
// ADMIN ADMIN RESOURCES API
// ----------------------------------------------------
app.get('/api/admin/metrics', (req, res) => {
  const totRev = payments.reduce((sum, p) => p.status === 'Paid' ? sum + p.amount : sum, 0);

  const goalBreakdown = members.reduce((acc, m) => {
    acc[m.fitnessGoal] = (acc[m.fitnessGoal] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = members.filter(m => m.membershipStatus === 'Active').length;
  const pendingCount = members.filter(m => m.membershipStatus === 'Pending').length;
  const expiredCount = members.filter(m => m.membershipStatus === 'Expired').length;

  res.json({
    totalMembers: members.length,
    activeMembers: activeCount,
    pendingMembers: pendingCount,
    expiredMembers: expiredCount,
    totalTrainers: trainers.length,
    totalRevenue: totRev,
    goalBreakdown,
    recentPayments: payments.slice(0, 5),
    revenueByService: [
      { name: 'Gym Subs', amount: payments.filter(p => !p.planName.includes('Trainer')).reduce((s, p) => s + p.amount, 0) },
      { name: 'Trainer Packs', amount: payments.filter(p => p.planName.includes('Trainer')).reduce((s, p) => s + p.amount, 0) },
    ]
  });
});

// Members management
app.get('/api/admin/members', (req, res) => {
  res.json(members);
});

app.post('/api/admin/members', (req, res) => {
  const { name, email, userId, membershipType, trainerId, weight, height, age, gender, fitnessGoal } = req.body;
  
  let usrId = userId;
  let mockUser = users.find(u => u.id === userId);
  if (!mockUser) {
    usrId = `usr-${Date.now()}`;
    mockUser = {
      id: usrId,
      email: email || 'user@gym.com',
      name: name || 'New Member',
      role: 'Member',
      createdAt: new Date().toISOString()
    };
    users.push(mockUser);
  }

  const w = Number(weight) || 75;
  const h = Number(height) || 175;
  const b = calculateAndSetBMI(w, h);

  const mem: Member = {
    id: `mem-${Date.now()}`,
    userId: usrId,
    name: mockUser.name,
    email: mockUser.email,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop',
    gender: gender || 'Male',
    age: Number(age) || 28,
    height: h,
    weight: w,
    fitnessGoal: fitnessGoal || 'muscle-building',
    activityLevel: 'moderately-active',
    bmi: b,
    membershipType: membershipType || 'Standard Monthly',
    membershipStatus: 'Active',
    membershipExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    trainerId: trainerId || null
  };
  members.push(mem);

  // assign trainer ref
  if (trainerId) {
    const tr = trainers.find(t => t.id === trainerId);
    if (tr && !tr.memberIds.includes(mem.id)) {
      tr.memberIds.push(mem.id);
    }
  }

  res.status(201).json(mem);
});

app.put('/api/admin/members/:id', (req, res) => {
  const memId = req.params.id;
  const mem = members.find(m => m.id === memId);
  if (!mem) return res.status(404).json({ error: 'Member not found' });

  const { name, email, membershipType, membershipStatus, membershipExpiry, trainerId } = req.body;
  if (name) mem.name = name;
  if (email) mem.email = email;
  if (membershipType) mem.membershipType = membershipType;
  if (membershipStatus) mem.membershipStatus = membershipStatus;
  if (membershipExpiry) mem.membershipExpiry = membershipExpiry;

  if (trainerId !== undefined) {
    // clean old trainer list
    if (mem.trainerId) {
      const oldTr = trainers.find(t => t.id === mem.trainerId);
      if (oldTr) oldTr.memberIds = oldTr.memberIds.filter(id => id !== mem.id);
    }
    mem.trainerId = trainerId;
    if (trainerId) {
      const newTr = trainers.find(t => t.id === trainerId);
      if (newTr && !newTr.memberIds.includes(mem.id)) newTr.memberIds.push(mem.id);
    }
  }

  res.json(mem);
});

app.delete('/api/admin/members/:id', (req, res) => {
  const memId = req.params.id;
  const memIndex = members.findIndex(m => m.id === memId);
  if (memIndex === -1) return res.status(404).json({ error: 'Member not found' });

  const mem = members[memIndex];
  // clean trainer assignment
  if (mem.trainerId) {
    const tr = trainers.find(t => t.id === mem.trainerId);
    if (tr) tr.memberIds = tr.memberIds.filter(id => id !== memId);
  }

  // delete records
  members.splice(memIndex, 1);
  users = users.filter(u => u.id !== mem.userId);

  res.json({ message: 'Member deleted successfully' });
});

// Admin Trainers management
app.get('/api/admin/trainers', (req, res) => {
  res.json(trainers);
});

app.post('/api/admin/trainers', (req, res) => {
  const { name, email, userId, specialties, biography } = req.body;
  
  let usrId = userId;
  let mockUser = users.find(u => u.id === userId);
  if (!mockUser) {
    usrId = `usr-${Date.now()}`;
    mockUser = {
      id: usrId,
      email: email || 'trainer@gym.com',
      name: name || 'New Coach',
      role: 'Trainer',
      createdAt: new Date().toISOString()
    };
    users.push(mockUser);
  }

  const tr: Trainer = {
    id: `trn-${Date.now()}`,
    userId: usrId,
    name: mockUser.name,
    email: mockUser.email,
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=200&auto=format&fit=crop',
    specialties: specialties ? specialties.split(',').map((s: string) => s.trim()) : ['General Fitness Trainer'],
    rating: 5.0,
    biography: biography || 'A gym physical health trainer specialized in athletic stamina.',
    memberIds: []
  };
  trainers.push(tr);

  res.status(201).json(tr);
});

app.delete('/api/admin/trainers/:id', (req, res) => {
  const trId = req.params.id;
  const index = trainers.findIndex(t => t.id === trId);
  if (index === -1) return res.status(404).json({ error: 'Trainer not found' });

  const trainerObj = trainers[index];
  trainers.splice(index, 1);
  users = users.filter(u => u.id !== trainerObj.userId);

  // Unset on members
  members.forEach(m => {
    if (m.trainerId === trId) m.trainerId = null;
  });

  res.json({ message: 'Trainer deleted successfully' });
});


// ----------------------------------------------------
// TRAINER FEATURES API
// ----------------------------------------------------
app.get('/api/trainer/members/:trainerId', (req, res) => {
  const trId = req.params.trainerId;
  const assigned = members.filter(m => m.trainerId === trId);
  res.json(assigned);
});

// Manage Workouts
app.get('/api/workouts/member/:memberId', (req, res) => {
  const memId = req.params.memberId;
  const plans = workoutPlans.filter(w => w.memberId === memId);
  res.json(plans);
});

app.post('/api/workouts', (req, res) => {
  const { memberId, trainerId, title, exercises } = req.body;
  if (!memberId || !title || !exercises) {
    return res.status(400).json({ error: 'Missing parameter' });
  }

  const newPlan: WorkoutPlan = {
    id: `wrk-${Date.now()}`,
    memberId,
    trainerId: trainerId || 'AI',
    title,
    createdAt: new Date().toISOString(),
    exercises
  };

  workoutPlans.push(newPlan);

  // Add notification for member
  const mem = members.find(m => m.id === memberId);
  if (mem) {
    notifications.push({
      id: `not-${Date.now()}`,
      userId: mem.userId,
      title: 'New Workout Plan',
      message: `Your trainer uploaded active workout: "${title}"! Begin exercising today.`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  res.status(201).json(newPlan);
});

app.delete('/api/workouts/:id', (req, res) => {
  const index = workoutPlans.findIndex(w => w.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Workout plan not found' });
  workoutPlans.splice(index, 1);
  res.json({ message: 'Workout plan deleted successfully' });
});

// Manage Diets
app.get('/api/diets/member/:memberId', (req, res) => {
  const memId = req.params.memberId;
  const plans = dietPlans.filter(d => d.memberId === memId);
  res.json(plans);
});

app.post('/api/diets', (req, res) => {
  const { memberId, trainerId, title, dailyCalorieTarget, proteinTarget, carbTarget, fatTarget, meals, allergyPreferences } = req.body;

  if (!memberId || !title || !dailyCalorieTarget) {
    return res.status(400).json({ error: 'Missing nutrient variables' });
  }

  const newPlan: DietPlan = {
    id: `dt-${Date.now()}`,
    memberId,
    trainerId: trainerId || 'AI',
    title,
    dailyCalorieTarget: Number(dailyCalorieTarget),
    proteinTarget: Number(proteinTarget) || 150,
    carbTarget: Number(carbTarget) || 200,
    fatTarget: Number(fatTarget) || 60,
    createdAt: new Date().toISOString(),
    meals: meals || [],
    allergyPreferences: allergyPreferences || ''
  };

  dietPlans.push(newPlan);

  // Add notification for member
  const mem = members.find(m => m.id === memberId);
  if (mem) {
    notifications.push({
      id: `not-${Date.now()}`,
      userId: mem.userId,
      title: 'Diet Plan Assigned',
      message: `A custom nutrient scheme has been established: "${title}" by Coach Sarah. Check details in your Nutrition tab.`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  res.status(201).json(newPlan);
});

app.delete('/api/diets/:id', (req, res) => {
  const index = dietPlans.findIndex(d => d.id === req.params.id);
  if (index === -1) return res.status(404).json({ error: 'Diet plan not found' });
  dietPlans.splice(index, 1);
  res.json({ message: 'Diet plan deleted successfully' });
});

// Schedule session mark/mark attendance records
app.get('/api/attendance', (req, res) => {
  res.json(attendance);
});

app.get('/api/attendance/member/:memberId', (req, res) => {
  const records = attendance.filter(a => a.memberId === req.params.memberId);
  res.json(records);
});

app.post('/api/attendance', (req, res) => {
  const { memberId, date, checkInTime, status } = req.body;
  if (!memberId) return res.status(400).json({ error: 'memberId is required' });

  const record: AttendanceRecord = {
    id: `att-${Date.now()}`,
    memberId,
    date: date || new Date().toISOString().split('T')[0],
    checkInTime: checkInTime || '08:00',
    status: status || 'Present'
  };

  attendance.push(record);
  res.status(201).json(record);
});


// Send custom announcements from trainer to all their members
app.post('/api/trainer/announcements', (req, res) => {
  const { trainerId, title, message } = req.body;
  if (!trainerId || !message) return res.status(400).json({ error: 'Missing trainerId or message body' });

  const trainer = trainers.find(t => t.id === trainerId);
  if (!trainer) return res.status(404).json({ error: 'Trainer not found' });

  // find assigned members
  const assignedProps = members.filter(m => m.trainerId === trainerId);
  assignedProps.forEach(m => {
    notifications.push({
      id: `not-${Date.now()}-${m.id}`,
      userId: m.userId,
      title: `Trainer Broadcast: ${title || 'Notice'}`,
      message: `${message} (Sincere regards, Coach ${trainer.name})`,
      createdAt: new Date().toISOString(),
      read: false
    });
  });

  res.json({ message: 'Announcements broadcasted to all assigned individuals successfully!', counts: assignedProps.length });
});


// ----------------------------------------------------
// MEMBER TRACKING API
// ----------------------------------------------------

// Progress weight track
app.get('/api/progress/member/:memberId', (req, res) => {
  const sorted = progressLogs.filter(p => p.memberId === req.params.memberId).sort((a,b) => a.date.localeCompare(b.date));
  res.json(sorted);
});

app.post('/api/progress', (req, res) => {
  const { memberId, date, weight, sleepHours, steps, waterMl, chest, waist, hips, biceps, photoUrl } = req.body;
  if (!memberId) return res.status(400).json({ error: 'memberId is require to log health parameters' });

  const loggedDate = date || new Date().toISOString().split('T')[0];
  const mem = members.find(m => m.id === memberId);

  // calculate current BMI
  let activeWeight = Number(weight) || (mem ? mem.weight : 70);
  const activeHeight = mem ? mem.height : 175;
  const bmiVal = calculateAndSetBMI(activeWeight, activeHeight);

  if (mem && weight) {
    mem.weight = activeWeight;
    mem.bmi = bmiVal;
  }

  // search if record exists on state date
  const matchedIndex = progressLogs.findIndex(p => p.memberId === memberId && p.date === loggedDate);
  if (matchedIndex !== -1) {
    // update
    if (weight) progressLogs[matchedIndex].weight = activeWeight;
    progressLogs[matchedIndex].bmi = bmiVal;
    if (sleepHours !== undefined) progressLogs[matchedIndex].sleepHours = Number(sleepHours);
    if (steps !== undefined) progressLogs[matchedIndex].steps = Number(steps);
    if (waterMl !== undefined) progressLogs[matchedIndex].waterMl = Number(waterMl);
    if (chest !== undefined) progressLogs[matchedIndex].chest = Number(chest);
    if (waist !== undefined) progressLogs[matchedIndex].waist = Number(waist);
    if (hips !== undefined) progressLogs[matchedIndex].hips = Number(hips);
    if (biceps !== undefined) progressLogs[matchedIndex].biceps = Number(biceps);
    if (photoUrl) progressLogs[matchedIndex].photoUrl = photoUrl;

    res.json(progressLogs[matchedIndex]);
  } else {
    const rawProgress: HealthProgress = {
      id: `prg-${Date.now()}`,
      memberId,
      date: loggedDate,
      weight: activeWeight,
      bmi: bmiVal,
      sleepHours: Number(sleepHours) || 8,
      steps: Number(steps) || 5000,
      waterMl: Number(waterMl) || 1000,
      chest: chest ? Number(chest) : undefined,
      waist: waist ? Number(waist) : undefined,
      hips: hips ? Number(hips) : undefined,
      biceps: biceps ? Number(biceps) : undefined,
      photoUrl
    };
    progressLogs.push(rawProgress);
    res.status(201).json(rawProgress);
  }
});

// Logs Meals Consumed today
app.get('/api/food/db', (req, res) => {
  res.json(globalFoodDatabase);
});

app.post('/api/food/db', (req, res) => {
  const { name, calories, protein, carbs, fat, servingSize } = req.body;
  if (!name || calories === undefined) return res.status(400).json({ error: 'Name and calories are required' });

  const customFood: FoodDatabaseEntry = {
    name,
    calories: Number(calories),
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    servingSize: servingSize || '100g'
  };

  globalFoodDatabase.push(customFood);
  res.status(201).json(customFood);
});

app.get('/api/meals/member/:memberId/:date', (req, res) => {
  const memId = req.params.memberId;
  const targetDate = req.params.date; // YYYY-MM-DD
  const filtered = loggedMeals.filter(m => m.memberId === memId && m.date === targetDate);
  res.json(filtered);
});

app.post('/api/meals', (req, res) => {
  const { memberId, date, category, name, calories, protein, carbs, fat, servingSize } = req.body;
  if (!memberId || !name || calories === undefined) {
    return res.status(400).json({ error: 'Missing meal parameters' });
  }

  const newLogMeal: LoggedMeal = {
    id: `lm-${Date.now()}`,
    memberId,
    date: date || new Date().toISOString().split('T')[0],
    category: category || 'Snacks',
    name,
    calories: Number(calories),
    protein: Number(protein) || 0,
    carbs: Number(carbs) || 0,
    fat: Number(fat) || 0,
    servingSize: servingSize || '1 Serving'
  };

  loggedMeals.push(newLogMeal);
  res.status(201).json(newLogMeal);
});

app.delete('/api/meals/:id', (req, res) => {
  const idx = loggedMeals.findIndex(m => m.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Logged meal not found' });
  loggedMeals.splice(idx, 1);
  res.json({ message: 'Meal log item deleted successfully' });
});


// Book Trainer sessions
app.post('/api/trainer/book', (req, res) => {
  const { memberId, trainerId, timeSlot, date } = req.body;
  if (!memberId || !trainerId || !date || !timeSlot) {
    return res.status(400).json({ error: 'Missing slot booking details' });
  }

  const member = members.find(m => m.id === memberId);
  const trainer = trainers.find(t => t.id === trainerId);

  if (!member || !trainer) return res.status(444).json({ error: 'Information incorrect' });

  // Add a specific system notification to trainer & payment placeholder if standard paid pack
  const nId = `not-${Date.now()}`;
  notifications.push({
    id: nId,
    userId: trainer.userId,
    title: 'Trainer Booking Confirmation',
    message: `Member ${member.name} has scheduled a custom coaching slot with you on ${date} at ${timeSlot}. Please confirm in your schedules catalog.`,
    createdAt: new Date().toISOString(),
    read: false
  });

  // Add a notification for member
  notifications.push({
    id: `not-${Date.now()}-m`,
    userId: member.userId,
    title: 'Coaching Session Appointed',
    message: `You successfuly reserved a physical training session with Coach ${trainer.name} on ${date} at ${timeSlot}. Keep it up!`,
    createdAt: new Date().toISOString(),
    read: false
  });

  res.json({ message: 'Coaching slot booked successfully!', bookingDetails: { trainer: trainer.name, date, timeSlot } });
});


// Simulated Payment Portal trigger
app.post('/api/payments/charge', (req, res) => {
  const { memberId, amount, planName, method } = req.body;
  if (!memberId || !amount || !planName) return res.status(400).json({ error: 'Missing payment params' });

  const record: PaymentRecord = {
    id: `pay-${Date.now()}`,
    memberId,
    amount: Number(amount),
    date: new Date().toISOString().split('T')[0],
    status: 'Paid',
    method: method || 'Credit Card',
    planName
  };

  payments.unshift(record);

  const mem = members.find(m => m.id === memberId);
  if (mem) {
    notifications.push({
      id: `not-${Date.now()}`,
      userId: mem.userId,
      title: 'Payment Successful',
      message: `Your payment of $${Number(amount).toFixed(2)} for '${planName}' was processed successfully. Access level has been fully synchronized.`,
      createdAt: new Date().toISOString(),
      read: false
    });
  }

  res.json({ message: 'Payment confirmed successfully', receipt: record });
});


// ----------------------------------------------------
// AI FITNESS COACH CHAT ENDPOINT
// ----------------------------------------------------
// ----------------------------------------------------
// AI PREMIUM BIOMETRIC CONSULTATION ENDPOINT
// ----------------------------------------------------
app.post('/api/ai/consult', async (req, res) => {
  const { userId, consultationType, specTitle, notes, prompt } = req.body;
  if (!userId || !consultationType) {
    return res.status(400).json({ error: 'User ID and consultationType are required' });
  }

  const user = users.find(u => u.id === userId);
  const mDetails = members.find(m => m.userId === userId);

  const weight = mDetails ? mDetails.weight : 75;
  const height = mDetails ? mDetails.height : 175;
  const age = mDetails ? mDetails.age : 28;
  const gender = mDetails ? mDetails.gender : 'Unspecified';
  const goal = mDetails ? mDetails.fitnessGoal : 'muscle-building';
  const level = mDetails ? mDetails.activityLevel : 'moderately-active';
  const bmi = mDetails ? mDetails.bmi : 25.4;

  const systemPrompt = `You are an elite PhD Biomechanic, Kinesiologist, and Sports Nutrition Consultant helping premium gym member: ${user ? user.name : 'Gym Member'}.
  Construct a deeply analytical, custom sports science consultation report. You must output ONLY a valid raw JSON object. Do not wrap in markdown tags or add any backticks.
  
  User Diagnostics context:
  - Gender: ${gender}, Age: ${age}, Weight: ${weight}kg, Height: ${height}cm, BMI: ${bmi}
  - Primary goal: ${goal}, Activity Level: ${level}
  - Special user notes & constraints: ${notes || 'None provided'}

  JSON Response Schema Specs (MUST match exactly):
  {
    "type": "Name of consultation (e.g. Advanced ${specTitle || 'Physical'} Blueprint)",
    "summary": "Deep, context-aware Paragraph analyzing their current physical stature and special notes",
    "nutritionAdvice": "Detailed customized meal plans, calorie allocations, specific macro distributions, and nutrient timing around exercise",
    "trainingAdvice": "Detailed exercise split cycles, RPE targets, progressive overload recommendations, and lifting techniques tailored to biomechanics",
    "precautions": "Safety precautions, joint adjustments, and back/knee stability drills based on notes/metrics",
    "macros": {
      "calories": 2800,
      "protein": 180,
      "carbs": 320,
      "fat": 75
    },
    "rawRecommendation": "Scientific biomechanics wrap-up statement."
  }`;

  let consultReport = null;
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt || `Perform standard athletic audit on consultation theme: ${consultationType}`,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
          responseMimeType: 'application/json'
        }
      });
      
      const cleanText = (response.text || '{}').trim().replace(/^```json/, '').replace(/```$/, '').trim();
      consultReport = JSON.parse(cleanText);
    } catch (e) {
      console.error("Gemini consult API error:", e);
    }
  }

  if (!consultReport) {
    // Highly-detailed local backup simulation
    consultReport = {
      type: `${specTitle || 'Advanced Physical'} Blueprint`,
      summary: `Comprehensive evaluation prepared for premium athlete ${user ? user.name : 'Gym Member'}. Body index registers at ${bmi} BMI (${weight}kg over ${height}cm). Goal alignment is targeted toward ${goal}. Based on your special notes (${notes || 'None logged'}), we recommend immediate postural stabilizers and specialized progressive splits.`,
      nutritionAdvice: `Aim for around 2,850 kcal daily. Distribute macros as: 180g of high-quality amino source proteins (chicken, whey, eggs), 340g of slow-digesting complex carbs (sweet potatoes, steel-cut oats), and 75g of healthy lipids (unrefined olive oils, avocado, almond nuts). Execute post-workout feeding within 45 minutes of lifting.`,
      trainingAdvice: `Undergo a 4-day compound training split using an Upper-Lower rotation. Target large muscle groups under heavy weights with a strict 3-second negative/eccentric phase to trigger myofibrillar tear. Add 2.5% progression load every fortnight maximum.`,
      precautions: `Avoid lifting with physical fatigue in structural back regions. Double check lumbar positions before heavy loads. Stagger exercises with 90 seconds warmups. Constraints: ${notes || 'No bone or severe tendon restraints specified.'}`,
      macros: { calories: 2850, protein: 180, carbs: 340, fat: 75 },
      rawRecommendation: `AuraFit Scientific Report finalized on ${new Date().toISOString().split('T')[0]}.`
    };
  }

  res.json({ report: consultReport });
});

// ----------------------------------------------------
// AI COMPUTER VISION FORM CHECKER ENDPOINT
// ----------------------------------------------------
app.post('/api/ai/analyze-form', async (req, res) => {
  const { userId, exercise, imageData } = req.body;
  if (!imageData || !exercise) {
    return res.status(400).json({ error: 'Exercise type and imageData are required' });
  }

  const systemInstruction = `You are a world-class Biomechanic Specialist and Olympic Form Postural Analyst.
  Carefully examine the user's lift form image while doing: ${exercise}.
  Evaluate structural posture, spine alignment (lumbar/thoracic angles), joints compression, hip depth, and shoulder positions.
  Evaluate injury risk rating (LOW, MEDIUM, or HIGH).
  Highlight posture flaws and detail direct athletic corrections.

  You MUST return ONLY a valid raw JSON object. Do not wrap in Markdown blocks.
  JSON Schema parameters:
  {
    "exercise": "${exercise}",
    "postureAssessment": "A thorough, 2-paragraph kinesiology-focused posture assessment based on the image parts.",
    "alignmentRating": 85, // Rating out of 100 representing standard posture correctness
    "injuryRisk": "LOW" or "MEDIUM" or "HIGH",
    "formErrors": [
      "Detail error 1 (e.g. knee flaring outward, spine rounding, chin poking)"
    ],
    "coachTips": [
      "Tip 1 (e.g. pin shadow shoulder blades back)",
      "Tip 2 (e.g. keep feet flat, screw heels to the ground)"
    ]
  }`;

  let evaluation = null;
  if (ai && imageData.includes('base64,')) {
    try {
      const base64Data = imageData.split('base64,')[1];
      const mimeType = imageData.split(';')[0].split(':')[1] || 'image/jpeg';

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const textPart = {
        text: `Evaluate this pose for the compound exercise: ${exercise}. Highlight joints safety, postural alignment, and safety rating.`
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: { parts: [imagePart, textPart] },
        config: {
          systemInstruction: systemInstruction,
          temperature: 0.3,
          responseMimeType: 'application/json'
        }
      });
      
      const cleanText = (response.text || '{}').trim().replace(/^```json/, '').replace(/```$/, '').trim();
      evaluation = JSON.parse(cleanText);
    } catch (e) {
      console.error("Gemini computer vision error:", e);
    }
  }

  if (!evaluation) {
    // Biomechanical default fallback template if offline
    const isBench = exercise === 'Bench Press';
    const isCurl = exercise === 'Bicep Curl';
    const isDeadlift = exercise === 'Deadlift';
    
    evaluation = {
      exercise,
      postureAssessment: `Analyzed compound exercise: ${exercise}. Spatial biometrics snapshot suggests standard joints alignment. ${
        isBench 
          ? 'Chest thoracic projection is positive at 14° but shoulder stability is slightly sub-optimal.' 
          : isDeadlift
          ? 'Spine curvature reveals neutral lines except slight lower dorsal compression when rising.'
          : 'Biceps muscle isolation is positive with stable humerus alignment.'
      }`,
      alignmentRating: isBench ? 75 : (isDeadlift ? 70 : 88),
      injuryRisk: (isBench || isDeadlift) ? 'MEDIUM' : 'LOW',
      formErrors: isBench 
        ? ['Shoulders raised off the deck causing chest compression.', 'Elbow angle flaring out past 80° relative to ribcage.']
        : isDeadlift
        ? ['Thoracic spine slightly rounding under initial load.', 'Hip level rising faster than shoulder lines during ascent.']
        : ['Slight trunk swaying momentum to lift weight.'],
      coachTips: isBench
        ? [
            'Depress shoulder blades and pinch them firmly back on the bench to stabilize structural posture.',
            'Tuck the elbows slightly inward around 45° to 60° to avoid rotator cuff shoulder strains.'
          ]
        : isDeadlift
        ? [
            'Brace abdominals heavily and pull slack out of the barbell before liftoff.',
            'Force heels into the platform and stand upright symmetrically.'
          ]
        : [
            'Split physical feet stance for leverage and squeeze your glutes to stay completely motionless.',
            'Lower the barbell/dumbbell in a controlled 3-second negative eccentric tempo.'
          ]
    };
  }

  res.json({ evaluation });
});

app.get('/api/ai/history/:userId', (req, res) => {
  const uId = req.params.userId;
  const hist = aiChatHistory.filter(c => c.userId === uId).sort((a,b) => a.createdAt.localeCompare(b.createdAt));
  res.json(hist);
});

app.post('/api/ai/chat', async (req, res) => {
  const { userId, question } = req.body;
  if (!userId || !question) {
    return res.status(400).json({ error: 'User ID and question are required' });
  }

  // Find associated member details to prepare dynamic, context-aware prompt details
  const user = users.find(u => u.id === userId);
  const mDetails = members.find(m => m.userId === userId);
  const progressHistory = mDetails ? progressLogs.filter(p => p.memberId === mDetails.id) : [];
  const latestProgress = progressHistory.length > 0 ? progressHistory[progressHistory.length - 1] : null;

  // Add user message to history
  const usrMsg: AIChatMessage = {
    id: `ch-user-${Date.now()}`,
    userId,
    role: 'user',
    text: question,
    createdAt: new Date().toISOString()
  };
  aiChatHistory.push(usrMsg);

  // Retrieve matching context parameters
  const weight = mDetails ? mDetails.weight : (latestProgress ? latestProgress.weight : 75);
  const height = mDetails ? mDetails.height : 175;
  const age = mDetails ? mDetails.age : 28;
  const gender = mDetails ? mDetails.gender : 'Unspecified';
  const goal = mDetails ? mDetails.fitnessGoal : 'muscle-building';
  const level = mDetails ? mDetails.activityLevel : 'moderately-active';
  const bmi = mDetails ? mDetails.bmi : calculateAndSetBMI(weight, height);

  // Formulate a robust, professional system instruction that makes the model behave like an outstanding Personal Gym Coach
  const systemPrompt = `You are "AuraFit Coach", an elite AI Gym Coach and Sports Nutritionist helping the user hit their peak physical performance.
  Be motivating, clear, helpful, and scientific but approachable. Apply personal coaching parameters of high visual and verbal distinction.

  USE THE USER'S CURRENT FITNESS DIAGNOSTICS FOR CONTEXT-AWARE ANSWERS:
  - User Name: ${user ? user.name : 'Gym Member'}
  - Age: ${age} years old
  - Gender: ${gender}
  - Weight: ${weight} kg
  - Height: ${height} cm
  - BMI: ${bmi} (${bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal weight' : bmi < 30 ? 'Overweight' : 'Obese'})
  - Primary Fitness Target: ${goal} (fat loss, muscle building, strength training, etc.)
  - Activity Level: ${level} (e.g., sedentary, lightly active, moderately active, very active)

  If the user asks for a workout plan, create a precise 1-day or split recommendation layout with clear Exercises, Sets, Reps, and coach notes using helpful formatting.
  If the user asks for a meal plan, structure protein targets, daily calorie threshold suggestions, and protein/carb/fat splits.

  Respond concisely and friendly, avoid unnecessary system text, and speak directly as their coach.`;

  // Try using GoogleGenAI SDK with gemini-3.5-flash
  let answerText = "";
  if (ai) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: question,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.7,
        }
      });
      answerText = response.text || "I apologize. I couldn't generate a prompt reply. Rest assured, your coach is analyzing your workouts.";
    } catch (apiErr: any) {
      console.error("Gemini model execution error:", apiErr);
      answerText = `[AI Coach Fallback Mode Active] I encountered a slight API connectivity delay, but as your virtual trainer, I highly suggest centering your immediate goals on a **${goal}** path. Keep taking at least 150g of clean protein today, hydratrate often with over 3,000ml of water, and ensure you maintain high muscle density using progressive resistance! Can I help clarify single workouts or target structures for you?`;
    }
  } else {
    // Elegant trainer simulator fallback so everything is completely responsive out of box
    answerText = generateSimulatedCoachAnswer(question, { name: user?.name, age, gender, weight, height, goal, level, bmi });
  }

  // Create AI Message log
  const aiMsg: AIChatMessage = {
    id: `ch-ai-${Date.now()}`,
    userId,
    role: 'model',
    text: answerText,
    createdAt: new Date().toISOString()
  };
  aiChatHistory.push(aiMsg);

  res.json({
    userMessage: usrMsg,
    aiMessage: aiMsg,
    allHistory: aiChatHistory.filter(c => c.userId === userId)
  });
});

// Helper for simulated trainer responses to questions
function generateSimulatedCoachAnswer(question: string, context: any): string {
  const qLower = question.toLowerCase();
  const name = context.name || "friend";
  const goal = context.goal || "muscle-building";

  if (qLower.includes('how can i lose weight') || qLower.includes('lose weight') || qLower.includes('fat loss')) {
    return `Hey **${name}**! Lowering body fat percentage revolves around a controlled **caloric deficit** while preserving muscular tissue with high protein intake.

Since your fitness goal is listed as **${goal}**, I recommend targeting a daily consumption of around **1,800 to 2,000 calories** (representing a soft 400 kcal deficit). Structure your macros as follows:
- **Protein**: 140g - 160g (to guard muscle fibers during fat breakdown)
- **Carbs**: 150g (clean carbs e.g. sweet potato, oats)
- **Fats**: 50g (avocados, nuts)

**Your exercise strategy:**
1. Focus on compound resistance training (Squats, presses, pulls) 3-4 times a week.
2. Incorporate 15-20 minutes of steady HIIT exercises or walk 10,000 steps daily.

Would you like me to generate a personalized calorie-controlled dinner option?`;
  }

  if (qLower.includes('chest workout') || qLower.includes('chest exercise')) {
    return `Let's tackle an intense, hypertrophy-focused chest workout, **${name}**! Perform this routine with proper warm-ups and progressive overload:

### 🏋️‍♂️ AuraFit Hypertrophy Chest Circuit
1. **Barbell Bench Press**: 4 Sets x 8 Reps
   *Rest: 90 seconds. Focus on controlled descents and explosive push.*
2. **Incline Dumbbell Press**: 3 Sets x 10 Reps
   *Rest: 75 seconds. Set bench to 30 degrees to target upper chest clavicular fibers.*
3. **Seated Cable Flys**: 3 Sets x 12-15 Reps
   *Rest: 60 seconds. Squeeze hands together and hold contraction for 1 second at peak.*
4. **Weighted/Bodyweight Chest Dips**: 3 Sets to Failure
   *Leaning forward slightly handles chest insertion fibers.*

*Coaching Tips*: Retract your scapula (pin shoulders back) throughout all push movements to fully isolate the pectorals and protect your shoulder joints. How does this fit into your weekly split?`;
  }

  if (qLower.includes('calorie') || qLower.includes('plan')) {
    return `Understood! I've formulated a balanced **2,500 kcal high-protein blueprint** tailored to keep your metabolism elevated and satisfy your recovery macros:

### 🍽️ AuraFit 2500 Calorie High-Performance Split
- **Meal 1: Breakfast** (600 kcal | 40g Protein)
  * Egg scramble (3 egg whites, 2 whole eggs), spinach, mushrooms.
  * 70g rolled oats cooked with water, 1 scoop whey isolate, with high-quality blueberries.
- **Meal 2: Lunch** (700 kcal | 50g Protein)
  * 180g grilled chicken breast or lean beef.
  * 150g baked sweet potato rings or cooked jasmine rice.
  * Large green cucumber & tomato salad with 1 tbsp extra virgin olive oil.
- **Meal 3: Pre-Workout/Snack** (350 kcal | 15g Protein)
  * 1 big banana paired with 30g almonds/walnuts.
- **Meal 4: Dinner** (650 kcal | 45g Protein)
  * 180g Atlantic Salmon fillet or seared Cod.
  * 100g quinoa or brown rice.
  * Steamed green asparagus or grilled broccoli spears.
- **Meal 5: Post-Workout/Before Sleep** (200 kcal | 25g Protein)
  * 200g non-fat plain Greek yogurt with cinnamon powder.

Would you like me to custom tailor this for vegetarian or dairy-free preferences?`;
  }

  // Default Coach reply
  return `Excellent statement, **${name}**! With your current stature (${context.height}cm & ${context.weight}kg, BMI: ${context.bmi}), your current **${goal}** objective resides firmly in focus.

To help you perform with maximum efficacy, remember the three rules of **AuraFit Excellence**:
1. **Nutrition Discipline**: Hit your targets. Prioritize clean, unprocessed whole foods, and hydrate with at least 3 Liters of fluid daily.
2. **Heavy Compound Lift Mechanics**: Consistently practice perfect postures on squats, deadlifts, and military presses.
3. **Structured Recovery**: Ensure you get 7-8 hours of uninterrupted sleep every night as muscles grow during rest, not during training!

Ask me anything else! For example: *"Give me a chest workout"* or *"Create a 2500 calorie plan"* and I will build it instantly!`;
}

// ----------------------------------------------------
// VITE CLIENT INTEGRATION MIDDLEWARE
// ----------------------------------------------------

async function startServer() {
  const PORT = 3000;

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log("Vite Development Middleware mounted.");
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log("Production Static Asset Middleware mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server fully booted inside Cloud Container on port ${PORT}`);
  });
}

startServer();
