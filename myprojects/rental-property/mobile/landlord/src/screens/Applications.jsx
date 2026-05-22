import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtDate } from '../../../shared/formatters';

const FILTERS = ['all', 'pending', 'approved', 'rejected'];

export default function Applications() {
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');
  const [approveModal, setApproveModal] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [leaseDates, setLeaseDates] = useState({ startDate: '', endDate: '' });
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = () => api.get('/applications/received').then(r => setApplications(r.data.data)).catch(() => {}).finally(() => setLoading(false));
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const filtered = filter === 'all' ? applications : applications.filter(a => a.status === filter);
  const pendingCount = applications.filter(a => a.status === 'pending').length;

  const openApprove = (app) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    setLeaseDates({ startDate: today, endDate: nextYear });
    setApproveModal(app);
  };

  const handleApprove = async () => {
    if (!leaseDates.startDate || !leaseDates.endDate) return Alert.alert('Error', 'Start and end dates are required');
    setProcessing(true);
    try {
      await api.put(`/applications/${approveModal._id}/approve`, leaseDates);
      Alert.alert('Approved', 'Application approved and lease created successfully.');
      setApproveModal(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to approve');
    }
    setProcessing(false);
  };

  const handleReject = async () => {
    setProcessing(true);
    try {
      await api.put(`/applications/${rejectModal._id}/reject`, { reason: rejectReason });
      setRejectModal(null);
      setRejectReason('');
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to reject');
    }
    setProcessing(false);
  };

  const renderItem = ({ item: app }) => {
    const s = STATUS_COLORS[app.status] || STATUS_COLORS.pending;
    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{app.tenant?.name?.[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{app.tenant?.name}</Text>
            <Text style={styles.email}>{app.tenant?.email}</Text>
            {app.tenant?.phone && <Text style={styles.phone}><Ionicons name="call-outline" size={11} /> {app.tenant.phone}</Text>}
          </View>
          <View style={[styles.badge, { backgroundColor: s.bg }]}>
            <Text style={[styles.badgeText, { color: s.text }]}>{app.status}</Text>
          </View>
        </View>

        <View style={styles.propertyRow}>
          <Ionicons name="business-outline" size={14} color={BRAND.muted} />
          <Text style={styles.propertyName} numberOfLines={1}>{app.property?.title}</Text>
        </View>

        <View style={styles.detailsRow}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Applied</Text>
            <Text style={styles.detailVal}>{fmtDate(app.createdAt)}</Text>
          </View>
          {app.moveInDate && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Move-in</Text>
              <Text style={styles.detailVal}>{fmtDate(app.moveInDate)}</Text>
            </View>
          )}
          {app.employmentStatus && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Employment</Text>
              <Text style={styles.detailVal} style={{ textTransform: 'capitalize' }}>{app.employmentStatus}</Text>
            </View>
          )}
        </View>

        {app.message ? (
          <View style={styles.messageBox}>
            <Ionicons name="chatbubble-outline" size={13} color={BRAND.secondary} />
            <Text style={styles.messageText} numberOfLines={2}>"{app.message}"</Text>
          </View>
        ) : null}

        {app.status === 'rejected' && app.rejectionReason ? (
          <View style={[styles.messageBox, { backgroundColor: '#FEF2F2' }]}>
            <Ionicons name="close-circle-outline" size={13} color={BRAND.danger} />
            <Text style={[styles.messageText, { color: BRAND.danger }]}>{app.rejectionReason}</Text>
          </View>
        ) : null}

        {app.status === 'pending' && (
          <View style={styles.actionRow}>
            <TouchableOpacity onPress={() => openApprove(app)} style={[styles.actionBtn, { backgroundColor: BRAND.secondary }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#fff" />
              <Text style={styles.actionBtnText}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setRejectModal(app); setRejectReason(''); }} style={styles.rejectBtn}>
              <Ionicons name="close-circle-outline" size={16} color={BRAND.danger} />
              <Text style={[styles.actionBtnText, { color: BRAND.danger }]}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg, paddingTop: insets.top }}>
      {pendingCount > 0 && (
        <View style={styles.alertBanner}>
          <Ionicons name="time-outline" size={16} color="#92400E" />
          <Text style={styles.alertText}>{pendingCount} application{pendingCount > 1 ? 's' : ''} awaiting review</Text>
        </View>
      )}

      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)}
            style={[styles.filterBtn, filter === f && styles.filterActive]}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={i => i._id}
        contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        ListEmptyComponent={!loading && (
          <View style={{ alignItems: 'center', marginTop: 50 }}>
            <Ionicons name="document-text-outline" size={48} color={BRAND.border} />
            <Text style={{ color: BRAND.muted, marginTop: 12, fontSize: 15 }}>No {filter === 'all' ? '' : filter} applications</Text>
          </View>
        )}
      />

      {/* Approve modal */}
      <Modal visible={!!approveModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Approve Application</Text>
            <Text style={styles.modalSub}>Set lease dates for <Text style={{ fontWeight: '700', color: BRAND.text }}>{approveModal?.tenant?.name}</Text></Text>

            <View style={styles.dateRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TextInput
                  value={leaseDates.startDate}
                  onChangeText={v => setLeaseDates(d => ({ ...d, startDate: v }))}
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                  keyboardType="numeric"
                />
              </View>
              <Ionicons name="arrow-forward" size={18} color={BRAND.muted} style={{ marginTop: 28 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.dateLabel}>End Date</Text>
                <TextInput
                  value={leaseDates.endDate}
                  onChangeText={v => setLeaseDates(d => ({ ...d, endDate: v }))}
                  placeholder="YYYY-MM-DD"
                  style={styles.dateInput}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={15} color={BRAND.secondary} />
              <Text style={styles.infoText}>Approving will create a lease and mark the property as occupied. All other pending applications will be automatically rejected.</Text>
            </View>

            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setApproveModal(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleApprove} disabled={processing} style={[styles.confirmBtn, { backgroundColor: BRAND.secondary }]}>
                {processing ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.confirmText}>Approve & Create Lease</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Reject modal */}
      <Modal visible={!!rejectModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Reject Application</Text>
            <Text style={styles.modalSub}>Provide a reason for <Text style={{ fontWeight: '700', color: BRAND.text }}>{rejectModal?.tenant?.name}</Text> (optional)</Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Property already rented, income requirements not met..."
              multiline
              numberOfLines={3}
              style={[styles.dateInput, { height: 80, textAlignVertical: 'top', marginTop: 12 }]}
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity onPress={() => setRejectModal(null)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleReject} disabled={processing} style={[styles.confirmBtn, { backgroundColor: BRAND.danger }]}>
                {processing ? <ActivityIndicator color="#fff" size="small" /> : (
                  <>
                    <Ionicons name="close" size={16} color="#fff" />
                    <Text style={styles.confirmText}>Reject</Text>
                  </>
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
  alertBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#FEF3C7', padding: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#FDE68A' },
  alertText: { fontSize: 13, fontWeight: '600', color: '#92400E' },
  filterRow: { flexDirection: 'row', backgroundColor: BRAND.surface, paddingHorizontal: 12, paddingVertical: 10, gap: 8, borderBottomWidth: 1, borderBottomColor: BRAND.border },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5, borderColor: BRAND.border },
  filterActive: { backgroundColor: BRAND.primary, borderColor: BRAND.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: BRAND.muted },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: BRAND.surface, borderRadius: 14, padding: 16, ...BRAND.shadow },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: BRAND.secondary + '22', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: BRAND.secondary },
  name: { fontSize: 15, fontWeight: '700', color: BRAND.text },
  email: { fontSize: 12, color: BRAND.muted, marginTop: 2 },
  phone: { fontSize: 12, color: BRAND.muted, marginTop: 1 },
  badge: { borderRadius: 7, paddingHorizontal: 9, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  propertyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: BRAND.bg, borderRadius: 8, padding: 8, marginBottom: 10 },
  propertyName: { fontSize: 13, color: BRAND.text, fontWeight: '500', flex: 1 },
  detailsRow: { flexDirection: 'row', gap: 12, marginBottom: 10 },
  detailItem: { flex: 1 },
  detailLabel: { fontSize: 11, color: BRAND.muted, marginBottom: 2 },
  detailVal: { fontSize: 12, fontWeight: '600', color: BRAND.text, textTransform: 'capitalize' },
  messageBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, backgroundColor: BRAND.secondary + '12', borderRadius: 8, padding: 10, marginBottom: 10 },
  messageText: { fontSize: 12, color: BRAND.muted, flex: 1, lineHeight: 17 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 10, borderRadius: 10, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA' },
  actionBtnText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modal: { backgroundColor: BRAND.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: BRAND.text, marginBottom: 4 },
  modalSub: { fontSize: 13, color: BRAND.muted, marginBottom: 16 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dateLabel: { fontSize: 12, fontWeight: '600', color: BRAND.muted, marginBottom: 6 },
  dateInput: { backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1.5, borderColor: BRAND.border, padding: 11, fontSize: 14, color: BRAND.text },
  infoBox: { flexDirection: 'row', gap: 8, backgroundColor: BRAND.secondary + '12', borderRadius: 10, padding: 12, marginTop: 14 },
  infoText: { fontSize: 12, color: BRAND.muted, flex: 1, lineHeight: 17 },
  modalBtns: { flexDirection: 'row', gap: 10, marginTop: 18 },
  cancelBtn: { flex: 1, padding: 13, borderRadius: 11, backgroundColor: BRAND.bg, alignItems: 'center', borderWidth: 1, borderColor: BRAND.border },
  cancelText: { fontSize: 14, fontWeight: '600', color: BRAND.text },
  confirmBtn: { flex: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, padding: 13, borderRadius: 11 },
  confirmText: { fontSize: 14, fontWeight: '700', color: '#fff' },
});
