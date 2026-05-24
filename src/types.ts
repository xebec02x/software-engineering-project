export type UserRole = 'Admin' | 'Trainer' | 'Member';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarRef?: string;
  createdAt: string;
}

export interface Member {
  id: string; // matches User.id or linked
  userId: string;
  name: string;
  email: string;
  avatar: string;
  gender: string;
  age: number;
  height: number; // cm
  weight: number; // kg
  fitnessGoal: 'fat-loss' | 'weight-gain' | 'muscle-building' | 'strength' | 'endurance';
  activityLevel: 'sedentary' | 'lightly-active' | 'moderately-active' | 'very-active';
  bmi: number;
  membershipType: string;
  membershipStatus: 'Active' | 'Expired' | 'Pending';
  membershipExpiry: string;
  trainerId: string | null; // ID of the trainer
}

export interface Trainer {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  specialties: string[];
  rating: number;
  biography?: string;
  memberIds: string[]; // assigned member userIds
}

export interface ExerciseEntry {
  day: string; // e.g. 'Monday'
  name: string;
  sets: number;
  reps: number;
  weight?: string;
  notes?: string;
}

export interface WorkoutPlan {
  id: string;
  memberId: string;
  trainerId: string; // or 'AI'
  title: string;
  createdAt: string;
  exercises: ExerciseEntry[];
}

export interface MealItem {
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Pre-workout' | 'Post-workout';
  name: string;
  description: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface DietPlan {
  id: string;
  memberId: string;
  trainerId: string; // or 'AI'
  title: string;
  dailyCalorieTarget: number;
  proteinTarget: number; // in grams
  carbTarget: number;    // in grams
  fatTarget: number;     // in grams
  createdAt: string;
  meals: MealItem[];
  allergyPreferences?: string;
}

export interface AttendanceRecord {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  checkInTime: string; // HH:MM
  status: 'Present' | 'Absent';
}

export interface LoggedMeal {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snacks' | 'Pre-workout' | 'Post-workout';
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}

export interface PaymentRecord {
  id: string;
  memberId: string;
  amount: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Failed';
  method: string;
  planName: string;
}

export interface HealthProgress {
  id: string;
  memberId: string;
  date: string; // YYYY-MM-DD
  weight: number;
  bmi: number;
  chest?: number; // inches
  waist?: number; // inches
  hips?: number;  // inches
  biceps?: number; // inches
  sleepHours: number;
  steps: number;
  waterMl: number; // Consumed today
  photoUrl?: string;
}

export interface SysNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

export interface AIChatMessage {
  id: string;
  userId: string;
  role: 'user' | 'model';
  text: string;
  createdAt: string;
}

export interface FoodDatabaseEntry {
  id?: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
}
