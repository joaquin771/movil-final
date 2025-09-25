import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Registro({ navigation }) {
  const [ocultarClave, setOcultarClave] = useState(true);
  const [ocultarConfirmacion, setOcultarConfirmacion] = useState(true);
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [correoValido, setCorreoValido] = useState(true);
  const [contraseña, setContraseña] = useState("");
  const [confirmarContraseña, setConfirmarContraseña] = useState("");

  // Validaciones contraseña
  const [validacionesContraseña, setValidacionesContraseña] = useState({
    tieneMayuscula: false,
    tieneNumeroOSimbolo: false,
    longitudMinima: false,
  });

  // Validar email con regex
  const validarCorreo = (texto) => {
    setCorreo(texto);
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setCorreoValido(regex.test(texto));
  };

  // Validar contraseña
  const validarContraseña = (texto) => {
    setContraseña(texto);
    setValidacionesContraseña({
      tieneMayuscula: /[A-Z]/.test(texto),
      tieneNumeroOSimbolo: /[0-9!@#$%^&*(),.?":{}|<>]/.test(texto),
      longitudMinima: texto.length >= 8,
    });
  };

  const registrarUsuario = () => {
    if (!nombre || !correo || !contraseña || !confirmarContraseña) {
      Alert.alert("Error", "Por favor completa todos los campos.");
      return;
    }
    if (!correoValido) {
      Alert.alert("Error", "El correo electrónico no es válido.");
      return;
    }
    if (contraseña !== confirmarContraseña) {
      Alert.alert("Error", "Las contraseñas no coinciden.");
      return;
    }
    if (
      !validacionesContraseña.tieneMayuscula ||
      !validacionesContraseña.tieneNumeroOSimbolo ||
      !validacionesContraseña.longitudMinima
    ) {
      Alert.alert("Error", "La contraseña no cumple con los requisitos.");
      return;
    }
    Alert.alert("¡Creaste tu cuenta con éxito!", "Cuenta creada correctamente :) ");
  };

  return (
    <SafeAreaView style={styles.container}>
      <Image source={require("../assets/header.jpg")} style={styles.headerImg} />

      <View style={styles.card}>
        <Text style={styles.title}>Registro de usuario</Text>

        {/* Nombre */}
        <View style={styles.inputContainer}>
          <Ionicons name="person-outline" size={20} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Nombre completo"
            style={styles.input}
            value={nombre}
            onChangeText={setNombre}
          />
        </View>

        {/* Correo */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail-outline" size={20} color="gray" style={styles.icon} />
          <TextInput
            placeholder="example@gmail.com"
            style={[styles.input, !correoValido && { borderColor: "red", borderWidth: 1 }]}
            value={correo}
            onChangeText={validarCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {!correoValido && (
          <Text style={{ color: "red", fontSize: 12, marginBottom: 10 }}>
            Ingresa un correo válido
          </Text>
        )}

        {/* Contraseña */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Contraseña"
            secureTextEntry={ocultarClave}
            style={styles.input}
            value={contraseña}
            onChangeText={validarContraseña}
          />
          <TouchableOpacity onPress={() => setOcultarClave(!ocultarClave)}>
            <Ionicons name={ocultarClave ? "eye-off" : "eye"} size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Requisitos contraseña */}
        <Text style={[styles.requirement, { color: validacionesContraseña.tieneMayuscula ? "green" : "gray" }]}>
          • Al menos 1 letra mayúscula
        </Text>
        <Text style={[styles.requirement, { color: validacionesContraseña.tieneNumeroOSimbolo ? "green" : "gray" }]}>
          • Al menos 1 número o carácter especial (ej: # ? ! &)
        </Text>
        <Text style={[styles.requirement, { color: validacionesContraseña.longitudMinima ? "green" : "gray" }]}>
          • Mínimo 8 caracteres
        </Text>

        {/* Confirmar contraseña */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed-outline" size={20} color="gray" style={styles.icon} />
          <TextInput
            placeholder="Confirmar contraseña"
            secureTextEntry={ocultarConfirmacion}
            style={styles.input}
            value={confirmarContraseña}
            onChangeText={setConfirmarContraseña}
          />
          <TouchableOpacity onPress={() => setOcultarConfirmacion(!ocultarConfirmacion)}>
            <Ionicons name={ocultarConfirmacion ? "eye-off" : "eye"} size={20} color="gray" />
          </TouchableOpacity>
        </View>

        {/* Botón */}
        <TouchableOpacity style={styles.btnYellow} onPress={registrarUsuario}>
          <Text style={styles.btnYellowText}>Crear cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Login")}>
          <Text style={styles.footer}>¿Ya tienes una cuenta? Inicia sesión aquí</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  headerImg: { width: "100%", height: 250 },
  card: {
    flex: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -30,
    padding: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  icon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    height: 45,
  },
  requirement: {
    fontSize: 12,
    marginBottom: 5,
  },
  btnYellow: {
    backgroundColor: "#FFD600",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 50,
  },
  btnYellowText: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  footer: {
    textAlign: "center",
    marginTop: 10,
    color: "#007bff",
  },
});
