import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  TouchableOpacity,
  Linking,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FontAwesome } from '@expo/vector-icons';

export default function Welcome() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ImageBackground
        source={require('../assets/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
        {/* Capa oscura para resaltar logo */}
        <View style={styles.overlay} />

    
        <View style={styles.container}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />

          <Text style={styles.welcomeText}>¡Bienvenido/a!</Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginText}>Iniciar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signupButton}
            onPress={() => navigation.navigate('SignUp')}
          >
            <Text style={styles.signupText}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* Íconos fijos al fondo */}
        <View style={styles.socialContainer}>
          <TouchableOpacity
            onPress={() =>
              Linking.openURL(
                'https://www.facebook.com/share/17XKBXxhDN/?mibextid=wwXIfr'
              )
            }
          >
            <FontAwesome name="facebook" size={26} color="#FCD73E" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://www.instagram.com/')}
          >
            <FontAwesome name="instagram" size={26} color="#FCD73E" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => Linking.openURL('https://wa.me/')}
          >
            <FontAwesome name="whatsapp" size={26} color="#FCD73E" />
          </TouchableOpacity>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)', // más oscura
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: 40, // baja un poco el bloque central sin afectar íconos
  },
  logo: {
  width: 200,
  height: 160,
  resizeMode: 'contain',
  marginBottom: 120, // 🔽 antes era 35, ahora más arriba
  marginTop: -30,   // 🔼 lo sube un poco más visualmente
},

  welcomeText: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 25,
  },
  loginButton: {
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    width: 280,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#fff',
  },
  loginText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  signupButton: {
    backgroundColor: '#FCD73E',
    borderRadius: 30,
    width: 280,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 90,
  },
  signupText: {
    color: '#000',
    fontSize: 17,
    fontWeight: 'bold',
  },
  socialContainer: {
    position: 'absolute',
    bottom: 30, 
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 130,
  },
});
