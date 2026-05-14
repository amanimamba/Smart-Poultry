import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const COLORS = {
  primary: '#10b981', // Emerald 500
  secondary: '#78350f', // Amber 900 (Earth)
  accent: '#fbbf24', // Amber 400
  background: '#f8fafc', // Slate 50
  surface: '#ffffff',
  text: '#1e293b', // Slate 800
};

export const BREEDS = ['Isa Brown', 'Rhode Island Red', 'Leghorn', 'Sussex', 'Plymouth Rock', 'Local Breed'];

export const DISEASES_DATABASE = [
  {
    name: 'Newcastle',
    symptoms: ['Difficulté respiratoire', 'Torsion du cou', 'Diarrhée verdâtre'],
    advice: 'Vaccination urgente, isolation stricte.',
  },
  {
    name: 'Coccidiose',
    symptoms: ['Diarrhée sanglante', 'Plumes ébouriffées', 'Apathie'],
    advice: 'Traitement anticoccidien, litière sèche.',
  },
  {
    name: 'Gumboro',
    symptoms: ['Prostration', 'Diarrhée blanche', 'Mortalité subite'],
    advice: 'Réhydratation, vitamines, hygiène renforcée.',
  },
];
