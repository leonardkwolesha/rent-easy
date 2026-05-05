import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useState, useEffect }        from 'react';
import { View, Text }                 from 'react-native';
import { Ionicons }                   from '@expo/vector-icons';
import { COLORS }                     from '../../../shared/theme';
import { getItem, KEYS }              from '../../../shared/storage';
import Dashboard  from '../screens/Dashboard';
import Orders     from '../screens/Orders';
import OrderDetail from '../screens/OrderDetail';
import Menu       from '../screens/Menu';
import Profile    from '../screens/Profile';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

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

// Live incoming-order badge on the Orders tab
function OrdersBadge({ color, focused }) {
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
    <View>
      <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
      {count > 0 && (
        <View style={{
          position:         'absolute',
          top:              -4,
          right:            -6,
          backgroundColor:  COLORS.red,
          borderRadius:     9,
          minWidth:         18,
          height:           18,
          paddingHorizontal:4,
          alignItems:       'center',
          justifyContent:   'center',
        }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>
            {count > 9 ? '9+' : count}
          </Text>
        </View>
      )}
    </View>
  );
}

const TAB_CONFIG = {
  DashboardTab: { icon: 'grid-outline',       activeIcon: 'grid',        label: 'Dashboard' },
  OrdersTab:    { icon: 'receipt-outline',    activeIcon: 'receipt',     label: 'Orders'    },
  MenuTab:      { icon: 'restaurant-outline', activeIcon: 'restaurant',  label: 'Menu'      },
  ProfileTab:   { icon: 'person-outline',     activeIcon: 'person',      label: 'Profile'   },
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name] || {};
        return {
          headerShown:           false,
          tabBarActiveTintColor:   COLORS.activeOrange,
          tabBarInactiveTintColor: COLORS.textLight,
          tabBarStyle: {
            borderTopWidth:  0,
            elevation:       12,
            shadowColor:     '#000',
            shadowOffset:    { width: 0, height: -2 },
            shadowOpacity:   0.06,
            shadowRadius:    8,
            height:          66,
            paddingBottom:   10,
            paddingTop:      6,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarLabel:  cfg.label,
          tabBarIcon:   route.name === 'OrdersTab'
            ? ({ color, focused }) => <OrdersBadge color={color} focused={focused} />
            : ({ color, focused }) => (
                <Ionicons name={focused ? cfg.activeIcon : cfg.icon} size={24} color={color} />
              ),
        };
      }}
    >
      <Tab.Screen name="DashboardTab" component={DashboardStack} />
      <Tab.Screen name="OrdersTab"    component={OrdersStack}    />
      <Tab.Screen name="MenuTab"      component={Menu}           />
      <Tab.Screen name="ProfileTab"   component={Profile}        />
    </Tab.Navigator>
  );
}
