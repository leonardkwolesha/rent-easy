import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { createBottomTabNavigator }           from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator }         from '@react-navigation/native-stack';
import { getFocusedRouteNameFromRoute }       from '@react-navigation/native';
import { useSafeAreaInsets }                  from 'react-native-safe-area-context';
import { Ionicons }                           from '@expo/vector-icons';
import { tabBar, tabColors }                  from 'shared/theme';
import { AnimatedTabIcon }                    from 'shared/components/AnimatedTabIcon';
import Dashboard      from '../screens/Dashboard';
import ActiveDelivery from '../screens/ActiveDelivery';
import Earnings       from '../screens/Earnings';
import Profile        from '../screens/Profile';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const tc    = tabColors;

// ─── Stacks ───────────────────────────────────────────────────────────────────
function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={Dashboard} />
    </Stack.Navigator>
  );
}

const TAB_CONFIG = [
  { name: 'Home',       label: 'Home',     icon: 'home-outline',    activeIcon: 'home',    component: HomeStack      },
  { name: 'Deliveries', label: 'Rides',    icon: 'bicycle-outline', activeIcon: 'bicycle', component: ActiveDelivery },
  { name: 'Earnings',   label: 'Earnings', icon: 'wallet-outline',  activeIcon: 'wallet',  component: Earnings       },
  { name: 'Profile',    label: 'Profile',  icon: 'person-outline',  activeIcon: 'person',  component: Profile        },
];

// ─── Custom floating tab bar ──────────────────────────────────────────────────
function FloatingTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
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
