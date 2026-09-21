import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, SafeAreaView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { Learner } from '@/domain/learning';

type AuthMode = 'sign-in' | 'sign-up';
type ExperienceProfile = 'elementary_playful' | 'middle_school_guided' | 'teen_performance' | 'adult_practical';
type LearnerRow = { id: string; display_name: string; experience_profile: ExperienceProfile };

type AccountGateProps = {
  children: (learner: Learner, signOut: () => Promise<void>) => React.ReactNode;
};

export function AccountGate({ children }: AccountGateProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [learner, setLearner] = useState<Learner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    }

    void loadSession();
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!active) return;
      setSession(nextSession);
      setLearner(null);
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    let active = true;

    async function loadLearner() {
      const { data, error } = await supabase
        .from('learners')
        .select('id, display_name, experience_profile')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle<LearnerRow>();

      if (!active) return;
      if (error) {
        Alert.alert('Could not load learners', error.message);
        return;
      }
      setLearner(data ? toLearningLearner(data) : null);
    }

    void loadLearner();
    return () => { active = false; };
  }, [session]);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Could not sign out', error.message);
  }

  if (loading) return <LoadingScreen />;
  if (!session) return <AuthScreen />;
  if (!learner) return <LearnerSetup session={session} onCreated={setLearner} />;
  return <>{children(learner, signOut)}</>;
}

function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      Alert.alert('Enter your email and password.');
      return;
    }
    if (mode === 'sign-up' && !name.trim()) {
      Alert.alert('Enter your name.');
      return;
    }

    setSubmitting(true);
    const result = mode === 'sign-up'
      ? await supabase.auth.signUp({ email: email.trim(), password, options: { data: { name: name.trim() } } })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);

    if (result.error) {
      Alert.alert('Account error', result.error.message);
      return;
    }
    if (mode === 'sign-up' && !result.data.session) {
      Alert.alert('Check your email', 'Confirm your email, then return here and sign in.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.authPage}>
        <Text style={styles.brand}>PLAY PATH</Text>
        <Text style={styles.authTitle}>{mode === 'sign-in' ? 'Welcome back' : 'Start your family learning space'}</Text>
        <Text style={styles.authIntro}>An adult account manages learner profiles and progress.</Text>
        <View style={styles.switchRow}>
          <SwitchButton active={mode === 'sign-in'} text="Sign in" onPress={() => setMode('sign-in')} />
          <SwitchButton active={mode === 'sign-up'} text="Create account" onPress={() => setMode('sign-up')} />
        </View>
        {mode === 'sign-up' && <TextInput value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" style={styles.input} />}
        <TextInput value={email} onChangeText={setEmail} placeholder="Email address" autoCapitalize="none" autoComplete="email" keyboardType="email-address" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} placeholder="Password (at least 6 characters)" autoCapitalize="none" autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'} secureTextEntry style={styles.input} />
        <Pressable disabled={submitting} onPress={() => void submit()} style={[styles.submitButton, submitting && styles.submitButtonDisabled]}><Text style={styles.submitButtonText}>{submitting ? 'Working…' : mode === 'sign-in' ? 'Sign in' : 'Create adult account'}</Text></Pressable>
        <Text style={styles.authFinePrint}>Learners do not need their own email or password in this first version.</Text>
      </View>
    </SafeAreaView>
  );
}

