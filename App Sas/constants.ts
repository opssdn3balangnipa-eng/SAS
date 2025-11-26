import { ExamConfig, GradeLevel, LinkMap } from './types';

export const EXAM_CONFIG: ExamConfig = {
  grades: {
    [GradeLevel.GRADE_4]: {
      rombels: [
        { id: 'A', name: 'Rombel 4A' },
        { id: 'B', name: 'Rombel 4B' },
        { id: 'C', name: 'Rombel 4C' },
      ],
    },
    [GradeLevel.GRADE_5]: {
      rombels: [
        { id: 'A', name: 'Rombel 5A' },
        { id: 'B', name: 'Rombel 5B' },
      ],
    },
    [GradeLevel.GRADE_6]: {
      rombels: [
        { id: 'A', name: 'Rombel 6A' },
        { id: 'B', name: 'Rombel 6B' },
      ],
    },
  },
  subjects: [
    { id: 'indo', name: 'Bahasa Indonesia', icon: '📖', color: 'bg-red-200' },
    { id: 'math', name: 'Matematika', icon: '📐', color: 'bg-blue-200' },
    { id: 'ipa', name: 'IPA', icon: '🔬', color: 'bg-green-200' },
    { id: 'ips', name: 'IPS', icon: '🌍', color: 'bg-orange-200' },
    { id: 'ppkn', name: 'PPKn', icon: '🇮🇩', color: 'bg-yellow-200' },
    { id: 'eng', name: 'Bahasa Inggris', icon: '🅰️', color: 'bg-purple-200' },
    { id: 'pjok', name: 'PJOK', icon: '⚽', color: 'bg-teal-200' },
    { id: 'seni', name: 'Seni Budaya', icon: '🎨', color: 'bg-pink-200' },
    { id: 'agama', name: 'Agama', icon: '🙏', color: 'bg-indigo-200' },
    { id: 'info', name: 'Informatika', icon: '💻', color: 'bg-slate-200' },
  ],
};

// EDIT LINKS HERE
// Format key: "{Grade}-{RombelID}-{SubjectID}"
// Example: "4-A-math" means Grade 4, Rombel A, Matematika
export const EXAM_LINKS: LinkMap = {
  // Placeholder links - replace with actual Google Form links
  'default': 'https://docs.google.com/forms', 
  
  // Example specific links
  '4-A-math': 'https://docs.google.com/forms/d/e/example_math_4a/viewform',
  '6-B-ipa': 'https://docs.google.com/forms/d/e/example_ipa_6b/viewform',
};

export const APP_TITLE = "Portal Ujian Sumatif Akhir Semester";
export const WELCOME_MSG = "Selamat Datang Siswa-Siswi Hebat!";
export const MOTIVATION_MSG = "Kerjakan dengan jujur dan teliti. Kamu pasti bisa!";
export const COPYRIGHT = "© 2024 SD Ceria - Tim Kurikulum";