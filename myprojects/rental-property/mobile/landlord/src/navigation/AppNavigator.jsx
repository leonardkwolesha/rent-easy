import { useState, useEffect, createContext } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getToken } from '../../../shared/storage';
import { BRAND } from '../../../shared/theme';
import Dashboard from '../screens/Dashboard';
import Properties from '../screens/Properties';
import Applications from '../screens/Applications';
import Tenants from '../screens/Tenants';
import Payments from '../screens/Payments';
import Profile from '../screens/Profile';
import Maintenance from '../screens/Maintenance';
import SplashScreen from '../screens/SplashScreen';
import Login from '../screens/Login';
import ForgotPassword from '../screens/ForgotPassword';

export const AuthContext = createContext({ signIn: () => {}, signOut: () => {} });

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TAB_ICONS = {
  Dashboard:    ['grid',          'grid-outline'],
  Properties:   ['business',      'business-outline'],
  Applications: ['document-text', 'document-text-outline'],
  Tenants:      ['people',        'people-outline'],
  Payments:     ['wallet',        'wallet-outline'],
  Profile:      ['person',        'person-outline'],
};

const TAB_HEIGHT = 64;
const TAB_FLOAT  = 8;

const HEADER_OPTS = {
  headerStyle: { backgroundColor: BRAND.surface },
  headerTintColor: BRAND.text,
  headerTitleStyle: { fontWeight: '700', fontSize: 17 },
  headerShadowVisible: false,
};

function FloatingTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();
  const tabBottom = insets.bottom + TAB_FLOAT;
  return (
    <View style={{
      position: 'absolute',
      bottom: tabBottom,
      left: 12,
      right: 12,
      height: TAB_HEIGHT,
      backgroundColor: BRAND.surface,
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 4,
      elevation: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.14,
      shadowRadius: 20,
    }}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const label   = options.tabBarLabel ?? options.title ?? route.name;
        const icons   = TAB_ICONS[route.name] ?? ['ellipse', 'ellipse-outline'];

        const onPress = () => {
          const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
        };

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            activeOpacity={0.65}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 }}
          >
            <View style={{
              width: 44,
              height: 30,
              borderRadius: 15,
              backgroundColor: focused ? BRAND.secondary : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 3,
            }}>
              <Ionicons
                name={icons[focused ? 0 : 1]}
                size={focused ? 19 : 18}
                color={focused ? '#fff' : BRAND.muted}
              />
            </View>
            <Text style={{
              fontSize: 9,
              fontWeight: focused ? '700' : '500',
              color: focused ? BRAND.secondary : BRAND.muted,
              letterSpacing: 0.1,
            }}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const scenePad = insets.bottom + TAB_FLOAT + TAB_HEIGHT + TAB_FLOAT;
  return (
    <Tab.Navigator
      tabBar={props => <FloatingTabBar {...props} />}
      sceneContainerStyle={{ paddingBottom: scenePad }}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard"    component={Dashboard}    options={{ title: 'Overview' }} />
      <Tab.Screen name="Properties"   component={Properties} />
      <Tab.Screen name="Applications" component={Applications} />
      <Tab.Screen name="Tenants"      component={Tenants} />
      <Tab.Screen name="Payments"     component={Payments} />
      <Tab.Screen name="Profile"      component={Profile} />
    </Tab.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTS}>
      <Stack.Screen name="Tabs"        component={MainTabs}   options={{ headerShown: false }} />
      <Stack.Screen name="Maintenance" component={Maintenance} options={{ title: 'Maintenance Requests' }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Splash"         component={SplashScreen} />
      <Stack.Screen name="Login"          component={Login} />
      <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const [authed, setAuthed] = useState(null);
  useEffect(() => { getToken().then(t => setAuthed(!!t)); }, []);
  if (authed === null) return null;
  return (
    <AuthContext.Provider value={{ signIn: () => setAuthed(true), signOut: () => setAuthed(false) }}>
      {authed ? <AppStack /> : <AuthStack />}
    </AuthContext.Provider>
  );
}