function LearnerSetup({ session, onCreated }: { session: Session; onCreated: (learner: Learner) => void }) {
  const [name, setName] = useState('');
  const [profile, setProfile] = useState<ExperienceProfile>('elementary_playful');
  const [submitting, setSubmitting] = useState(false);

  async function createLearner() {
    if (!name.trim()) {
      Alert.alert('Enter the learner’s first name or nickname.');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('learners')
      .insert({ display_name: name.trim(), experience_profile: profile, created_by_account_id: session.user.id })
      .select('id, display_name, experience_profile')
      .single<LearnerRow>();
    setSubmitting(false);
    if (error) {
      Alert.alert('Could not create learner', error.message);
      return;
    }
    onCreated(toLearningLearner(data));
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.authPage}>
        <Text style={styles.brand}>PLAY PATH</Text>
        <Text style={styles.authTitle}>Who is learning first?</Text>
        <Text style={styles.authIntro}>Use a first name or nickname. This chooses the presentation style, not a skill level.</Text>
        <TextInput value={name} onChangeText={setName} placeholder="Learner name" autoCapitalize="words" style={styles.input} />
        <Text style={styles.fieldLabel}>Learning experience</Text>
        <View style={styles.profileList}>
          <ProfileOption active={profile === 'elementary_playful'} label="Elementary · playful" onPress={() => setProfile('elementary_playful')} />
          <ProfileOption active={profile === 'middle_school_guided'} label="Middle school · guided" onPress={() => setProfile('middle_school_guided')} />
          <ProfileOption active={profile === 'teen_performance'} label="Teen · performance" onPress={() => setProfile('teen_performance')} />
          <ProfileOption active={profile === 'adult_practical'} label="Adult · practical" onPress={() => setProfile('adult_practical')} />
        </View>
        <Pressable disabled={submitting} onPress={() => void createLearner()} style={[styles.submitButton, submitting && styles.submitButtonDisabled]}><Text style={styles.submitButtonText}>{submitting ? 'Creating…' : 'Create learner'}</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

function toLearningLearner(row: LearnerRow): Learner {
  return { id: row.id, firstName: row.display_name, avatarInitial: row.display_name.slice(0, 1).toUpperCase(), weeklyPracticeGoal: 3 };
}

function LoadingScreen() {
  return <SafeAreaView style={styles.safeArea}><View style={styles.loadingPage}><ActivityIndicator color="#157D73" /><Text style={styles.loadingText}>Loading your learning space…</Text></View></SafeAreaView>;
}

function SwitchButton({ active, text, onPress }: { active: boolean; text: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.switchButton, active && styles.switchButtonActive]}><Text style={[styles.switchText, active && styles.switchTextActive]}>{text}</Text></Pressable>;
}

function ProfileOption({ active, label, onPress }: { active: boolean; label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.profileOption, active && styles.profileOptionActive]}><Text style={[styles.profileOptionText, active && styles.profileOptionTextActive]}>{active ? '✓  ' : '○  '}{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FFFDF8' },
  authPage: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', justifyContent: 'center', padding: 26 },
  brand: { color: '#173A3A', fontSize: 17, fontWeight: '900', letterSpacing: 1.2, marginBottom: 28 },
  authTitle: { color: '#173A3A', fontSize: 30, lineHeight: 37, fontWeight: '900' },
  authIntro: { color: '#63736E', lineHeight: 21, marginTop: 9, marginBottom: 25 },
  switchRow: { flexDirection: 'row', backgroundColor: '#E8EEEC', padding: 3, borderRadius: 13, alignSelf: 'flex-start', marginBottom: 18 },
  switchButton: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 10 },
  switchButtonActive: { backgroundColor: '#173A3A' },
  switchText: { color: '#53615D', fontWeight: '800', fontSize: 13 },
  switchTextActive: { color: '#FFFFFF' },
  input: { borderWidth: 1, borderColor: '#D6DDD9', backgroundColor: '#FFFFFF', borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, color: '#173A3A', marginBottom: 11, fontSize: 16 },
  submitButton: { backgroundColor: '#F4B766', borderRadius: 15, paddingVertical: 15, alignItems: 'center', marginTop: 8 },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { color: '#173A3A', fontSize: 15, fontWeight: '900' },
  authFinePrint: { color: '#77847F', fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 16 },
  fieldLabel: { color: '#173A3A', fontSize: 14, fontWeight: '900', marginTop: 11, marginBottom: 8 },
  profileList: { gap: 8 },
  profileOption: { borderWidth: 1, borderColor: '#D6DDD9', borderRadius: 13, padding: 13, backgroundColor: '#FFFFFF' },
  profileOptionActive: { borderColor: '#157D73', backgroundColor: '#E9F7F1' },
  profileOptionText: { color: '#53615D', fontWeight: '700' },
  profileOptionTextActive: { color: '#125C4D' },
  loadingPage: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 14 },
  loadingText: { color: '#5E6F6A', fontWeight: '700' },
});
