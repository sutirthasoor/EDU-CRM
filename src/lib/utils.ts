import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}
// Add this to your utils file
export const CLASSES = [
  'Pre-school', 'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12',
  'College', 'Competitive Exam'
];

export const BOARDS = [
  'CBSE', 'ICSE', 'ISC', 'State Board', 'IB', 'IGCSE', 'Other'
];
export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800',
    contacted: 'bg-yellow-100 text-yellow-800',
    demo_scheduled: 'bg-purple-100 text-purple-800',
    converted: 'bg-green-100 text-green-800',
    lost: 'bg-red-100 text-red-800',
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    open: 'bg-red-100 text-red-800',
    resolved: 'bg-green-100 text-green-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

export const ZONES = ['North', 'South', 'East', 'West', 'Central', 'Northeast', 'Northwest', 'Southeast', 'Southwest']

// Dynamic arrays that can be edited by admin
export const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'Bengali',
  'Hindi',
  'History',
  'Geography',
  'Computer Science',
  'Accounts',
  'Economics',
  'Physics',
  'Chemistry',
  'Biology',
  'Political Science',
  'Philosophy',
  'Sociology',
  'Psychology',
  'Art',
  'Music',
  'Physical Education'
];


