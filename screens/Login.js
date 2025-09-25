import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Login({ navigation }) {
  const [email, setEmail] = useState("");
  const [emailValido, setEmailValido] = useState(true);
  const [password, setPassword] = useState("");
  const [secure, setSecure] = useState(true);
  const [remember, setRemember] = useState(false);

  // Validar email en tiempo real
  const validarEmail = (texto) => {
    setEmail(texto);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValido(regex.test(texto));
  };

  const handleLogin = () => {
    if (!email || !password) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }
    if (!emailValido) {
      Alert.alert("Error", "El correo electrónico no es válido.");
      return;
    }

    Alert.alert("Iniciaste sesión", `¡Bienvenido ${email}!`);
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
            {/* header */}
            <Image
              source={require("../assets/header.jpg")}
              style={styles.headerImg}
            />

            {/* Card */}
            <View style={styles.card}>
              <Text style={styles.titulo}>Inicio de sesión</Text>

              {/* Email */}
              <View
                style={[
                  styles.inputContainer,
                  !emailValido && { borderColor: "red", borderWidth: 1 },
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
                  value={email}
                  onChangeText={validarEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {!emailValido && (
                <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
                  Ingresa un correo válido
                </Text>
              )}

              {/* Contraseña */}
              <View style={styles.inputContainer}>
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="gray"
                  style={styles.icon}
                />
                <TextInput
                  placeholder="Contraseña"
                  placeholderTextColor="#999"
                  secureTextEntry={secure}
                  style={[styles.input, { marginRight: 8 }]}
                  value={password}
                  onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setSecure(!secure)}>
                  <Ionicons
                    name={secure ? "eye-off" : "eye"}
                    size={20}
                    color="gray"
                  />
                </TouchableOpacity>
              </View>

              {/* Recordar / Olvidaste */}
              <View style={styles.row}>
                <TouchableOpacity
                  style={styles.checkBox}
                  onPress={() => setRemember(!remember)}
                >
                  <Ionicons
                    name={remember ? "checkbox" : "square-outline"}
                    size={20}
                    color={remember ? "#28a745" : "gray"}
                  />
                  <Text style={styles.recordar}>Recordar contraseña</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() =>
                    Alert.alert(":(", "Aun no desarrollamos esta parte")
                  }
                >
                  <Text style={styles.link}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </View>

              {/* Botón principal */}
              <TouchableOpacity style={styles.boton} onPress={handleLogin}>
                <Text style={styles.textoBoton}>Iniciar sesión</Text>
              </TouchableOpacity>

              {/* Link registrarse */}
              <TouchableOpacity onPress={() => navigation?.navigate?.("SignUp")}>
                <Text style={styles.registro}>
                  ¿No tienes una cuenta? Regístrate
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#f5f5f5" },

  scrollContainer: {
    flexGrow: 1,
    justifyContent: "flex-start",
  },

  headerImg: {
    width: "100%",
    height: 200,
  },

  card: {
    flex: 1,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
  },

  titulo: {
    fontSize: 40,
    fontWeight: "700",
    marginBottom: 18,
  },

  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    borderRadius: 10,
    marginBottom: 14,
    paddingHorizontal: 12,
    marginTop: 10,
    height: 48,
  },

  icon: { marginRight: 8 },
  input: { flex: 1, height: "100%" },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 18,
  },

  checkBox: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordar: {
    marginLeft: 8,
    color: "#333",
  },

  link: {
    color: "#007bff",
    fontSize: 14,
  },

  boton: {
    backgroundColor: "#FFD600",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
    marginTop: 80,
  },

  textoBoton: {
    color: "#000",
    fontWeight: "700",
    fontSize: 16,
  },

  registro: {
    textAlign: "center",
    color: "#007bff",
    marginTop: 6,
  },
});
