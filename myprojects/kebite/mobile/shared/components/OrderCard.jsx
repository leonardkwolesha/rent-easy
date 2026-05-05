import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Avatar from './Avatar';
import Badge  from './Badge';
import { COLORS, RADIUS, SPACING, FONT_SIZE, FONT_WEIGHT, SHADOW } from '../theme';
import { formatMoney, formatOrderId } from '../formatters';

// Order list card. Used by:
//   - Customer / Orders            → showActions: 'customer' (Reorder + Rate / Track)
//   - Restaurant / Live Orders     → showActions: 'restaurant' (Accept + Decline / Mark Ready)
//   - Rider / Available Orders     → showActions: 'rider' (Accept + Decline)
//   - Plain list (history)         → showActions: false
//
// Props:
//   order        : order doc
//   actorName    : the name to display in the title row (restaurant for customer,
//                  customer for restaurant/rider). Falls back to order.title.
//   itemsLine    : pre-formatted items summary
//   timeAgo      : pre-formatted "2h ago" string
//   onPress      : tap whole card
//   actions      : { onReorder, onRate, onTrack, onAccept, onDecline, onReady }
//   showActions  : 'customer' | 'restaurant' | 'rider' | false
export default function OrderCard({
  order,
  actorName,
  itemsLine,
  timeAgo,
  onPress,
  actions = {},
  showActions = false,
}) {
  const status = order?.status || 'placed';
  const total  = order?.total ?? order?.totalAmount ?? 0;
  const id     = formatOrderId(order?._id || order?.id);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.card}
    >
      <View style={styles.header}>
        <Avatar name={actorName} size={40} />
        <View style={{ flex: 1, marginLeft: SPACING.md }}>
          <Text numberOfLines={1} style={styles.title}>{actorName || '—'}</Text>
          <Text style={styles.orderId}>#{id}</Text>
        </View>
        <Badge status={status} size="sm" />
      </View>

      {itemsLine ? (
        <Text numberOfLines={2} style={styles.items}>{itemsLine}</Text>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.total}>{formatMoney(total)}</Text>
        {timeAgo ? <Text style={styles.muted}>{timeAgo}</Text> : null}
      </View>

      {showActions === 'customer' && status === 'delivered' && (
        <View style={styles.actionsRow}>
          <SecondaryBtn label="Reorder" onPress={actions.onReorder} />
          <PrimaryBtn   label="★ Rate"  onPress={actions.onRate} />
        </View>
      )}
      {showActions === 'customer' && ['placed','confirmed','preparing','ready','on_the_way'].includes(status) && (
        <View style={styles.actionsRow}>
          <PrimaryBtn label="Track Order →" onPress={actions.onTrack} fullWidth />
        </View>
      )}

      {showActions === 'restaurant' && status === 'placed' && (
        <View style={styles.actionsRow}>
          <PrimaryBtn   label="Accept"  onPress={actions.onAccept} />
          <SecondaryBtn label="Decline" onPress={actions.onDecline} destructive />
        </View>
      )}
      {showActions === 'restaurant' && status === 'preparing' && (
        <View style={styles.actionsRow}>
          <PrimaryBtn label="Mark Ready" onPress={actions.onReady} fullWidth />
        </View>
      )}

      {showActions === 'rider' && (
        <View style={styles.actionsRow}>
          <PrimaryBtn   label="Accept"  onPress={actions.onAccept} />
          <SecondaryBtn label="Decline" onPress={actions.onDecline} destructive />
        </View>
      )}
    </TouchableOpacity>
  );
}

function PrimaryBtn({ label, onPress, fullWidth }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btnPrimary, fullWidth && { flex: 1 }]}
    >
      <Text style={styles.btnPrimaryText}>{label}</Text>
    </TouchableOpacity>
  );
}

function SecondaryBtn({ label, onPress, destructive }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.btnSecondary, destructive && { borderColor: COLORS.errorText }]}
    >
      <Text style={[styles.btnSecondaryText, destructive && { color: COLORS.errorText }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.cardBg,
    borderRadius:    RADIUS.lg,
    padding:         SPACING.lg,
    marginBottom:    SPACING.md,
    ...SHADOW.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  title:   { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.dark },
  orderId: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted, marginTop: 2 },
  items:   { color: COLORS.textBody, fontSize: FONT_SIZE.base, marginTop: SPACING.md },
  footer: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
    marginTop:      SPACING.md,
  },
  total: { fontSize: FONT_SIZE.lg, fontWeight: FONT_WEIGHT.bold, color: COLORS.activeOrange },
  muted: { fontSize: FONT_SIZE.sm, color: COLORS.textMuted },
  actionsRow: {
    flexDirection: 'row',
    gap:           SPACING.sm,
    marginTop:     SPACING.md,
  },
  btnPrimary: {
    backgroundColor:   COLORS.activeOrange,
    paddingVertical:   SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius:      RADIUS.pill,
    alignItems:        'center',
    flex:              1,
  },
  btnPrimaryText: {
    color:    COLORS.white,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.base,
  },
  btnSecondary: {
    backgroundColor:   COLORS.cardBg,
    borderWidth:       1.5,
    borderColor:       COLORS.activeOrange,
    paddingVertical:   SPACING.md - 1.5,
    paddingHorizontal: SPACING.lg,
    borderRadius:      RADIUS.pill,
    alignItems:        'center',
    flex:              1,
  },
  btnSecondaryText: {
    color:    COLORS.activeOrange,
    fontWeight: FONT_WEIGHT.bold,
    fontSize: FONT_SIZE.base,
  },
});
