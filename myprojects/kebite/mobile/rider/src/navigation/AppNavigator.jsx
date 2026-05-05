import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons }                   from '@expo/vector-icons';
import { COLORS }                     from '../../../shared/theme';
import Dashboard     from '../screens/Dashboard';
import ActiveDelivery from '../screens/ActiveDelivery';
import Earnings      from '../screens/Earnings';
import Profile       from '../screens/Profile';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard"      component={Dashboard} />
      <Stack.Screen name="ActiveDelivery" component={ActiveDelivery} />
    </Stack.Navigator>
  );
}

const TAB_CONFIG = {
  Home:       { icon: 'home-outline',    activeIcon: 'home',    label: 'Home'      },
  Deliveries: { icon: 'bicycle-outline', activeIcon: 'bicycle', label: 'Deliver'   },
  Earnings:   { icon: 'wallet-outline',  activeIcon: 'wallet',  label: 'Earnings'  },
  Profile:    { icon: 'person-outline',  activeIcon: 'person',  label: 'Profile'   },
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
          tabBarIcon:   ({ color, focused }) => (
            <Ionicons name={focused ? cfg.activeIcon : cfg.icon} size={24} color={color} />
          ),
        };
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeStack}
      />
      <Tab.Screen
        name="Deliveries"
        component={ActiveDelivery}
        initialParams={{ orderId: null }}
      />
      <Tab.Screen name="Earnings" component={Earnings} />
      <Tab.Screen name="Profile"  component={Profile}  />
    </Tab.Navigator>
  );
}
