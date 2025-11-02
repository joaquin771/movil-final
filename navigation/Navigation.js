// navigation/Navigation.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { onAuthStateChanged } from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { auth } from "../src/firebaseConfig";

// 🟡 <-- import theme context
import { useTheme } from "../src/theme/ThemeContext";

/* Screens */
import Welcome from "../screens/Welcome";
import Login from "../screens/Login";
import SignUp from "../screens/SignUp";
import Home from "../screens/Home";
import ForgotPassword from "../screens/ForgotPassword";
import Products from "../screens/Products";
import Profile from "../screens/Profile";
import ProductDetails from "../screens/ProductDetails";
import ChangePassword from "../screens/ChangePassword"; // <-- importar aquí

const Stack = createStackNavigator();

/* fade global */
const forFade = ({ current }) => ({
  cardStyle: {
    opacity: current.progress,
  },
});

export default function Navigation() {
  const { theme, navigationTheme } = useTheme(); // <- agarramos colores globales

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

  // loading inicial
  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyleInterpolator: forFade,
          gestureEnabled: false,
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Home" component={Home} />
            <Stack.Screen name="Products" component={Products} />
            <Stack.Screen name="ChangePassword" component={ChangePassword} />
            <Stack.Screen name="Profile" component={Profile} />
            <Stack.Screen
              name="ProductDetails"
              component={ProductDetails}
              options={{
                headerShown: false,
                gestureEnabled: true,
              }}
            />
          </>
        ) : hasLoggedBefore ? (
          <>
            <Stack.Screen name="Login" component={Login} />
            <Stack.Screen name="SignUp" component={SignUp} />
            <Stack.Screen name="ForgotPassword" component={ForgotPassword} />
          </>
        ) : (
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
  },
});
