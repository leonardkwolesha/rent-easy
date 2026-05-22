import { useState, useCallback, useRef, useMemo } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Pressable, ScrollView,
  Modal, TextInput, ActivityIndicator, RefreshControl,
  StyleSheet, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../../shared/api';
import { BRAND, STATUS_COLORS } from '../../../shared/theme';
import { fmtCurrency, fmtDate } from '../../../shared/formatters';

/* ─── Badge styles ───────────────────────────────────────────────── */
const bs = StyleSheet.create({
  badge:   { width: 72, height: 44, borderRadius: 9, flexDirection: 'row', overflow: 'hidden' },
  section: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  divider: { width: 0.5, backgroundColor: 'rgba(255,255,255,0.28)' },
  mainTxt: { fontSize: 10, fontWeight: '900', color: '#fff', letterSpacing: 0.5 },
  subTxt:  { fontSize: 6,  color: 'rgba(255,255,255,0.65)', letterSpacing: 0.8, marginTop: 1 },
});

const MpesaBadge = () => (
  <View style={[bs.badge, { backgroundColor: '#CC0000' }]}>
    <View style={bs.section}>
      <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', lineHeight: 28 }}>M</Text>
    </View>
    <View style={bs.divider} />
    <View style={[bs.section, { flex: 1.6 }]}>
      <Text style={bs.mainTxt}>PESA</Text>
      <Text style={bs.subTxt}>VODACOM</Text>
    </View>
  </View>
);

const AirtelBadge = () => (
  <View style={[bs.badge, { backgroundColor: '#E00000', justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', fontStyle: 'italic' }}>airtel</Text>
    <View style={{ width: 50, height: 1.5, backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: 1, marginTop: 3 }} />
    <Text style={[bs.subTxt, { marginTop: 2 }]}>MONEY</Text>
  </View>
);

const MixxBadge = () => (
  <View style={[bs.badge, { backgroundColor: '#0055FF', justifyContent: 'center', alignItems: 'center' }]}>
    <Text style={{ fontSize: 15, fontWeight: '900', color: '#fff', letterSpacing: 1.5 }}>MIXX</Text>
    <Text style={[bs.subTxt, { marginTop: 2 }]}>by Yas</Text>
  </View>
);

const HalopesaBadge = () => (
  <View style={[bs.badge, { backgroundColor: '#F97316' }]}>
    <View style={{ width: 34, justifyContent: 'center', alignItems: 'center' }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.88)', justifyContent: 'center', alignItems: 'center' }}>
        <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255,255,255,0.55)' }} />
      </View>
    </View>
    <View style={[bs.section, { flex: 1.4 }]}>
      <Text style={bs.mainTxt}>HALO</Text>
      <Text style={bs.subTxt}>PESA</Text>
    </View>
  </View>
);

const BankBadge = () => (
  <View style={[bs.badge, { backgroundColor: '#1B3A6B', justifyContent: 'center', alignItems: 'center' }]}>
    <View style={{ width: 0, height: 0, borderLeftWidth: 17, borderRightWidth: 17, borderBottomWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: 'rgba(255,255,255,0.85)' }} />
    <View style={{ flexDirection: 'row', gap: 3, marginTop: 2 }}>
      {[0,1,2,3].map(i => (
        <View key={i} style={{ width: 5, height: 11, backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 1 }} />
      ))}
    </View>
    <View style={{ width: 38, height: 2.5, backgroundColor: 'rgba(255,255,255,0.78)', borderRadius: 1, marginTop: 2 }} />
  </View>
);

const CashBadge = () => (
  <View style={[bs.badge, { backgroundColor: '#166534', justifyContent: 'center', alignItems: 'center' }]}>
    <View style={{ width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 8, fontWeight: '900', color: '#fff' }}>TZS</Text>
    </View>
    <Text style={[bs.subTxt, { marginTop: 3 }]}>CASH</Text>
  </View>
);

/* ─── Providers ──────────────────────────────────────────────────── */
const PROVIDERS = [
  { id: 'mpesa',   label: 'M-Pesa',        sub: 'Vodacom Tanzania',   mobile: true,  color: '#CC0000', bg: '#FFF0F0', border: '#FFCDD2', badge: <MpesaBadge />,    prefix: ['0741','0742','0743','0744','0745','0746','0747','0748','0749'] },
  { id: 'airtel',  label: 'Airtel Money',  sub: 'Airtel Tanzania',    mobile: true,  color: '#E00000', bg: '#FEF2F2', border: '#FECACA', badge: <AirtelBadge />,   prefix: ['0680','0681','0682','0683','0684','0685','0686','0687','0688','0689'] },
  { id: 'mixx',    label: 'Mixx by Yas',   sub: 'Formerly Tigo Pesa', mobile: true,  color: '#0055FF', bg: '#EFF6FF', border: '#BFDBFE', badge: <MixxBadge />,    prefix: ['0615','0616','0617','0618','0619','0714','0715','0716','0717','0718','0719'] },
  { id: 'halotel', label: 'Halopesa',      sub: 'Halotel Tanzania',   mobile: true,  color: '#F97316', bg: '#FFF7ED', border: '#FED7AA', badge: <HalopesaBadge />, prefix: ['0621','0622','0624','0625','0626','0627','0628','0629','0723','0724'] },
  { id: 'bank',    label: 'Bank Transfer', sub: 'Any local bank',     mobile: false, color: '#1B3A6B', bg: '#EFF6FF', border: '#BFDBFE', badge: <BankBadge />,    prefix: [] },
  { id: 'cash',    label: 'Cash',          sub: 'Pay to landlord',    mobile: false, color: '#166534', bg: '#F0FDF4', border: '#BBF7D0', badge: <CashBadge />,    prefix: [] },
];
const MOBILE_IDS = ['mpesa', 'airtel', 'mixx', 'halotel'];

/* ─── Helpers ────────────────────────────────────────────────────── */
const formatPhone = v => {
  const d = v.replace(/\D/g, '').slice(0, 10);
  if (d.length <= 4) return d;
  if (d.length <= 7) return `${d.slice(0,4)} ${d.slice(4)}`;
  return `${d.slice(0,4)} ${d.slice(4,7)} ${d.slice(7)}`;
};
const fmtCountdown = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
const periodLabel  = period => {
  if (!period) return '—';
  const [y, m] = period.split('-');
  return new Date(+y, +m - 1).toLocaleDateString('en-TZ', { month: 'long', year: 'numeric' });
};
const shortMon = d => d.toLocaleDateString('en', { month: 'short' });

/* ─── Step progress bar ──────────────────────────────────────────── */
const STEPS    = ['Choose', 'Details', 'Confirm', 'Done'];
const STEP_IDX = { provider: 0, phone: 1, pending: 2, done: 3 };

function StepBar({ step }) {
  const cur = STEP_IDX[step] ?? 0;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 2 }}>
      {STEPS.map((label, i) => (
        <View key={label} style={{ flexDirection: 'row', alignItems: 'flex-start', flex: i < STEPS.length - 1 ? 1 : 0 }}>
          <View style={{ alignItems: 'center', gap: 4 }}>
            <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: i < cur ? BRAND.secondary : i === cur ? BRAND.primary : '#E5E7EB', justifyContent: 'center', alignItems: 'center' }}>
              {i < cur
                ? <Ionicons name="checkmark" size={14} color="#fff" />
                : <Text style={{ fontSize: 10, fontWeight: '700', color: i === cur ? '#fff' : '#9CA3AF' }}>{i + 1}</Text>
              }
            </View>
            <Text style={{ fontSize: 9, fontWeight: i === cur ? '700' : '400', color: i === cur ? BRAND.primary : i < cur ? BRAND.secondary : '#9CA3AF' }}>
              {label}
            </Text>
          </View>
          {i < STEPS.length - 1 && (
            <View style={{ flex: 1, height: 2, marginTop: 12, marginHorizontal: 4, backgroundColor: i < cur ? BRAND.secondary : '#E5E7EB' }} />
          )}
        </View>
      ))}
    </View>
  );
}

