
export enum GradeLevel {
  GRADE_4 = "4",
  GRADE_5 = "5",
  GRADE_6 = "6",
}

export interface Subject {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface Rombel {
  id: string;
  name: string;
}

export interface ExamConfig {
  grades: {
    [key in GradeLevel]: {
      rombels: Rombel[];
    };
  };
  subjects: Subject[];
}

// This type helps us map a specific combination to a URL
// Format: "Grade-Rombel-SubjectID" -> URL
export type LinkMap = Record<string, string>;

export interface ExamSchedule {
  id: string;
  grade: GradeLevel | 'ALL'; // Specific grade or all grades
  subjectId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
}
