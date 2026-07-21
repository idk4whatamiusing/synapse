import React, {useState} from 'react';
import {
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import {SafeAreaProvider, useSafeAreaInsets} from 'react-native-safe-area-context';

const GATEWAY_URL = 'http://18.60.43.29:8000';

type Page = 'landing' | 'login';

function App() {
  const [page, setPage] = useState<Page>('landing');
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      {page === 'landing' ? (
        <LandingPage onNavigate={setPage} />
      ) : (
        <LoginPage onBack={() => setPage('landing')} />
      )}
    </SafeAreaProvider>
  );
}

/* ─── LANDING PAGE ─── */
function LandingPage({onNavigate}: {onNavigate: (p: Page) => void}) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#09090b' : '#fafafa';
  const text = isDark ? '#fafafa' : '#09090b';
  const muted = isDark ? '#a1a1aa' : '#71717a';
  const card = isDark ? '#18181b' : '#ffffff';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const accent = '#818cf8';

  return (
    <View style={[s.root, {backgroundColor: bg}]}>
      <ScrollView contentContainerStyle={{paddingTop: insets.top}} showsVerticalScrollIndicator={false}>
        {/* Nav */}
        <View style={s.nav}>
          <Text style={[s.navLogo, {color: text}]}>synapse</Text>
          <TouchableOpacity onPress={() => onNavigate('login')} style={[s.navBtn, {backgroundColor: accent}]}>
            <Text style={s.navBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={[s.heroPill, {backgroundColor: accent + '18'}]}>
            <Text style={[s.heroPillText, {color: accent}]}>Built for Adamas University</Text>
          </View>
          <Text style={[s.heroTitle, {color: text}]}>
            Campus life,{'\n'}simplified.
          </Text>
          <Text style={[s.heroDesc, {color: muted}]}>
            One app for your department chat, campus AI assistant,{'\n'}
            {Platform.OS === 'web' ? '' : ''}announcements, and everything in between.
          </Text>
          <View style={s.heroBtns}>
            <TouchableOpacity onPress={() => onNavigate('login')} style={[s.btnFill, {backgroundColor: accent}]}>
              <Text style={s.btnFillText}>Get Started</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[s.btnOutline, {borderColor: border}]}>
              <Text style={[s.btnOutlineText, {color: text}]}>View Features</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={[s.statsRow, {borderTopColor: border, borderBottomColor: border}]}>
          {[{n: '24/7', l: 'AI Assistant'}, {n: 'Real-time', l: 'Dept Chat'}, {n: 'Secure', l: 'Roll Auth'}].map(
            (item, i) => (
              <View key={i} style={s.statItem}>
                <Text style={[s.statNum, {color: accent}]}>{item.n}</Text>
                <Text style={[s.statLabel, {color: muted}]}>{item.l}</Text>
              </View>
            ),
          )}
        </View>

        {/* Features Grid */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: text}]}>What you get</Text>
          <Text style={[s.sectionDesc, {color: muted}]}>Everything a student needs, nothing they don't.</Text>

          <View style={s.grid}>
            {[
              {icon: '>', title: 'Dept Rooms', desc: 'Auto-joined chat with your department and year group.'},
              {icon: '/', title: 'AI Chatbot', desc: 'Ask about wifi, fees, schedule — instant answers.'},
              {icon: '*', title: 'Roll Login', desc: 'No passwords. Your registration number is your identity.'},
              {icon: '~', title: 'Messages', desc: 'Post and read announcements in your dept room.'},
              {icon: '{', title: 'Schools', desc: 'Browse departments and programs at Adamas.'},
              {icon: '=', title: 'Fast', desc: 'Cloudflare edge network. Loads in milliseconds.'},
            ].map((f, i) => (
              <View key={i} style={[s.gridCard, {backgroundColor: card, borderColor: border}]}>
                <Text style={[s.gridIcon, {color: accent}]}>{f.icon}</Text>
                <Text style={[s.gridTitle, {color: text}]}>{f.title}</Text>
                <Text style={[s.gridDesc, {color: muted}]}>{f.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How It Works */}
        <View style={s.section}>
          <Text style={[s.sectionTitle, {color: text}]}>How it works</Text>
          {[
            {num: '1', title: 'Enter your registration number', desc: 'e.g. ADASU/2024/001'},
            {num: '2', title: 'We find your department', desc: 'Auto-matched to your dept + year'},
            {num: '3', title: 'Start chatting', desc: 'Dept room + AI assistant ready to go'},
          ].map((step, i) => (
            <View key={i} style={[s.stepCard, {backgroundColor: card, borderColor: border}]}>
              <View style={[s.stepNumWrap, {backgroundColor: accent + '18'}]}>
                <Text style={[s.stepNum, {color: accent}]}>{step.num}</Text>
              </View>
              <View style={{flex: 1}}>
                <Text style={[s.stepTitle, {color: text}]}>{step.title}</Text>
                <Text style={[s.stepDesc, {color: muted}]}>{step.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* CTA */}
        <View style={[s.cta, {backgroundColor: accent}]}>
          <Text style={s.ctaTitle}>Ready?</Text>
          <Text style={s.ctaDesc}>Sign in with your registration number and you're in.</Text>
          <TouchableOpacity onPress={() => onNavigate('login')} style={[s.btnFill, {backgroundColor: '#fff'}]}>
            <Text style={[s.btnFillText, {color: accent}]}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={[s.footerText, {color: muted}]}>synapse — Adamas University</Text>
          <Text style={[s.footerSub, {color: muted}]}>Gleam + Cloudflare</Text>
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── LOGIN PAGE ─── */
function LoginPage({onBack}: {onBack: () => void}) {
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const bg = isDark ? '#09090b' : '#fafafa';
  const text = isDark ? '#fafafa' : '#09090b';
  const muted = isDark ? '#a1a1aa' : '#71717a';
  const card = isDark ? '#18181b' : '#ffffff';
  const border = isDark ? '#27272a' : '#e4e4e7';
  const inputBg = isDark ? '#27272a' : '#f4f4f5';
  const accent = '#818cf8';

  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!rollNumber.trim()) {
      setError('Roll number is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${GATEWAY_URL}/api/login`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({registration_number: rollNumber.trim(), credential: password}),
      });
      const data = await res.json();
      if (res.ok) {
        // TODO: store session, navigate to chat
        setError('Login successful! (session storage coming soon)');
      } else {
        setError(data.error || 'Login failed');
      }
    } catch {
      setError('Cannot reach server. Try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[s.root, {backgroundColor: bg}]}>
      <ScrollView
        contentContainerStyle={{paddingTop: insets.top, minHeight: '100%'}}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <View style={s.loginNav}>
          <TouchableOpacity onPress={onBack}>
            <Text style={[s.backText, {color: accent}]}>← Back</Text>
          </TouchableOpacity>
        </View>

        {/* Login Card */}
        <View style={s.loginWrap}>
          <View style={[s.loginCard, {backgroundColor: card, borderColor: border}]}>
            <Text style={[s.loginTitle, {color: text}]}>Welcome back</Text>
            <Text style={[s.loginDesc, {color: muted}]}>Sign in with your registration number</Text>

            <View style={{marginTop: 28}}>
              <Text style={[s.label, {color: muted}]}>Registration Number</Text>
              <TextInput
                style={[s.input, {backgroundColor: inputBg, color: text, borderColor: border}]}
                placeholder="ADASU/2024/001"
                placeholderTextColor={muted}
                value={rollNumber}
                onChangeText={setRollNumber}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={{marginTop: 16}}>
              <Text style={[s.label, {color: muted}]}>Password</Text>
              <TextInput
                style={[s.input, {backgroundColor: inputBg, color: text, borderColor: border}]}
                placeholder="Enter password"
                placeholderTextColor={muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            {error ? (
              <Text style={[s.errorText, {color: error.includes('successful') ? '#22c55e' : '#ef4444'}]}>
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={[s.loginBtn, {backgroundColor: accent, opacity: loading ? 0.6 : 1}]}>
              <Text style={s.loginBtnText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
            </TouchableOpacity>

            <Text style={[s.loginFooter, {color: muted}]}>
              Don't have an account?{' '}
              <Text style={{color: accent, fontWeight: '600'}}>Contact your dept admin</Text>
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/* ─── STYLES ─── */
const s = StyleSheet.create({
  root: {flex: 1},

  // Nav
  nav: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16},
  navLogo: {fontSize: 20, fontWeight: '800', letterSpacing: -0.5},
  navBtn: {paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8},
  navBtnText: {color: '#fff', fontSize: 13, fontWeight: '600'},

  // Hero
  hero: {paddingHorizontal: 24, paddingTop: 32, paddingBottom: 48, alignItems: 'center'},
  heroPill: {paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 24},
  heroPillText: {fontSize: 12, fontWeight: '600', letterSpacing: 0.3},
  heroTitle: {fontSize: 48, fontWeight: '800', textAlign: 'center', lineHeight: 52, letterSpacing: -1.5, marginBottom: 16},
  heroDesc: {fontSize: 16, textAlign: 'center', lineHeight: 24, marginBottom: 32, paddingHorizontal: 12},
  heroBtns: {flexDirection: 'row', gap: 12},
  btnFill: {paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10},
  btnFillText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  btnOutline: {paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5},
  btnOutlineText: {fontSize: 15, fontWeight: '500'},

  // Stats
  statsRow: {flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, marginHorizontal: 24, paddingVertical: 20},
  statItem: {flex: 1, alignItems: 'center'},
  statNum: {fontSize: 18, fontWeight: '700', marginBottom: 2},
  statLabel: {fontSize: 12, fontWeight: '500'},

  // Sections
  section: {paddingHorizontal: 24, paddingTop: 48, paddingBottom: 8},
  sectionTitle: {fontSize: 28, fontWeight: '700', letterSpacing: -0.5, marginBottom: 6},
  sectionDesc: {fontSize: 15, lineHeight: 22, marginBottom: 24},

  // Grid
  grid: {gap: 10},
  gridCard: {padding: 18, borderRadius: 12, borderWidth: 1},
  gridIcon: {fontSize: 20, fontWeight: '700', marginBottom: 8},
  gridTitle: {fontSize: 15, fontWeight: '600', marginBottom: 4},
  gridDesc: {fontSize: 13, lineHeight: 18},

  // Steps
  stepCard: {flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10, gap: 14},
  stepNumWrap: {width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center'},
  stepNum: {fontSize: 16, fontWeight: '700'},
  stepTitle: {fontSize: 15, fontWeight: '600', marginBottom: 2},
  stepDesc: {fontSize: 13, lineHeight: 18},

  // CTA
  cta: {marginHorizontal: 24, marginTop: 40, borderRadius: 16, padding: 32, alignItems: 'center'},
  ctaTitle: {fontSize: 28, fontWeight: '700', color: '#fff', marginBottom: 6},
  ctaDesc: {fontSize: 15, color: '#fff', opacity: 0.85, marginBottom: 24},

  // Footer
  footer: {paddingHorizontal: 24, paddingVertical: 32, alignItems: 'center'},
  footerText: {fontSize: 13, fontWeight: '500'},
  footerSub: {fontSize: 11, marginTop: 2},

  // Login
  loginNav: {paddingHorizontal: 20, paddingVertical: 12},
  backText: {fontSize: 14, fontWeight: '500'},
  loginWrap: {paddingHorizontal: 24, paddingTop: 24, alignItems: 'center'},
  loginCard: {width: '100%', maxWidth: 400, padding: 28, borderRadius: 16, borderWidth: 1},
  loginTitle: {fontSize: 26, fontWeight: '700', letterSpacing: -0.5},
  loginDesc: {fontSize: 14, marginTop: 4},
  label: {fontSize: 12, fontWeight: '600', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5},
  input: {height: 48, borderRadius: 10, borderWidth: 1, paddingHorizontal: 14, fontSize: 15},
  errorText: {fontSize: 13, marginTop: 12, fontWeight: '500'},
  loginBtn: {height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 24},
  loginBtnText: {color: '#fff', fontSize: 15, fontWeight: '600'},
  loginFooter: {fontSize: 13, textAlign: 'center', marginTop: 20},
});

export default App;
