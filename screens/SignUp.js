import React, { useState, useRef, useEffect } from "react";
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
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import CustomAlert from "../components/CustomAlert";
import * as Haptics from "expo-haptics";

const PRIMARY_COLOR = "#FCD73E";
const BACKGROUND_COLOR = "#000";
const TEXT_COLOR_LIGHT = "#fff";
const BORDER_COLOR_NORMAL = "#e1e1e1";

export default function SignUp({ navigation }) {
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [email, setEmail] = useState("");
  const [emailValido, setEmailValido] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmar, setConfirmar] = useState("");

  const [secure, setSecure] = useState(true);
  const [secureConfirm, setSecureConfirm] = useState(true);

  const [isNombreFocused, setIsNombreFocused] = useState(false);
  const [isApellidoFocused, setIsApellidoFocused] = useState(false);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isConfirmFocused, setIsConfirmFocused] = useState(false);

  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");

  const animatedCardY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.timing(animatedCardY, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const [errores, setErrores] = useState({
    nombre: false,
    apellido: false,
    email: false,
    password: false,
    confirmar: false,
  });

  const [validacionesPassword, setValidacionesPassword] = useState({
    longitud: false,
    mayuscula: false,
    minuscula: false,
    numero: false,
  });

  const validarNombre = (texto) => {
    setNombre(texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""));
    setErrores((prev) => ({ ...prev, nombre: false }));
  };

  const validarApellido = (texto) => {
    setApellido(texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, ""));
    setErrores((prev) => ({ ...prev, apellido: false }));
  };

  // 👇 SOLO gmail.com o hotmail.com
  const validarEmail = (texto) => {
    const t = texto.trim().toLowerCase();
    setEmail(t);

    // chequeo básico estructura algo@algo
    const tieneArrobaYTexto =
      t.includes("@") &&
      t.split("@")[0].length > 0 &&
      t.split("@")[1] &&
      t.split("@")[1].length > 0;

    if (!tieneArrobaYTexto) {
      setEmailValido(false);
      setErrores((prev) => ({ ...prev, email: false }));
      return;
    }

    const dominio = t.split("@")[1]; // después del @
    const permitido =
      dominio === "gmail.com" || dominio === "hotmail.com";

    setEmailValido(permitido);
    setErrores((prev) => ({ ...prev, email: false }));
  };

  const validarPassword = (texto) => {
    setPassword(texto);
    setValidacionesPassword({
      longitud: texto.length >= 6,
      mayuscula: /[A-Z]/.test(texto),
      minuscula: /[a-z]/.test(texto),
      numero: /[0-9]/.test(texto),
    });
    setErrores((prev) => ({ ...prev, password: false, confirmar: false }));
  };

  const passwordsMatch = password && confirmar && password === confirmar;

  // 🔐 FUNCIÓN DE REGISTRO
  const handleRegister = async () => {
    const campos = { nombre, apellido, email, password, confirmar };
    let erroresTemp = {};
    let hayError = false;

    Object.entries(campos).forEach(([campo, valor]) => {
      if (valor.trim() === "") {
        erroresTemp[campo] = true;
        hayError = true;
      } else {
        erroresTemp[campo] = false;
      }
    });
    setErrores(erroresTemp);

    if (hayError) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertType("error");
      setAlertMessage("Por favor, complete todos los campos obligatorios.");
      setAlertVisible(true);
      return;
    }

    // dominio permitido? (chequeo crítico ANTES de crear cuenta)
    const lowerEmail = email.trim().toLowerCase();
    const partes = lowerEmail.split("@");
    const dominioVal = partes[1] || "";
    const dominioPermitido =
      dominioVal === "gmail.com" || dominioVal === "hotmail.com";

    if (!dominioPermitido) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrores((prev) => ({ ...prev, email: true }));
      setEmailValido(false); // fuerza el rojo visual
      setAlertType("error");
      setAlertMessage("Formato de correo inválido.");
      setAlertVisible(true);
      return;
    }

    if (password !== confirmar) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertType("error");
      setAlertMessage("Las contraseñas no coinciden.");
      setErrores((prev) => ({ ...prev, password: true, confirmar: true }));
      setAlertVisible(true);
      return;
    }

    if (!Object.values(validacionesPassword).every(Boolean)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAlertType("error");
      setAlertMessage(
        "La contraseña no cumple con todos los requisitos de seguridad."
      );
      setAlertVisible(true);
      return;
    }

    setLoading(true);

    try {
      // ✅ Crear usuario
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // ✅ Guardar nombre y apellido en Firebase Auth
      await updateProfile(user, {
        displayName: `${nombre.trim()} ${apellido.trim()}`,
      });

      // 🔄 Forzar actualización local del perfil antes de cerrar sesión
      await user.reload();

      // 🚪 Cerrar sesión después del registro
      await signOut(auth);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAlertType("success");
      setAlertMessage(
        "Cuenta creada exitosamente. Ahora puedes iniciar sesión."
      );
      setAlertVisible(true);

      setTimeout(() => {
        setAlertVisible(false);
        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      }, 2500);
    } catch (err) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      let msg = "Error al crear la cuenta. Intente nuevamente.";
      if (err.code === "auth/email-already-in-use")
        msg = "El correo ya está registrado. Intenta iniciar sesión.";
      setAlertType("error");
      setAlertMessage(msg);
      setAlertVisible(true);
      setLoading(false);
    }
  };

  const getInputBorder = (isFocused, isInvalid) => {
    if (isInvalid) return styles.inputError;
    if (isFocused) return styles.inputFocused;
    return null;
  };

  const getInputIconColor = (isFocused) =>
    isFocused ? PRIMARY_COLOR : "gray";

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* HEADER */}
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

            {/* CARD ANIMADA */}
            <Animated.View
              style={[
                styles.card,
                { transform: [{ translateY: animatedCardY }] },
              ]}
            >
              <Text style={styles.titulo}>Crear cuenta</Text>

              {/* Nombre */}
              <View
                style={[
                  styles.inputContainer,
                  getInputBorder(isNombreFocused, errores.nombre),
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={getInputIconColor(isNombreFocused)}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Nombre"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={nombre}
                  onChangeText={validarNombre}
                  onFocus={() => setIsNombreFocused(true)}
                  onBlur={() => setIsNombreFocused(false)}
                />
              </View>

              {/* Apellido */}
              <View
                style={[
                  styles.inputContainer,
                  getInputBorder(isApellidoFocused, errores.apellido),
                ]}
              >
                <Ionicons
                  name="person-outline"
                  size={20}
                  color={getInputIconColor(isApellidoFocused)}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Apellido"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={apellido}
                  onChangeText={validarApellido}
                  onFocus={() => setIsApellidoFocused(true)}
                  onBlur={() => setIsApellidoFocused(false)}
                />
              </View>

              {/* Email */}
              <View
                style={[
                  styles.inputContainer,
                  getInputBorder(
                    isEmailFocused,
                    (!emailValido && email !== "") || errores.email
                  ),
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={getInputIconColor(isEmailFocused)}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Correo electrónico"
                  placeholderTextColor="#999"
                  style={styles.input}
                  value={email}
                  onChangeText={validarEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onFocus={() => setIsEmailFocused(true)}
                  onBlur={() => setIsEmailFocused(false)}
                />
              </View>
              {!emailValido && email !== "" && (
                <Text style={styles.errorText}>
                  Formato de correo inválido. 
                </Text>
              )}

              {/* Contraseña */}
              <View
                style={[
                  styles.inputContainer,
                  getInputBorder(isPasswordFocused, errores.password),
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={getInputIconColor(isPasswordFocused)}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={secure}
                  style={[styles.input, { marginRight: 8 }]}
                  value={password}
                  onChangeText={validarPassword}
                  onFocus={() => setIsPasswordFocused(true)}
                  onBlur={() => setIsPasswordFocused(false)}
                />
                <TouchableOpacity onPress={() => setSecure(!secure)}>
                  <Ionicons
                    name={secure ? "eye-off" : "eye"}
                    size={20}
                    color={PRIMARY_COLOR}
                  />
                </TouchableOpacity>
              </View>

              {/* Confirmar contraseña */}
              <View
                style={[
                  styles.inputContainer,
                  getInputBorder(
                    isConfirmFocused,
                    errores.confirmar ||
                      (confirmar.length > 0 && !passwordsMatch)
                  ),
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={getInputIconColor(isConfirmFocused)}
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={secureConfirm}
                  style={[styles.input, { marginRight: 8 }]}
                  value={confirmar}
                  onChangeText={setConfirmar}
                  onFocus={() => setIsConfirmFocused(true)}
                  onBlur={() => setIsConfirmFocused(false)}
                />
                <TouchableOpacity
                  onPress={() => setSecureConfirm(!secureConfirm)}
                >
                  <Ionicons
                    name={secureConfirm ? "eye-off" : "eye"}
                    size={20}
                    color={PRIMARY_COLOR}
                  />
                </TouchableOpacity>
              </View>

              {confirmar.length > 0 && (
                <Text
                  style={[
                    styles.matchText,
                    { color: passwordsMatch ? "green" : "red" },
                  ]}
                >
                  {passwordsMatch
                    ? "¡Las contraseñas coinciden!"
                    : "Las contraseñas no coinciden"}
                </Text>
              )}

              <TouchableOpacity
                style={[styles.boton, loading && styles.botonDisabled]}
                onPress={handleRegister}
                activeOpacity={0.85}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={BACKGROUND_COLOR} size="small" />
                ) : (
                  <Text style={styles.textoBoton}>Registrarse</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.login}>
                  ¿Ya tenés una cuenta?{" "}
                  <Text style={styles.link}>Iniciá sesión</Text>
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
          if (alertType === "success") {
            navigation.reset({
              index: 0,
              routes: [{ name: "Login" }],
            });
          }
        }}
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
    backgroundColor: "rgba(0,0,0,0.60)",
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
  input: { flex: 1, height: "100%", color: BACKGROUND_COLOR, fontSize: 16 },
  inputError: { borderColor: "#FF4D4D", borderWidth: 2 },
  errorText: {
    color: "red",
    fontSize: 12,
    marginBottom: 10,
    marginTop: -10,
  },
  matchText: {
    textAlign: "center",
    marginBottom: 10,
    fontSize: 14,
    fontWeight: "600",
  },
  boton: {
    backgroundColor: PRIMARY_COLOR,
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 25,
    marginBottom: 8,
    shadowColor: PRIMARY_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 8,
  },
  botonDisabled: { opacity: 0.6 },
  textoBoton: { color: BACKGROUND_COLOR, fontWeight: "700", fontSize: 16 },
  login: {
    textAlign: "center",
    color: BACKGROUND_COLOR,
    marginTop: 8,
    fontSize: 14,
  },
  link: { color: PRIMARY_COLOR, fontWeight: "700" },
});
