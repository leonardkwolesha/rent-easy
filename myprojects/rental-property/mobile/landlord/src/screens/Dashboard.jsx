import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { getUser } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import { fmtCurrency } from '../../../shared/formatters';

const PRIORITY_COLOR = {
  low: BRAND.secondary, medium: BRAND.accent, high: '#F97316', urgent: BRAND.danger,
};

const CAT_ICON = {
  plumbing: 'water-outline', electrical: 'flash-outline', structural: 'home-outline',
  appliance: 'hardware-chip-outline', pest: 'bug-outline', other: 'build-outline',
};

function getTimeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'Morning';
  if (h < 17) return 'Afternoon';
  return 'Evening';
}

export default function Dashboard({ navigation }) {
  const insets = useSafeAreaInsets();
  const [user, setUser]         = useState(null);
  const [stats, setStats]       = useState({ properties: 0, applications: 0, tenants: 0, revenue: 0, overdue: 0, maintenance: 0 });
  const [recentApps, setRecentApps]     = useState([]);
  const [recentMaint, setRecentMaint]   = useState([]);
  const [refreshing, setRefreshing]     = useState(false);
  const [loading, setLoading]           = useState(true);

  const load = async () => {
    const u = await getUser();
    setUser(u);
    try {
      const [p, a, l, pay, maint] = await Promise.all([
        api.get('/properties/my'),
        api.get('/applications/received'),
        api.get('/leases/landlord'),
        api.get('/payments/landlord'),
        api.get('/maintenance/landlord'),
      ]);

      const paid    = pay.data.data.filter(x => x.status === 'paid');
      const overdue = pay.data.data.filter(x => x.status === 'overdue');
      const maintData  = maint.data.data || [];
      const openMaint  = maintData.filter(x => x.status === 'open' || x.status === 'in_progress');

      setStats({
        properties:  p.data.data.length,
        applications: a.data.data.filter(x => x.status === 'pending').length,
        tenants:     l.data.data.filter(x => x.status === 'active').length,
        revenue:     paid.reduce((s, x) => s + x.amount, 0),
        overdue:     overdue.length,
        maintenance: openMaint.length,
      });

      setRecentApps(a.data.data.filter(x => x.status === 'pending').slice(0, 4));
      // Show most recent open/in-progress maintenance requests first
      setRecentMaint(openMaint.slice(0, 4));
    } catch {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const STAT_CARDS = [
    { icon: 'business',       label: 'Properties',  value: stats.properties,                               color: BRAND.primary,   tab: 'Properties' },
    { icon: 'time',           label: 'Pending',     value: stats.applications,                             color: '#D97706',       tab: 'Applications', alert: stats.applications > 0 },
    { icon: 'people',         label: 'Tenants',     value: stats.tenants,                                  color: BRAND.secondary, tab: 'Tenants' },
    { icon: 'construct',      label: 'Maintenance', value: stats.maintenance,                              color: '#F97316',       tab: 'Maintenance', alert: stats.maintenance > 0 },
    { icon: 'wallet',         label: 'Collected',   value: fmtCurrency(stats.revenue).replace('TZS ', '') + ' TZS', color: '#8B5CF6', tab: 'Payments', small: true },
    { icon: 'warning-outline',label: 'Overdue',     value: stats.overdue,                                  color: BRAND.danger,    tab: 'Payments', alert: stats.overdue > 0 },
  ];

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.secondary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero header */}
      <View style={[styles.hero, { paddingTop: insets.top + 16 }]}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.greeting}>Good {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋</Text>
            <Text style={styles.heroSub}>Here's your property overview</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Profile')} style={styles.avatarBtn}>
            <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Alert banners */}
        {stats.overdue > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Payments')} style={styles.alertBanner}>
            <Ionicons name="warning-outline" size={14} color="#92400E" />
            <Text style={styles.alertText}>{stats.overdue} overdue payment{stats.overdue > 1 ? 's' : ''} need attention</Text>
            <Ionicons name="chevron-forward" size={13} color="#92400E" />
          </TouchableOpacity>
        )}
        {stats.maintenance > 0 && (
          <TouchableOpacity onPress={() => navigation.navigate('Maintenance')} style={[styles.alertBanner, { backgroundColor: '#FFF7ED', marginTop: 6 }]}>
            <Ionicons name="construct-outline" size={14} color="#9A3412" />
            <Text style={[styles.alertText, { color: '#9A3412' }]}>{stats.maintenance} open maintenance request{stats.maintenance > 1 ? 's' : ''}</Text>
            <Ionicons name="chevron-forward" size={13} color="#9A3412" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stats grid — 2 per row */}
      {loading ? (
        <ActivityIndicator color={BRAND.secondary} style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.statsGrid}>
          {STAT_CARDS.map(card => (
            <TouchableOpacity key={card.label} onPress={() => navigation.navigate(card.tab)} style={styles.statCard} activeOpacity={0.75}>
              <View style={[styles.statIconWrap, { backgroundColor: card.color + '18' }]}>
                <Ionicons name={card.icon} size={20} color={card.color} />
                {card.alert && <View style={styles.alertDot} />}
              </View>
              <Text style={[styles.statValue, card.small && { fontSize: 13 }]}>{card.value}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Quick actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          {[
            { icon: 'add-circle-outline',      label: 'Add Property',  tab: 'Properties',   color: BRAND.primary },
            { icon: 'document-text-outline',    label: 'Applications',  tab: 'Applications', color: '#D97706' },
            { icon: 'construct-outline',        label: 'Maintenance',   tab: 'Maintenance',  color: '#F97316' },
            { icon: 'wallet-outline',           label: 'Payments',      tab: 'Payments',     color: '#8B5CF6' },
          ].map(a => (
            <TouchableOpacity key={a.label} onPress={() => navigation.navigate(a.tab)} style={styles.quickCard} activeOpacity={0.7}>
              <View style={[styles.quickIcon, { backgroundColor: a.color + '15' }]}>
                <Ionicons name={a.icon} size={20} color={a.color} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Maintenance Requests */}
      {recentMaint.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Maintenance Requests</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Maintenance')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color={BRAND.secondary} />
            </TouchableOpacity>
          </View>

          {recentMaint.map((req, idx) => {
            const pri = PRIORITY_COLOR[req.priority] || BRAND.muted;
            const isLast = idx === recentMaint.length - 1;
            return (
              <TouchableOpacity
                key={req._id}
                onPress={() => navigation.navigate('Maintenance')}
                activeOpacity={0.75}
                style={[styles.maintRow, !isLast && styles.maintRowBorder, { borderLeftColor: pri }]}
              >
                {/* Category icon */}
                <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: pri + '15',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Ionicons name={CAT_ICON[req.category] || 'build-outline'} size={16} color={pri} />
                </View>

                <View style={{ flex: 1, marginLeft: 10 }}>
                  {/* Title + priority */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <Text style={{ fontSize: 13, fontWeight: '700', color: BRAND.text, flex: 1, marginRight: 8 }} numberOfLines={1}>
                      {req.title}
                    </Text>
                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8, backgroundColor: pri + '18' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: pri, textTransform: 'uppercase' }}>
                        {req.priority}
                      </Text>
                    </View>
                  </View>

                  {/* Description — the "message" the user was missing */}
                  <Text style={{ fontSize: 12, color: BRAND.text, lineHeight: 17, marginBottom: 5 }} numberOfLines={2}>
                    {req.description}
                  </Text>

                  {/* Tenant + status row */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 11, color: BRAND.muted }}>
                      {req.tenant?.name}{req.property?.title ? ` · ${req.property.title}` : ''}
                    </Text>
                    <View style={{
                      paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6,
                      backgroundColor: req.status === 'open' ? '#FEE2E2' : '#FEF3C7',
                    }}>
                      <Text style={{
                        fontSize: 9, fontWeight: '700',
                        color: req.status === 'open' ? BRAND.danger : BRAND.warn,
                        textTransform: 'capitalize',
                      }}>
                        {req.status.replace('_', ' ')}
                      </Text>
                    </View>
                  </View>

                  {/* Landlord note indicator */}
                  {req.landlordNote ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                      <Ionicons name="checkmark-circle" size={11} color={BRAND.success} />
                      <Text style={{ fontSize: 10, color: BRAND.success }}>Note sent to tenant</Text>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 }}>
                      <Ionicons name="alert-circle-outline" size={11} color={BRAND.warn} />
                      <Text style={{ fontSize: 10, color: BRAND.warn }}>No response sent yet</Text>
                    </View>
                  )}
                </View>

                <Ionicons name="chevron-forward" size={15} color={BRAND.border} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Recent pending applications */}
      {recentApps.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Pending Applications</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Applications')} style={styles.seeAllBtn}>
              <Text style={styles.seeAllText}>See all</Text>
              <Ionicons name="chevron-forward" size={14} color={BRAND.secondary} />
            </TouchableOpacity>
          </View>
          {recentApps.map((app, idx) => (
            <TouchableOpacity key={app._id} onPress={() => navigation.navigate('Applications')}
              style={[styles.appRow, idx < recentApps.length - 1 && { borderBottomWidth: 1, borderBottomColor: BRAND.border }]}
              activeOpacity={0.7}>
              <View style={styles.appAvatar}>
                <Text style={styles.appAvatarText}>{app.tenant?.name?.[0]?.toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.appName}>{app.tenant?.name}</Text>
                <Text style={styles.appProp} numberOfLines={1}>{app.property?.title}</Text>
              </View>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color={BRAND.muted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Empty state */}
      {!loading && stats.properties === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color={BRAND.border} />
          <Text style={styles.emptyTitle}>No Properties Yet</Text>
          <Text style={styles.emptySub}>Add your first property to start managing tenants and payments</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Properties')} style={styles.emptyBtn}>
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.emptyBtnText}>Add Property</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: BRAND.bg },
  hero:            { backgroundColor: BRAND.primary, padding: 20, paddingTop: 16, paddingBottom: 28 },
  heroTop:         { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  greeting:        { fontSize: 20, fontWeight: '700', color: '#fff' },
  heroSub:         { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 3 },
  avatarBtn:       { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  avatarText:      { fontSize: 16, fontWeight: '800', color: '#fff' },
  alertBanner:     { flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 10, marginTop: 14 },
  alertText:       { flex: 1, fontSize: 12, fontWeight: '600', color: '#92400E' },
  statsGrid:       { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 10, marginTop: -14 },
  statCard:        { width: '47%', backgroundColor: BRAND.surface, borderRadius: 14, padding: 14, ...BRAND.shadow },
  statIconWrap:    { width: 40, height: 40, borderRadius: 11, justifyContent: 'center', alignItems: 'center', marginBottom: 10, position: 'relative' },
  alertDot:        { position: 'absolute', top: 2, right: 2, width: 10, height: 10, borderRadius: 5, backgroundColor: BRAND.danger, borderWidth: 2, borderColor: BRAND.surface },
  statValue:       { fontSize: 20, fontWeight: '800', color: BRAND.text, marginBottom: 2 },
  statLabel:       { fontSize: 11, color: BRAND.muted, fontWeight: '500' },
  section:         { backgroundColor: BRAND.surface, margin: 12, marginBottom: 0, borderRadius: 16, padding: 16, ...BRAND.shadow },
  sectionTitle:    { fontSize: 15, fontWeight: '700', color: BRAND.text, marginBottom: 14 },
  sectionHeaderRow:{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  seeAllBtn:       { flexDirection: 'row', alignItems: 'center', gap: 2 },
  seeAllText:      { fontSize: 13, color: BRAND.secondary, fontWeight: '600' },
  quickRow:        { flexDirection: 'row', gap: 8 },
  quickCard:       { flex: 1, alignItems: 'center', gap: 6, padding: 10, borderRadius: 12, backgroundColor: BRAND.bg },
  quickIcon:       { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  quickLabel:      { fontSize: 10, fontWeight: '600', color: BRAND.text, textAlign: 'center' },
  maintRow:        { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 12, borderLeftWidth: 3, paddingLeft: 10 },
  maintRowBorder:  { borderBottomWidth: 1, borderBottomColor: BRAND.border },
  appRow:          { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  appAvatar:       { width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.secondary + '20', justifyContent: 'center', alignItems: 'center' },
  appAvatarText:   { fontSize: 15, fontWeight: '700', color: BRAND.secondary },
  appName:         { fontSize: 14, fontWeight: '600', color: BRAND.text },
  appProp:         { fontSize: 12, color: BRAND.muted, marginTop: 1 },
  pendingBadge:    { backgroundColor: '#FEF3C7', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  pendingBadgeText:{ fontSize: 10, fontWeight: '700', color: '#92400E' },
  emptyState:      { alignItems: 'center', margin: 24, marginTop: 16, padding: 28, backgroundColor: BRAND.surface, borderRadius: 20, ...BRAND.shadow },
  emptyTitle:      { fontSize: 17, fontWeight: '700', color: BRAND.text, marginTop: 14, marginBottom: 6 },
  emptySub:        { fontSize: 13, color: BRAND.muted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn:        { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BRAND.primary, borderRadius: 12, paddingHorizontal: 20, paddingVertical: 12 },
  emptyBtnText:    { color: '#fff', fontWeight: '700', fontSize: 14 },
});
