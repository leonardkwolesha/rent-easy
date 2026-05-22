import { StyleSheet, Text }             from 'react-native';
import { View, TouchableOpacity }      from 'react-native';
import { createContext, useContext, useState } from 'react';
import { createBottomTabNavigator }    from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator }  from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { useSafeAreaInsets }           from 'react-native-safe-area-context';
import { Ionicons }                    from '@expo/vector-icons';
import { tabBar, tabColors }           from 'shared/theme';
import { AnimatedTabIcon }             from 'shared/components/AnimatedTabIcon';
import Home             from '../screens/Home';
import Restaurants      from '../screens/Restaurants';
import RestaurantDetail from '../screens/RestaurantDetail';
import Checkout         from '../screens/Checkout';
import Orders           from '../screens/Orders';
import OrderTracking    from '../screens/OrderTracking';
import Profile          from '../screens/Profile';
import ChatScreen       from '../screens/ChatScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const tc    = tabColors;

const HIDDEN_ON = new Set(['RestaurantDetail', 'Checkout', 'OrderTracking']);

// ─── Active-order badge context ───────────────────────────────────────────────
// Orders.jsx calls setActiveOrderCount after every fetch so the tab badge stays live.
const OrderBadgeCtx = createContext({ count: 0, setCount: () => {} });
export const useOrderBadge = () => useContext(OrderBadgeCtx);

// ─── Stacks ───────────────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home"             component={Home} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />
      <Stack.Screen name="Checkout"         component={Checkout} />
      <Stack.Screen name="OrderTracking"    component={OrderTracking} />
    </Stack.Navigator>
  );
}

function RestaurantsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Restaurants"      component={Restaurants} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetail} />
      <Stack.Screen name="Checkout"         component={Checkout} />
      <Stack.Screen name="OrderTracking"    component={OrderTracking} />
    </Stack.Navigator>
  );
}

function OrdersStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Orders"        component={Orders} />
      <Stack.Screen name="OrderTracking" component={OrderTracking} />
    </Stack.Navigator>
  );
}

const TAB_CONFIG = [
  { name: 'HomeTab',        label: 'Home',    icon: 'home-outline',       activeIcon: 'home',       component: HomeStack        },
  { name: 'RestaurantsTab', label: 'Explore', icon: 'restaurant-outline', activeIcon: 'restaurant', component: RestaurantsStack },
  { name: 'OrdersTab',      label: 'Orders',  icon: 'receipt-outline',    activeIcon: 'receipt',    component: OrdersStack      },
  { name: 'ChatTab',        label: 'Keba',    icon: 'chatbubble-outline', activeIcon: 'chatbubble', component: ChatScreen        },
  { name: 'ProfileTab',     label: 'Me',      icon: 'person-outline',     activeIcon: 'person',     component: Profile          },
];

// ─── Custom floating tab bar ──────────────────────────────────────────────────
function FloatingTabBar({ state, navigation }) {
  const insets      = useSafeAreaInsets();
  const { count }   = useOrderBadge();

  // Hide on nested detail screens
  const activeRoute  = state.routes[state.index];
  const focusedChild = getFocusedRouteNameFromRoute(activeRoute);
  if (focusedChild && HIDDEN_ON.has(focusedChild)) return null;

  const bottom = Math.max(insets.bottom, tabBar.bottomGap);

  return (
    <View style={[s.bar, { bottom }]}>
      {state.routes.map((route, index) => {
        const focused      = state.index === index;
        const cfg          = TAB_CONFIG.find((t) => t.name === route.name) || {};
        const isOrdersTab  = route.name === 'OrdersTab';
        const badgeCount   = isOrdersTab ? count : 0;

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
            <View style={{ position: 'relative' }}>
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
              {badgeCount > 0 && (
                <View style={s.badge}>
                  <Text style={s.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
                </View>
              )}
            </View>
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
    position:         'absolute',
    top:              -4,
    right:            -6,
    backgroundColor:  '#e63946',
    borderRadius:     9,
    minWidth:         17,
    height:           17,
    alignItems:       'center',
    justifyContent:   'center',
    paddingHorizontal: 3,
    borderWidth:      1.5,
    borderColor:      tc.background,
  },
  badgeText: {
    color:      '#fff',
    fontSize:   10,
    fontWeight: '700',
    lineHeight: 13,
  },
});

// ─── Main navigator ───────────────────────────────────────────────────────────
export default function AppNavigator() {
  const [count, setCount] = useState(0);

  return (
    <OrderBadgeCtx.Provider value={{ count, setCount }}>
      <Tab.Navigator
        tabBar={(props) => <FloatingTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        {TAB_CONFIG.map((t) => (
          <Tab.Screen key={t.name} name={t.name} component={t.component} />
        ))}
      </Tab.Navigator>
    </OrderBadgeCtx.Provider>
  );
}
