import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtCurrency, fmtDate } from '../../../shared/formatters';

export default function Tenants() {
  const insets = useSafeAreaInsets();
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [terminateModal, setTerminateModal] = useState(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [tab, setTab] = useState('active');

  const load = () => api.get('/leases/landlord').then(r => setLeases(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const active = leases.filter(l => l.status === 'active');
  const past = leases.filter(l => l.status !== 'active');
  const displayed = tab === 'active' ? active : past;

  const handleTerminate = async () => {
    if (!reason.trim()) return Alert.alert('Error', 'Please provide a termination reason');
    setProcessing(true);
    try {
      await api.put(`/leases/${terminateModal._id}/terminate`, { reason });
      Alert.alert('Terminated', 'Lease has been terminated.');
      setTerminateModal(null);
      setReason('');
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to terminate lease');
    }
    setProcessing(false);
  };

  const daysLeft = (endDate) => Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24));

  const renderItem = ({ item: lease }) => {
    const s = STATUS_COLORS[lease.status] || STATUS_COLORS.active;
    const days = daysLeft(lease.endDate);
    const expiring = lease.status === 'active' && days > 0 && days <= 30;

    return (
      <View style={[styles.card, lease.status !== 'active' && styles.cardDimmed]}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{lease.tenant?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tenantName}>{lease.tenant?.name}</Text>
            <Text style={styles.tenantEmail}>{lease.tenant?.email}</Text>
            {lease.tenant?.phone && (
              <Text style={styles.tenantPhone}><Ionicons name="call-outline" size={11} /> {lease.tenant.phone}</Text>
            )}
          </View>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{lease.status}</Text>
          </View>
        </View>

        <View style={styles.propertyRow}>
          <Ionicons name="business-outline" size={14} color={BRAND.muted} />
          <Text style={styles.propertyName} numberOfLines={1}>{lease.property?.title}</Text>
        </View>

        <View style={styles.leaseDetails}>
          <View style={styles.leaseDetailItem}>
            <Text style={styles.leaseDetailLabel}>Monthly Rent</Text>
            <Text style={styles.leaseDetailVal}>{fmtCurrency(lease.rentAmount)}</Text>
          </View>
          <View style={styles.leaseDetailItem}>
            <Text style={styles.leaseDetailLabel}>Start</Text>
            <Text style={styles.leaseDetailVal}>{fmtDate(lease.startDate)}</Text>
          </View>
          <View style={styles.leaseDetailItem}>
            <Text style={styles.leaseDetailLabel}>End</Text>
            <Text style={styles.leaseDetailVal}>{fmtDate(lease.endDate)}</Text>
          </View>
        </View>

        {expiring && (
          <View style={styles.expiryBanner}>
            <Ionicons name="warning-outline" size={14} color="#92400E" />
            <Text style={styles.expiryText}>Expiring in {days} day{days !== 1 ? 's' : ''}</Text>
          </View>
        )}

        {lease.status === 'active' && (
          <TouchableOpacity onPress={() => { setTerminateModal(lease); setReason(''); }} style={styles.terminateBtn}>
            <Ionicons name="close-circle-outline" size={15} color={BRAND.danger} />
            <Text style={styles.terminateText}>Terminate Lease</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerStat}>
          <Text style={styles.headerStatVal}>{active.length}</Text>
          <Text style={styles.headerStatLabel}>Active</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.headerStat}>
          <Text style={styles.headerStatVal}>{past.length}</Text>
          <Text style={styles.headerStatLabel}>Past</Text>
        </View>
        <View style={styles.headerDivider} />
        <View style={styles.headerStat}>
          <Text style={styles.headerStatVal}>{leases.length}</Text>
          <Text style={styles.headerStatLabel}>Total</Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity onPress={() => setTab('active')} style={[styles.tab, tab === 'active' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'active' && styles.tabTextActive]}>Active Tenants ({active.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('past')} style={[styles.tab, tab === 'past' && styles.tabActive]}>
          <Text style={[styles.tabText, tab === 'past' && styles.tabTextActive]}>Past Tenants ({past.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayed}
        renderItem={renderItem}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        ListEmptyComponent={!loading && (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="people-outline" size={48} color={BRAND.border} />
            <Text style={{ color: BRAND.muted, marginTop: 12, fontSize: 15 }}>No {tab} tenants</Text>
          </View>
        )}
      />

      <Modal visible={!!terminateModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <View style={styles.modalIconWrap}>
              <Ionicons name="warning-outline" size={28} color={BRAND.danger} />
            </View>
            <Text style={styles.modalTitle}>Terminate Lease</Text>
            <Text style={styles.modalSub}>
              You are about to terminate the lease for{' '}
              <Text style={{ fontWeight: '700', color: BRAND.text }}>{terminateModal?.tenant?.name}</Text>
              {' '}at{' '}
              <Text style={{ fontWeight: '600', color: BRAND.text }}>{terminateModal?.property?.title}</Text>.
            </Text>
            <Text style={styles.modalWarning}>This action cannot be undone. The property will be marked as available.</Text>

            <Text style={styles.reasonLabel}>Reason for Termination *</Text>
            <TextInput
              value={reason}
              onChangeText={setReason}
              placeholder="e.g. End of lease term, lease violation, mutual agreement..."
              multiline
              numberOfLines={3}
              style={styles.reasonInput}
            />

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setTerminateModal(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Keep Lease</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleTerminate} disabled={processing} style={[styles.confirmBtn, { backgroundColor: BRAND.danger }]}>
                {processing ? <ActivityIndicator color="#fff" size="small" /> : (
                  <Text style={styles.confirmText}>Terminate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', backgroundColor: BRAND.primary, paddingVertical: 16, paddingHorizontal: 24 },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatVal: { fontSize: 24, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  headerDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginHorizontal: 8 },
  tabRow: { flexDirection: 'row', backgroundColor: BRAND.surface, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: BRAND.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: BRAND.muted },
  tabTextActive: { color: BRAND.primary },
  card: { backgroundColor: BRAND.surface, borderRadius: 14, padding: 16, ...BRAND.shadow },
  cardDimmed: { opacity: 0.7 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: BRAND.secondary + '22', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: BRAND.secondary },
  tenantName: { fontSize: 15, fontWeight: '700', color: BRAND.text },
  tenantEmail: { fontSize: 12, color: BRAND.muted, marginTop: 2 },
  tenantPhone: { fontSize: 12, color: BRAND.muted, marginTop: 1 },
  badge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BRAND.bg, borderRadius: 8, padding: 8, marginBottom: 10 },
  propertyName: { fontSize: 13, color: BRAND.text, fontWeight: '500', flex: 1 },
  leaseDetails: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  leaseDetailItem: { flex: 1, backgroundColor: BRAND.bg, borderRadius: 8, padding: 8 },
  leaseDetailLabel: { fontSize: 10, color: BRAND.muted, marginBottom: 2, fontWeight: '600' },
  leaseDetailVal: { fontSize: 12, fontWeight: '700', color: BRAND.text },
  expiryBanner: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF3C7', borderRadius: 8, padding: 8, marginBottom: 10 },
  expiryText: { fontSize: 12, fontWeight: '600', color: '#92400E' },
  terminateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#FECACA' },
  terminateText: { fontSize: 13, fontWeight: '700', color: BRAND.danger },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: BRAND.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalIconWrap: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#FEF2F2', justifyContent: 'center', alignItems: 'center', marginBottom: 12, alignSelf: 'center' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: BRAND.text, textAlign: 'center', marginBottom: 8 },
  modalSub: { fontSize: 13, color: BRAND.muted, textAlign: 'center', lineHeight: 20 },
  modalWarning: { fontSize: 12, color: BRAND.danger, textAlign: 'center', marginTop: 8, marginBottom: 16 },
  reasonLabel: { fontSize: 13, fontWeight: '600', color: BRAND.text, marginBottom: 6 },
  reasonInput: { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1.5, borderColor: BRAND.border, padding: 11, fontSize: 14, color: BRAND.text, height: 80, textAlignVertical: 'top' },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, padding: 13, borderRadius: 11, backgroundColor: BRAND.bg, alignItems: 'center', borderWidth: 1, borderColor: BRAND.border },
  cancelText: { fontSize: 14, fontWeight: '600', color: BRAND.text },
  confirmBtn: { flex: 1, padding: 13, borderRadius: 11, alignItems: 'center' },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
