import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
// 🚨 CAMBIO IMPORTANTE: Usamos createStackNavigator para un mejor control de las transiciones personalizadas
import { createStackNavigator, CardStyleInterpolators, TransitionPresets } from "@react-navigation/stack"; 
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Screens
import Welcome from "../screens/Welcome";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import Home from "../screens/Home";
import ForgotPassword from "../screens/ForgotPassword";
import Products from "../screens/Products";
import Profile from "../screens/Profile"; 

const Stack = createStackNavigator();

// --- CONFIGURACIÓN DE TRANSICIÓN ---

// Opción 1: Transición de Aparición/Desvanecimiento (Fade) - Más suave
const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

// Opción 2: Sin Animación (Instantánea) - Más seca, como un cambio de pestaña
const noAnimation = {
    transitionSpec: {
        open: { animation: 'timing', config: { duration: 0 } },
        close: { animation: 'timing', config: { duration: 0 } },
    },
    cardStyleInterpolator: ({ current }) => ({
        cardStyle: {
            opacity: current.progress.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 1],
            }),
        },
    }),
};

// --- FIN CONFIGURACIÓN DE TRANSICIÓN ---

export default function Navigation() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoggedBefore, setHasLoggedBefore] = useState(false);

  useEffect(() => {
    const init = async () => {
      const loggedBefore = await AsyncStorage.getItem("hasLoggedBefore");
      setHasLoggedBefore(!!loggedBefore);

      const unsubscribe = onAuthStateChanged(auth, (user) => {
        setIsAuthenticated(!!user);
        if (user) {
          AsyncStorage.setItem("hasLoggedBefore", "true");
        }
        setIsLoading(false);
      });

      return unsubscribe;
    };
    init();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FCD73E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          // 💡 Aplicamos la interpolación para la transición de Fade a todas las pantallas
          cardStyleInterpolator: forFade, 
          gestureEnabled: false, // Desactiva el gesto de deslizar para volver
        }}
      >
        {isAuthenticated ? (
          // ✅ Usuario autenticado → Rutas principales
          <>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Products" component={Products} />
            <Stack.Screen name="Profile" component={Profile} />
          </>
        ) : hasLoggedBefore ? (
          // ✅ Usuario ya se logueó alguna vez → Login
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </>
        ) : (
          // ✅ Usuario nuevo → Welcome
          <>
            <Stack.Screen name="Welcome" component={Welcome} />
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
