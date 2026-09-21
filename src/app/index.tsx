import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AccountGate } from '@/components/account-gate';
import { demoLearningRepository } from '@/data/demo-learning-repository';
import type { LearningSnapshot, Lesson, LessonStatus } from '@/domain/learning';

type Audience = 'kid' | 'parent';
type Tab = 'today' | 'path' | 'progress';
type Screen = 'dashboard' | 'lesson';

export default function HomeScreen() {
  return <AccountGate>{(learner, signOut) => <LearningDemoScreen learner={learner} onSignOut={signOut} />}</AccountGate>;
}

function LearningDemoScreen({ learner, onSignOut }: { learner: LearningSnapshot['learner']; onSignOut: () => Promise<void> }) {
  const [audience, setAudience] = useState<Audience>('kid');
  const [tab, setTab] = useState<Tab>('today');
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [learningState, setLearningState] = useState(() => demoLearningRepository.getInitialState());
  const snapshot = demoLearningRepository.getSnapshot(learningState, learner);
  const [selectedLessonId, setSelectedLessonId] = useState(snapshot.nextLesson.id);
  const [lastCompletedLessonTitle, setLastCompletedLessonTitle] = useState<string | null>(null);
  const selectedLesson = snapshot.lessons.find((lesson) => lesson.id === selectedLessonId) ?? snapshot.nextLesson;
  const selectedLessonNumber = snapshot.lessons.findIndex((lesson) => lesson.id === selectedLesson.id) + 1;

  function finishPractice() {
    if (!learningState.practicedToday || !learningState.reflectedToday) return;
    setLearningState((state) => demoLearningRepository.completeMission(state, selectedLesson.id));
    setLastCompletedLessonTitle(selectedLesson.title);
    setScreen('dashboard');
    setTab('progress');
  }

  function resetDemo() {
    const initialState = demoLearningRepository.reset();
    const initialSnapshot = demoLearningRepository.getSnapshot(initialState);
    setLearningState(initialState);
    setSelectedLessonId(initialSnapshot.nextLesson.id);
    setLastCompletedLessonTitle(null);
    setScreen('dashboard');
    setTab('today');
  }

  if (screen === 'lesson') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.page}>
          <Pressable style={styles.backButton} onPress={() => setScreen('dashboard')}>
            <Text style={styles.backText}>‹ Back to path</Text>
          </Pressable>

          <Text style={styles.eyebrow}>VOLLEYBALL · LESSON {selectedLessonNumber}</Text>
          <Text style={styles.lessonTitle}>{selectedLesson.title}</Text>
          <Text style={styles.lessonIntro}>{selectedLesson.intro}</Text>

          <View style={styles.videoCard}>
            <Text style={styles.videoEmoji}>🏐</Text>
            <Text style={styles.videoTitle}>Human demo video</Text>
            <Text style={styles.videoCaption}>A coach demonstrates the movement and the two most important cues.</Text>
            <View style={styles.playButton}><Text style={styles.playText}>▶ Watch {selectedLesson.demoDuration}</Text></View>
          </View>

          <Text style={styles.sectionTitle}>Remember only these two cues</Text>
          {selectedLesson.cues.map((cue, index) => <Cue key={cue.title} number={String(index + 1)} title={cue.title} detail={cue.detail} />)}

          <View style={styles.mistakeCard}>
            <Text style={styles.mistakeTitle}>Watch for this</Text>
            <Text style={styles.mistakeText}>{selectedLesson.commonMistake}</Text>
          </View>

          <Text style={styles.sectionTitle}>Your 3-minute mission</Text>
          <View style={styles.missionCard}>
            <Text style={styles.missionTitle}>{selectedLesson.mission.title}</Text>
            <Text style={styles.missionText}>{selectedLesson.mission.detail}</Text>
          </View>

          <Checklist checked={learningState.practicedToday} onPress={() => setLearningState((state) => demoLearningRepository.togglePractice(state))} text="I practiced the mission" />
          <Checklist checked={learningState.reflectedToday} onPress={() => setLearningState((state) => demoLearningRepository.toggleReflection(state))} text="I noticed one thing to improve" />

          <Pressable
            accessibilityRole="button"
            disabled={!learningState.practicedToday || !learningState.reflectedToday}
            onPress={finishPractice}
            style={[styles.primaryButton, (!learningState.practicedToday || !learningState.reflectedToday) && styles.primaryButtonDisabled]}>
            <Text style={styles.primaryButtonText}>Finish mission · earn 10 coins</Text>
          </Pressable>
          <Text style={styles.finePrint}>Coins recognize effort. A coach or future checkpoint verifies skill.</Text>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.brand}>PLAY PATH</Text>
            <Text style={styles.subBrand}>Learn sports, one small win at a time.</Text>
          </View>
          <View style={styles.modeSwitch}>
            <ModeButton active={audience === 'kid'} onPress={() => setAudience('kid')} text="Kid" />
            <ModeButton active={audience === 'parent'} onPress={() => setAudience('parent')} text="Parent" />
          </View>
        </View>

        {audience === 'parent' ? (
          <ParentDashboard
            snapshot={snapshot}
            lastCompletedLessonTitle={lastCompletedLessonTitle}
            onReset={resetDemo}
            onSignOut={onSignOut}
            onOpenLesson={(lesson) => {
              setAudience('kid');
              setSelectedLessonId(lesson.id);
              setScreen('lesson');
            }}
          />
        ) : (
          <KidDashboard
            tab={tab}
            setTab={setTab}
            snapshot={snapshot}
            lastCompletedLessonTitle={lastCompletedLessonTitle}
            onStart={(lesson) => {
              setSelectedLessonId(lesson.id);
              setScreen('lesson');
            }}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function KidDashboard({ tab, setTab, snapshot, lastCompletedLessonTitle, onStart }: {
  tab: Tab; setTab: (tab: Tab) => void; snapshot: LearningSnapshot; lastCompletedLessonTitle: string | null; onStart: (lesson: Lesson) => void;
}) {
  const { learner, lessons, state, practiceDaysThisWeek, lessonStatuses, nextLesson } = snapshot;
  const completed = state.completedLessonIds.includes('platform-basics');
  return (
    <>
      <View style={styles.kidHeader}>
        <View style={styles.avatar}><Text style={styles.avatarText}>{learner.avatarInitial}</Text></View>
        <View style={styles.greeting}><Text style={styles.hello}>Hi, {learner.firstName}!</Text><Text style={styles.greetingText}>Your volleyball journey is growing.</Text></View>
        <View style={styles.coinPill}><Text style={styles.coinText}>🪙 {state.coins}</Text></View>
      </View>
      <View style={styles.tabRow}>
        {(['today', 'path', 'progress'] as Tab[]).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={[styles.tab, tab === item && styles.tabActive]}>
            <Text style={[styles.tabText, tab === item && styles.tabTextActive]}>{item[0].toUpperCase() + item.slice(1)}</Text>
          </Pressable>
        ))}
      </View>

      {tab === 'today' && (
        <>
          {lastCompletedLessonTitle && <CompletionBanner lessonTitle={lastCompletedLessonTitle} coins={state.coins} />}
          <Text style={styles.eyebrow}>THIS WEEK · {practiceDaysThisWeek} OF {learner.weeklyPracticeGoal} DAYS</Text>
          <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(practiceDaysThisWeek / learner.weeklyPracticeGoal) * 100}%` }]} /></View>
          <View style={styles.todayCard}>
            <Text style={styles.todayEmoji}>🏐</Text>
            <Text style={styles.todayTitle}>{completed ? 'New mission unlocked!' : 'Today’s mission'}</Text>
            <Text style={styles.todayLesson}>{nextLesson.title}</Text>
            <Text style={styles.todayMeta}>{completed ? '8 min · Learn to guide the ball' : '7 min · Make one strong, flat platform'}</Text>
            <Pressable style={styles.primaryButton} onPress={() => onStart(nextLesson)}>
              <Text style={styles.primaryButtonText}>{completed ? 'Start next mission' : 'Start mission'}</Text>
            </Pressable>
          </View>
          <View style={styles.rewardCallout}><Text style={styles.rewardTitle}>Your effort matters</Text><Text style={styles.rewardText}>Practice plus reflection earns coins. Coins unlock fun looks, not harder skills.</Text></View>
        </>
      )}

      {tab === 'path' && (
        <>
          <Text style={styles.sectionTitle}>Volleyball foundations</Text>
          <Text style={styles.muted}>Follow the path. Each small lesson prepares the next one.</Text>
          <View style={styles.pathList}>
            {lessons.map((lesson) => <PathNode key={lesson.id} lesson={lesson} status={lessonStatuses[lesson.id]} onPress={lessonStatuses[lesson.id] === 'locked' ? undefined : () => onStart(lesson)} />)}
          </View>
        </>
      )}

      {tab === 'progress' && (
        <>
          {lastCompletedLessonTitle && <CompletionBanner lessonTitle={lastCompletedLessonTitle} coins={state.coins} />}
          <Text style={styles.sectionTitle}>You showed up today</Text>
          <View style={styles.statsRow}><Stat value={`${practiceDaysThisWeek}/${learner.weeklyPracticeGoal}`} label="weekly days" /><Stat value={String(state.coins)} label="effort coins" /><Stat value={String(state.completedLessonIds.length)} label="lessons done" /></View>
          <View style={styles.skillCard}>
            <Text style={styles.skillTitle}>Passing platform</Text>
            <Text style={styles.skillStatus}>{completed ? 'Practiced · ready for your next lesson' : 'Learning · practice the platform mission'}</Text>
            <Text style={styles.skillNote}>This shows learning progress, not a skill rating.</Text>
          </View>
          <View style={styles.collectionCard}><Text style={styles.collectionTitle}>Collection</Text><Text style={styles.collectionText}>You can save for a new ball trail at 30 coins.</Text><Text style={styles.collectionCoin}>🪙 {state.coins} / 30</Text></View>
        </>
      )}
    </>
  );
}

function ParentDashboard({ snapshot, lastCompletedLessonTitle, onReset, onSignOut, onOpenLesson }: { snapshot: LearningSnapshot; lastCompletedLessonTitle: string | null; onReset: () => void; onSignOut: () => Promise<void>; onOpenLesson: (lesson: Lesson) => void }) {
  const { learner, state, practiceDaysThisWeek, nextLesson } = snapshot;
  const completed = state.completedLessonIds.includes('platform-basics');
  return (
    <>
      <Text style={styles.parentTitle}>{learner.firstName}’s overview</Text>
      <Text style={styles.parentIntro}>A calm view of effort, learning evidence, and what comes next.</Text>
      {lastCompletedLessonTitle && <CompletionBanner lessonTitle={lastCompletedLessonTitle} coins={state.coins} />}
      <View style={styles.parentSummary}><Text style={styles.parentSummaryValue}>{practiceDaysThisWeek} of {learner.weeklyPracticeGoal}</Text><Text style={styles.parentSummaryLabel}>weekly practice days</Text></View>
      <Text style={styles.sectionTitle}>Learning status</Text>
      <View style={styles.parentCard}><Text style={styles.parentCardTitle}>Passing platform</Text><Text style={styles.parentCardText}>{completed ? 'Practiced — ready for the next guided lesson.' : 'Learning — platform basics is the current mission.'}</Text><Text style={styles.parentCardNote}>Lesson completion shows effort. Skill verification comes from a future checkpoint or coach review.</Text></View>
      <View style={styles.parentCard}><Text style={styles.parentCardTitle}>Next suggested activity</Text><Text style={styles.parentCardText}>{nextLesson.title}</Text><Pressable style={styles.secondaryButton} onPress={() => onOpenLesson(nextLesson)}><Text style={styles.secondaryButtonText}>Open with {learner.firstName}</Text></Pressable></View>
      <View style={styles.parentCard}><Text style={styles.parentCardTitle}>Motivation, not pressure</Text><Text style={styles.parentCardText}>{learner.firstName} has {state.coins} effort coins. No daily streak is at risk—rest days are okay.</Text></View>
      <Pressable style={styles.resetButton} onPress={onReset}><Text style={styles.resetButtonText}>Reset demo progress</Text></Pressable>
      <Pressable style={styles.resetButton} onPress={() => void onSignOut()}><Text style={styles.resetButtonText}>Sign out</Text></Pressable>
    </>
  );
}

function ModeButton({ active, onPress, text }: { active: boolean; onPress: () => void; text: string }) {
  return <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}><Text style={[styles.modeText, active && styles.modeTextActive]}>{text}</Text></Pressable>;
}

function Checklist({ checked, onPress, text }: { checked: boolean; onPress: () => void; text: string }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked }} style={[styles.checkRow, checked && styles.checkRowDone]} onPress={onPress}><Text style={styles.checkIcon}>{checked ? '✓' : '○'}</Text><Text style={styles.checkText}>{text}</Text></Pressable>;
}

function Cue({ number, title, detail }: { number: string; title: string; detail: string }) {
  return <View style={styles.cue}><Text style={styles.cueNumber}>{number}</Text><View style={styles.cueTextWrap}><Text style={styles.cueTitle}>{title}</Text><Text style={styles.cueDetail}>{detail}</Text></View></View>;
}

function CompletionBanner({ lessonTitle, coins }: { lessonTitle: string; coins: number }) {
  return <View style={styles.completionBanner}><Text style={styles.completionEmoji}>✨</Text><View style={styles.completionCopy}><Text style={styles.completionTitle}>{lessonTitle} complete!</Text><Text style={styles.completionText}>Nice effort. Your progress is saved in this demo session — 🪙 {coins}</Text></View></View>;
}

function PathNode({ lesson, status, onPress }: { lesson: Lesson; status: LessonStatus; onPress?: () => void }) {
  const icon = status === 'done' ? '✓' : status === 'active' ? '▶' : '🔒';
  return <Pressable disabled={!onPress} accessibilityRole={onPress ? 'button' : undefined} onPress={onPress} style={[styles.pathNode, status === 'active' && styles.pathNodeActive, !onPress && styles.pathNodeLocked]}><View style={[styles.nodeIcon, status === 'done' && styles.nodeDone]}><Text style={styles.nodeIconText}>{icon}</Text></View><View><Text style={styles.nodeTitle}>{lesson.title}</Text><Text style={styles.nodeMeta}>{status === 'locked' ? 'Finish the lesson before this one' : `${lesson.durationMinutes} min`}</Text></View></Pressable>;
}

function Stat({ value, label }: { value: string; label: string }) {
  return <View style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF8' },
  page: { width: '100%', maxWidth: 780, alignSelf: 'center', padding: 20, paddingBottom: 56 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 28 },
  brand: { color: '#173A3A', fontSize: 17, fontWeight: '900', letterSpacing: 1.2 },
  subBrand: { color: '#6B7774', fontSize: 12, marginTop: 3 },
  modeSwitch: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: '#E8EEEC' },
  modeButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 11 },
  modeButtonActive: { backgroundColor: '#173A3A' },
  modeText: { color: '#53615D', fontWeight: '700', fontSize: 13 },
  modeTextActive: { color: '#FFFFFF' },
  kidHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 24 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', backgroundColor: '#EEA760' },
  avatarText: { color: '#FFFFFF', fontSize: 22, fontWeight: '900' },
  greeting: { flex: 1 },
  hello: { color: '#173A3A', fontSize: 22, fontWeight: '900' },
  greetingText: { color: '#6B7774', fontSize: 13, marginTop: 2 },
  coinPill: { backgroundColor: '#FFF0B8', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 14 },
  coinText: { color: '#7B5311', fontWeight: '800' },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#E5E6E1', marginBottom: 28 },
  tab: { paddingVertical: 11, paddingHorizontal: 14, marginRight: 4, borderBottomWidth: 3, borderColor: 'transparent' },
  tabActive: { borderColor: '#157D73' },
  tabText: { color: '#71807B', fontWeight: '700' },
  tabTextActive: { color: '#173A3A' },
  eyebrow: { color: '#157D73', fontSize: 12, letterSpacing: 1, fontWeight: '900', marginBottom: 9 },
  progressTrack: { height: 9, backgroundColor: '#E1E8E5', borderRadius: 9, overflow: 'hidden', marginBottom: 22 },
  progressFill: { height: '100%', backgroundColor: '#1BAA94', borderRadius: 9 },
  todayCard: { backgroundColor: '#173A3A', borderRadius: 26, padding: 24 },
  todayEmoji: { fontSize: 42, marginBottom: 16 },
  todayTitle: { color: '#BCE8DD', fontSize: 14, fontWeight: '800' },
  todayLesson: { color: '#FFFFFF', fontSize: 30, fontWeight: '900', marginTop: 4 },
  todayMeta: { color: '#D8E6E2', fontSize: 15, marginTop: 9, marginBottom: 22 },
  primaryButton: { backgroundColor: '#F4B766', borderRadius: 15, paddingVertical: 15, alignItems: 'center', marginTop: 5 },
  primaryButtonDisabled: { backgroundColor: '#D6D8D2' },
  primaryButtonText: { color: '#173A3A', fontWeight: '900', fontSize: 15 },
  rewardCallout: { backgroundColor: '#F7F0E4', padding: 18, borderRadius: 18, marginTop: 16 },
  rewardTitle: { color: '#173A3A', fontWeight: '900', fontSize: 16 },
  rewardText: { color: '#61706B', lineHeight: 20, marginTop: 5 },
  sectionTitle: { color: '#173A3A', fontWeight: '900', fontSize: 21, marginBottom: 8 },
  muted: { color: '#6B7774', lineHeight: 20 },
  pathList: { gap: 12, marginTop: 20 },
  pathNode: { flexDirection: 'row', alignItems: 'center', padding: 17, borderRadius: 18, backgroundColor: '#F4F2EC', gap: 14 },
  pathNodeLocked: { opacity: 0.66 },
  pathNodeActive: { backgroundColor: '#E2F3ED', borderWidth: 1, borderColor: '#9BD8C9' },
  nodeIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#E0E2DC', justifyContent: 'center', alignItems: 'center' },
  nodeDone: { backgroundColor: '#1BAA94' },
  nodeIconText: { color: '#173A3A', fontWeight: '900' },
  nodeTitle: { color: '#173A3A', fontSize: 16, fontWeight: '800' },
  nodeMeta: { color: '#697773', fontSize: 13, marginTop: 3 },
  statsRow: { flexDirection: 'row', gap: 9, marginTop: 18, marginBottom: 18 },
  stat: { flex: 1, padding: 13, borderRadius: 15, backgroundColor: '#F0F3EF' },
  statValue: { color: '#173A3A', fontSize: 20, fontWeight: '900' },
  statLabel: { color: '#6B7774', fontSize: 11, marginTop: 3 },
  skillCard: { backgroundColor: '#FFFFFF', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#E6E5DF' },
  skillTitle: { color: '#173A3A', fontWeight: '900', fontSize: 17 },
  skillStatus: { color: '#157D73', fontWeight: '700', marginTop: 8 },
  skillNote: { color: '#6B7774', fontSize: 12, marginTop: 9, lineHeight: 17 },
  collectionCard: { backgroundColor: '#FFF0B8', borderRadius: 18, padding: 18, marginTop: 14 },
  collectionTitle: { color: '#634510', fontSize: 17, fontWeight: '900' },
  collectionText: { color: '#775B22', marginTop: 6, lineHeight: 20 },
  collectionCoin: { color: '#634510', fontWeight: '900', marginTop: 11 },
  parentTitle: { color: '#173A3A', fontSize: 29, fontWeight: '900', marginBottom: 7 },
  completionBanner: { flexDirection: 'row', gap: 12, backgroundColor: '#E5F6EE', borderWidth: 1, borderColor: '#9ED9C2', padding: 15, borderRadius: 17, marginBottom: 20 },
  completionEmoji: { fontSize: 23 },
  completionCopy: { flex: 1 },
  completionTitle: { color: '#125C4D', fontSize: 16, fontWeight: '900' },
  completionText: { color: '#377269', fontSize: 13, lineHeight: 18, marginTop: 3 },
  parentIntro: { color: '#687773', lineHeight: 21, marginBottom: 22 },
  parentSummary: { backgroundColor: '#E4F2EC', padding: 21, borderRadius: 19, marginBottom: 25 },
  parentSummaryValue: { color: '#173A3A', fontSize: 30, fontWeight: '900' },
  parentSummaryLabel: { color: '#537068', marginTop: 3 },
  parentCard: { backgroundColor: '#FFFFFF', padding: 18, borderRadius: 18, borderWidth: 1, borderColor: '#E5E6E1', marginBottom: 12 },
  parentCardTitle: { color: '#173A3A', fontSize: 16, fontWeight: '900' },
  parentCardText: { color: '#4E625C', lineHeight: 20, marginTop: 7 },
  parentCardNote: { color: '#73817D', fontSize: 12, lineHeight: 17, marginTop: 9 },
  secondaryButton: { alignSelf: 'flex-start', borderWidth: 1, borderColor: '#157D73', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, marginTop: 13 },
  secondaryButtonText: { color: '#0D6C62', fontWeight: '800' },
  resetButton: { alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 4, marginTop: 4 },
  resetButtonText: { color: '#6B7774', textDecorationLine: 'underline', fontWeight: '700' },
  backButton: { alignSelf: 'flex-start', paddingVertical: 10, marginBottom: 20 },
  backText: { color: '#0D6C62', fontWeight: '800' },
  lessonTitle: { color: '#173A3A', fontSize: 31, fontWeight: '900', marginBottom: 8 },
  lessonIntro: { color: '#5E6F6A', fontSize: 16, lineHeight: 23, marginBottom: 22 },
  videoCard: { backgroundColor: '#D7ECE5', borderRadius: 23, padding: 24, alignItems: 'center', marginBottom: 26 },
  videoEmoji: { fontSize: 48, marginBottom: 9 },
  videoTitle: { color: '#173A3A', fontSize: 18, fontWeight: '900' },
  videoCaption: { color: '#507068', textAlign: 'center', lineHeight: 20, marginTop: 6 },
  playButton: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 15, paddingVertical: 10, marginTop: 14 },
  playText: { color: '#173A3A', fontWeight: '800' },
  cue: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  cueNumber: { backgroundColor: '#173A3A', color: '#FFFFFF', width: 28, height: 28, borderRadius: 14, textAlign: 'center', paddingTop: 4, fontWeight: '900' },
  cueTextWrap: { flex: 1 },
  cueTitle: { color: '#173A3A', fontWeight: '900', fontSize: 16 },
  cueDetail: { color: '#64746F', lineHeight: 20, marginTop: 2 },
  mistakeCard: { backgroundColor: '#FFF2E1', borderRadius: 17, padding: 16, marginTop: 10, marginBottom: 24 },
  mistakeTitle: { color: '#88511A', fontWeight: '900' },
  mistakeText: { color: '#78592E', lineHeight: 20, marginTop: 5 },
  missionCard: { backgroundColor: '#F4F2EC', borderRadius: 18, padding: 18, marginBottom: 14 },
  missionTitle: { color: '#173A3A', fontSize: 17, fontWeight: '900' },
  missionText: { color: '#5D6E68', marginTop: 6, lineHeight: 20 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderRadius: 14, borderWidth: 1, borderColor: '#D8DDD9', marginBottom: 10 },
  checkRowDone: { borderColor: '#79C9B7', backgroundColor: '#E9F7F1' },
  checkIcon: { color: '#157D73', fontSize: 20, fontWeight: '900' },
  checkText: { color: '#173A3A', fontWeight: '700', flex: 1 },
  finePrint: { color: '#77847F', textAlign: 'center', fontSize: 12, lineHeight: 17, marginTop: 12, marginBottom: 8 },
});
