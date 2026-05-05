import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../theme';
import api from '../api';

// Props:
//   onApply(promo | null) — called with promo object when applied, null when removed
//   strings               — optional i18n overrides { placeholder, apply, remove, error }
export default function PromoCodeInput({ onApply, strings = {}, style }) {
  const [code, setCode]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [applied, setApplied]   = useState(null);

  const S = {
    placeholder: strings.placeholder || 'Promo code',
    apply:       strings.apply       || 'Apply',
    remove:      strings.remove      || 'Remove',
    error:       strings.error       || 'Invalid or expired promo code.',
  };

  async function handleApply() {
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;
    setLoading(true); setError(null);
    try {
      const res = await api.post('/promos/validate', { code: trimmed });
      setApplied(res.data);
      onApply?.(res.data);
    } catch (err) {
      setError(err?.response?.data?.message || S.error);
    } finally {
      setLoading(false);
    }
  }

  function handleRemove() {
    setCode(''); setApplied(null); setError(null);
    onApply?.(null);
  }

  return (
    <View style={[styles.wrap, style]}>
      <View style={[styles.row, applied && styles.rowApplied, error && styles.rowError]}>
        <Ionicons
          name="pricetag-outline"
          size={18}
          color={applied ? COLORS.successText : error ? COLORS.errorText : COLORS.textMuted}
          style={{ marginRight: SPACING.sm }}
        />
        <TextInput
          value={code}
          onChangeText={(v) => { setCode(v.toUpperCase()); setError(null); }}
          placeholder={S.placeholder}
          placeholderTextColor={COLORS.textLight}
          autoCapitalize="characters"
          editable={!applied && !loading}
          style={styles.input}
          returnKeyType="done"
          onSubmitEditing={handleApply}
        />
        {applied ? (
          <TouchableOpacity onPress={handleRemove} accessibilityLabel="Remove promo code" style={styles.actionBtn}>
            <Ionicons name="close-circle" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleApply}
            disabled={loading || !code.trim()}
            accessibilityLabel="Apply promo code"
            style={[styles.applyBtn, (!code.trim() || loading) && { opacity: 0.45 }]}
          >
            {loading
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={styles.applyText}>{S.apply}</Text>}
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <View style={styles.msgRow}>
          <Ionicons name="alert-circle-outline" size={14} color={COLORS.errorText} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {applied ? (
        <View style={styles.msgRow}>
          <Ionicons name="checkmark-circle" size={14} color={COLORS.successText} />
          <Text style={styles.successText}>
            {applied.description
              || (applied.discountType === 'percent'
                    ? `${applied.discount}% off applied!`
                    : `TSh ${(applied.discount || 0).toLocaleString()} off applied!`)}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:        { gap: SPACING.xs },
  row: {
    flexDirection:  'row',
    alignItems:     'center',
    backgroundColor: COLORS.cardBg,
    borderRadius:   RADIUS.lg,
    borderWidth:    1,
    borderColor:    COLORS.border,
    paddingHorizontal: SPACING.md,
    paddingVertical:   2,
    ...SHADOW.sm,
  },
  rowApplied:  { borderColor: COLORS.successText },
  rowError:    { borderColor: COLORS.errorText },
  input:       { flex: 1, fontSize: FONT_SIZE.base, color: COLORS.textPrimary,
                 paddingVertical: SPACING.sm, letterSpacing: 1 },
  actionBtn:   { padding: SPACING.xs },
  applyBtn:    { backgroundColor: COLORS.activeOrange, borderRadius: RADIUS.md,
                 paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, marginLeft: SPACING.xs },
  applyText:   { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.sm },
  msgRow:      { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
                 paddingHorizontal: SPACING.xs },
  errorText:   { color: COLORS.errorText,   fontSize: FONT_SIZE.sm, flex: 1 },
  successText: { color: COLORS.successText, fontSize: FONT_SIZE.sm, flex: 1, fontWeight: FONT_WEIGHT.medium },
});