/* ─── Modal sheet (defined outside main to avoid remount on re-render) */
function PaySheet({
  selected, step, setStep, provider, setProvider, phone, setPhone, phoneErr, setPhoneErr,
  gateway, txnId, setTxnId, initiating, confirming, countdown, pollActive, insets,
  handleContinue, handleSendRequest, handleConfirmPaid, closeModal,
}) {
  if (!selected) return null;

  const prov      = PROVIDERS.find(p => p.id === provider);
  const isMobile  = MOBILE_IDS.includes(provider);

  const detectedProv = useMemo(() => {
    const d = phone.replace(/\D/g, '');
    if (d.length < 4) return null;
    return PROVIDERS.find(p => p.prefix.includes(d.slice(0, 4))) || null;
  }, [phone]);

  const validatePhone = val => {
    const d = val.replace(/\D/g, '');
    if (d.length < 10) { setPhoneErr('Enter a valid 10-digit number'); return false; }
    setPhoneErr(''); return true;
  };

  return (
    <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[ms.sheet, { paddingBottom: insets.bottom + 24 }]}>

          {/* drag handle */}
          <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 2 }}>
            <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#D1D5DB' }} />
          </View>

          {/* sheet header */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 19, fontWeight: '800', color: BRAND.text }}>
                {step === 'done' ? 'Payment Recorded' : 'Pay Rent'}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, backgroundColor: '#F3F4F6' }}>
                  <Text style={{ fontSize: 12, color: BRAND.muted, fontWeight: '600' }}>{selected.period}</Text>
                </View>
                <Text style={{ fontSize: 15, fontWeight: '800', color: BRAND.primary }}>{fmtCurrency(selected.amount)}</Text>
              </View>
            </View>
            {step !== 'done' && (
              <Pressable
                onPress={closeModal}
                style={({ pressed }) => [{ padding: 8, borderRadius: 22, backgroundColor: '#F3F4F6' }, pressed && { opacity: 0.7 }]}>
                <Ionicons name="close" size={18} color={BRAND.muted} />
              </Pressable>
            )}
          </View>

          {step !== 'done' && <StepBar step={step} />}

          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>

            {/* ══ STEP: provider ══ */}
            {step === 'provider' && (
              <>
                <Text style={{ fontSize: 13, color: BRAND.muted, marginBottom: 14 }}>Select your payment method</Text>

                <Text style={ms.secLabel}>Mobile Money</Text>
                {PROVIDERS.filter(p => p.mobile).map(p => (
                  <Pressable key={p.id} onPress={() => setProvider(p.id)}
                    style={({ pressed }) => [ms.provRow, { borderColor: provider === p.id ? p.color : '#E5E7EB', backgroundColor: provider === p.id ? p.bg : '#fff' }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                    {p.badge}
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: provider === p.id ? p.color : BRAND.text }}>{p.label}</Text>
                      <Text style={{ fontSize: 11, color: BRAND.muted, marginTop: 1 }}>{p.sub}</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: provider === p.id ? p.color : '#D1D5DB', backgroundColor: provider === p.id ? p.color : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                      {provider === p.id && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                    </View>
                  </Pressable>
                ))}

                <Text style={[ms.secLabel, { marginTop: 18 }]}>Other Methods</Text>
                {PROVIDERS.filter(p => !p.mobile).map(p => (
                  <Pressable key={p.id} onPress={() => setProvider(p.id)}
                    style={({ pressed }) => [ms.provRow, { borderColor: provider === p.id ? p.color : '#E5E7EB', backgroundColor: provider === p.id ? p.bg : '#fff' }, pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                    {p.badge}
                    <View style={{ flex: 1, paddingHorizontal: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: provider === p.id ? p.color : BRAND.text }}>{p.label}</Text>
                      <Text style={{ fontSize: 11, color: BRAND.muted, marginTop: 1 }}>{p.sub}</Text>
                    </View>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: provider === p.id ? p.color : '#D1D5DB', backgroundColor: provider === p.id ? p.color : 'transparent', justifyContent: 'center', alignItems: 'center' }}>
                      {provider === p.id && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
                    </View>
                  </Pressable>
                ))}

                <Pressable
                  disabled={!provider || initiating}
                  onPress={handleContinue}
                  style={({ pressed }) => [ms.btn, { backgroundColor: provider ? (prov?.color || BRAND.primary) : '#D1D5DB', opacity: !provider || initiating ? 0.55 : 1, marginTop: 22 }, pressed && provider && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  {initiating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Text style={ms.btnTxt}>Continue</Text><Ionicons name="arrow-forward" size={16} color="#fff" /></>
                  }
                </Pressable>
              </>
            )}

            {/* ══ STEP: phone ══ */}
            {step === 'phone' && prov && (
              <>
                <Pressable
                  onPress={() => { setProvider(null); setStep('provider'); }}
                  style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 18, alignSelf: 'flex-start', paddingVertical: 4 }, pressed && { opacity: 0.6 }]}>
                  <Ionicons name="arrow-back" size={15} color={BRAND.muted} />
                  <Text style={{ fontSize: 13, color: BRAND.muted, fontWeight: '600' }}>Back</Text>
                </Pressable>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, backgroundColor: prov.bg, borderWidth: 1.5, borderColor: prov.border, marginBottom: 22 }}>
                  {prov.badge}
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: prov.color }}>{prov.label}</Text>
                    <Text style={{ fontSize: 12, color: BRAND.muted, marginTop: 2 }}>
                      Sending <Text style={{ fontWeight: '700', color: BRAND.text }}>{fmtCurrency(selected.amount)}</Text>
                    </Text>
                  </View>
                </View>

                <Text style={ms.inputLabel}>{prov.label} Phone Number *</Text>
                <TextInput
                  value={phone}
                  onChangeText={v => { const f = formatPhone(v); setPhone(f); validatePhone(f); }}
                  placeholder="0741 234 567"
                  keyboardType="phone-pad"
                  placeholderTextColor="#9CA3AF"
                  style={[ms.input, { borderColor: phoneErr ? BRAND.danger : phone.length > 0 ? prov.color : '#E5E7EB' }]}
                />

                {phoneErr
                  ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                      <Ionicons name="alert-circle" size={13} color={BRAND.danger} />
                      <Text style={{ fontSize: 12, color: BRAND.danger }}>{phoneErr}</Text>
                    </View>
                  : phone.replace(/\D/g,'').length >= 4
                    ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 }}>
                        <Ionicons
                          name={detectedProv ? 'checkmark-circle' : 'help-circle'}
                          size={13}
                          color={detectedProv ? detectedProv.color : '#9CA3AF'}
                        />
                        <Text style={{ fontSize: 12, fontWeight: '600', color: detectedProv ? detectedProv.color : '#9CA3AF' }}>
                          {detectedProv ? `Detected: ${detectedProv.label}` : 'Prefix not recognised — check network'}
                        </Text>
                      </View>
                    : <Text style={{ fontSize: 12, color: BRAND.muted, marginTop: 6 }}>
                        Enter the number registered with {prov.label}
                      </Text>
                }

                <Pressable
                  disabled={initiating || !!phoneErr || phone.replace(/\D/g,'').length < 10}
                  onPress={handleSendRequest}
                  style={({ pressed }) => {
                    const disabled = initiating || !!phoneErr || phone.replace(/\D/g,'').length < 10;
                    return [ms.btn, { backgroundColor: disabled ? '#D1D5DB' : prov.color, marginTop: 24 }, !disabled && pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }];
                  }}>
                  {initiating
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Text style={ms.btnTxt}>Send Payment Request</Text><Ionicons name="send" size={15} color="#fff" /></>
                  }
                </Pressable>
              </>
            )}

            {/* ══ STEP: pending ══ */}
            {step === 'pending' && prov && gateway && (
              <>
                <View style={{ alignItems: 'center', marginBottom: 22 }}>
                  <View style={{ width: 84, height: 84, borderRadius: 42, backgroundColor: prov.bg, borderWidth: 3, borderColor: prov.color, justifyContent: 'center', alignItems: 'center', marginBottom: 14 }}>
                    <Ionicons name={isMobile ? 'phone-portrait' : 'card'} size={36} color={prov.color} />
                  </View>
                  <Text style={{ fontSize: 17, fontWeight: '800', color: BRAND.text }}>
                    {isMobile ? 'Check your phone' : `Complete ${prov.label}`}
                  </Text>
                  <Text style={{ fontSize: 13, color: BRAND.muted, marginTop: 5, textAlign: 'center', lineHeight: 18 }}>
                    {isMobile ? `A prompt was sent to ${phone}` : 'Follow the instructions below'}
                  </Text>
                </View>

                {isMobile && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E5E7EB' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {pollActive
                        ? <ActivityIndicator size="small" color={BRAND.secondary} />
                        : <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: BRAND.secondary }} />
                      }
                      <Text style={{ fontSize: 12, color: BRAND.muted }}>
                        {pollActive ? 'Checking payment…' : 'Listening for confirmation'}
                      </Text>
                    </View>
                    {countdown > 0 && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: countdown < 60 ? '#FEE2E2' : '#F3F4F6' }}>
                        <Ionicons name="time-outline" size={12} color={countdown < 60 ? BRAND.danger : BRAND.muted} />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: countdown < 60 ? BRAND.danger : BRAND.muted }}>
                          {fmtCountdown(countdown)}
                        </Text>
                      </View>
                    )}
                  </View>
                )}

                <View style={{ backgroundColor: prov.bg, borderRadius: 12, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: prov.border }}>
                  <Text style={{ fontSize: 13, color: BRAND.text, lineHeight: 21 }}>{gateway.instructions}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 14, marginBottom: 18, borderWidth: 1, borderColor: '#E5E7EB' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="barcode-outline" size={14} color={BRAND.muted} />
                    <Text style={{ fontSize: 12, color: BRAND.muted }}>Reference</Text>
                  </View>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: BRAND.text, letterSpacing: 1.2 }} selectable>
                    {gateway.reference}
                  </Text>
                </View>

                <Text style={ms.inputLabel}>
                  {isMobile ? 'Confirmation Code (optional)' : 'Payment / Receipt Reference (optional)'}
                </Text>
                <TextInput
                  value={txnId}
                  onChangeText={setTxnId}
                  placeholder={isMobile ? 'e.g. ABC123XYZ' : 'Bank ref or receipt no.'}
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                  style={[ms.input, { borderColor: prov.color }]}
                />

                <Pressable
                  disabled={confirming}
                  onPress={handleConfirmPaid}
                  style={({ pressed }) => [ms.btn, { backgroundColor: confirming ? '#D1D5DB' : BRAND.secondary, marginTop: 18 }, !confirming && pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] }]}>
                  {confirming
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <><Ionicons name="checkmark-circle" size={17} color="#1B4332" /><Text style={[ms.btnTxt, { color: '#1B4332' }]}>I've Paid — Confirm</Text></>
                  }
                </Pressable>

                <Text style={{ fontSize: 11, color: BRAND.muted, textAlign: 'center', marginTop: 10, lineHeight: 16 }}>
                  Only confirm after the payment completes on your phone
                </Text>
              </>
            )}

            {/* ══ STEP: done ══ */}
            {step === 'done' && (
              <View style={{ alignItems: 'center', paddingVertical: 16 }}>
                <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: '#ECFDF5', borderWidth: 3, borderColor: '#6EE7B7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 }}>
                  <Ionicons name="checkmark-circle" size={56} color={BRAND.success} />
                </View>
                <Text style={{ fontSize: 23, fontWeight: '800', color: BRAND.text, marginBottom: 6 }}>
                  Payment Recorded!
                </Text>
                <Text style={{ fontSize: 14, color: BRAND.muted, marginBottom: 6 }}>
                  {fmtCurrency(selected.amount)} · {selected.period}
                </Text>
                {prov && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 30, backgroundColor: prov.bg, borderWidth: 1, borderColor: prov.border, marginTop: 8 }}>
                    {prov.badge}
                    <Text style={{ fontSize: 13, fontWeight: '700', color: prov.color }}>{prov.label}</Text>
                  </View>
                )}
                {!!txnId && (
                  <View style={{ marginTop: 12, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F9FAFB' }}>
                    <Text style={{ fontSize: 12, color: BRAND.muted }}>Ref: <Text style={{ fontWeight: '700', color: BRAND.text }}>{txnId}</Text></Text>
                  </View>
                )}
                <Pressable
                  onPress={closeModal}
                  style={({ pressed }) => [{ marginTop: 26, backgroundColor: BRAND.primary, borderRadius: 14, paddingHorizontal: 52, paddingVertical: 15 }, pressed && { opacity: 0.85, transform: [{ scale: 0.97 }] }]}>
                  <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Done</Text>
                </Pressable>
              </View>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

/* ─── Main screen ────────────────────────────────────────────────── */
export default function PayRent() {
  const insets = useSafeAreaInsets();

  const [payments,   setPayments]   = useState([]);
  const [lease,      setLease]      = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter,     setFilter]     = useState('All');
  const [expanded,   setExpanded]   = useState(null);
  const [ensuring,   setEnsuring]   = useState(false);

  const [selected,   setSelected]   = useState(null);
  const [step,       setStep]       = useState('provider');
  const [provider,   setProvider]   = useState(null);
  const [phone,      setPhone]      = useState('');
  const [phoneErr,   setPhoneErr]   = useState('');
  const [gateway,    setGateway]    = useState(null);
  const [txnId,      setTxnId]      = useState('');
  const [initiating, setInitiating] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [countdown,  setCountdown]  = useState(0);
  const [pollActive, setPollActive] = useState(false);
  const pollRef      = useRef(null);
  const countdownRef = useRef(null);

  /* ── data load ── */
  const load = async () => {
    try {
      const [pmtRes, leaseRes] = await Promise.all([
        api.get('/payments/my'),
        api.get('/leases/my/all').catch(() => ({ data: { data: [] } })),
      ]);
      setPayments(pmtRes.data.data || []);
      // Use the first active lease for the hero; fall back to most recent
      const all = leaseRes.data.data || [];
      const active = all.find(l => l.status === 'active') || all[0] || null;
      setLease(active);
    } catch {}
    setLoading(false);
  };

  useFocusEffect(useCallback(() => { load(); }, []));
  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  /* ── polling ── */
  const stopPolling = () => {
    if (pollRef.current)      { clearInterval(pollRef.current);      pollRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  };

  const startPolling = paymentId => {
    stopPolling();
    setCountdown(300);
    countdownRef.current = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(countdownRef.current); return 0; }
      return c - 1;
    }), 1000);
    pollRef.current = setInterval(async () => {
      try {
        setPollActive(true);
        const r = await api.get(`/payments/${paymentId}/status`);
        if (r.data.data?.status === 'paid') { stopPolling(); setStep('done'); load(); }
      } catch {} finally { setPollActive(false); }
    }, 4000);
  };

  /* ── modal helpers ── */
  const openModal = pmt => {
    setSelected(pmt);
    setStep('provider');
    setProvider(null);
    setPhone('');
    setPhoneErr('');
    setGateway(null);
    setTxnId('');
    stopPolling();
  };

  const closeModal = () => { stopPolling(); setSelected(null); };

  const isMobileProvider = MOBILE_IDS.includes(provider);

  const handleContinue = async () => {
    if (!provider) return;
    if (isMobileProvider) { setStep('phone'); return; }
    setInitiating(true);
    try {
      const r = await api.post(`/payments/${selected._id}/initiate`, { provider });
      setGateway(r.data.data);
      setStep('pending');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to prepare payment.');
    } finally { setInitiating(false); }
  };

  const handleSendRequest = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) { setPhoneErr('Enter a valid 10-digit number'); return; }
    setInitiating(true);
    try {
      const r = await api.post(`/payments/${selected._id}/initiate`, { provider, phone: digits });
      const gw = r.data.data;
      setGateway(gw);
      setStep('pending');
      if (gw.useRealGateway && isMobileProvider) startPolling(selected._id);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to send request.');
    } finally { setInitiating(false); }
  };

  const handleConfirmPaid = async () => {
    setConfirming(true);
    try {
      await api.put(`/payments/${selected._id}/pay`, {
        paymentMethod: provider,
        transactionId: txnId.trim() || undefined,
        gatewayRef:    gateway?.reference,
      });
      stopPolling();
      setStep('done');
      load();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to record payment.');
    } finally { setConfirming(false); }
  };

  const handlePayCurrentMonth = async () => {
    setEnsuring(true);
    try {
      const r = await api.post('/payments/ensure-current');
      openModal(r.data.data);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Could not prepare payment.');
    } finally { setEnsuring(false); }
  };

  /* ── computed ── */
  const pending        = payments.filter(p => p.status === 'pending' || p.status === 'overdue');
  const overdue        = payments.filter(p => p.status === 'overdue');
  const paid           = payments.filter(p => p.status === 'paid');
  const totalOwed      = pending.reduce((s, p) => s + p.amount, 0);
  const totalPaid      = paid.reduce((s, p) => s + p.amount, 0);
  const hasActiveLease = lease?.status === 'active';
  const showPayMonth   = hasActiveLease && pending.length === 0;

  const streak = useMemo(() => {
    const sorted = [...paid].sort((a, b) => b.period.localeCompare(a.period));
    let count = 0, expected = null;
    for (const p of sorted) {
      if (!expected) { expected = p.period; count = 1; continue; }
      const [ey, em] = expected.split('-').map(Number);
      const prev = em === 1 ? `${ey-1}-12` : `${ey}-${String(em-1).padStart(2,'0')}`;
      if (p.period === prev) { count++; expected = p.period; } else break;
    }
    return count;
  }, [paid]);

  const calMonths = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const period = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      return { period, date: d, pmt: payments.find(p => p.period === period) };
    });
  }, [payments]);

  const FILTERS = [
    { id: 'All',     cnt: payments.length },
    { id: 'Due',     cnt: pending.length },
    { id: 'Overdue', cnt: overdue.length },
    { id: 'Paid',    cnt: paid.length },
  ];

  const filtered = useMemo(() => {
    const all = [...payments].sort((a, b) => b.period.localeCompare(a.period));
    if (filter === 'Due')     return all.filter(p => p.status === 'pending' || p.status === 'overdue');
    if (filter === 'Overdue') return all.filter(p => p.status === 'overdue');
    if (filter === 'Paid')    return all.filter(p => p.status === 'paid' || p.status === 'waived');
    return all;
  }, [payments, filter]);

  /* ── payment card ── */
  const renderItem = useCallback(({ item: p }) => {
    const sc       = STATUS_COLORS[p.status] || STATUS_COLORS.pending;
    const isOD     = p.status === 'overdue';
    const isPaid   = p.status === 'paid';
    const isDue    = p.status === 'pending' || p.status === 'overdue';
    const isExp    = expanded === p._id;
    const provInfo = PROVIDERS.find(x => x.id === p.paymentMethod);

    return (
      <View style={[cs.card, { borderColor: isOD ? '#FECACA' : BRAND.border }]}>
        {/* accent strip */}
        {isOD             && <View style={{ height: 3, backgroundColor: BRAND.danger }} />}
        {p.status === 'pending' && <View style={{ height: 3, backgroundColor: '#F59E0B' }} />}

        <Pressable
          onPress={() => setExpanded(isExp ? null : p._id)}
          style={({ pressed }) => [cs.cardRow, pressed && { backgroundColor: '#F9FAFB' }]}>
          {/* status icon */}
          <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: sc.bg, justifyContent: 'center', alignItems: 'center', flexShrink: 0 }}>
            <Ionicons
              name={isPaid ? 'checkmark-circle' : isOD ? 'alert-circle' : 'time'}
              size={22}
              color={isPaid ? BRAND.success : isOD ? BRAND.danger : '#D97706'}
            />
          </View>

          {/* info */}
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: BRAND.text }}>{periodLabel(p.period)}</Text>
            <Text style={{ fontSize: 11, color: BRAND.muted, marginTop: 2 }}>
              {isPaid ? `Paid ${fmtDate(p.paidDate)}` : `Due ${fmtDate(p.dueDate)}`}
              {provInfo && isPaid ? ` · ${provInfo.label}` : ''}
            </Text>
          </View>

          {/* right */}
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: isOD ? BRAND.danger : BRAND.text }}>
              {fmtCurrency(p.amount)}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: 20, backgroundColor: sc.bg }}>
                <Text style={{ fontSize: 10, fontWeight: '700', color: sc.text, textTransform: 'capitalize' }}>{p.status}</Text>
              </View>
              {isDue && (
                <Pressable
                  onPress={() => openModal(p)}
                  style={({ pressed }) => [{ paddingHorizontal: 13, paddingVertical: 5, borderRadius: 8, backgroundColor: isOD ? BRAND.danger : BRAND.primary }, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Pay</Text>
                </Pressable>
              )}
              <Ionicons name={isExp ? 'chevron-up' : 'chevron-down'} size={14} color={BRAND.muted} />
            </View>
          </View>
        </Pressable>

        {/* expanded detail */}
        {isExp && (
          <View style={{ borderTopWidth: 1, borderTopColor: '#F3F4F6', padding: 16, backgroundColor: '#FAFAFA', gap: 10 }}>
            {[
              { label: 'Period',    value: p.period },
              { label: 'Amount',   value: fmtCurrency(p.amount) },
              { label: 'Due Date', value: fmtDate(p.dueDate) },
              isPaid && { label: 'Paid Date',  value: fmtDate(p.paidDate) },
              provInfo && isPaid && { label: 'Method',   value: provInfo.label },
              p.transactionId && { label: 'Ref',       value: p.transactionId },
              p.property?.title && { label: 'Property', value: p.property.title },
            ].filter(Boolean).map(item => (
              <View key={item.label} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 12, color: BRAND.muted }}>{item.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: '600', color: BRAND.text }} selectable>{item.value}</Text>
              </View>
            ))}
            {isDue && (
              <Pressable
                onPress={() => openModal(p)}
                style={({ pressed }) => [{ marginTop: 4, paddingVertical: 11, borderRadius: 10, backgroundColor: isOD ? BRAND.danger : BRAND.primary, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }, pressed && { opacity: 0.85 }]}>
                <Ionicons name="flash" size={14} color="#fff" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Pay Now</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>
    );
  }, [expanded]);

  /* ── list header ── */
  const ListHeader = (
    <View>
      {/* hero — edge-to-edge */}
      <LinearGradient
        colors={['#1B4332', '#2D6A4F']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ paddingHorizontal: 20, paddingBottom: 28, paddingTop: insets.top + 14 }}>
        {hasActiveLease ? (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="home-outline" size={11} color="rgba(255,255,255,0.75)" />
              </View>
              <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', flex: 1 }} numberOfLines={1}>
                {lease.property?.title || 'Active Lease'}
              </Text>
            </View>

            <Text style={{ fontSize: 32, fontWeight: '900', color: '#fff', lineHeight: 36, letterSpacing: -0.5 }}>
              {fmtCurrency(lease.rentAmount)}
            </Text>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
              per month · payment due on day {lease.paymentDay || 1}
            </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }}>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: '600' }}>{paid.length} paid</Text>
                </View>
                {overdue.length > 0 && (
                  <View style={{ paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, backgroundColor: 'rgba(239,68,68,0.22)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' }}>
                    <Text style={{ fontSize: 11, color: '#FCA5A5', fontWeight: '600' }}>{overdue.length} overdue</Text>
                  </View>
                )}
              </View>

              {showPayMonth && (
                <Pressable
                  disabled={ensuring}
                  onPress={handlePayCurrentMonth}
                  style={({ pressed }) => [{ flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', opacity: ensuring ? 0.65 : 1 }, !ensuring && pressed && { transform: [{ scale: 0.96 }] }]}>
                  {ensuring
                    ? <ActivityIndicator size="small" color={BRAND.primary} />
                    : <Ionicons name="flash" size={14} color={BRAND.primary} />
                  }
                  <Text style={{ fontSize: 13, fontWeight: '700', color: BRAND.primary }}>
                    {ensuring ? 'Preparing…' : 'Pay This Month'}
                  </Text>
                </Pressable>
              )}
            </View>
          </>
        ) : (
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Rent Payments</Text>
        )}
      </LinearGradient>

      {/* overdue banner */}
      {overdue.length > 0 && (
        <View style={{ marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 14, backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="alert-circle" size={20} color="#DC2626" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#991B1B' }}>
              {overdue.length} overdue · {fmtCurrency(overdue.reduce((s,p)=>s+p.amount,0))}
            </Text>
            <Text style={{ fontSize: 11, color: '#B91C1C', marginTop: 2 }}>Pay now to avoid tenancy issues</Text>
          </View>
          <Pressable
            onPress={() => openModal(overdue[0])}
            style={({ pressed }) => [{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: '#DC2626' }, pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] }]}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>Pay</Text>
          </Pressable>
        </View>
      )}

      {/* stat cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
        {[
          { label: 'Total Paid',  value: fmtCurrency(totalPaid),                    color: BRAND.secondary, icon: 'checkmark-circle', detail: `${paid.length} month${paid.length !== 1 ? 's' : ''}` },
          { label: 'Months Paid', value: String(paid.length),                        color: BRAND.primary,   icon: 'calendar',         detail: `on-time payments` },
          { label: 'Due Now',     value: String(pending.length),                     color: pending.length > 0 ? BRAND.danger : BRAND.muted, icon: 'time', detail: pending.length > 0 ? fmtCurrency(totalOwed) : 'All clear' },
          { label: 'Pay Streak',  value: streak > 0 ? `${streak} mo` : '—',         color: streak >= 3 ? '#D4A853' : BRAND.muted,            icon: 'flash', detail: streak >= 3 ? '🏆 Great job!' : 'Build streak' },
        ].map(card => (
          <Pressable
            key={card.label}
            onPress={() => Alert.alert(card.label, card.detail)}
            style={({ pressed }) => [{ minWidth: 108, backgroundColor: BRAND.surface, borderRadius: 14, padding: 14, borderWidth: 1, borderColor: BRAND.border, ...BRAND.shadow }, pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
              <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: card.color + '18', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name={card.icon} size={15} color={card.color} />
              </View>
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: card.color, marginBottom: 2 }} numberOfLines={1}>
              {card.value}
            </Text>
            <Text style={{ fontSize: 10, color: BRAND.muted, fontWeight: '500' }}>{card.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* 6-month calendar */}
      {payments.length > 0 && (
        <View style={{ marginHorizontal: 16, marginTop: 14, backgroundColor: BRAND.surface, borderRadius: 14, padding: 16, borderWidth: 1, borderColor: BRAND.border, ...BRAND.shadow }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: BRAND.muted, textTransform: 'uppercase', letterSpacing: 0.6 }}>
              6-Month History
            </Text>
            <Ionicons name="calendar-outline" size={14} color={BRAND.muted} />
          </View>
          <View style={{ flexDirection: 'row', gap: 5 }}>
            {calMonths.map(m => {
              const isPaidM = m.pmt?.status === 'paid';
              const isODM   = m.pmt?.status === 'overdue';
              const isPendM = m.pmt?.status === 'pending';
              const dot  = isPaidM ? BRAND.secondary : isODM ? BRAND.danger : isPendM ? '#F59E0B' : '#D1D5DB';
              const bg   = isPaidM ? '#D1FAE5' : isODM ? '#FEE2E2' : isPendM ? '#FEF3C7' : '#F3F4F6';
              const lbl  = isPaidM ? 'paid' : isODM ? 'late' : isPendM ? 'due' : '—';
              return (
                <Pressable
                  key={m.period}
                  onPress={() => m.pmt && Alert.alert(
                    periodLabel(m.period),
                    `Amount: ${fmtCurrency(m.pmt.amount)}\nStatus: ${m.pmt.status}${m.pmt.paidDate ? `\nPaid: ${fmtDate(m.pmt.paidDate)}` : ''}`
                  )}
                  style={({ pressed }) => [{ flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10, backgroundColor: bg }, pressed && m.pmt && { opacity: 0.75, transform: [{ scale: 0.93 }] }]}>
                  <Text style={{ fontSize: 10, color: '#6B7280', fontWeight: '700', marginBottom: 5 }}>
                    {shortMon(m.date)}
                  </Text>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dot }} />
                  <Text style={{ fontSize: 8, color: dot, fontWeight: '800', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.3 }}>
                    {lbl}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 14, marginBottom: 6 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {FILTERS.map(f => {
          const active = filter === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => setFilter(f.id)}
              style={({ pressed }) => [
                { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 22, borderWidth: 1.5,
                  backgroundColor: active ? BRAND.primary : BRAND.surface,
                  borderColor: active ? BRAND.primary : BRAND.border,
                  flexDirection: 'row', alignItems: 'center', gap: 5 },
                pressed && { opacity: 0.75, transform: [{ scale: 0.96 }] },
              ]}>
              <Text style={{ fontSize: 13, fontWeight: active ? '700' : '500', color: active ? '#fff' : BRAND.muted }}>
                {f.id}
              </Text>
              {f.cnt > 0 && (
                <View style={{ minWidth: 18, height: 18, borderRadius: 9, backgroundColor: active ? 'rgba(255,255,255,0.25)' : BRAND.primary + '18', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 4 }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: active ? '#fff' : BRAND.primary }}>{f.cnt}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  /* ── loading ── */
  if (loading) return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg, justifyContent: 'center', alignItems: 'center', gap: 14 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: BRAND.primary + '15', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={BRAND.primary} size="large" />
      </View>
      <Text style={{ color: BRAND.muted, fontSize: 14, fontWeight: '500' }}>Loading payments…</Text>
    </View>
  );

  /* ── render ── */
  return (
    <View style={{ flex: 1, backgroundColor: BRAND.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={i => i._id}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={BRAND.primary} />}
        ListEmptyComponent={
          <View style={{ alignItems: 'center', paddingVertical: 52, paddingHorizontal: 32, gap: 12 }}>
            <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="wallet-outline" size={32} color="#D1D5DB" />
            </View>
            <Text style={{ fontSize: 16, fontWeight: '700', color: BRAND.text }}>
              No {filter !== 'All' ? filter.toLowerCase() + ' ' : ''}payments
            </Text>
            <Text style={{ fontSize: 13, color: BRAND.muted, textAlign: 'center', lineHeight: 19 }}>
              {filter === 'All' && !hasActiveLease
                ? 'Payments appear once your lease is approved and active'
                : `No ${filter.toLowerCase()} payments found`}
            </Text>
            {filter !== 'All' && (
              <Pressable
                onPress={() => setFilter('All')}
                style={({ pressed }) => [{ paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1.5, borderColor: BRAND.primary }, pressed && { opacity: 0.7 }]}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: BRAND.primary }}>Show all payments</Text>
              </Pressable>
            )}
          </View>
        }
      />

      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={closeModal}>
        <PaySheet
          selected={selected}
          step={step}
          setStep={setStep}
          provider={provider}
          setProvider={setProvider}
          phone={phone}
          setPhone={setPhone}
          phoneErr={phoneErr}
          setPhoneErr={setPhoneErr}
          gateway={gateway}
          txnId={txnId}
          setTxnId={setTxnId}
          initiating={initiating}
          confirming={confirming}
          countdown={countdown}
          pollActive={pollActive}
          insets={insets}
          handleContinue={handleContinue}
          handleSendRequest={handleSendRequest}
          handleConfirmPaid={handleConfirmPaid}
          closeModal={closeModal}
        />
      </Modal>
    </View>
  );
}

/* ─── Styles ──────────────────────────────────────────────────────── */
const cs = StyleSheet.create({
  card: {
    backgroundColor: BRAND.surface,
    borderRadius: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    overflow: 'hidden',
    ...BRAND.shadow,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
});

const ms = StyleSheet.create({
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    maxHeight: '93%',
  },
  secLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: 10,
  },
  provRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 2,
    marginBottom: 9,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: BRAND.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 7,
  },
  input: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 13,
    fontSize: 15,
    color: BRAND.text,
  },
  btn: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 20,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  btnTxt: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
});
