import { useState, useCallback } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Modal,
         TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtDate } from '../../../shared/formatters';

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

const STATUS_OPTIONS = [
  { id: 'open',        label: 'Open',        color: BRAND.danger },
  { id: 'in_progress', label: 'In Progress',  color: BRAND.warn },
  { id: 'resolved',    label: 'Resolved',     color: BRAND.success },
  { id: 'closed',      label: 'Closed',       color: BRAND.muted },
];

const PRIORITY_COLOR = {
  low: BRAND.secondary, medium: BRAND.accent, high: '#F97316', urgent: BRAND.danger,
};

const CAT_ICON = {
  plumbing: 'water-outline', electrical: 'flash-outline', structural: 'home-outline',
  appliance: 'hardware-chip-outline', pest: 'bug-outline', other: 'build-outline',
};

function filterKey(f) {
  if (f === 'In Progress') return 'in_progress';
  return f.toLowerCase();
}

export default function Maintenance() {
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('All');
  const [expanded, setExpanded]     = useState(null);  // id of expanded card

  // Status update modal
  const [statusModal, setStatusModal]   = useState(null);
  const [newStatus, setNewStatus]       = useState('');
  const [updatingStatus, setUpdating]   = useState(false);

  // Note modal
  const [noteModal, setNoteModal]   = useState(null);
  const [noteText, setNoteText]     = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const load = async () => {
    try {
      const r = await api.get('/maintenance/landlord');
      setRequests(r.data.data || []);
    } catch {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const openStatusModal = (req) => {
    setNewStatus(req.status);
    setStatusModal(req);
  };

  const handleStatusUpdate = async () => {
    if (!newStatus || newStatus === statusModal.status) { setStatusModal(null); return; }
    setUpdating(true);
    try {
      await api.put(`/maintenance/${statusModal._id}`, { status: newStatus });
      setStatusModal(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
    }
    setUpdating(false);
  };

  const openNoteModal = (req) => {
    setNoteText(req.landlordNote || '');
    setNoteModal(req);
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await api.put(`/maintenance/${noteModal._id}`, { landlordNote: noteText.trim() });
      setNoteModal(null);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save note.');
    }
    setSavingNote(false);
  };

  const open       = requests.filter(r => r.status === 'open');
  const inProgress = requests.filter(r => r.status === 'in_progress');
  const resolved   = requests.filter(r => r.status === 'resolved');

  const filtered = filter === 'All'
    ? requests
    : requests.filter(r => r.status === filterKey(filter));

  const renderItem = ({ item: r }) => {
    const sc     = STATUS_COLORS[r.status] || { bg: '#F3F4F6', text: BRAND.muted };
    const pri    = PRIORITY_COLOR[r.priority] || BRAND.muted;
    const isOpen = expanded === r._id;

    return (
      <View style={{
        backgroundColor: BRAND.surface, borderRadius: 14, marginBottom: 10,
        ...BRAND.shadow, overflow: 'hidden',
        borderLeftWidth: 4, borderLeftColor: pri,
      }}>
        {/* Header row — always visible */}
        <TouchableOpacity
          onPress={() => setExpanded(isOpen ? null : r._id)}
          activeOpacity={0.75}
          style={{ padding: 14 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            {/* Category icon */}
            <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: BRAND.primary + '12',
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Ionicons name={CAT_ICON[r.category] || 'build-outline'} size={16} color={BRAND.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.text }} numberOfLines={isOpen ? undefined : 1}>
                {r.title}
              </Text>
              {/* Tenant + property */}
              <Text style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }} numberOfLines={1}>
                {r.tenant?.name}
                {r.property?.title ? ` · ${r.property.title}` : ''}
              </Text>
            </View>

            <View style={{ alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: sc.bg }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: sc.text, textTransform: 'capitalize' }}>
                  {r.status.replace('_', ' ')}
                </Text>
              </View>
              <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10, backgroundColor: pri + '18' }}>
                <Text style={{ fontSize: 9, fontWeight: '700', color: pri, textTransform: 'uppercase' }}>
                  {r.priority}
                </Text>
              </View>
            </View>
          </View>

          {/* Description — always show 2 lines, full when expanded */}
          <Text style={{ fontSize: 13, color: BRAND.text, marginTop: 10, lineHeight: 19 }}
            numberOfLines={isOpen ? undefined : 2}>
            {r.description}
          </Text>

          {/* Meta row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 11, color: BRAND.muted }}>
              {r.category} · {fmtDate(r.createdAt)}
            </Text>
            <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.muted} />
          </View>
        </TouchableOpacity>

        {/* Expanded section */}
        {isOpen && (
          <View style={{ borderTopWidth: 1, borderTopColor: BRAND.border }}>

            {/* Tenant contact */}
            {r.tenant && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, paddingBottom: 10 }}>
                <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: BRAND.secondary + '20',
                  alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: BRAND.secondary }}>
                    {r.tenant.name?.[0]?.toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: BRAND.text }}>{r.tenant.name}</Text>
                  <Text style={{ fontSize: 12, color: BRAND.muted }}>{r.tenant.phone || r.tenant.email}</Text>
                </View>
              </View>
            )}

            {/* Resolve dates */}
            {r.resolvedAt && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 8 }}>
                <Text style={{ fontSize: 11, color: BRAND.success }}>Resolved {fmtDate(r.resolvedAt)}</Text>
              </View>
            )}

            {/* Landlord note */}
            <View style={{ marginHorizontal: 14, marginBottom: 12 }}>
              {r.landlordNote ? (
                <View style={{ backgroundColor: '#ECFDF5', borderRadius: 9, padding: 11 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: BRAND.success,
                    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 }}>Your Note</Text>
                  <Text style={{ fontSize: 13, color: '#065F46', lineHeight: 18 }}>{r.landlordNote}</Text>
                </View>
              ) : (
                <View style={{ backgroundColor: BRAND.bg, borderRadius: 9, padding: 11,
                  borderWidth: 1, borderColor: BRAND.border, borderStyle: 'dashed' }}>
                  <Text style={{ fontSize: 12, color: BRAND.muted, textAlign: 'center' }}>
                    No note added yet — tap "Add Note" to communicate with tenant
                  </Text>
                </View>
              )}
            </View>

            {/* Action buttons */}
            <View style={{ flexDirection: 'row', gap: 8, padding: 14, paddingTop: 0 }}>
              <TouchableOpacity onPress={() => openStatusModal(r)} style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: 10, borderRadius: 9, backgroundColor: BRAND.primary + '12',
                borderWidth: 1, borderColor: BRAND.primary + '30',
              }}>
                <Ionicons name="sync-outline" size={14} color={BRAND.primary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.primary }}>Update Status</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => openNoteModal(r)} style={{
                flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
                gap: 5, padding: 10, borderRadius: 9, backgroundColor: BRAND.secondary + '12',
                borderWidth: 1, borderColor: BRAND.secondary + '30',
              }}>
                <Ionicons name="chatbubble-ellipses-outline" size={14} color={BRAND.secondary} />
                <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.secondary }}>
                  {r.landlordNote ? 'Edit Note' : 'Add Note'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      {/* Stats bar */}
      <View style={{ backgroundColor: BRAND.primary, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row' }}>
          {[
            { label: 'Open',        val: open.length,        color: '#FCA5A5' },
            { label: 'In Progress', val: inProgress.length,  color: '#FCD34D' },
            { label: 'Resolved',    val: resolved.length,    color: '#6EE7B7' },
            { label: 'Total',       val: requests.length,    color: '#fff' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ paddingVertical: 10, paddingHorizontal: 12, flexGrow: 0 }}>
        {FILTERS.map(f => {
          const active = filter === f;
          const cnt = f === 'All' ? requests.length
            : requests.filter(r => r.status === filterKey(f)).length;
          return (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={{
              paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, marginRight: 8,
              backgroundColor: active ? BRAND.primary : BRAND.surface,
              borderWidth: 1, borderColor: active ? BRAND.primary : BRAND.border,
            }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: active ? '#fff' : BRAND.muted }}>
                {f}{cnt > 0 ? ` (${cnt})` : ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? <ActivityIndicator color={BRAND.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 12, paddingTop: 4 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="construct-outline" size={44} color={BRAND.border} />
              <Text style={{ color: BRAND.muted, marginTop: 10, fontSize: 14 }}>
                No {filter.toLowerCase()} maintenance requests.
              </Text>
            </View>
          }
        />
      )}

      {/* Status update modal */}
      <Modal visible={!!statusModal} transparent animationType="slide" onRequestClose={() => setStatusModal(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: BRAND.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: BRAND.text }}>Update Status</Text>
              <TouchableOpacity onPress={() => setStatusModal(null)}>
                <Ionicons name="close" size={22} color={BRAND.muted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: BRAND.muted, marginBottom: 18 }} numberOfLines={1}>
              {statusModal?.title}
            </Text>

            <View style={{ gap: 10, marginBottom: 20 }}>
              {STATUS_OPTIONS.map(opt => {
                const active = newStatus === opt.id;
                return (
                  <TouchableOpacity key={opt.id} onPress={() => setNewStatus(opt.id)} style={{
                    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                    borderRadius: 12, borderWidth: 2,
                    borderColor: active ? opt.color : BRAND.border,
                    backgroundColor: active ? opt.color + '10' : BRAND.bg,
                  }}>
                    <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2,
                      borderColor: active ? opt.color : BRAND.border,
                      backgroundColor: active ? opt.color : 'transparent',
                      alignItems: 'center', justifyContent: 'center' }}>
                      {active && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                    </View>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: active ? opt.color : BRAND.text }}>
                      {opt.label}
                    </Text>
                    {statusModal?.status === opt.id && (
                      <Text style={{ fontSize: 11, color: BRAND.muted, marginLeft: 'auto' }}>current</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity onPress={handleStatusUpdate} disabled={updatingStatus} style={{
              backgroundColor: BRAND.primary, borderRadius: 12, padding: 15,
              alignItems: 'center', opacity: updatingStatus ? 0.7 : 1,
            }}>
              {updatingStatus
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Confirm Status</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Note modal */}
      <Modal visible={!!noteModal} transparent animationType="slide" onRequestClose={() => setNoteModal(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: BRAND.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <Text style={{ fontSize: 17, fontWeight: '700', color: BRAND.text }}>
                {noteModal?.landlordNote ? 'Edit Note' : 'Add Note to Tenant'}
              </Text>
              <TouchableOpacity onPress={() => setNoteModal(null)}>
                <Ionicons name="close" size={22} color={BRAND.muted} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 13, color: BRAND.muted, marginBottom: 16 }} numberOfLines={1}>
              {noteModal?.title}
            </Text>

            <Text style={{ fontSize: 11, fontWeight: '600', color: BRAND.muted,
              textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 }}>
              Your message to the tenant
            </Text>
            <TextInput
              value={noteText}
              onChangeText={setNoteText}
              placeholder="e.g. We'll send a plumber on Monday between 9–11am..."
              multiline
              numberOfLines={5}
              style={{
                backgroundColor: BRAND.bg, borderRadius: 10, borderWidth: 1, borderColor: BRAND.border,
                padding: 12, fontSize: 14, color: BRAND.text, height: 120,
                textAlignVertical: 'top', marginBottom: 18,
              }}
            />

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity onPress={() => setNoteModal(null)} style={{
                flex: 1, borderRadius: 12, padding: 14, alignItems: 'center',
                borderWidth: 1, borderColor: BRAND.border, backgroundColor: BRAND.bg,
              }}>
                <Text style={{ color: BRAND.muted, fontWeight: '600' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSaveNote} disabled={savingNote} style={{
                flex: 2, backgroundColor: BRAND.secondary, borderRadius: 12, padding: 14,
                alignItems: 'center', opacity: savingNote ? 0.7 : 1,
              }}>
                {savingNote
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Send Note</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
