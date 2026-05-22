import { useState, useEffect }              from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator }           from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator }         from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute }       from '@react-navigation/native';
import { useSafeAreaInsets }                  from 'react-native-safe-area-context';
import { Ionicons }                           from '@expo/vector-icons';
import { tabBar, tabColors, COLORS }          from 'shared/theme';
import { AnimatedTabIcon }                    from 'shared/components/AnimatedTabIcon';
import { getItem, KEYS }                      from 'shared/storage';
import Dashboard   from '../screens/Dashboard';
import Orders      from '../screens/Orders';
import OrderDetail from '../screens/OrderDetail';
import Menu        from '../screens/Menu';
import Profile     from '../screens/Profile';
import EditProfile from '../screens/EditProfile';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const tc    = tabColors;

// Screens inside stacks where the tab bar must be hidden
const HIDDEN_ON = new Set(['OrderDetail', 'EditProfile']);

// ─── Orders tab icon with live badge ─────────────────────────────────────────
function OrdersBadge({ focused }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const poll = async () => {
      const raw = await getItem(KEYS.activeOrderCount);
      setCount(parseInt(raw || '0', 10) || 0);
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  return (
    <AnimatedTabIcon
      focused={focused}
      label="Orders"
      activePill={tc.activePill}
      activeLabel={tc.activeLabel}
      inactiveLabel={tc.inactiveLabel}
      icon={
        <View>
          <Ionicons
            name={focused ? 'receipt' : 'receipt-outline'}
            size={22}
            color={focused ? tc.activeIcon : tc.inactiveIcon}
          />
          {count > 0 && (
            <View style={s.badge}>
              <Text style={s.badgeText}>{count > 9 ? '9+' : count}</Text>
            </View>
          )}
        </View>
      }
    />
  );
}

// ─── Stacks ───────────────────────────────────────────────────────────────────
function DashboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard"   component={Dashboard} />
      <Stack.Screen name="OrderDetail" component={OrderDetail} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Orders"      component={Orders} />
      <Stack.Screen name="OrderDetail" component={OrderDetail} />
    </Stack.Navigator>
  );
}

function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Profile"     component={Profile} />
      <Stack.Screen name="EditProfile" component={EditProfile} />
    </Stack.Navigator>
  );
}

const TAB_CONFIG = [
  { name: 'DashboardTab', label: 'Home',    icon: 'grid-outline',       activeIcon: 'grid',       component: DashboardStack },
  { name: 'OrdersTab',    label: 'Orders',  icon: 'receipt-outline',    activeIcon: 'receipt',    component: OrdersStack    },
  { name: 'MenuTab',      label: 'Menu',    icon: 'restaurant-outline', activeIcon: 'restaurant', component: Menu           },
  { name: 'ProfileTab',   label: 'Profile', icon: 'person-outline',     activeIcon: 'person',     component: ProfileStack   },
];

// ─── Custom floating tab bar ──────────────────────────────────────────────────
function FloatingTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();

  // Hide on nested detail / edit screens
  const activeRoute  = state.routes[state.index];
  const focusedChild = getFocusedRouteNameFromRoute(activeRoute);
  if (focusedChild && HIDDEN_ON.has(focusedChild)) return null;

  const bottom = Math.max(insets.bottom, tabBar.bottomGap);

  return (
    <View style={[s.bar, { bottom }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const cfg     = TAB_CONFIG.find((t) => t.name === route.name) || {};

        function onPress() {
          const event = navigation.emit({
            type:              'tabPress',
            target:            route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate({ name: route.name, merge: true });
          }
        }

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={s.item}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={cfg.label}
          >
            {route.name === 'OrdersTab' ? (
              <OrdersBadge focused={focused} />
            ) : (
              <AnimatedTabIcon
                focused={focused}
                label={cfg.label}
                activePill={tc.activePill}
                activeLabel={tc.activeLabel}
                inactiveLabel={tc.inactiveLabel}
                icon={
                  <Ionicons
                    name={focused ? cfg.activeIcon : cfg.icon}
                    size={22}
                    color={focused ? tc.activeIcon : tc.inactiveIcon}
                  />
                }
              />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  bar: {
    position:          'absolute',
    left:              tabBar.horizontalInset,
    right:             tabBar.horizontalInset,
    height:            tabBar.height,
    borderRadius:      tabBar.radius,
    backgroundColor:   tc.background,
    flexDirection:     'row',
    alignItems:        'center',
    paddingHorizontal: 8,
    elevation:         14,
    shadowColor:       '#000',
    shadowOffset:      { width: 0, height: 6 },
    shadowOpacity:     0.35,
    shadowRadius:      14,
    zIndex:            100,
  },
  item: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    height:         '100%',
  },
  badge: {
    position:          'absolute',
    top:               -4,
    right:             -6,
    backgroundColor:   COLORS.red,
    borderRadius:      9,
    minWidth:          18,
    height:            18,
    paddingHorizontal: 4,
    alignItems:        'center',
    justifyContent:    'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});

// ─── Main navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      {TAB_CONFIG.map((t) => (
        <Tab.Screen key={t.name} name={t.name} component={t.component} />
      ))}
    </Tab.Navigator>
  );
}
