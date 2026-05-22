import { useState, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Modal, TextInput,
  Alert, ActivityIndicator, RefreshControl, Image, Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtCurrency, fmtDate } from '../../../shared/formatters';

// ─── helpers ──────────────────────────────────────────────────────────────────

function pmtCfg(status) {
  if (status === 'paid')    return { bg: '#ECFDF5', border: '#A7F3D0', color: '#059669', icon: 'checkmark-circle',     label: 'Paid' };
  if (status === 'overdue') return { bg: '#FEF2F2', border: '#FECACA', color: '#DC2626', icon: 'alert-circle-outline', label: 'Overdue' };
  return                           { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: 'time-outline',          label: 'Pending' };
}

function paymentsForLease(lease, payments) {
  const lid = lease._id?.toString();
  return payments.filter(p => (p.lease?._id || p.lease)?.toString() === lid);
}

function currentPeriod() {
  const n = new Date();
  return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
}

// ─── LeaseCard ────────────────────────────────────────────────────────────────

function LeaseCard({ lease, payments, expanded, onToggle, onNavigate, onTerminate }) {
  const prop        = lease.property;
  const addr        = [prop?.address?.street, prop?.address?.city].filter(Boolean).join(', ');
  const daysLeft    = Math.ceil((new Date(lease.endDate) - new Date()) / 86400000);
  const expiringSoon = daysLeft > 0 && daysLeft <= 30;
  const hasImage    = !!prop?.images?.[0];

  const lp           = paymentsForLease(lease, payments);
  const period       = currentPeriod();
  const current      = lp.find(p => p.period === period);
  const overdueCount = lp.filter(p => p.status === 'overdue').length;
  const topStatus    = current?.status ?? (overdueCount > 0 ? 'overdue' : 'pending');
  const cfg          = pmtCfg(topStatus);

  return (
    <View style={{ backgroundColor: BRAND.surface, borderRadius: 16, marginHorizontal: 16, marginBottom: 12, overflow: 'hidden', ...BRAND.shadow }}>

      {/* Full-width image header */}
      <View style={{ height: 160 }}>
        {hasImage ? (
          <Image source={{ uri: prop.images[0] }} style={{ width: '100%', height: 160 }} resizeMode="cover" />
        ) : (
          <View style={{ width: '100%', height: 160, backgroundColor: BRAND.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="business-outline" size={44} color={BRAND.primary + '50'} />
          </View>
        )}
        <View style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12,
          backgroundColor: hasImage ? 'rgba(0,0,0,0.48)' : 'transparent',
        }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#D1FAE5' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#065F46' }}>ACTIVE</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: expiringSoon ? '#FEF3C7' : 'rgba(255,255,255,0.18)' }}>
              <Text style={{ fontSize: 10, fontWeight: '600', color: expiringSoon ? '#92400E' : (hasImage ? '#fff' : BRAND.muted) }}>
                {daysLeft > 0 ? `${daysLeft}d left` : 'Expired'}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 16, fontWeight: '700', color: hasImage ? '#fff' : BRAND.text, marginBottom: 3 }} numberOfLines={1}>
            {prop?.title || 'Property'}
          </Text>
          {addr ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Ionicons name="location-outline" size={11} color={hasImage ? 'rgba(255,255,255,0.8)' : BRAND.muted} />
              <Text style={{ fontSize: 11, color: hasImage ? 'rgba(255,255,255,0.8)' : BRAND.muted }} numberOfLines={1}>{addr}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Rent + dates row */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: BRAND.border }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: BRAND.primary }}>
          {fmtCurrency(lease.rentAmount)}
          <Text style={{ fontSize: 12, fontWeight: '400', color: BRAND.muted }}>/mo</Text>
        </Text>
        <Text style={{ fontSize: 11, color: BRAND.muted }}>
          {fmtDate(lease.startDate)} – {fmtDate(lease.endDate)}
        </Text>
      </View>

      {/* Payment status bar */}
      <Pressable
        onPress={onNavigate}
        style={({ pressed }) => [{
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
          paddingHorizontal: 14, paddingVertical: 12,
          backgroundColor: cfg.bg, borderBottomWidth: 1, borderBottomColor: cfg.border,
        }, pressed && { opacity: 0.85 }]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
          <Ionicons name={cfg.icon} size={15} color={cfg.color} />
          <Text style={{ fontSize: 13, fontWeight: '600', color: cfg.color }}>
            {current
              ? `${period} · ${fmtCurrency(current.amount)} — ${cfg.label}`
              : `Rent — ${cfg.label}`}
          </Text>
          {overdueCount > 0 && (
            <View style={{ backgroundColor: '#DC2626', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 1 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#fff' }}>{overdueCount} overdue</Text>
            </View>
          )}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: cfg.color }}>Pay</Text>
          <Ionicons name="chevron-forward" size={13} color={cfg.color} />
        </View>
      </Pressable>

      {/* Details toggle */}
      <Pressable
        onPress={onToggle}
        style={({ pressed }) => [{
          flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
          paddingHorizontal: 14, paddingVertical: 11,
          borderBottomWidth: expanded ? 1 : 0, borderBottomColor: BRAND.border,
        }, pressed && { backgroundColor: BRAND.bg }]}
      >
        <Text style={{ fontSize: 12, color: BRAND.muted }}>Lease details & landlord info</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <Text style={{ fontSize: 13, color: BRAND.primary, fontWeight: '600' }}>{expanded ? 'Hide' : 'Details'}</Text>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.primary} />
        </View>
      </Pressable>

      {/* Expanded section */}
      {expanded && (
        <View>
          {[
            ['Start Date',       fmtDate(lease.startDate)],
            ['End Date',         fmtDate(lease.endDate)],
            ['Monthly Rent',     fmtCurrency(lease.rentAmount)],
            ['Security Deposit', fmtCurrency(lease.depositAmount)],
            ['Payment Due',      `Day ${lease.paymentDay} of each month`],
            ['Status',           lease.status],
          ].map(([label, value]) => (
            <View key={label} style={{
              flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
              paddingVertical: 11, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: BRAND.border,
            }}>
              <Text style={{ fontSize: 12, color: BRAND.muted }}>{label}</Text>
              <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.text, textTransform: 'capitalize', maxWidth: '55%', textAlign: 'right' }}>{value}</Text>
            </View>
          ))}

          {lease.landlord && (
            <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: BRAND.border }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 8 }}>Landlord</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.primary }}>{lease.landlord.name?.[0]?.toUpperCase()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: BRAND.text }}>{lease.landlord.name}</Text>
                  {lease.landlord.phone ? <Text style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>{lease.landlord.phone}</Text> : null}
                  {lease.landlord.email ? <Text style={{ fontSize: 12, color: BRAND.muted }}>{lease.landlord.email}</Text> : null}
                </View>
              </View>
            </View>
          )}

          {lease.application && (
            <View style={{ backgroundColor: '#ECFDF5', padding: 14, borderBottomWidth: 1, borderBottomColor: '#A7F3D0' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Ionicons name="checkmark-circle" size={14} color="#059669" />
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#065F46' }}>Application Approved</Text>
              </View>
              {[
                ['Applied',     fmtDate(lease.application.createdAt)],
                lease.application.moveInDate       && ['Move-in',    fmtDate(lease.application.moveInDate)],
                lease.application.employmentStatus && ['Employment', lease.application.employmentStatus],
              ].filter(Boolean).map(([label, value]) => (
                <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
                  <Text style={{ fontSize: 11, color: '#6B7280' }}>{label}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#065F46', textTransform: 'capitalize' }}>{value}</Text>
                </View>
              ))}
              {lease.application.message ? (
                <View style={{ marginTop: 10, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.7)', borderWidth: 1, borderColor: 'rgba(167,243,208,0.7)' }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Your Message</Text>
                  <Text style={{ fontSize: 13, color: '#065F46', lineHeight: 18 }}>{lease.application.message}</Text>
                </View>
              ) : null}
            </View>
          )}

          {lease.terms ? (
            <View style={{ padding: 14, borderBottomWidth: 1, borderBottomColor: BRAND.border }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>Lease Terms</Text>
              <Text style={{ fontSize: 13, color: BRAND.muted, lineHeight: 19 }}>{lease.terms}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={onTerminate}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 7, justifyContent: 'center', padding: 14, backgroundColor: '#FEF2F2' }}
          >
            <Ionicons name="close-circle-outline" size={15} color={BRAND.danger} />
            <Text style={{ fontSize: 13, fontWeight: '600', color: BRAND.danger }}>Request Lease Termination</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MyLease({ navigation }) {
  const insets = useSafeAreaInsets();
  const [allLeases, setAllLeases]           = useState([]);
  const [applications, setApps]             = useState([]);
  const [payments, setPayments]             = useState([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [showTerminate, setShowTerminate]   = useState(false);
  const [terminatingLease, setTermLease]    = useState(null);
  const [reason, setReason]                 = useState('');
  const [terminating, setTerminating]       = useState(false);
  const [expandedApps, setExpandedApps]     = useState([]);
  const [expandedLeases, setExpandedLeases] = useState([]);

  const toggleApp   = id => setExpandedApps(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  const toggleLease = id => setExpandedLeases(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const load = async () => {
    try {
      const [al, a, p] = await Promise.all([
        api.get('/leases/my/all'),
        api.get('/applications/sent'),
        api.get('/payments/my'),
      ]);
      setAllLeases(al.data.data || []);
      setApps(a.data.data || []);
      setPayments(p.data.data || []);
    } catch {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleTerminate = (lease) => {
    setTermLease(lease);
    Alert.alert(
      'Terminate Lease',
      `Terminate the lease for "${lease.property?.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => setShowTerminate(true) },
      ]
    );
  };

  const confirmTerminate = async () => {
    if (!reason.trim()) return Alert.alert('Required', 'Please provide a reason for termination.');
    setTerminating(true);
    try {
      await api.put(`/leases/${terminatingLease._id}/terminate`, { reason: reason.trim() });
      Alert.alert('Lease Terminated', 'Your lease has been terminated.');
      setShowTerminate(false);
      setReason('');
      setTermLease(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to terminate lease.');
    }
    setTerminating(false);
  };

  if (loading) return <ActivityIndicator color={BRAND.primary} style={{ flex: 1, marginTop: insets.top + 40 }} />;

  const activeLeases  = allLeases.filter(l => l.status === 'active');
  const leaseAppIds   = new Set(allLeases.map(l => (l.application?._id || l.application)?.toString()).filter(Boolean));
  const otherApps     = applications.filter(a => !leaseAppIds.has(a._id?.toString()));
  const anySoonExpiring = activeLeases.some(l => {
    const d = Math.ceil((new Date(l.endDate) - new Date()) / 86400000);
    return d > 0 && d <= 30;
  });

  // ── No active lease ─────────────────────────────────────────────────────────
  if (activeLeases.length === 0) return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BRAND.bg }}
      contentContainerStyle={{ paddingTop: insets.top }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
    >
      {otherApps.length === 0 ? (
        <View style={{ alignItems: 'center', padding: 40, paddingTop: 60 }}>
          <Ionicons name="document-text-outline" size={52} color={BRAND.border} />
          <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.text, marginTop: 14 }}>No Active Lease</Text>
          <Text style={{ color: BRAND.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
            Browse available properties and apply to start your tenancy.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('Properties')}
            style={{ backgroundColor: BRAND.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 20, paddingHorizontal: 32 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Browse Properties</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND.text, marginBottom: 14 }}>My Applications</Text>
          {otherApps.map(app => {
            const sc = STATUS_COLORS[app.status] || { bg: BRAND.border, text: BRAND.muted };
            return (
              <View key={app._id} style={{ backgroundColor: BRAND.surface, borderRadius: 13, padding: 16, marginBottom: 10, ...BRAND.shadow }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <Text style={{ fontSize: 15, fontWeight: '600', color: BRAND.text, flex: 1, marginRight: 10 }} numberOfLines={2}>
                    {app.property?.title || 'Property'}
                  </Text>
                  <View style={{ paddingHorizontal: 9, paddingVertical: 3, borderRadius: 6, backgroundColor: sc.bg }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: sc.text, textTransform: 'capitalize' }}>{app.status}</Text>
                  </View>
                </View>
                {app.property?.address && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 }}>
                    <Ionicons name="location-outline" size={12} color={BRAND.muted} />
                    <Text style={{ fontSize: 12, color: BRAND.muted }}>
                      {[app.property.address.area, app.property.address.city].filter(Boolean).join(', ')}
                    </Text>
                  </View>
                )}
                {app.property?.rent?.amount ? (
                  <Text style={{ fontSize: 13, color: BRAND.primary, fontWeight: '600', marginBottom: 6 }}>
                    {fmtCurrency(app.property.rent.amount)}/mo
                  </Text>
                ) : null}
                <Text style={{ fontSize: 11, color: BRAND.muted }}>Applied {fmtDate(app.createdAt)}</Text>
                {app.status === 'pending' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8, backgroundColor: '#FFFBEB', borderRadius: 7, padding: 8 }}>
                    <Ionicons name="time-outline" size={12} color={BRAND.warn} />
                    <Text style={{ fontSize: 11, color: BRAND.warn, fontWeight: '600' }}>Awaiting landlord review</Text>
                  </View>
                )}
                {app.status === 'rejected' && app.rejectionReason ? (
                  <View style={{ backgroundColor: '#FEE2E2', borderRadius: 8, padding: 10, marginTop: 8 }}>
                    <Text style={{ fontSize: 12, color: '#991B1B', fontWeight: '500' }}>Reason: {app.rejectionReason}</Text>
                  </View>
                ) : null}
              </View>
            );
          })}
          <TouchableOpacity
            onPress={() => navigation.navigate('Properties')}
            style={{ backgroundColor: BRAND.primary, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Browse More Properties</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  // ── Has active leases ────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: BRAND.bg }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: 28 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
    >
      {/* Expiry warning */}
      {anySoonExpiring && (
        <View style={{ backgroundColor: '#FEF3C7', borderBottomWidth: 1, borderBottomColor: '#FDE68A', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Ionicons name="warning-outline" size={16} color="#92400E" />
          <Text style={{ fontSize: 13, color: '#92400E', flex: 1 }}>
            One or more leases expire soon. Contact your landlord about renewal.
          </Text>
        </View>
      )}

      {/* Section header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginHorizontal: 16, marginTop: 16, marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND.text }}>Active Leases</Text>
        <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, backgroundColor: '#D1FAE5' }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#065F46' }}>{activeLeases.length}</Text>
        </View>
      </View>

      {/* All active leases — equal weight */}
      {activeLeases.map(lease => (
        <LeaseCard
          key={lease._id}
          lease={lease}
          payments={payments}
          expanded={expandedLeases.includes(lease._id)}
          onToggle={() => toggleLease(lease._id)}
          onNavigate={() => navigation.navigate('Payments')}
          onTerminate={() => handleTerminate(lease)}
        />
      ))}

      {/* Other applications (pending/rejected, no active lease) */}
      {otherApps.length > 0 && (
        <>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 8, marginBottom: 12, gap: 8 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: BRAND.border }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Other Applications</Text>
            <View style={{ flex: 1, height: 1, backgroundColor: BRAND.border }} />
          </View>
          {otherApps.map(app => {
            const sc   = STATUS_COLORS[app.status] || { bg: BRAND.border, text: BRAND.muted };
            const prop = app.property;
            const addr = [prop?.address?.area, prop?.address?.city].filter(Boolean).join(', ');
            const isExpanded = expandedApps.includes(app._id);
            const appDetails = [
              app.moveInDate       && ['Requested Move-in', fmtDate(app.moveInDate)],
              app.employmentStatus && ['Employment',        app.employmentStatus],
              app.monthlyIncome    && ['Monthly Income',    fmtCurrency(app.monthlyIncome)],
            ].filter(Boolean);

            return (
              <Pressable
                key={app._id}
                onPress={() => toggleApp(app._id)}
                style={({ pressed }) => [{
                  backgroundColor: BRAND.surface, borderRadius: 14, marginHorizontal: 16,
                  marginBottom: 10, overflow: 'hidden', ...BRAND.shadow,
                }, pressed && { opacity: 0.88, transform: [{ scale: 0.985 }] }]}
              >
                <View style={{ flexDirection: 'row' }}>
                  <View style={{ width: 92, height: 92, backgroundColor: BRAND.bg }}>
                    {prop?.images?.[0] ? (
                      <Image source={{ uri: prop.images[0] }} style={{ width: 92, height: 92 }} resizeMode="cover" />
                    ) : (
                      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <Ionicons name="business-outline" size={26} color={BRAND.border} />
                      </View>
                    )}
                  </View>
                  <View style={{ flex: 1, padding: 12 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.text, flex: 1, marginRight: 8 }} numberOfLines={2}>
                        {prop?.title || 'Property'}
                      </Text>
                      <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: sc.bg }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: sc.text, textTransform: 'capitalize' }}>{app.status}</Text>
                      </View>
                    </View>
                    {addr ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 5 }}>
                        <Ionicons name="location-outline" size={11} color={BRAND.muted} />
                        <Text style={{ fontSize: 11, color: BRAND.muted }} numberOfLines={1}>{addr}</Text>
                      </View>
                    ) : null}
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      {prop?.rent?.amount ? <Text style={{ fontSize: 13, fontWeight: '700', color: BRAND.primary }}>{fmtCurrency(prop.rent.amount)}/mo</Text> : null}
                      {prop?.type ? <Text style={{ fontSize: 11, color: BRAND.muted, textTransform: 'capitalize' }}>{prop.type}</Text> : null}
                    </View>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderTopWidth: 1, borderTopColor: BRAND.border }}>
                  <Text style={{ fontSize: 11, color: BRAND.muted }}>Applied {fmtDate(app.createdAt)}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Text style={{ fontSize: 12, color: BRAND.primary, fontWeight: '600' }}>{isExpanded ? 'Less' : 'Details'}</Text>
                    <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.primary} />
                  </View>
                </View>

                {isExpanded && (
                  <View style={{ borderTopWidth: 1, borderTopColor: BRAND.border, padding: 14 }}>
                    {appDetails.length > 0 && appDetails.map(([label, value]) => (
                      <View key={label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: BRAND.border }}>
                        <Text style={{ fontSize: 12, color: BRAND.muted }}>{label}</Text>
                        <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.text, textTransform: 'capitalize', maxWidth: '55%', textAlign: 'right' }}>{value}</Text>
                      </View>
                    ))}
                    {app.message ? (
                      <View style={{ marginTop: appDetails.length > 0 ? 12 : 0, backgroundColor: BRAND.bg, borderRadius: 8, padding: 10, borderWidth: 1, borderColor: BRAND.border }}>
                        <Text style={{ fontSize: 10, fontWeight: '700', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Your Message</Text>
                        <Text style={{ fontSize: 13, color: BRAND.text, lineHeight: 18 }}>{app.message}</Text>
                      </View>
                    ) : null}
                  </View>
                )}

                {app.status === 'pending' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FFFBEB', padding: 10, borderTopWidth: 1, borderTopColor: '#FDE68A' }}>
                    <Ionicons name="time-outline" size={13} color={BRAND.warn} />
                    <Text style={{ fontSize: 12, color: BRAND.warn, fontWeight: '600' }}>Awaiting landlord review</Text>
                  </View>
                )}
                {app.status === 'rejected' && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', padding: 10, borderTopWidth: 1, borderTopColor: '#FECACA' }}>
                    <Ionicons name="close-circle-outline" size={13} color={BRAND.danger} />
                    <Text style={{ fontSize: 12, color: BRAND.danger, fontWeight: '600', flex: 1 }}>
                      {app.rejectionReason ? `Reason: ${app.rejectionReason}` : 'Application not accepted'}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </>
      )}

      {/* Termination modal */}
      <Modal visible={showTerminate} transparent animationType="slide" onRequestClose={() => setShowTerminate(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: BRAND.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.danger }}>Terminate Lease</Text>
              <TouchableOpacity onPress={() => setShowTerminate(false)}>
                <Ionicons name="close" size={22} color={BRAND.muted} />
              </TouchableOpacity>
            </View>
            {terminatingLease && (
              <Text style={{ fontSize: 13, color: BRAND.muted, marginBottom: 12 }}>
                Property: <Text style={{ fontWeight: '600', color: BRAND.text }}>{terminatingLease.property?.title}</Text>
              </Text>
            )}
            <View style={{ backgroundColor: '#FEF2F2', borderRadius: 10, padding: 12, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                <Ionicons name="warning-outline" size={16} color={BRAND.danger} style={{ marginTop: 1 }} />
                <Text style={{ fontSize: 13, color: BRAND.danger, flex: 1, lineHeight: 18 }}>
                  Terminating your lease is permanent. The property will be marked as available and your tenancy ends immediately.
                </Text>
              </View>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
              Reason for Termination *
            </Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. Relocating for work, found alternative accommodation..."
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: BRAND.bg, borderRadius: 9, borderWidth: 1, borderColor: BRAND.border,
                padding: 12, fontSize: 14, color: BRAND.text, height: 100, textAlignVertical: 'top', marginBottom: 18,
              }}
            />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                onPress={() => setShowTerminate(false)}
                style={{ flex: 1, borderRadius: 12, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.bg }}
              >
                <Text style={{ color: BRAND.muted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={confirmTerminate}
                disabled={terminating}
                style={{ flex: 2, backgroundColor: BRAND.danger, borderRadius: 12, padding: 14, alignItems: 'center', opacity: terminating ? 0.7 : 1 }}
              >
                {terminating
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>Confirm Termination</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
