import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  ImageBackground,
  ActivityIndicator,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signInWithEmailAndPassword, onAuthStateChanged } from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import CustomAlert from "../components/CustomAlert";

import * as Haptics from 'expo-haptics'; 

const PRIMARY_COLOR = "#FCD73E"; // Amarillo del botón/link
const BACKGROUND_COLOR = "#000"; // Negro
const TEXT_COLOR_LIGHT = "#fff"; // Blanco
const BORDER_COLOR_NORMAL = "#e1e1e1";

export default function Home({ navigation }) {
  const [email, setEmail] = useState("");
  const [emailValido, setEmailValido] = useState(true);
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false); // Estado de carga


  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");

  const animatedCardY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    const cargarUltimoEmail = async () => {
      try {
        const ultimo = await AsyncStorage.getItem("ultimoEmail");
        if (ultimo) setEmail(ultimo);
      } catch (error) {
        console.log("Error al cargar email:", error);
      }
    };
    cargarUltimoEmail();

    Animated.timing(animatedCardY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
      }
    });
    return unsubscribe;
  }, []);

  const validarFormatoEmail = (texto) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto.trim());

  const onChangeEmail = (texto) => {
    const t = texto.trim();
    setEmail(t);
    if (t === "") setEmailValido(true);
    else setEmailValido(validarFormatoEmail(t));
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); 

      setAlertType("error");
      setAlertMessage("Credenciales inválidas. Verifica tus datos o regístrate.");
      setAlertVisible(true);
      return;
    }

    setLoading(true); // Iniciar carga

    try {

      await signInWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem("ultimoEmail", email);
      await AsyncStorage.setItem("alertMostrado", "true");

      setAlertType("success");
      setAlertMessage("Inicio de sesión exitoso.");
      setAlertVisible(true);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    } catch (error) {
  
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); // Feedback Háptico
      // ==========================
      console.log("Error Firebase:", error.code);
      setAlertType("error");
      setAlertMessage("Credenciales inválidas.");
      setAlertVisible(true);
    } finally {
      setLoading(false); // Detener carga
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <ImageBackground
              source={require("../assets/header.jpg")}
              style={styles.headerImgBackground}
              resizeMode="cover"
              imageStyle={styles.headerImageStyle}
            >
              <View style={styles.overlayHeader} />
              <Image
                source={require("../assets/logo.png")}
                style={styles.logoHeader}
                resizeMode="contain"
              />
            </ImageBackground>

            {/* Tarjeta Animada con Sombra (Mejora UX) */}
            <Animated.View style={[
              styles.card,
              { transform: [{ translateY: animatedCardY }] } 
            ]}>
              <Text style={styles.titulo}>Inicio de sesión</Text>

              {/* INPUT EMAIL */}
              <View
                style={[
                  styles.inputContainer,
                  isEmailFocused && styles.inputFocused, // Estilo de Foco
                  !emailValido && email !== "" ? styles.inputError : null,
                ]}
              >
                <Ionicons 
                  name="mail-outline" 
                  size={20} 
                  color={isEmailFocused ? PRIMARY_COLOR : "gray"} // Color de icono enfocado
                  style={styles.icon} 
                />
                <TextInput
                  placeholder="example@gmail.com"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={email}
                  onChangeText={onChangeEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>

              {!emailValido && email !== "" && (
                <Text style={styles.errorText}>Ingresa un correo válido</Text>
              )}

              {/* INPUT CONTRASEÑA */}
              <View 
                style={[
                  styles.inputContainer,
                  isPasswordFocused && styles.inputFocused, // Estilo de Foco
                ]}
              >
                <Ionicons 
                  name="lock-closed-outline" 
                  size={20} 
                  color={isPasswordFocused ? PRIMARY_COLOR : "gray"} // Color de icono enfocado
                  style={styles.icon} 
                />
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={secure}
                  style={[styles.input, { marginRight: 8 }]}
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setSecure(!secure)}>
                  <Ionicons 
                    name={secure ? "eye-off" : "eye"} 
                    size={20} 
                    color={PRIMARY_COLOR} // Se usa el color primario para el botón de toggle
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.olvidaste}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.boton, loading && styles.botonDisabled]} 
                onPress={handleLogin} 
                activeOpacity={0.85}
                disabled={loading} // Deshabilitar si está cargando
              >
                {loading ? (
                  <ActivityIndicator color={BACKGROUND_COLOR} size="small" />
                ) : (
                  <Text style={styles.textoBoton}>Iniciar sesión</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("SignUp")} activeOpacity={0.8}>
                <Text style={styles.registro}>
                  ¿No tenés una cuenta? <Text style={styles.link}>Regístrate</Text>
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      <CustomAlert
        isVisible={alertVisible}
        type={alertType}
        message={alertMessage}
        onConfirm={() => setAlertVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  scrollContainer: { flexGrow: 1, justifyContent: "space-between" },
  headerImgBackground: {
    width: "100%",
    height: 350,
    justifyContent: "center",
    alignItems: "center",
  },
  headerImageStyle: { transform: [{ scale: 1 }] },
  logoHeader: { width: "60%", height: "60%", zIndex: 3 },
  overlayHeader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1 },
  
  card: {
    flex: 1,
    backgroundColor: TEXT_COLOR_LIGHT,
    borderRadius: 24,
    padding: 20,
    marginTop: -50,
    zIndex: 2,

    shadowColor: BACKGROUND_COLOR, 
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 20,
  },
  
  titulo: { fontSize: 40, fontWeight: "700", marginBottom: 20, color: BACKGROUND_COLOR },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER_COLOR_NORMAL,
    borderRadius: 10,
    marginBottom: 14,
    marginTop: 5,
    paddingHorizontal: 12,
    height: 54,
    backgroundColor: TEXT_COLOR_LIGHT,
    transition: 'border-color 0.3s ease', // No funciona en RN, pero se pone como comentario conceptual
  },
  inputFocused: {
    borderColor: PRIMARY_COLOR, // Borde Amarillo al enfocar
    borderWidth: 2, // Borde más grueso al enfocar
  },
  icon: { marginRight: 8 },
  input: { flex: 1, height: "100%", color: BACKGROUND_COLOR, fontSize: 16 },
  inputError: { borderColor: "#FF4D4D", borderWidth: 2 },
  errorText: { color: "red", fontSize: 12, marginBottom: 10 },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 15,
  },
  olvidaste: { color: PRIMARY_COLOR, fontSize: 14, fontWeight: "600" },
  
  // ESTILOS DE BOTÓN MEJORADOS
  boton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: 'center', // Centra el ActivityIndicator
    marginTop: 30,
    marginBottom: 8,
    // Sombra para el botón
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  botonDisabled: {
    opacity: 0.6,
  },
  textoBoton: { color: BACKGROUND_COLOR, fontWeight: "700", fontSize: 16 },
  registro: { textAlign: "center", color: BACKGROUND_COLOR, marginTop: 6, fontSize: 14 },
  link: { color: PRIMARY_COLOR, fontWeight: "700" },
});
