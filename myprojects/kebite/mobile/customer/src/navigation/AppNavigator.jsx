import { createBottomTabNavigator }  from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons }                   from '@expo/vector-icons';
import { COLORS, BRAND }             from '../../../shared/theme';
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

const TAB_CONFIG = {
  HomeTab:        { icon: 'home-outline',       activeIcon: 'home',       label: 'Home'        },
  RestaurantsTab: { icon: 'restaurant-outline', activeIcon: 'restaurant', label: 'Explore'     },
  OrdersTab:      { icon: 'receipt-outline',    activeIcon: 'receipt',    label: 'Orders'      },
  ChatTab:        { icon: 'chatbubble-outline',  activeIcon: 'chatbubble', label: 'Keba'        },
  ProfileTab:     { icon: 'person-outline',     activeIcon: 'person',     label: 'Profile'     },
};

export default function AppNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TAB_CONFIG[route.name] || {};
        return {
          headerShown:          false,
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
      <Tab.Screen name="HomeTab"        component={HomeStack}       />
      <Tab.Screen name="RestaurantsTab" component={RestaurantsStack}/>
      <Tab.Screen name="OrdersTab"      component={OrdersStack}     />
      <Tab.Screen name="ChatTab"        component={ChatScreen}      />
      <Tab.Screen name="ProfileTab"     component={Profile}         />
    </Tab.Navigator>
  );
}
