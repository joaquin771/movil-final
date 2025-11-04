import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  Platform,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Animated,
  Keyboard,
  ImageBackground,
  Alert,
  ActionSheetIOS,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { signOut, updateProfile } from "firebase/auth";
import { auth } from "../src/firebaseConfig";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import CustomAlert from "../components/CustomAlert";
import { useTheme } from "../src/theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Cloudinary
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/duveiniyf/image/upload`;
const CLOUDINARY_UPLOAD_PRESET = "profile";

// Imágenes
const HEADER_IMAGE_SOURCE = require("../assets/header.jpg");
const LOGO_SOURCE = require("../assets/logo.png");

// Opciones de género
const GENDER_OPTIONS = ["Hombre", "Mujer", "Otros", "Prefiero no decirlo"];

// Validación de DNI
const validateDNI = (dni) => {
  const cleanDNI = String(dni).replace(/[^0-9]/g, "");
  if (!cleanDNI) return true; // campo vacío lo manejás aparte si es requerido

  // Debe tener 7 u 8 dígitos
  if (!/^\d{7,8}$/.test(cleanDNI)) return false;

  const num = parseInt(cleanDNI, 10);
  if (num < 1 || num > 99999999) return false;

  return true;
};

// Validación de teléfono
const validatePhone = (value) => {
  if (!value) return true; // vacío permitido si no es obligatorio
  const digits = value.replace(/[^\d]/g, "");
  return digits.length >= 6 && digits.length <= 15;
};

// Header personalizado
const CustomHeader = ({ onBackPress, theme }) => {
  return (
    <ImageBackground
      source={HEADER_IMAGE_SOURCE}
      style={styles.headerBackground}
      resizeMode="cover"
    >
      <View
        style={[styles.headerOverlay, { backgroundColor: theme.headerOverlay }]}
      />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.headerMenuButton} onPress={onBackPress}>
          <Ionicons name="arrow-back-outline" size={28} color={theme.primary} />
        </TouchableOpacity>
        <View style={styles.headerLogoContainer}>
          <Image
            source={LOGO_SOURCE}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.headerTitleText, { color: theme.primary }]}>
            Perfil
          </Text>
        </View>
      </View>
    </ImageBackground>
  );
};

const GenderModal = ({
  isVisible,
  onClose,
  selectedGender,
  onSelectGender,
  theme,
}) => {
  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: theme.modalOverlay },
        ]}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View
            style={[
              styles.pickerHeader,
              { borderBottomColor: theme.border },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              Selecciona tu género
            </Text>
          </View>

          <ScrollView style={{ maxHeight: 240 }}>
            {GENDER_OPTIONS.map((option) => {
              const selected = option === selectedGender;
              return (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.genderItem,
                    {
                      backgroundColor: theme.card,
                      borderBottomColor: theme.border,
                    },
                    selected && {
                      backgroundColor: theme.primary + "20",
                    },
                  ]}
                  onPress={() => {
                    onSelectGender(option === "Seleccionar" ? "" : option);
                    onClose();
                  }}
                >
                  <Text
                    style={[
                      styles.genderItemText,
                      { color: theme.text },
                      selected && { fontWeight: "700" },
                    ]}
                  >
                    {option}
                  </Text>
                  {selected && (
                    <Ionicons name="checkmark" size={18} color={theme.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.closeButton,
              { margin: 15, backgroundColor: theme.primary },
            ]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

// Modal de selección de tema
const ThemeModal = ({
  isVisible,
  onClose,
  selectedTheme,
  onSelectTheme,
  theme,
}) => {
  const themeOptions = [
    { value: "light", label: "Claro", icon: "sunny" },
    { value: "dark", label: "Oscuro", icon: "moon" },
  ];

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.modalOverlay,
          { backgroundColor: theme.modalOverlay },
        ]}
      >
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View
            style={[
              styles.pickerHeader,
              { borderBottomColor: theme.border },
            ]}
          >
            <Text style={[styles.pickerTitle, { color: theme.text }]}>
              Seleccionar Tema
            </Text>
          </View>

          <View style={{ paddingVertical: 10 }}>
            {themeOptions.map((option) => {
              const selected = option.value === selectedTheme;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.themeItem,
                    {
                      backgroundColor: theme.card,
                      borderBottomColor: theme.border,
                    },
                    selected && {
                      backgroundColor: theme.primary + "20",
                    },
                  ]}
                  onPress={() => {
                    onSelectTheme(option.value);
                    onClose();
                  }}
                >
                  <View style={styles.themeItemLeft}>
                    <View
                      style={[
                        styles.themeIconContainer,
                        { backgroundColor: theme.background },
                      ]}
                    >
                      <Ionicons
                        name={option.icon}
                        size={22}
                        color={
                          selected ? theme.primary : theme.textSecondary
                        }
                      />
                    </View>
                    <Text
                      style={[
                        styles.themeItemText,
                        { color: theme.text },
                        selected && {
                          fontWeight: "700",
                          color: theme.primary,
                        },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </View>
                  {selected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={24}
                      color={theme.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[
              styles.closeButton,
              { margin: 15, backgroundColor: theme.primary },
            ]}
            onPress={onClose}
          >
            <Text style={styles.closeButtonText}>Cerrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default function Profile({ navigation }) {
  // ✨ ahora usamos el contexto global de tema
  // esto hace que cuando cambies el tema acá, cambie TODA la app
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const currentUser = auth.currentUser;

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [tempDob, setTempDob] = useState(null);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "warning",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    customTitle: "",
  });

  // Estados del perfil
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImageUri, setProfileImageUri] = useState(currentUser?.photoURL);
  const [dni, setDni] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(null);
  const [validationError, setValidationError] = useState("");

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // abrir modal de tema
  const handleThemeChange = () => {
    setIsThemeModalVisible(true);
  };

  // seleccionado desde ThemeModal: 'light' | 'dark'
  const handleThemeSelection = async (value) => {
    const wantDark = value === "dark";
    try {
      toggleTheme(wantDark); // 👈 esto actualiza ThemeContext global y persiste en AsyncStorage
    } catch (e) {
      console.error("Error al cambiar tema:", e);
    } finally {
      setIsThemeModalVisible(false);
    }
  };

  useEffect(() => {
    loadUserData();
    startAnimations();
    requestPermissions();

    // inicializar nombre y apellido a partir de displayName (si existe)
    if (displayName) {
      const parts = displayName.trim().split(/\s+/);
      setFirstName(parts.shift() || "");
      setLastName(parts.join(" ") || "");
    }
  }, []);

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const loadUserData = async () => {
    if (!currentUser) return;
    try {
      const uid = currentUser.uid;
      const storedDni = await AsyncStorage.getItem(`dni_${uid}`);
      const storedAddress = await AsyncStorage.getItem(`address_${uid}`);
      const storedPhone = await AsyncStorage.getItem(`phone_${uid}`);
      const storedGender = await AsyncStorage.getItem(`gender_${uid}`);
      const storedDobString = await AsyncStorage.getItem(`dob_${uid}`);

      if (storedDni) setDni(storedDni);
      if (storedAddress) setAddress(storedAddress);
      if (storedPhone) setPhone(storedPhone);
      if (storedGender) setGender(storedGender);

      if (storedDobString) {
        const parts = storedDobString.split("/");
        if (parts.length === 3) {
          const dateObject = new Date(
            parseInt(parts[2]),
            parseInt(parts[1]) - 1,
            parseInt(parts[0])
          );
          setDob(dateObject);
        }
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        // silencioso
      }
      // solicitar permiso de cámara también (para tomar foto)
      const camera = await ImagePicker.requestCameraPermissionsAsync();
      if (camera.status !== "granted") {
        // silencioso
      }
    }
  };

  const pickFromLibrary = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error("pickFromLibrary:", e);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permiso denegado", "No se otorgó permiso para usar la cámara.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      if (!result.canceled) {
        setProfileImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.error("takePhoto:", e);
    }
  };

  const pickImage = async () => {
    // mostrar opciones nativas en iOS o Alert en Android
    if (Platform.OS === "ios" && ActionSheetIOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancelar", "Tomar foto", "Elegir de la galería"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) takePhoto();
          if (buttonIndex === 2) pickFromLibrary();
        }
      );
      return;
    }

    // Android / otros: Alert con botones
    Alert.alert(
      "Seleccionar imagen",
      "Elige una opción",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Tomar foto", onPress: takePhoto },
        { text: "Elegir de la galería", onPress: pickFromLibrary },
      ],
      { cancelable: true }
    );
  };

  const uploadImageToCloudinary = async (imageUri) => {
    if (!imageUri || imageUri.startsWith("http")) return imageUri;

    const formData = new FormData();
    formData.append("file", {
      uri: imageUri,
      type: "image/jpeg",
      name: `profile-${currentUser.uid}-${Date.now()}.jpg`,
    });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

    try {
      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: formData,
        headers:
          {
            Accept: "application/json",
            "Content-Type": "multipart/form-data",
          },
      });

      if (!response.ok) throw new Error("Error al subir imagen");
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Error:", error);
      return null;
    }
  };

  const handleDateChange = (event, selectedDate) => {
    // Android: se cierra automáticamente y event.type indica 'set' o 'dismissed'
    if (Platform.OS === "android") {
      setIsDatePickerVisible(false);
      if (event?.type === "set" && selectedDate) {
        const today = new Date();
        if (selectedDate > today) {
          setValidationError("La fecha de nacimiento no puede ser futura");
          setDob(null);
        } else {
          setDob(selectedDate);
          setValidationError("");
        }
      }
      return;
    }
    // iOS: actualizar tempDob mientras el spinner cambia; confirmar con Aceptar
    if (selectedDate) setTempDob(selectedDate);
  };

  const openDatePicker = () => {
    setTempDob(dob || new Date());
    setIsDatePickerVisible(true);
  };

  const handleSave = async () => {
    Keyboard.dismiss();

    if (!validateDNI(dni)) {
      setValidationError("El DNI debe contener 7 u 8 dígitos");
      return;
    }

    if (!validatePhone(phone)) {
      setPhoneError("Teléfono inválido — debe tener entre 6 y 15 dígitos");
      return;
    }

    setValidationError("");
    setIsSaving(true);

    try {
      const uid = currentUser.uid;
      const dobString = dob ? format(dob, "dd/MM/yyyy", { locale: es }) : "";

      await AsyncStorage.setItem(`dni_${uid}`, dni.trim());
      await AsyncStorage.setItem(`address_${uid}`, address.trim());
      await AsyncStorage.setItem(`phone_${uid}`, phone.trim());
      await AsyncStorage.setItem(`gender_${uid}`, gender.trim());
      await AsyncStorage.setItem(`dob_${uid}`, dobString);

      let newPhotoURL = profileImageUri;
      if (profileImageUri && !profileImageUri.startsWith("http")) {
        newPhotoURL = await uploadImageToCloudinary(profileImageUri);
      }

      const combinedName = `${firstName.trim()}${
        lastName.trim() ? " " + lastName.trim() : ""
      }`.trim();

      await updateProfile(currentUser, {
        displayName: combinedName || displayName.trim(),
        photoURL: newPhotoURL || currentUser.photoURL,
      });

      setProfileImageUri(newPhotoURL || currentUser.photoURL);
      setDisplayName(combinedName || displayName);
      setIsEditing(false);

      setAlertConfig({
        type: "success",
        customTitle: "¡Listo!",
        message: "Perfil actualizado exitosamente.",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    } catch (error) {
      console.error("Error:", error);
      setAlertConfig({
        type: "error",
        customTitle: "Error",
        message: "No se pudo actualizar el perfil. Intenta nuevamente.",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    } finally {
        setIsSaving(false);
    }
  };

  const confirmarCerrarSesion = useCallback(() => {
    setAlertConfig({
      type: "warning",
      message: "¿Estás seguro de que deseas cerrar sesión?",
      customTitle: "Confirmar Cierre de Sesión",
      onConfirm: async () => {
        setAlertVisible(false);
        try {
          await signOut(auth);
          // no navigation.reset/replace aquí, igual que en Products
        } catch (e) {
          console.error("signOut:", e);
          setAlertConfig({
            type: "error",
            customTitle: "Error",
            message: "No se pudo cerrar sesión. Intenta nuevamente.",
            onConfirm: () => setAlertVisible(false),
          });
          setAlertVisible(true);
        }
      },
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  }, [setAlertConfig, setAlertVisible]);

  // cerrar sesión y forzar reset de navegación al flujo de Login
  const handleLogout = async () => {
    try {
      await signOut(auth);
      // No usar navigation.reset() aquí
      // El useEffect en Navigation.js detectará el cambio en auth
      // y automáticamente cambiará isAuthenticated a false
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setAlertConfig({
        type: "error",
        customTitle: "Error",
        message: "No se pudo cerrar sesión. Intenta nuevamente.",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    }
  };

  const getInitials = () => {
    const name = firstName || displayName || currentUser?.email || "";
    return name.charAt(0).toUpperCase();
  };

  const onlyLetters = (text) => {
    // Permite letras Unicode (incluye Ñ/ñ y todas las vocales con acento),
    // espacios, guion y apóstrofe.
    try {
      // usa Unicode property escapes si están soportadas
      return text
        .replace(/[^'\-\p{L}\s]/gu, "")
        .replace(/\s{2,}/g, " ")
        .trimStart();
    } catch (e) {
      // fallback para motores que no soporten \p{L}
      return text
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]/g, "")
        .replace(/\s{2,}/g, " ")
        .trimStart();
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <CustomHeader onBackPress={() => navigation.goBack()} theme={theme} />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              style={[styles.content, { transform: [{ translateY: slideAnim }] }]}
            >
              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {profileImageUri ? (
                    <Image
                      source={{ uri: profileImageUri }}
                      style={[styles.avatar, { borderColor: theme.primary }]}
                    />
                  ) : (
                    <LinearGradient
                      colors={theme.gradient}
                      style={[
                        styles.avatarPlaceholder,
                        { borderColor: theme.primary },
                      ]}
                    >
                      <Text
                        style={[
                          styles.avatarInitials,
                          {
                            color:
                              theme.text === "#FFFFFF" ? "#1A1A1A" : "#FFFFFF",
                          },
                        ]}
                      >
                        {getInitials()}
                      </Text>
                    </LinearGradient>
                  )}

                  {isEditing && (
                    <TouchableOpacity
                      onPress={pickImage}
                      activeOpacity={0.8}
                      style={[
                        styles.cameraIconContainer,
                        {
                          backgroundColor: theme.primary,
                          borderColor: theme.background,
                        },
                      ]}
                    >
                      <Ionicons name="camera" size={20} color="#1A1A1A" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Nombre grande */}
                <Text style={[styles.name, { color: theme.text }]}>
                  {displayName ||
                    `${firstName} ${lastName}`.trim() ||
                    "Sin nombre"}
                </Text>
                <Text style={[styles.email, { color: theme.textSecondary }]}>
                  {currentUser?.email}
                </Text>
              </View>

              {/* Card de Información Personal */}
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.primary }]}>
                  Información Personal
                </Text>

                {/* Email */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="mail" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Email
                    </Text>
                    <Text
                      style={[
                        styles.inputReadOnly,
                        { color: theme.text },
                      ]}
                    >
                      {currentUser?.email || "Sin email"}
                    </Text>
                  </View>
                </View>

                {/* Nombre */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="person" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      NOMBRE
                    </Text>
                    {isEditing ? (
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: theme.text,
                            borderBottomColor: theme.border,
                          },
                        ]}
                        value={firstName}
                        onChangeText={(t) =>
                          setFirstName(onlyLetters(t).slice(0, 30))
                        }
                        placeholder="Ingresa tu nombre"
                        placeholderTextColor={theme.textSecondary}
                        maxLength={30}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.inputReadOnly,
                          { color: theme.text },
                        ]}
                      >
                        {firstName || "Sin especificar"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Apellido */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="person-outline"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      APELLIDO
                    </Text>
                    {isEditing ? (
                      <TextInput
                        style={[
                          styles.input,
                          {
                            color: theme.text,
                            borderBottomColor: theme.border,
                          },
                        ]}
                        value={lastName}
                        onChangeText={(t) =>
                          setLastName(onlyLetters(t).slice(0, 30))
                        }
                        placeholder="Ingresa tu apellido"
                        placeholderTextColor={theme.textSecondary}
                        maxLength={30}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.inputReadOnly,
                          { color: theme.text },
                        ]}
                      >
                        {lastName || "Sin especificar"}
                      </Text>
                    )}
                  </View>
                </View>

                {/* DNI */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="card" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      DNI
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderBottomColor: theme.border,
                        },
                        !isEditing && styles.inputDisabled,
                      ]}
                      value={dni}
                      onChangeText={(text) => {
                        setDni(text.replace(/[^\d]/g, "").slice(0, 8));
                        setValidationError("");
                      }}
                      placeholder="Ej: 12345678"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      maxLength={8}
                      editable={isEditing}
                    />
                    {validationError ? (
                      <Text style={[styles.errorText, { color: theme.error }]}>
                        {validationError}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {/* Dirección */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="location"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Dirección
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderBottomColor: theme.border,
                        },
                        !isEditing && styles.inputDisabled,
                      ]}
                      value={address}
                      onChangeText={setAddress}
                      placeholder="Calle, número, ciudad"
                      placeholderTextColor={theme.textSecondary}
                      editable={isEditing}
                    />
                  </View>
                </View>

                {/* Teléfono */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="call" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Teléfono
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          color: theme.text,
                          borderBottomColor: theme.border,
                        },
                        !isEditing && styles.inputDisabled,
                      ]}
                      value={phone}
                      onChangeText={(text) => {
                        // permitir + solo al inicio y solo dígitos después
                        let v = text.replace(/[^\d+]/g, "");
                        if (v.indexOf("+") > 0) {
                          // eliminar signos + que no estén al inicio
                          v = v.replace(/\+/g, "");
                        }
                        if (v.startsWith("+")) {
                          const digits = v.slice(1).replace(/\D/g, "").slice(0, 15);
                          v = "+" + digits;
                        } else {
                          v = v.replace(/\D/g, "").slice(0, 15);
                        }
                        setPhone(v);
                        setPhoneError("");
                      }}
                      placeholder="Ej: +5491112345678 o 91112345678"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="phone-pad"
                      editable={isEditing}
                    />
                    {phoneError ? (
                      <Text style={[styles.errorText, { color: theme.error }]}>
                        {phoneError}
                      </Text>
                    ) : (
                      <Text
                        style={[
                          styles.helperText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        Formato: +[código país][número] o [número]. 6-15 dígitos.
                      </Text>
                    )}
                  </View>
                </View>

                {/* Género */}
                <TouchableOpacity
                  style={styles.inputGroup}
                  onPress={() => isEditing && setIsGenderModalVisible(true)}
                  disabled={!isEditing}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="male-female"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Género
                    </Text>
                    <View
                      style={[
                        styles.selectContainer,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.inputReadOnly,
                          { color: theme.text },
                          !gender && { color: theme.textSecondary },
                        ]}
                      >
                        {gender || "Sin especificar"}
                      </Text>
                      {isEditing && (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.textSecondary}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Fecha de Nacimiento */}
                <TouchableOpacity
                  style={styles.inputGroup}
                  onPress={() => isEditing && openDatePicker()}
                  disabled={!isEditing}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="calendar"
                      size={20}
                      color={theme.primary}
                    />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Fecha de Nacimiento
                    </Text>
                    <View
                      style={[
                        styles.selectContainer,
                        { borderBottomColor: theme.border },
                      ]}
                    >
                      <Text
                        style={[
                          styles.inputReadOnly,
                          { color: theme.text },
                          !dob && { color: theme.textSecondary },
                        ]}
                      >
                        {dob
                          ? format(dob, "dd/MM/yyyy", { locale: es })
                          : "Seleccionar"}
                      </Text>
                      {isEditing && (
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color={theme.textSecondary}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>

              {/* Botón de Acción */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={isEditing ? handleSave : () => setIsEditing(true)}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator color="#1A1A1A" size="small" />
                  ) : (
                    <>
                      <Ionicons
                        name={isEditing ? "checkmark" : "create"}
                        size={20}
                        color="#1A1A1A"
                      />
                      <Text style={styles.actionButtonText}>
                        {isEditing ? "Guardar Cambios" : "Editar Perfil"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Configuración */}
              <View
                style={[
                  styles.settingsCard,
                  { backgroundColor: theme.card },
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.primary }]}>
                  Configuración
                </Text>

                {/* Tema */}
                <TouchableOpacity
                  style={[
                    styles.settingItem,
                    { borderBottomColor: "transparent" },
                  ]}
                  onPress={handleThemeChange}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons
                      name={isDarkMode ? "moon" : "sunny"}
                      size={20}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.settingText,
                        { color: theme.text },
                      ]}
                    >
                      Tema
                    </Text>
                  </View>
                  <View style={styles.settingRight}>
                    <Text
                      style={[
                        styles.settingValue,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {isDarkMode ? "Oscuro" : "Claro"}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={theme.textSecondary}
                    />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Seguridad */}
              <View
                style={[
                  styles.settingsCard,
                  { backgroundColor: theme.card },
                ]}
              >
                <Text style={[styles.cardTitle, { color: theme.primary }]}>
                  Seguridad
                </Text>

                {/* Cambiar Contraseña */}
                <TouchableOpacity
                  style={[
                    styles.settingItem,
                    { borderBottomColor: "transparent" },
                  ]}
                  onPress={() => navigation.navigate("ChangePassword")}
                >
                  <View style={styles.settingLeft}>
                    <Ionicons
                      name="key-outline"
                      size={20}
                      color={theme.primary}
                    />
                    <Text
                      style={[
                        styles.settingText,
                        { color: theme.text },
                      ]}
                    >
                      Cambiar Contraseña
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={theme.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Botón Cerrar Sesión */}
              <TouchableOpacity
                style={styles.logoutButton}
                onPress={() => setShowLogoutModal(true)}
              >
                <View
                  style={[
                    styles.logoutButtonContent,
                    { 
                      backgroundColor: theme.card,
                      borderColor: theme.error + "40",
                    },
                  ]}
                >
                  <Ionicons
                    name="log-out-outline"
                    size={24}
                    color={theme.error}
                  />
                  <Text
                    style={[
                      styles.logoutButtonText,
                      { color: theme.error },
                    ]}
                  >
                    Cerrar Sesión
                  </Text>
                </View>
              </TouchableOpacity>

              <View style={{ height: 100 }} />
            </Animated.View>
          </ScrollView>
        </Animated.View>

        {/* Date Picker - Android / iOS */}
        {isDatePickerVisible && Platform.OS === "android" && (
          <DateTimePicker
            value={dob || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}

        {Platform.OS === "ios" && isDatePickerVisible && (
          <Modal
            visible={isDatePickerVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsDatePickerVisible(false)}
            presentationStyle="overFullScreen"
          >
            <TouchableWithoutFeedback onPress={() => setIsDatePickerVisible(false)}>
              <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]} />
            </TouchableWithoutFeedback>
            <View style={styles.iosPickerContainer}>
              <View style={[styles.iosPickerHeader, { backgroundColor: theme.card }]}>
                <TouchableOpacity onPress={() => { setIsDatePickerVisible(false); setTempDob(dob); }}>
                  <Text style={{ color: theme.textSecondary, padding: 10 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setDob(tempDob); setIsDatePickerVisible(false); }}>
                  <Text style={{ color: theme.primary, fontWeight: "700", padding: 10 }}>Aceptar</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={tempDob || new Date()}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                maximumDate={new Date()}
              />
            </View>
          </Modal>
        )}

        {/* Modal de Género */}
        <GenderModal
          isVisible={isGenderModalVisible}
          onClose={() => setIsGenderModalVisible(false)}
          selectedGender={gender}
          onSelectGender={(option) => {
            setGender(option);
          }}
          theme={theme}
        />

        {/* Modal de Tema */}
        <ThemeModal
          isVisible={isThemeModalVisible}
          onClose={() => setIsThemeModalVisible(false)}
          selectedTheme={isDarkMode ? "dark" : "light"}
          onSelectTheme={handleThemeSelection}
          theme={theme}
        />

        {/* Navegación Inferior */}
        <View
          style={[
            styles.navInferior,
            { backgroundColor: theme.primary },
          ]}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            style={styles.itemNav}
          >
            <Ionicons name="home-outline" size={26} color="#000" />
            <Text style={styles.textoNav}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={styles.itemNav}
          >
            <Ionicons name="person" size={26} color="#000" />
            <Text style={[styles.textoNav, { fontWeight: "900" }]}>
              Perfil
            </Text>
          </TouchableOpacity>
        </View>

        {/* Modal de Logout */}
        <Modal
          animationType="fade"
          transparent
          visible={showLogoutModal}
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowLogoutModal(false)}>
            <View
              style={[
                styles.modalOverlay,
                { backgroundColor: theme.modalOverlay },
              ]}
            >
              <TouchableWithoutFeedback>
                <View
                  style={[
                    styles.modalContent,
                    { backgroundColor: theme.card },
                  ]}
                >
                  <Ionicons
                    name="log-out"
                    size={48}
                    color={theme.primary}
                  />
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    Cerrar Sesión
                  </Text>
                  <Text
                    style={[
                      styles.modalMessage,
                      { color: theme.textSecondary },
                    ]}
                  >
                    ¿Estás seguro que deseas salir?
                  </Text>
                  <View style={styles.modalButtons}>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.modalButtonCancel,
                        { backgroundColor: theme.background },
                      ]}
                      onPress={() => setShowLogoutModal(false)}
                    >
                      <Text
                        style={[
                          styles.modalButtonTextCancel,
                          { color: theme.text },
                        ]}
                      >
                        Cancelar
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.modalButton,
                        styles.modalButtonConfirm,
                      ]}
                      onPress={async () => {
                        setShowLogoutModal(false);
                        await handleLogout();
                      }}
                    >
                      <LinearGradient
                        colors={theme.gradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.modalButtonGradient}
                      >
                        <Text style={styles.modalButtonTextConfirm}>
                          Salir
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        {/* Alerta Personalizada */}
        <CustomAlert
          isVisible={alertVisible}
          type={alertConfig.type}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
          onCancel={alertConfig.onCancel}
          customTitle={alertConfig.customTitle}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBackground: { width: "100%", height: 100, justifyContent: "center" },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "ios" ? 20 : 10,
  },
  headerMenuButton: { padding: 8 },
  headerLogoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    marginLeft: -36,
  },
  logoImage: { width: 32, height: 32, marginRight: 8 },
  headerTitleText: { fontSize: 20, fontWeight: "bold" },

  scrollContent: { flexGrow: 1, paddingBottom: 100 },
  content: { padding: 20 },

  avatarSection: { alignItems: "center", marginBottom: 30 },
  avatarContainer: { marginBottom: 15 },
  avatar: { width: 120, height: 120, borderRadius: 60, borderWidth: 4 },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 4,
  },
  avatarInitials: { fontSize: 48, fontWeight: "bold" },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    borderRadius: 20,
    padding: 8,
    borderWidth: 3,
  },

  name: { fontSize: 28, fontWeight: "bold", marginBottom: 5 },
  email: { fontSize: 14 },

  card: { borderRadius: 20, padding: 20, marginBottom: 20 },
  settingsCard: { borderRadius: 20, padding: 20, marginBottom: 20 },

  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },

  inputGroup: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  inputWrapper: { flex: 1 },
  inputLabel: {
    fontSize: 12,
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8,
  },
  inputDisabled: { borderBottomColor: "transparent" },
  inputReadOnly: { fontSize: 16, paddingVertical: 8 },

  selectContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
  },

  errorText: { fontSize: 12, marginTop: 5 },

  actionButton: {
    borderRadius: 30,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#FFD600",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    marginBottom: 15,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginLeft: 8,
  },

  logoutButton: {
    marginTop: 10,
    marginBottom: 20,
  },
  logoutButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 30,
    borderRadius: 20,
    borderWidth: 2,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },

  navInferior: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: 85,
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    elevation: 10,
  },
  itemNav: { alignItems: "center" },
  textoNav: { fontSize: 12, fontWeight: "600", color: "#000" },

  modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center" },
  modalContent: {
    borderRadius: 24,
    width: SCREEN_WIDTH * 0.85,
    maxWidth: 400,
    padding: 20,
    alignItems: "center",
  },
  iosPickerContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: "hidden",
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 15,
    marginBottom: 10,
  },
  modalMessage: { fontSize: 16, textAlign: "center", marginBottom: 25 },
  modalButtons: { flexDirection: "row", gap: 12, width: "100%" },
  modalButton: { flex: 1, borderRadius: 12, overflow: "hidden" },
  modalButtonCancel: {},
  modalButtonConfirm: { elevation: 3 },
  modalButtonGradient: { paddingVertical: 14, alignItems: "center" },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 14,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
  },

  pickerHeader: { width: "100%", padding: 15, borderBottomWidth: 1 },
  pickerTitle: { fontSize: 18, fontWeight: "bold", textAlign: "center" },

  closeButton: {
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: "#1A1A1A",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },

  genderItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  genderItemText: { fontSize: 16 },

  themeItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  themeItemLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  themeItemText: { fontSize: 16, fontWeight: "500" },

  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  settingText: { fontSize: 16 },
  settingValue: { fontSize: 14 },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});