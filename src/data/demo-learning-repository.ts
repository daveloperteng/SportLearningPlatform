import type { Learner, LearningSnapshot, LearningState, Lesson, LessonStatus } from '@/domain/learning';

const LESSONS: Lesson[] = [
  {
    id: 'ready-position', title: 'Ready position', durationMinutes: 5, objective: 'Be balanced and ready to move.',
    intro: 'Start low and balanced so you can move to the ball.', demoDuration: '0:36',
    cues: [{ title: 'Feet apart', detail: 'Stand with your feet a little wider than your hips.' }, { title: 'Hands ready', detail: 'Keep your hands in front so you can react quickly.' }],
    commonMistake: 'Standing tall makes it harder to move before the ball drops.',
    mission: { title: 'Ready-position freeze', detail: 'Make your ready position, hold it for five seconds, then reset five times.' },
  },
  {
    id: 'platform-basics', title: 'Platform basics', durationMinutes: 7, objective: 'Make one strong, flat passing platform.',
    intro: 'Your forearms make one flat surface so the ball can travel to your target.', demoDuration: '0:42',
    cues: [{ title: 'Thumbs together', detail: 'Point both thumbs down so your forearms touch.' }, { title: 'Arms long and still', detail: 'Lift from your legs—do not swing your arms.' }],
    commonMistake: 'Bent elbows make the ball bounce in different directions.',
    mission: { title: 'Wall platform taps', detail: 'Make 15 gentle taps to a wall or with a parent. Stop if anything hurts.' },
  },
  {
    id: 'pass-to-target', title: 'Pass to target', durationMinutes: 8, objective: 'Guide the ball toward your target.',
    intro: 'Use your legs and platform angle to guide the ball where you want it to go.', demoDuration: '0:48',
    cues: [{ title: 'Face your target', detail: 'Point your hips and shoulders toward the place you want the ball to go.' }, { title: 'Finish still', detail: 'Hold your platform for one beat after contact.' }],
    commonMistake: 'Swinging your arms sends the ball too far or sideways.',
    mission: { title: 'Target taps', detail: 'Choose a spot on a wall. Make 10 gentle taps that finish near the target.' },
  },
];

const LEARNER: Learner = {
  id: 'demo-maya',
  firstName: 'Maya',
  avatarInitial: 'M',
  weeklyPracticeGoal: 3,
};

const INITIAL_STATE: LearningState = {
  completedLessonIds: ['ready-position'],
  coins: 20,
  practiceDaysThisWeek: 2,
  practicedToday: false,
  reflectedToday: false,
};

const PRACTICE_REWARD_COINS = 10;

export class DemoLearningRepository {
  getInitialState(): LearningState {
    return { ...INITIAL_STATE, completedLessonIds: [...INITIAL_STATE.completedLessonIds] };
  }

  reset(): LearningState {
    return this.getInitialState();
  }

  togglePractice(state: LearningState): LearningState {
    return { ...state, practicedToday: !state.practicedToday };
  }

  toggleReflection(state: LearningState): LearningState {
    return { ...state, reflectedToday: !state.reflectedToday };
  }

  completeMission(state: LearningState, lessonId: string): LearningState {
    const lessonStatuses = this.getLessonStatuses(state);
    if (!state.practicedToday || !state.reflectedToday || lessonStatuses[lessonId] !== 'active') {
      return state;
    }

    return {
      ...state,
      completedLessonIds: [...state.completedLessonIds, lessonId],
      coins: state.coins + PRACTICE_REWARD_COINS,
      practiceDaysThisWeek: Math.min(state.practiceDaysThisWeek + 1, LEARNER.weeklyPracticeGoal),
      practicedToday: false,
      reflectedToday: false,
    };
  }

  getSnapshot(state: LearningState, learnerOverride?: Learner): LearningSnapshot {
    const lessonStatuses = this.getLessonStatuses(state);
    const nextLesson = LESSONS.find((lesson) => lessonStatuses[lesson.id] === 'active') ?? LESSONS.at(-1)!;

    return {
      learner: learnerOverride ?? LEARNER,
      lessons: LESSONS,
      state,
      practiceDaysThisWeek: state.practiceDaysThisWeek + Number(state.practicedToday),
      lessonStatuses,
      nextLesson,
    };
  }

  private getLessonStatuses(state: LearningState): Record<string, LessonStatus> {
    const firstIncompleteIndex = LESSONS.findIndex((lesson) => !state.completedLessonIds.includes(lesson.id));

    return Object.fromEntries(
      LESSONS.map((lesson, index) => {
        const status: LessonStatus = state.completedLessonIds.includes(lesson.id)
          ? 'done'
          : index === firstIncompleteIndex
            ? 'active'
            : 'locked';
        return [lesson.id, status];
      })
    );
  }
}

export const demoLearningRepository = new DemoLearningRepository();
