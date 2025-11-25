import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView, View, Text, TextInput, StyleSheet, TouchableOpacity, Image, 
  KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard, 
  ImageBackground, ActivityIndicator, Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { sendPasswordResetEmail, onAuthStateChanged } from "firebase/auth"; 
import { auth } from "../src/firebaseConfig";
import CustomAlert from "../components/CustomAlert";
import * as Haptics from "expo-haptics";

const PRIMARY_COLOR = "#FCD73E";
const BACKGROUND_COLOR = "#000";
const TEXT_COLOR_LIGHT = "#fff";
const BORDER_COLOR_NORMAL = "#e1e1e1";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [emailValido, setEmailValido] = useState(true);
  const [motivoEmailInvalido, setMotivoEmailInvalido] = useState("");

  const [loading, setLoading] = useState(false);
  const [botonHabilitado, setBotonHabilitado] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");

  const animatedCardY = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const shakeInput = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  useEffect(() => {
    const cargarUltimoEmail = async () => {
      try {
        const ultimo = await AsyncStorage.getItem("ultimoEmail");
        if (ultimo) {
          setEmail(ultimo);
          validarYSetearEmail(ultimo);
        }
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
    const unsubscribe = onAuthStateChanged(auth, () => {});
    return unsubscribe;
  }, []);

  // ✅ VALIDACIÓN DE EMAIL MEJORADA - Acepta cualquier dominio válido
  const validarYSetearEmail = (raw) => {
    const t = raw.trim().toLowerCase();
    setEmail(t);

    // Expresión regular para validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Verifica que tenga formato válido: algo@dominio.extension
    const esValido = emailRegex.test(t);
    
    if (!esValido && t !== "") {
      setEmailValido(false);
      setMotivoEmailInvalido("Formato de correo electrónico inválido.");
    } else {
      setEmailValido(true);
      setMotivoEmailInvalido("");
    }
  };

  const onChangeEmail = (texto) => validarYSetearEmail(texto);

  useEffect(() => {
    setBotonHabilitado(email.trim() && emailValido);
  }, [email, emailValido]);

  const handlePasswordReset = async () => {
    const correo = email.trim().toLowerCase();

    if (!emailValido || !correo.trim()) {
      shakeInput();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertType("error");
      setAlertMessage("Por favor, ingresa un correo electrónico válido.");
      setAlertVisible(true);
      return;
    }

    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, correo);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertType("success");
      setAlertMessage("¡Enlace enviado! Si el correo está registrado, revisa tu bandeja de entrada o spam para restablecer tu contraseña.");
      setAlertVisible(true);
    } catch (error) {
      shakeInput();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertType("error");
      setAlertMessage("Error al enviar el enlace. Verifica el email e inténtalo de nuevo.");
      setAlertVisible(true);
      console.log("Error de restablecimiento:", error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEmailContainerStyle = () => {
    if (email !== "" && !emailValido) return [styles.inputContainer, styles.inputError];
    if (isEmailFocused) return [styles.inputContainer, styles.inputFocused];
    return [styles.inputContainer];
  };

  const getEmailIconColor = () => {
    if (email !== "" && !emailValido) return "#FF4D4D";
    return isEmailFocused ? PRIMARY_COLOR : "gray";
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
            <ImageBackground
              source={require("../assets/header.jpg")}
              style={styles.headerImgBackground}
              resizeMode="cover"
              imageStyle={styles.headerImageStyle}
            >
              <View style={styles.overlayHeader} />
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color={TEXT_COLOR_LIGHT} />
              </TouchableOpacity>
              <Image source={require("../assets/logo.png")} style={styles.logoHeader} resizeMode="contain" />
            </ImageBackground>

            <Animated.View style={[styles.card, { transform: [{ translateY: animatedCardY }] }]}>
              <Text style={styles.titulo}>Restablecer Contraseña</Text>

              <Text style={styles.subtitulo}>
                Ingresa el correo electrónico asociado a tu cuenta. Te enviaremos un enlace seguro para que puedas establecer una nueva contraseña.
              </Text>

              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <View style={getEmailContainerStyle()}>
                  <Ionicons name="mail-outline" size={20} color={getEmailIconColor()} style={styles.icon} />
                  <TextInput
                    placeholder="Tu correo electrónico"
                    placeholderTextColor="#999"
                    style={styles.input}
                    value={email}
                    onChangeText={onChangeEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    onFocus={() => setIsEmailFocused(true)}
                    onBlur={() => setIsEmailFocused(false)}
                  />
                  {email.length > 0 && emailValido && <Ionicons name="checkmark-circle" size={20} color="green" />}
                  {email.length > 0 && !emailValido && <Ionicons name="close-circle" size={20} color="red" />}
                </View>
              </Animated.View>

              {email !== "" && !emailValido && <Text style={styles.errorText}>{motivoEmailInvalido}</Text>}

              <TouchableOpacity
                style={[styles.boton, (!botonHabilitado || loading) && styles.botonDisabled]}
                onPress={handlePasswordReset}
                disabled={!botonHabilitado || loading}
                activeOpacity={0.85}
              >
                {loading ? (
                  <ActivityIndicator color={BACKGROUND_COLOR} size="small" />
                ) : (
                  <Text style={styles.textoBoton}>Enviar enlace de restablecimiento</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Login")} activeOpacity={0.8}>
                <Text style={styles.registro}>
                  ¿Recordaste tu contraseña? <Text style={styles.link}>Volver al inicio de sesión</Text>
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
        onConfirm={() => {
          setAlertVisible(false);
          if (alertType === "success") navigation.navigate("Login");
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BACKGROUND_COLOR },
  scrollContainer: { flexGrow: 1, justifyContent: "flex-start", paddingBottom: 40 },
  headerImgBackground: { width: "100%", height: 350, justifyContent: "center", alignItems: "center" },
  headerImageStyle: { transform: [{ scale: 1 }] },
  logoHeader: { width: "60%", height: "60%", zIndex: 3 },
  overlayHeader: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.65)", zIndex: 1 },
  backButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 40 : 20,
    left: 20,
    zIndex: 4,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 50,
  },
  card: {
    flex: 1,
    backgroundColor: TEXT_COLOR_LIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    marginTop: -50,
    zIndex: 2,
    shadowColor: BACKGROUND_COLOR,
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 20,
  },
  titulo: { fontSize: 32, fontWeight: "700", marginBottom: 5, color: BACKGROUND_COLOR },
  subtitulo: { fontSize: 16, color: "#666", marginBottom: 30, lineHeight: 22 },
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
  },
  inputFocused: { borderColor: PRIMARY_COLOR, borderWidth: 2 },
  icon: { marginRight: 8 },
  input: { flex: 1, height: "100%", color: BACKGROUND_COLOR, fontSize: 16, paddingVertical: 0 },
  inputError: { borderColor: "#FF4D4D", borderWidth: 2 },
  errorText: { color: "red", fontSize: 12, marginBottom: 10, fontWeight: "500", marginLeft: 5 },
  boton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
    marginBottom: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  botonDisabled: { opacity: 0.5 },
  textoBoton: { color: BACKGROUND_COLOR, fontWeight: "700", fontSize: 16 },
  registro: { textAlign: "center", color: BACKGROUND_COLOR, marginTop: 6, fontSize: 14 },
  link: { color: PRIMARY_COLOR, fontWeight: "700" },
});