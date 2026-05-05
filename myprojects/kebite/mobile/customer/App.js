import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer }    from '@react-navigation/native';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import { StatusBar }              from 'expo-status-bar';
import { AuthProvider, useAuth }  from './src/context/AuthContext';
import { CartProvider }           from './src/context/CartContext';
import { LanguageProvider }       from './src/context/LanguageContext';
import { BRAND }                  from '../shared/theme';
import AppNavigator               from './src/navigation/AppNavigator';
import AuthNavigator              from './src/navigation/AuthNavigator';

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: BRAND.pageBg }}>
        <ActivityIndicator color={BRAND.orange} size="large" />
      </View>
    );
  }
  return user ? <AppNavigator /> : <AuthNavigator />;
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <NavigationContainer>
              <StatusBar style="light" />
              <RootNavigator />
            </NavigationContainer>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}
