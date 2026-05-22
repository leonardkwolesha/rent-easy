import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView, Modal,
         TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtDate } from '../../../shared/formatters';

const EMPTY_FORM = { title: '', description: '', category: 'plumbing', priority: 'medium' };

const CATEGORIES = [
  { id: 'plumbing',    icon: 'water-outline' },
  { id: 'electrical',  icon: 'flash-outline' },
  { id: 'structural',  icon: 'home-outline' },
  { id: 'appliance',   icon: 'hardware-chip-outline' },
  { id: 'pest',        icon: 'bug-outline' },
  { id: 'other',       icon: 'build-outline' },
];

const PRIORITIES = [
  { id: 'low',    color: BRAND.secondary },
  { id: 'medium', color: BRAND.accent },
  { id: 'high',   color: '#F97316' },
  { id: 'urgent', color: BRAND.danger },
];

const FILTERS = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];

function filterKey(f) {
  if (f === 'In Progress') return 'in_progress';
  return f.toLowerCase();
}

export default function Maintenance() {
  const insets = useSafeAreaInsets();
  const [requests, setRequests]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]         = useState('All');
  const [showForm, setShowForm]     = useState(false);
  const [form, setForm]             = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing]       = useState(null); // id being closed

  const load = async () => {
    try { const r = await api.get('/maintenance/my'); setRequests(r.data.data || []); }
    catch {}
    setLoading(false);
  };
  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.description.trim())
      return Alert.alert('Required', 'Title and description are required.');
    setSubmitting(true);
    try {
      await api.post('/maintenance', form);
      Alert.alert('Submitted', 'Your maintenance request has been sent to the landlord.');
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit request.');
    }
    setSubmitting(false);
  };

  const handleClose = (req) => {
    Alert.alert(
      'Close Request',
      'Mark this request as closed? You confirm the issue has been resolved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Close Request', onPress: async () => {
          setClosing(req._id);
          try {
            await api.put(`/maintenance/${req._id}`, { status: 'closed' });
            load();
          } catch (err) {
            Alert.alert('Error', err.response?.data?.message || 'Failed to close request.');
          }
          setClosing(null);
        }},
      ]
    );
  };

  const open       = requests.filter(r => r.status === 'open');
  const inProgress = requests.filter(r => r.status === 'in_progress');
  const resolved   = requests.filter(r => r.status === 'resolved');

  const filtered = requests.filter(r => {
    if (filter === 'All') return true;
    return r.status === filterKey(filter);
  });

  const catIcon = (cat) => CATEGORIES.find(c => c.id === cat)?.icon || 'build-outline';
  const priColor = (p) => PRIORITIES.find(x => x.id === p)?.color || BRAND.muted;

  const renderItem = ({ item: r }) => {
    const sc = STATUS_COLORS[r.status] || { bg: '#F3F4F6', text: BRAND.muted };
    const canClose = r.status === 'resolved';
    const isClosing = closing === r._id;

    return (
      <View style={{
        backgroundColor: BRAND.surface, borderRadius: 14, marginBottom: 10,
        ...BRAND.shadow, overflow: 'hidden',
        borderLeftWidth: 4, borderLeftColor: priColor(r.priority),
      }}>
        <View style={{ padding: 14 }}>
          {/* Title row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: BRAND.primary + '12', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name={catIcon(r.category)} size={15} color={BRAND.primary} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: BRAND.text, flex: 1 }} numberOfLines={1}>{r.title}</Text>
            </View>
            <View style={{ paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, backgroundColor: sc.bg, marginLeft: 8 }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: sc.text, textTransform: 'capitalize' }}>
                {r.status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 13, color: BRAND.muted, lineHeight: 18, marginBottom: 10 }} numberOfLines={2}>
            {r.description}
          </Text>

          {/* Meta row */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 11, color: BRAND.muted }}>
              {r.category} · {fmtDate(r.createdAt)}
            </Text>
            <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, backgroundColor: priColor(r.priority) + '20' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: priColor(r.priority), textTransform: 'uppercase' }}>
                {r.priority}
              </Text>
            </View>
          </View>

          {/* Landlord note */}
          {r.landlordNote ? (
            <View style={{ flexDirection: 'row', gap: 7, backgroundColor: '#ECFDF5', borderRadius: 8, padding: 10, marginTop: 10 }}>
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={BRAND.secondary} style={{ marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: BRAND.secondary, marginBottom: 2 }}>LANDLORD NOTE</Text>
                <Text style={{ fontSize: 12, color: '#065F46', lineHeight: 17 }}>{r.landlordNote}</Text>
              </View>
            </View>
          ) : null}

          {/* Resolved date */}
          {r.resolvedAt ? (
            <Text style={{ fontSize: 11, color: BRAND.success, marginTop: 8 }}>
              Resolved {fmtDate(r.resolvedAt)}
            </Text>
          ) : null}

          {/* Close button */}
          {canClose && (
            <TouchableOpacity onPress={() => handleClose(r)} disabled={isClosing} style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
              marginTop: 12, borderRadius: 8, padding: 9, backgroundColor: BRAND.bg,
              borderWidth: 1, borderColor: BRAND.border, opacity: isClosing ? 0.6 : 1,
            }}>
              {isClosing
                ? <ActivityIndicator size="small" color={BRAND.muted} />
                : <>
                    <Ionicons name="checkmark-circle-outline" size={14} color={BRAND.muted} />
                    <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.muted }}>Mark as Closed</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      {/* Stats header */}
      <View style={{ backgroundColor: BRAND.primary, paddingHorizontal: 16, paddingTop: insets.top + 14, paddingBottom: 18 }}>
        <View style={{ flexDirection: 'row' }}>
          {[
            { label: 'Open',        val: open.length,       color: '#FCA5A5' },
            { label: 'In Progress', val: inProgress.length, color: '#FCD34D' },
            { label: 'Resolved',    val: resolved.length,   color: '#6EE7B7' },
          ].map(s => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 20, fontWeight: '700', color: s.color }}>{s.val}</Text>
              <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{s.label}</Text>
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

      {/* New request button */}
      <TouchableOpacity onPress={() => setShowForm(true)} style={{
        flexDirection: 'row', alignItems: 'center', gap: 6,
        backgroundColor: BRAND.secondary, marginHorizontal: 12, marginBottom: 4,
        borderRadius: 10, padding: 12, justifyContent: 'center',
      }}>
        <Ionicons name="add-circle-outline" size={18} color="#fff" />
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 14 }}>New Maintenance Request</Text>
      </TouchableOpacity>

      {loading ? <ActivityIndicator color={BRAND.primary} style={{ marginTop: 40 }} /> : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={i => i._id}
          contentContainerStyle={{ padding: 12, paddingTop: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 50 }}>
              <Ionicons name="construct-outline" size={44} color={BRAND.border} />
              <Text style={{ color: BRAND.muted, marginTop: 10, fontSize: 14 }}>No {filter.toLowerCase()} requests.</Text>
            </View>
          }
        />
      )}

      {/* New Request Modal */}
      <Modal visible={showForm} animationType="slide" transparent onRequestClose={() => setShowForm(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: BRAND.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 36, maxHeight: '92%' }}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: '700', color: BRAND.text }}>New Maintenance Request</Text>
                <TouchableOpacity onPress={() => setShowForm(false)}>
                  <Ionicons name="close" size={22} color={BRAND.muted} />
                </TouchableOpacity>
              </View>

              <Text style={FL}>Title *</Text>
              <TextInput value={form.title} onChangeText={v => setForm(f => ({ ...f, title: v }))}
                placeholder="e.g. Leaking tap in kitchen" style={INPUT} />

              <Text style={[FL, { marginTop: 14 }]}>Description *</Text>
              <TextInput value={form.description} onChangeText={v => setForm(f => ({ ...f, description: v }))}
                placeholder="Describe the issue in detail..." multiline numberOfLines={4}
                style={[INPUT, { height: 90, textAlignVertical: 'top' }]} />

              <Text style={[FL, { marginTop: 14 }]}>Category</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                {CATEGORIES.map(c => {
                  const active = form.category === c.id;
                  return (
                    <TouchableOpacity key={c.id} onPress={() => setForm(f => ({ ...f, category: c.id }))} style={{
                      flexDirection: 'row', alignItems: 'center', gap: 5,
                      paddingHorizontal: 12, paddingVertical: 8, borderRadius: 9,
                      borderWidth: 1, borderColor: active ? BRAND.primary : BRAND.border,
                      backgroundColor: active ? BRAND.primary + '12' : BRAND.bg,
                    }}>
                      <Ionicons name={c.icon} size={13} color={active ? BRAND.primary : BRAND.muted} />
                      <Text style={{ fontSize: 12, fontWeight: '500', color: active ? BRAND.primary : BRAND.muted, textTransform: 'capitalize' }}>{c.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[FL, { marginTop: 14 }]}>Priority</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                {PRIORITIES.map(p => {
                  const active = form.priority === p.id;
                  return (
                    <TouchableOpacity key={p.id} onPress={() => setForm(f => ({ ...f, priority: p.id }))} style={{
                      flex: 1, paddingVertical: 9, borderRadius: 9, alignItems: 'center',
                      borderWidth: 2, borderColor: active ? p.color : BRAND.border,
                      backgroundColor: active ? p.color + '14' : BRAND.bg,
                    }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: active ? p.color : BRAND.muted, textTransform: 'capitalize' }}>{p.id}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={{
                backgroundColor: BRAND.primary, borderRadius: 12, padding: 15,
                alignItems: 'center', marginTop: 20, opacity: submitting ? 0.7 : 1,
              }}>
                {submitting
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Submit Request</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const FL   = { fontSize: 11, fontWeight: '600', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6 };
const INPUT = { backgroundColor: BRAND.bg, borderRadius: 9, borderWidth: 1, borderColor: BRAND.border, padding: 11, fontSize: 14, color: BRAND.text };
