import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { getUser } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import { fmtCurrency, fmtDate } from '../../../shared/formatters';

function getGreeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function KPICard({ icon, title, value, desc, onPress, color }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ flex: 1, minWidth: '47%', backgroundColor: BRAND.surface, borderRadius: 12, padding: 14, ...BRAND.shadow }}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: color + '18', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <Text style={{ fontSize: 11, fontWeight: '600', color: BRAND.muted, marginBottom: 3 }}>{title}</Text>
      <Text style={{ fontSize: 24, fontWeight: '800', color, lineHeight: 28, marginBottom: 2 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: BRAND.muted }}>{desc}</Text>
    </TouchableOpacity>
  );
}

export default function Home({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [lease, setLease] = useState(null);
  const [payments, setPayments] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const u = await getUser();
    setUser(u);
    try {
      const [l, p, m, a] = await Promise.all([
        api.get('/leases/my'),
        api.get('/payments/my'),
        api.get('/maintenance/my'),
        api.get('/applications/sent'),
      ]);
      setLease(l.data.data);
      setPayments(p.data.data || []);
      setMaintenance(m.data.data || []);
      setApplications(a.data.data || []);
    } catch {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const pending = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const openMaint = maintenance.filter(m => m.status === 'open' || m.status === 'in_progress');
  const pendingApps = applications.filter(a => a.status === 'pending');
  const approvedApps = applications.filter(a => a.status === 'approved');
  const daysLeft = lease ? Math.max(0, Math.ceil((new Date(lease.endDate) - new Date()) / 86400000)) : null;

  const onboardSteps = [
    {
      done: true,
      icon: 'checkmark-circle',
      color: BRAND.success,
      title: 'Create your account',
      desc: "You're signed in — you're ready to go.",
      link: null,
    },
    {
      done: applications.length > 0,
      icon: applications.length > 0 ? 'checkmark-circle' : 'search',
      color: applications.length > 0 ? BRAND.success : BRAND.primary,
      title: 'Browse & apply for a property',
      desc: 'Find a property you like and submit a rental application.',
      link: { screen: 'Properties', label: 'Browse Properties' },
    },
    {
      done: approvedApps.length > 0 && pendingApps.length === 0,
      icon: approvedApps.length > 0 && pendingApps.length === 0
        ? 'checkmark-circle'
        : pendingApps.length > 0 ? 'time-outline' : 'document-text-outline',
      color: approvedApps.length > 0 && pendingApps.length === 0
        ? BRAND.success
        : pendingApps.length > 0 ? BRAND.warn : BRAND.muted,
      title: 'Get your application approved',
      desc: pendingApps.length > 0
        ? `${pendingApps.length} application${pendingApps.length > 1 ? 's' : ''} under review.`
        : approvedApps.length > 0
          ? 'Your previous lease has ended. Apply to a new property to start again.'
          : 'The landlord will review your application and respond.',
      link: applications.length > 0
        ? { screen: 'My Lease', label: 'View Applications' }
        : null,
    },
    {
      done: false,
      icon: 'document-text-outline',
      color: BRAND.muted,
      title: 'Your lease is activated',
      desc: 'Once approved, your lease and full payment schedule are created automatically.',
      link: null,
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BRAND.bg }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
    >
      {/* Header */}
      <View style={{ backgroundColor: BRAND.primary, paddingHorizontal: 20, paddingTop: insets.top + 16, paddingBottom: 34 }}>
        <Text style={{ fontSize: 22, fontWeight: '700', color: '#fff' }}>{getGreeting()}, {user?.name?.split(' ')[0]}</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 }}>
          {lease ? 'Active tenant' : 'No active lease'}
        </Text>
      </View>

      <View style={{ marginTop: -16, paddingHorizontal: 12, paddingBottom: 24 }}>

        {/* Onboarding guide — shown only when no lease */}
        {!lease && !loading && (
          <View style={{ backgroundColor: BRAND.surface, borderRadius: 14, padding: 18, marginBottom: 12, ...BRAND.shadow }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.text, marginBottom: 18 }}>How to rent a property</Text>
            {onboardSteps.map((s, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 12, position: 'relative', paddingBottom: i < onboardSteps.length - 1 ? 20 : 0 }}>
                {i < onboardSteps.length - 1 && (
                  <View style={{ position: 'absolute', left: 17, top: 36, bottom: 0, width: 2, backgroundColor: s.done ? BRAND.success : BRAND.border }} />
                )}
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: s.done ? '#ECFDF5' : BRAND.bg, borderWidth: 2, borderColor: s.done ? BRAND.success : BRAND.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 }}>
                  <Ionicons name={s.icon} size={16} color={s.color} />
                </View>
                <View style={{ flex: 1, paddingTop: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: s.done ? BRAND.success : BRAND.text }}>{s.title}</Text>
                  <Text style={{ fontSize: 12, color: BRAND.muted, marginTop: 2, lineHeight: 17 }}>{s.desc}</Text>
                  {s.link && (
                    <TouchableOpacity onPress={() => navigation.navigate(s.link.screen)} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.primary }}>{s.link.label}</Text>
                      <Ionicons name="arrow-forward" size={12} color={BRAND.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Pending applications banner */}
        {!lease && pendingApps.length > 0 && (
          <View style={{ backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FDE68A', borderRadius: 12, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>
              <Text style={{ fontWeight: '700' }}>{pendingApps.length}</Text>{' '}
              application{pendingApps.length > 1 ? 's are' : ' is'} under review
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('My Lease')} style={{ backgroundColor: '#92400E', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginLeft: 10 }}>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>Track →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* KPI cards */}
        {loading ? (
          <ActivityIndicator color={BRAND.primary} style={{ marginVertical: 30 }} />
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <KPICard
              icon="business-outline" title="My Lease"
              value={lease ? 'Active' : 'None'}
              desc={lease?.property?.title || 'No active lease'}
              onPress={() => navigation.navigate('My Lease')}
              color={BRAND.primary}
            />
            <KPICard
              icon="document-text-outline" title="Applications"
              value={String(applications.length)}
              desc={`${pendingApps.length} pending · ${approvedApps.length} approved`}
              onPress={() => navigation.navigate('My Lease')}
              color={pendingApps.length > 0 ? BRAND.warn : BRAND.secondary}
            />
            <KPICard
              icon="wallet-outline" title="Due Payments"
              value={String(pending.length)}
              desc={`${pending.length} payment${pending.length !== 1 ? 's' : ''} pending`}
              onPress={() => navigation.navigate('Payments')}
              color={pending.length > 0 ? BRAND.danger : BRAND.success}
            />
            <KPICard
              icon="construct-outline" title="Maintenance"
              value={String(openMaint.length)}
              desc={`${openMaint.length} open request${openMaint.length !== 1 ? 's' : ''}`}
              onPress={() => navigation.navigate('Maintenance')}
              color={BRAND.secondary}
            />
          </View>
        )}

        {/* Current lease details */}
        {lease && (
          <TouchableOpacity onPress={() => navigation.navigate('My Lease')} style={{ backgroundColor: BRAND.surface, borderRadius: 14, padding: 18, marginBottom: 12, ...BRAND.shadow }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.text }}>Current Lease</Text>
              {daysLeft !== null && (
                <View style={{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, backgroundColor: daysLeft < 30 ? '#FEF3C7' : '#DCFCE7' }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: daysLeft < 30 ? '#92400E' : '#166534' }}>{daysLeft} days left</Text>
                </View>
              )}
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                ['Property', lease.property?.title],
                ['Monthly Rent', fmtCurrency(lease.rentAmount)],
                ['Start', fmtDate(lease.startDate)],
                ['End', fmtDate(lease.endDate)],
              ].map(([label, val]) => (
                <View key={label} style={{ flex: 1, minWidth: '47%', backgroundColor: BRAND.bg, borderRadius: 9, padding: 12, borderWidth: 1, borderColor: BRAND.border }}>
                  <Text style={{ fontSize: 10, color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}>{label}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: BRAND.text }} numberOfLines={1}>{val}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Upcoming payments */}
        {pending.length > 0 && (
          <View style={{ backgroundColor: BRAND.surface, borderRadius: 14, overflow: 'hidden', ...BRAND.shadow }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: BRAND.border }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.text }}>Upcoming Payments</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Payments')}>
                <Text style={{ fontSize: 13, color: BRAND.secondary, fontWeight: '600' }}>Pay now →</Text>
              </TouchableOpacity>
            </View>
            {pending.slice(0, 4).map((p, idx) => (
              <TouchableOpacity key={p._id} onPress={() => navigation.navigate('Payments')}
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, borderBottomWidth: idx < pending.slice(0, 4).length - 1 ? 1 : 0, borderBottomColor: BRAND.border }}>
                <View>
                  <Text style={{ fontSize: 14, fontWeight: '500', color: BRAND.text }}>{p.period} Rent</Text>
                  <Text style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>Due {fmtDate(p.dueDate)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.text }}>{fmtCurrency(p.amount)}</Text>
                  <View style={{ marginTop: 3, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: p.status === 'overdue' ? '#FEE2E2' : '#FEF3C7' }}>
                    <Text style={{ fontSize: 10, fontWeight: '600', color: p.status === 'overdue' ? '#991B1B' : '#92400E' }}>{p.status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}
