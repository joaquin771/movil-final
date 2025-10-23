import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Image,
  ImageBackground,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { sendPasswordResetEmail, fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import CustomAlert from "../components/CustomAlert";

export default function ForgotPassword({ navigation }) {
  const [email, setEmail] = useState("");
  const [emailValido, setEmailValido] = useState(true);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertType, setAlertType] = useState("error");
  const [alertMessage, setAlertMessage] = useState("");

  const validarFormatoEmail = (texto) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(texto.trim());

  const setAlert = (type, message) => {
    setAlertType(type);
    setAlertMessage(message);
    setAlertVisible(true);
  };

  const handleReset = async () => {
    if (!email.trim()) {
      setAlert("error", "Por favor, ingresá tu correo electrónico.");
      return;
    }

    if (!validarFormatoEmail(email)) {
      setAlert("error", "Formato de correo inválido.");
      return;
    }

    try {
      // ✅ Enviar correo para restablecer la contraseña directamente
      await sendPasswordResetEmail(auth, email);
      
      // ✅ Mostrar un mensaje de éxito genérico para no revelar si el correo está registrado
      setAlert(
        "success",
        "Si el correo está registrado, te enviamos un enlace para restablecer tu contraseña."
      );
    } catch (error) {
      console.log("Error Firebase:", error.code);

      // 🛑 Manejar los errores específicos de Firebase
      if (error.code === "auth/invalid-email") {
        setAlert("error", "Correo electrónico inválido.");
      } else if (error.code === "auth/network-request-failed") {
        setAlert("error", "Error de conexión. Verificá tu red e intentá de nuevo.");
      } else {
        // 🛑 Para cualquier otro error, incluido 'auth/user-not-found', se usa un mensaje genérico.
        // Esto previene la enumeración de usuarios.
        setAlert("error", "Ocurrió un error. Intentá nuevamente.");
      }
    }
  };

  const onChangeEmail = (texto) => {
    setEmail(texto);
    setEmailValido(validarFormatoEmail(texto));
  };

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

            <View style={styles.card}>
              <Text style={styles.titulo}>Recuperar contraseña</Text>
              <Text style={styles.subtitulo}>
                Ingrese su correo electrónico y le enviaremos un enlace para
                restablecer su contraseña.
              </Text>

              <View
                style={[
                  styles.inputContainer,
                  !emailValido && email !== "" ? styles.inputError : null,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color="gray"
                  style={styles.icon}
                />
                <TextInput
                  placeholder="example@gmail.com"
                  placeholderTextColor="#999"
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={onChangeEmail}
                />
              </View>

              {!emailValido && email !== "" && (
                <Text style={styles.errorText}>Correo electrónico no válido</Text>
              )}

              <TouchableOpacity
                style={styles.boton}
                onPress={handleReset}
                activeOpacity={0.85}
              >
                <Text style={styles.textoBoton}>Enviar correo</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate("Login")}
                activeOpacity={0.8}
              >
                <Text style={styles.volver}>
                  ¿Ya recordaste tu contraseña?{" "}
                  <Text style={styles.link}>Iniciá sesión</Text>
                </Text>
              </TouchableOpacity>
            </View>
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
  safe: { flex: 1, backgroundColor: "#000" },
  scrollContainer: { flexGrow: 1, justifyContent: "space-between" },
  headerImgBackground: {
    width: "100%",
    height: 350,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    marginTop: 10,
  },
  headerImageStyle: { transform: [{ scale: 1.05 }] },
  overlayHeader: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.65)",
    zIndex: 1,
  },
  logoHeader: {
    width: 140,
    height: 140,
    zIndex: 3,
    marginTop: 10,
  },
  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 24,
    padding: 20,
    marginTop: -25,
    zIndex: 2,
  },
  titulo: { fontSize: 28, fontWeight: "700", marginBottom: 12, color: "#000" },
  subtitulo: {
    color: "#555",
    fontSize: 14,
    marginBottom: 22,
    lineHeight: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 52,
    backgroundColor: "#FAFAFA",
    marginBottom: 14,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, color: "#000", fontSize: 16 },
  inputError: { borderColor: "#FF4D4D", borderWidth: 2 },
  errorText: { color: "red", fontSize: 12, marginBottom: 8 },
  boton: {
    backgroundColor: "#FCD73E",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginTop: 6,
    marginBottom: 12,
  },
  textoBoton: { color: "#000", fontWeight: "700", fontSize: 16 },
  volver: { textAlign: "center", color: "#000", marginTop: 6, fontSize: 14 },
  link: { color: "#FCD73E", fontWeight: "700" },
});