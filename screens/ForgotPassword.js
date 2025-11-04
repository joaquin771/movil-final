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
import * as Haptics from "expo-haptics";

const PRIMARY_COLOR = "#FCD73E";
const BACKGROUND_COLOR = "#000";
const TEXT_COLOR_LIGHT = "#fff";
const BORDER_COLOR_NORMAL = "#e1e1e1";

export default function Home({ navigation }) {
  const [email, setEmail] = useState("");
  const [emailValido, setEmailValido] = useState(true);
  const [motivoEmailInvalido, setMotivoEmailInvalido] = useState("");

  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [loading, setLoading] = useState(false);
  const [botonHabilitado, setBotonHabilitado] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);

  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");

  const animatedCardY = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  // Shake animation
  const shakeInput = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 80, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 80, useNativeDriver: true }),
    ]).start();
  };

  // ==============================
  //  CARGA EMAIL GUARDADO + ANIM
  // ==============================
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

  // ==============================
  //  AUTH STATE
  // ==============================
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, () => {});
    return unsubscribe;
  }, []);

  // ==============================
  //  VALIDACIÓN EMAIL
  // ==============================
  const validarYSetearEmail = (raw) => {
    const t = raw.trim().toLowerCase();
    setEmail(t);

    if (!t.includes("@") || t.split("@")[0].length === 0 || !t.split("@")[1]) {
      setEmailValido(false);
      setMotivoEmailInvalido("Formato inválido. Solo @gmail.com o @hotmail.com");
      return;
    }

    const dominio = t.split("@")[1];
    const permitido = dominio === "gmail.com" || dominio === "hotmail.com";

    if (!permitido) {
      setEmailValido(false);
      setMotivoEmailInvalido("Formato inválido.");
      return;
    }

    setEmailValido(true);
    setMotivoEmailInvalido("");
  };

  const onChangeEmail = (texto) => validarYSetearEmail(texto);

  // ✅ Habilitar botón solo si todo OK
  useEffect(() => {
    setBotonHabilitado(email.trim() && password.trim() && emailValido);
  }, [email, password, emailValido]);

  // ==============================
  //  LOGIN
  // ==============================
  const handleLogin = async () => {
    const correo = email.trim().toLowerCase();

    if (!emailValido || !password.trim()) {
      shakeInput();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertType("error");
      setAlertMessage("Revisá los campos.");
      setAlertVisible(true);
      return;
    }

    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, correo, password);
      await AsyncStorage.setItem("ultimoEmail", correo);
      await AsyncStorage.setItem("alertMostrado", "true");

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertType("success");
      setAlertMessage("Inicio de sesión exitoso.");
      setAlertVisible(true);
    } catch (error) {
      shakeInput();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertType("error");
      setAlertMessage("Credenciales inválidas.");
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  //  ESTILOS INPUT
  // ==============================
  const getEmailContainerStyle = () => {
    if (email !== "" && !emailValido) return [styles.inputContainer, styles.inputError];
    if (isEmailFocused) return [styles.inputContainer, styles.inputFocused];
    return [styles.inputContainer];
  };

  const getEmailIconColor = () => {
    if (email !== "" && !emailValido) return "#FF4D4D";
    return isEmailFocused ? PRIMARY_COLOR : "gray";
  };

  const getPassIconColor = () => (isPasswordFocused ? PRIMARY_COLOR : "gray");

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
              <Image source={require("../assets/logo.png")} style={styles.logoHeader} resizeMode="contain" />
            </ImageBackground>

            <Animated.View style={[styles.card, { transform: [{ translateY: animatedCardY }] }]}>
              <Text style={styles.titulo}>Inicio de sesión</Text>

              {/* EMAIL */}
              <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                <View style={getEmailContainerStyle()}>
                  <Ionicons name="mail-outline" size={20} color={getEmailIconColor()} style={styles.icon} />
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

                  {email.length > 0 && emailValido && (
                    <Ionicons name="checkmark-circle" size={20} color="green" />
                  )}
                  {email.length > 0 && !emailValido && (
                    <Ionicons name="close-circle" size={20} color="red" />
                  )}
                </View>
              </Animated.View>

              {email !== "" && !emailValido && <Text style={styles.errorText}>{motivoEmailInvalido}</Text>}

              {/* PASSWORD */}
              <View style={[styles.inputContainer, isPasswordFocused && styles.inputFocused]}>
                <Ionicons name="lock-closed-outline" size={20} color={getPassIconColor()} style={styles.icon} />
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
                  <Ionicons name={secure ? "eye-off" : "eye"} size={20} color={PRIMARY_COLOR} />
                </TouchableOpacity>
              </View>

              <View style={styles.optionsRow}>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.olvidaste}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              {/* BOTÓN */}
              <TouchableOpacity
                style={[styles.boton, (!botonHabilitado || loading) && styles.botonDisabled]}
                onPress={handleLogin}
                disabled={!botonHabilitado || loading}
                activeOpacity={0.85}
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
  overlayHeader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    zIndex: 1,
  },

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

  titulo: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 20,
    color: BACKGROUND_COLOR,
  },

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

  inputFocused: {
    borderColor: PRIMARY_COLOR,
    borderWidth: 2,
  },

  icon: { marginRight: 8 },

  input: {
    flex: 1,
    height: "100%",
    color: BACKGROUND_COLOR,
    fontSize: 16,
  },

  inputError: {
    borderColor: "#FF4D4D",
    borderWidth: 2,
  },

  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    fontWeight: "500",
  },

  optionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginBottom: 15,
  },
  olvidaste: { color: PRIMARY_COLOR, fontSize: 14, fontWeight: "600" },

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
  botonDisabled: {
    opacity: 0.5,
  },
  textoBoton: { color: BACKGROUND_COLOR, fontWeight: "700", fontSize: 16 },
  registro: {
    textAlign: "center",
    color: BACKGROUND_COLOR,
    marginTop: 6,
    fontSize: 14,
  },
  link: { color: PRIMARY_COLOR, fontWeight: "700" },
});