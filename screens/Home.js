import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ImageBackground,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Home({ navigation }) {
  return (
    <ImageBackground
      source={require("../assets/background.png")} // Fondo (mesa con velas)
      style={styles.fondo}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.contenedor}>
        
        {/* Logo y bienvenida */}
        <View style={styles.contenedorLogo}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.bienvenida}>¡Bienvenido/a!</Text>
        </View>

        {/* Botones */}
        <View style={styles.contenedorBotones}>
          <TouchableOpacity
            style={styles.botonBlanco}
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.textoBotonBlanco}>Iniciar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonAmarillo}
            onPress={() => navigation.navigate("SignUp")}
          >
            <Text style={styles.textoBotonAmarillo}>Registrarse</Text>
          </TouchableOpacity>
        </View>

        {/* Redes sociales */}
        <View style={styles.redes}>
          <TouchableOpacity onPress={() => Linking.openURL("https://facebook.com")}>
            <Ionicons name="logo-facebook" size={28} color="#FFD600" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://instagram.com")}>
            <Ionicons name="logo-instagram" size={28} color="#FFD600" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => Linking.openURL("https://wa.me/5493871234567")}>
            <Ionicons name="logo-whatsapp" size={28} color="#FFD600" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    justifyContent: "center",
  },
  contenedor: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 40,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  contenedorLogo: {
    alignItems: "center",
    marginTop: 150, 
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 15,
  },
  bienvenida: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: -5,
  },
  contenedorBotones: {
    width: "80%",
    marginTop: 30,
  },
  botonBlanco: {
    borderWidth: 2,
    borderColor: "#fff",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
    marginBottom: 10,
    marginTop: -40
  },
  textoBotonBlanco: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  botonAmarillo: {
    backgroundColor: "#FFD600",
    paddingVertical: 14,
    borderRadius: 25,
    alignItems: "center",
  },
  textoBotonAmarillo: {
    color: "#000",
    fontWeight: "bold",
    fontSize: 16,
  },
  redes: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "50%",
  },
});
