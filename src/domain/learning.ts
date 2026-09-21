export type LessonStatus = 'active' | 'done' | 'locked';

export type Lesson = {
  id: string;
  title: string;
  durationMinutes: number;
  objective: string;
  intro: string;
  demoDuration: string;
  cues: { title: string; detail: string }[];
  commonMistake: string;
  mission: { title: string; detail: string };
};

export type Learner = {
  id: string;
  firstName: string;
  avatarInitial: string;
  weeklyPracticeGoal: number;
};

export type LearningState = {
  completedLessonIds: string[];
  coins: number;
  practiceDaysThisWeek: number;
  practicedToday: boolean;
  reflectedToday: boolean;
};

export type LearningSnapshot = {
  learner: Learner;
  lessons: Lesson[];
  state: LearningState;
  practiceDaysThisWeek: number;
  lessonStatuses: Record<string, LessonStatus>;
  nextLesson: Lesson;
};
