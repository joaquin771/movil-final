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
// ============================================================
// DATOS DE PROVINCIAS Y DEPARTAMENTOS (Argentina - Solo Salta)
// ============================================================
const PROVINCES_DATA = {
  "Salta": {
    name: "Salta",
    departments: {
      "Anta": ["Zona Centro", "Zona Norte", "Zona Sur"],
      "Cachi": ["Zona Centro", "Zona Este", "Zona Oeste"],
      "Cafayate": ["Zona Centro", "Zona Norte", "Zona Sur"],
      "Cerrillos": ["Zona Centro", "Zona Este", "Zona Oeste"],
      "Chicoana": ["Zona Centro", "Zona Norte", "Zona Sur"],
      "General Güemes": ["Zona Centro", "Zona Este", "Zona Oeste"],
      "General José de San Martín": ["Zona Centro", "Zona Norte", "Zona Sur"],
      "Guachipas": ["Zona Centro", "Zona Este"],
      "Iruya": ["Zona Centro", "Zona Norte"],
      "La Caldera": ["Zona Centro", "Zona Este", "Zona Oeste"],
      "La Candelaria": ["Zona Centro", "Zona Norte"],
      "La Poma": ["Zona Centro", "Zona Sur"],
      "La Viña": ["Zona Centro", "Zona Este", "Zona Oeste"],
      "Los Andes": ["Zona Centro", "Zona Norte", "Zona Sur"],
      "Metán": ["Zona Centro", "Zona Este", "Zona Oeste"],
      "Molinos": ["Zona Centro", "Zona Norte"],
      "Orán": ["Zona Centro", "Zona Norte", "Zona Sur"],
      "Rivadavia": ["Zona Centro", "Zona Este"],
      "Rosario de la Frontera": ["Zona Centro", "Zona Norte", "Zona Sur"],
      "Rosario de Lerma": ["Zona Centro", "Zona Este", "Zona Oeste"],
      "Salta Capital": ["Centro", "Norte", "Sur", "Este", "Oeste", "Villa San Lorenzo", "Tres Cerritos"],
      "San Carlos": ["Zona Centro", "Zona Norte"],
      "Santa Victoria": ["Zona Centro", "Zona Este"],
    },
  },
};

// ============================================================
// ÁREAS LOCALES DE TELEFONÍA (Solo Salta)
// ============================================================
const PHONE_AREAS = [
  { code: "+54 387", name: "Salta Capital", region: "Salta" },
  { code: "+54 3868", name: "Metán", region: "Salta" },
  { code: "+54 3872", name: "Rosario de la Frontera", region: "Salta" },
  { code: "+54 3873", name: "General Güemes", region: "Salta" },
  { code: "+54 3876", name: "Cafayate", region: "Salta" },
  { code: "+54 3877", name: "Orán", region: "Salta" },
  { code: "+54 3878", name: "Tartagal", region: "Salta" },
];
// ✨ VALIDACIÓN DE DNI CON VERIFICACIÓN BÁSICA
const validateDNI = (dni) => {
  const cleanDNI = String(dni).replace(/[^0-9]/g, "");
  if (!cleanDNI) return { valid: true, error: "" };

  if (!/^\d{7,8}$/.test(cleanDNI)) {
    return { valid: false, error: "El DNI debe contener 7 u 8 dígitos" };
  }

  const num = parseInt(cleanDNI, 10);
  if (num < 1 || num > 99999999) {
    return { valid: false, error: "DNI inválido" };
  }

  return { valid: true, error: "" };
};

// ✨ VALIDACIÓN DE EDAD (máximo 65 años)
const validateAge = (dob) => {
  if (!dob) return { valid: true, error: "" };

  const today = new Date();
  const birthDate = new Date(dob);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age > 65) {
    return { valid: false, error: "Debes tener máximo 65 años" };
  }

  return { valid: true, error: "" };
};

// ✨ VALIDACIÓN DE TELÉFONO (con área seleccionada)
const validatePhone = (areaCode, phoneNumber) => {
  if (!phoneNumber || phoneNumber.trim() === "") {
    return { valid: true, error: "" };
  }

  const digitsOnly = phoneNumber.replace(/[^\d]/g, "");

  // Validar que tenga entre 6-8 dígitos (varían según la zona)
  if (digitsOnly.length < 6 || digitsOnly.length > 8) {
    return {
      valid: false,
      error: "Número de teléfono debe tener entre 6-8 dígitos",
    };
  }

  return { valid: true, error: "" };
};

// ✨ VALIDACIÓN DE DIRECCIÓN MEJORADA (calle y número)
const validateStreetAddress = (street, number) => {
  if (!street || street.trim() === "") {
    return { valid: true, error: "" };
  }

  // Longitud: máximo 30 caracteres, mínimo 3 si se proporcionó
  if (street.trim().length < 3) {
    return {
      valid: false,
      error: "El nombre de la calle debe tener al menos 3 caracteres",
    };
  }

  if (street.trim().length > 30) {
    return {
      valid: false,
      error: "El nombre de la calle no puede exceder 30 caracteres",
    };
  }

  // Solo letras y espacios, guión y apóstrofe (sin números, sin emojis ni símbolos)
  try {
    if (!/^[\p{L}\s'-]+$/u.test(street.trim())) {
      return {
        valid: false,
        error: "La calle sólo puede contener letras y espacios",
      };
    }
  } catch (e) {
    // Fallback para motores sin soporte \p{L}
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]+$/.test(street.trim())) {
      return {
        valid: false,
        error: "La calle sólo puede contener letras y espacios",
      };
    }
  }

  // ✨ NUEVA VALIDACIÓN PARA EL NÚMERO
  if (number && number.trim() !== "") {
    // Permitir números, letras (para "S/N"), y algunos caracteres especiales comunes
    const numberPattern = /^[0-9A-Za-z\s\-\/]+$/;
    
    if (!numberPattern.test(number)) {
      return {
        valid: false,
        error: "El número contiene caracteres no válidos",
      };
    }

    if (number.trim().length > 10) {
      return {
        valid: false,
        error: "El número no puede exceder 10 caracteres",
      };
    }

    // Verificar si es "S/N" o similar (sin número)
    const sinNumero = /^(s\/n|sn|sin\s*número)$/i;
    if (!sinNumero.test(number.trim())) {
      // Si no es "S/N", debe contener al menos un dígito
      if (!/\d/.test(number)) {
        return {
          valid: false,
          error: "El número debe contener al menos un dígito o ser 'S/N'",
        };
      }
    }
  }

  return { valid: true, error: "" };
};
// ============================================================
// HEADER PERSONALIZADO
// ============================================================
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
// ============================================================
// MODAL DE SELECCIÓN GENÉRICA (Departamentos, Calles, Áreas)
// ============================================================
const SelectionModal = ({
  isVisible,
  onClose,
  title,
  options,
  selectedValue,
  onSelectValue,
  theme,
}) => {
  const [searchText, setSearchText] = useState("");

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
              {title}
            </Text>
          </View>

          {/* Buscador */}
          <TextInput
            style={[
              styles.searchInput,
              {
                backgroundColor: theme.background,
                color: theme.text,
                borderColor: theme.border,
              },
            ]}
            placeholder="Buscar..."
            placeholderTextColor={theme.textSecondary}
            value={searchText}
            onChangeText={setSearchText}
          />

          <ScrollView style={{ maxHeight: 300 }}>
            {filteredOptions.map((option) => {
              const selected = option === selectedValue;
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
                    onSelectValue(option);
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
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.primary}
                    />
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
// ============================================================
// MODAL DE GÉNERO
// ============================================================
const GenderModal = ({
  isVisible,
  onClose,
  selectedGender,
  onSelectGender,
  theme,
}) => {
  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={theme.primary}
                    />
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
// ============================================================
// MODAL DE TEMA
// ============================================================
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
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
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
// ============================================================
// COMPONENTE PRINCIPAL: PROFILE
// ============================================================
export default function Profile({ navigation }) {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const currentUser = auth.currentUser;

  // ============================================================
  // ESTADOS - MODALES
  // ============================================================
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isGenderModalVisible, setIsGenderModalVisible] = useState(false);
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);
  const [tempDob, setTempDob] = useState(null);
  const [isThemeModalVisible, setIsThemeModalVisible] = useState(false);
  const [isImageOptionsVisible, setIsImageOptionsVisible] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "warning",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    customTitle: "",
  });

  // ============================================================
  // ESTADOS - MODALES DE DIRECCIÓN
  // ============================================================
  const [isDepartmentModalVisible, setIsDepartmentModalVisible] = useState(false);
  const [isStreetModalVisible, setIsStreetModalVisible] = useState(false);

  // ============================================================
  // ESTADOS - MODALES DE TELÉFONO
  // ============================================================
  const [isPhoneAreaModalVisible, setIsPhoneAreaModalVisible] = useState(false);

  // ============================================================
  // ESTADOS DEL PERFIL - DIRECCIÓN
  // ============================================================
  const [province, setProvince] = useState("Salta");
  const [department, setDepartment] = useState("");
  const [street, setStreet] = useState("");
  const [streetNumber, setStreetNumber] = useState("");
  const [streetError, setStreetError] = useState("");

  // ============================================================
  // ESTADOS DEL PERFIL - TELÉFONO
  // ============================================================
  const [phoneArea, setPhoneArea] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // ============================================================
  // ESTADOS DEL PERFIL - GENERAL
  // ============================================================
  const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [profileImageUri, setProfileImageUri] = useState(
    currentUser?.photoURL
  );
  const [dni, setDni] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState(null);
  const [validationError, setValidationError] = useState("");

  // ============================================================
  // ANIMACIONES
  // ============================================================
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  // ============================================================
  // EFECTO AL MONTAR COMPONENTE
  // ============================================================
  useEffect(() => {
    loadUserData();
    startAnimations();
    requestPermissions();

    if (displayName) {
      const parts = displayName.trim().split(/\s+/);
      setFirstName(parts.shift() || "");
      setLastName(parts.join(" ") || "");
    }

    // ✨ NUEVO: Establecer Salta como provincia por defecto
    setProvince("Salta");
  }, []);

  // ============================================================
  // FUNCIONES DE ANIMACIÓN
  // ============================================================
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
  // ============================================================
  // CARGAR DATOS DEL USUARIO
  // ============================================================
  const loadUserData = async () => {
    if (!currentUser) return;
    try {
      const uid = currentUser.uid;
      const storedDni = await AsyncStorage.getItem(`dni_${uid}`);
      const storedProvince = await AsyncStorage.getItem(`province_${uid}`);
      const storedDepartment = await AsyncStorage.getItem(`department_${uid}`);
      const storedStreet = await AsyncStorage.getItem(`street_${uid}`);
      const storedStreetNumber = await AsyncStorage.getItem(
        `streetNumber_${uid}`
      );
      const storedPhoneArea = await AsyncStorage.getItem(`phoneArea_${uid}`);
      const storedPhoneNumber = await AsyncStorage.getItem(
        `phoneNumber_${uid}`
      );
      const storedGender = await AsyncStorage.getItem(`gender_${uid}`);
      const storedDobString = await AsyncStorage.getItem(`dob_${uid}`);

      if (storedDni) setDni(storedDni);
      if (storedProvince) setProvince(storedProvince);
      else setProvince("Salta"); // ✨ Por defecto Salta
      if (storedDepartment) setDepartment(storedDepartment);
      if (storedStreet) setStreet(storedStreet);
      if (storedStreetNumber) setStreetNumber(storedStreetNumber);
      if (storedPhoneArea) setPhoneArea(storedPhoneArea);
      if (storedPhoneNumber) setPhoneNumber(storedPhoneNumber);
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

  // ============================================================
  // SOLICITAR PERMISOS
  // ============================================================
  const requestPermissions = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        // silencioso
      }
      const camera = await ImagePicker.requestCameraPermissionsAsync();
      if (camera.status !== "granted") {
        // silencioso
      }
    }
  };
  // ============================================================
  // CAMBIO DE TEMA
  // ============================================================
  const handleThemeChange = () => {
    setIsThemeModalVisible(true);
  };

  const handleThemeSelection = async (value) => {
    const wantDark = value === "dark";
    try {
      toggleTheme(wantDark);
    } catch (e) {
      console.error("Error al cambiar tema:", e);
    } finally {
      setIsThemeModalVisible(false);
    }
  };

  // ============================================================
  // FUNCIONES AUXILIARES PARA DIRECCIÓN
  // ============================================================
  const getDepartmentsList = (selectedProvince) => {
    if (!selectedProvince || !PROVINCES_DATA[selectedProvince]) return [];
    return Object.keys(PROVINCES_DATA[selectedProvince].departments);
  };

  const getStreetsList = (selectedProvince, selectedDepartment) => {
    if (
      !selectedProvince ||
      !selectedDepartment ||
      !PROVINCES_DATA[selectedProvince]
    )
      return [];
    return (
      PROVINCES_DATA[selectedProvince].departments[selectedDepartment] || []
    );
  };

  // ============================================================
  // FUNCIONES AUXILIARES PARA TELÉFONO
  // ============================================================
  const getPhoneAreasList = () =>
    PHONE_AREAS.map((area) => `${area.code} - ${area.name}`);

  const getSelectedAreaCode = () => {
    if (!phoneArea) return "";
    const areaName = phoneArea.split(" - ")[0];
    return areaName;
  };
  // ============================================================
  // FUNCIONES DE SELECCIÓN DE IMÁGENES
  // ============================================================
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
        setAlertConfig({
          type: "success",
          customTitle: "Imagen seleccionada",
          message: "La imagen fue seleccionada correctamente.",
          onConfirm: () => setAlertVisible(false),
        });
        setAlertVisible(true);
      }
    } catch (e) {
      console.error("pickFromLibrary:", e);
      setAlertConfig({
        type: "error",
        customTitle: "Error",
        message: "No se pudo seleccionar la imagen. Intenta nuevamente.",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        setAlertConfig({
          type: "warning",
          customTitle: "Permiso denegado",
          message: "No se otorgó permiso para usar la cámara.",
          onConfirm: () => setAlertVisible(false),
        });
        setAlertVisible(true);
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
        setAlertConfig({
          type: "success",
          customTitle: "Imagen tomada",
          message: "La foto se tomó correctamente.",
          onConfirm: () => setAlertVisible(false),
        });
        setAlertVisible(true);
      }
    } catch (e) {
      console.error("takePhoto:", e);
      setAlertConfig({
        type: "error",
        customTitle: "Error",
        message: "No se pudo tomar la foto. Intenta nuevamente.",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    }
  };

  const pickImage = async () => {
    console.log('[Profile] pickImage called, isEditing=', isEditing, 'platform=', Platform.OS);
    // Forzar abrir el modal personalizado en todas las plataformas para consistencia
    setIsImageOptionsVisible(true);
  };

  // ============================================================
  // SUBIR IMAGEN A CLOUDINARY
  // ============================================================
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
        headers: {
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
  // ============================================================
  // MANEJO DE CAMBIO DE FECHA
  // ============================================================
  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setIsDatePickerVisible(false);
      if (event?.type === "set" && selectedDate) {
        const today = new Date();
        if (selectedDate > today) {
          setValidationError("La fecha de nacimiento no puede ser futura");
          setDob(null);
        } else {
          const ageValidation = validateAge(selectedDate);
          if (!ageValidation.valid) {
            setValidationError(ageValidation.error);
            setDob(null);
          } else {
            setDob(selectedDate);
            setValidationError("");
          }
        }
      }
      return;
    }
    if (selectedDate) setTempDob(selectedDate);
  };

  const openDatePicker = () => {
    setTempDob(dob || new Date());
    setIsDatePickerVisible(true);
  };

  // ============================================================
  // FUNCIÓN SOLO LETRAS
  // ============================================================
  const onlyLetters = (text) => {
    try {
      return text
        .replace(/[^'\-\p{L}\s]/gu, "")
        .replace(/\s{2,}/g, " ")
        .trimStart();
    } catch (e) {
      return text
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ\s'-]/g, "")
        .replace(/\s{2,}/g, " ")
        .trimStart();
    }
  };

  // ============================================================
  // OBTENER INICIALES
  // ============================================================
  const getInitials = () => {
    const name = firstName || displayName || currentUser?.email || "";
    return name.charAt(0).toUpperCase();
  };
  // ============================================================
  // GUARDAR CAMBIOS ✨ CON TODAS LAS VALIDACIONES
  // ============================================================
  const handleSave = async () => {
    Keyboard.dismiss();

    // ✨ VALIDAR DNI
    const dniValidation = validateDNI(dni);
    if (!dniValidation.valid) {
      setValidationError(dniValidation.error);
      return;
    }

    // ✨ VALIDAR DIRECCIÓN
    const streetValidation = validateStreetAddress(street, streetNumber);
    if (!streetValidation.valid) {
      setStreetError(streetValidation.error);
      return;
    }

    // ✨ VALIDAR TELÉFONO
    const phoneValidation = validatePhone(phoneArea, phoneNumber);
    if (!phoneValidation.valid) {
      setPhoneError(phoneValidation.error);
      return;
    }

    // ✨ VALIDAR EDAD
    const ageValidation = validateAge(dob);
    if (!ageValidation.valid) {
      setValidationError(ageValidation.error);
      return;
    }

    // Limpiar errores
    setValidationError("");
    setPhoneError("");
    setStreetError("");
    setIsSaving(true);

    try {
      const uid = currentUser.uid;
      const dobString = dob
        ? format(dob, "dd/MM/yyyy", { locale: es })
        : "";

      // Guardar en AsyncStorage
      await AsyncStorage.setItem(`dni_${uid}`, dni.trim());
      await AsyncStorage.setItem(`province_${uid}`, province);
      await AsyncStorage.setItem(`department_${uid}`, department);
      await AsyncStorage.setItem(`street_${uid}`, street.trim());
      await AsyncStorage.setItem(`streetNumber_${uid}`, streetNumber.trim());
      await AsyncStorage.setItem(`phoneArea_${uid}`, phoneArea);
      await AsyncStorage.setItem(`phoneNumber_${uid}`, phoneNumber.trim());
      await AsyncStorage.setItem(`gender_${uid}`, gender.trim());
      await AsyncStorage.setItem(`dob_${uid}`, dobString);

      // Subir imagen si es necesario
      let newPhotoURL = profileImageUri;
      if (profileImageUri && !profileImageUri.startsWith("http")) {
        newPhotoURL = await uploadImageToCloudinary(profileImageUri);
      }

      // Combinar nombre y apellido
      const combinedName = `${firstName.trim()}${
        lastName.trim() ? " " + lastName.trim() : ""
      }`.trim();

      // Actualizar perfil en Firebase
      await updateProfile(currentUser, {
        displayName: combinedName || displayName.trim(),
        photoURL: newPhotoURL || currentUser.photoURL,
      });

      setProfileImageUri(newPhotoURL || currentUser.photoURL);
      setDisplayName(combinedName || displayName);
      setIsEditing(false);

      // Mostrar alerta de éxito
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

  // ============================================================
  // CONFIRMAR Y CERRAR SESIÓN
  // ============================================================
  const handleLogout = async () => {
    try {
      await signOut(auth);
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
  // ============================================================
  // RETURN / JSX
  // ============================================================
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <CustomHeader
            onBackPress={() => navigation.goBack()}
            theme={theme}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <Animated.View
              style={[
                styles.content,
                { transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* ============================================================ */}
              {/* SECCIÓN DE AVATAR */}
              {/* ============================================================ */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarContainer}>
                  {profileImageUri ? (
                    <Image
                      source={{ uri: profileImageUri }}
                      style={[
                        styles.avatar,
                        { borderColor: theme.primary },
                      ]}
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
                              theme.text === "#FFFFFF"
                                ? "#1A1A1A"
                                : "#FFFFFF",
                          },
                        ]}
                      >
                        {getInitials()}
                      </Text>
                    </LinearGradient>
                  )}

                  <TouchableOpacity
                    onPress={() => {
                      if (!isEditing) {
                        setAlertConfig({
                          type: "warning",
                          customTitle: "Modo edición",
                          message: "Activa 'Editar Perfil' para cambiar la imagen.",
                          onConfirm: () => setAlertVisible(false),
                          onCancel: () => setAlertVisible(false),
                          confirmText: "Aceptar",
                          cancelText: "Cerrar",
                        });
                        setAlertVisible(true);
                        return;
                      }
                      pickImage();
                    }}
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
                </View>

                <Text style={[styles.name, { color: theme.text }]}>
                  {displayName ||
                    `${firstName} ${lastName}`.trim() ||
                    "Sin nombre"}
                </Text>
                <Text style={[styles.email, { color: theme.textSecondary }]}>
                  {currentUser?.email}
                </Text>
              </View>
              {/* ============================================================ */}
              {/* CARD DE INFORMACIÓN PERSONAL */}
              {/* ============================================================ */}
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text
                  style={[styles.cardTitle, { color: theme.primary }]}
                >
                  Información Personal
                </Text>

                {/* EMAIL - Solo lectura */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="mail"
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

                {/* NOMBRE */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="person"
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

                {/* APELLIDO */}
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
                    <Ionicons
                      name="card"
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
                      <Text
                        style={[
                          styles.errorText,
                          { color: theme.error },
                        ]}
                      >
                        {validationError}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
              {/* ============================================================ */}
              {/* CARD DE DIRECCIÓN ✨ CON PROVINCIA FIJA EN SALTA */}
              {/* ============================================================ */}
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text
                  style={[styles.cardTitle, { color: theme.primary }]}
                >
                  Dirección
                </Text>

                {/* PROVINCIA - SOLO LECTURA (SALTA) */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="map"
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
                      Provincia
                    </Text>
                    <View
                      style={[
                        styles.selectContainer,
                        { borderBottomColor: "transparent" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.inputReadOnly,
                          { color: theme.text },
                        ]}
                      >
                        Salta
                      </Text>
                      <Ionicons
                        name="lock-closed"
                        size={16}
                        color={theme.textSecondary}
                      />
                    </View>
                  </View>
                </View>
                {/* DEPARTAMENTO */}
                <TouchableOpacity
                  style={styles.inputGroup}
                  onPress={() =>
                    isEditing &&
                    setIsDepartmentModalVisible(true)
                  }
                  disabled={!isEditing}
                >
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
                      Departamento / Localidad
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
                          !department && {
                            color: theme.textSecondary,
                          },
                        ]}
                      >
                        {department || "Seleccionar departamento"}
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

                {/* CALLE - ahora editable (solo letras, sin emojis, max 30) */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons name="road" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text
                      style={[
                        styles.inputLabel,
                        { color: theme.textSecondary },
                      ]}
                    >
                      Calle
                    </Text>
                    {isEditing ? (
                      <TextInput
                        style={[
                          styles.input,
                          { color: theme.text, borderBottomColor: theme.border },
                          !isEditing && styles.inputDisabled,
                        ]}
                        value={street}
                        onChangeText={(t) => {
                          const cleaned = onlyLetters(t).slice(0, 30);
                          setStreet(cleaned);
                          setStreetError("");
                        }}
                        placeholder="Nombre de la calle"
                        placeholderTextColor={theme.textSecondary}
                        maxLength={30}
                        editable={isEditing}
                      />
                    ) : (
                      <Text
                        style={[
                          styles.inputReadOnly,
                          { color: theme.text },
                          !street && { color: theme.textSecondary },
                        ]}
                      >
                        {street || "Sin especificar"}
                      </Text>
                    )}
                    {streetError ? (
                      <Text style={[styles.errorText, { color: theme.error }]}>
                        {streetError}
                      </Text>
                    ) : null}
                  </View>
                </View>
                {/* NÚMERO MEJORADO */}
                <View style={styles.inputGroup}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                    <Ionicons name="hash" size={20} color={theme.primary} />
                  </View>
                  <View style={styles.inputWrapper}>
                    <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Número</Text>
                    <TextInput
                      style={[styles.input, { color: theme.text, borderBottomColor: theme.border }, !isEditing && styles.inputDisabled]}
                      value={streetNumber}
                      onChangeText={(text) => {
                        // Permitir números, letras, espacios, guiones y barras (elimina emojis/otros)
                        const cleaned = text.replace(/[^0-9A-Za-z\s\-\/]/g, "");
                        setStreetNumber(cleaned);
                        setStreetError("");
                      }}
                      placeholder="Ej: 1234, S/N, 123-A"
                      placeholderTextColor={theme.textSecondary}
                      maxLength={10}
                      editable={isEditing}
                    />
                    {streetError ? (
                      <Text style={[styles.errorText, { color: theme.error }]}>{streetError}</Text>
                    ) : (
                      <Text style={[styles.helperText, { color: theme.textSecondary }]}>
                        Ingresa el número o "S/N" si no tiene
                      </Text>
                    )}
                  </View>
                </View>
              </View>
              {/* ============================================================ */}
              {/* CARD DE TELÉFONO ✨ CON SELECCIÓN DE ÁREA */}
              {/* ============================================================ */}
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text
                  style={[styles.cardTitle, { color: theme.primary }]}
                >
                  Teléfono
                </Text>

                {/* ÁREA LOCAL */}
                <TouchableOpacity
                  style={styles.inputGroup}
                  onPress={() =>
                    isEditing && setIsPhoneAreaModalVisible(true)
                  }
                  disabled={!isEditing}
                >
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="call"
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
                      Área / Código Local
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
                          !phoneArea && {
                            color: theme.textSecondary,
                          },
                        ]}
                      >
                        {phoneArea || "Seleccionar área"}
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

                {/* NÚMERO DE TELÉFONO */}
                <View style={styles.inputGroup}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.background },
                    ]}
                  >
                    <Ionicons
                      name="keypad"
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
                      Número de Teléfono
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
                      value={phoneNumber}
                      onChangeText={(text) => {
                        const digits = text
                          .replace(/[^\d]/g, "")
                          .slice(0, 8);
                        setPhoneNumber(digits);
                        setPhoneError("");
                      }}
                      placeholder="Ej: 1234567"
                      placeholderTextColor={theme.textSecondary}
                      keyboardType="numeric"
                      maxLength={8}
                      editable={isEditing}
                    />
                    {phoneError ? (
                      <Text
                        style={[
                          styles.errorText,
                          { color: theme.error },
                        ]}
                      >
                        {phoneError}
                      </Text>
                    ) : phoneArea ? (
                      <Text
                        style={[
                          styles.helperText,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {getSelectedAreaCode()} {phoneNumber}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </View>
              {/* ============================================================ */}
              {/* CARD DE INFORMACIÓN ADICIONAL */}
              {/* ============================================================ */}
              <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text
                  style={[styles.cardTitle, { color: theme.primary }]}
                >
                  Información Adicional
                </Text>

                {/* GÉNERO */}
                <TouchableOpacity
                  style={styles.inputGroup}
                  onPress={() =>
                    isEditing && setIsGenderModalVisible(true)
                  }
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
                          !gender && {
                            color: theme.textSecondary,
                          },
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

                {/* FECHA DE NACIMIENTO */}
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
                          !dob && {
                            color: theme.textSecondary,
                          },
                        ]}
                      >
                        {dob
                          ? format(dob, "dd/MM/yyyy", {
                              locale: es,
                            })
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
              {/* ============================================================ */}
              {/* BOTÓN DE ACCIÓN PRINCIPAL */}
              {/* ============================================================ */}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={
                  isEditing
                    ? handleSave
                    : () => setIsEditing(true)
                }
                disabled={isSaving}
              >
                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.buttonGradient}
                >
                  {isSaving ? (
                    <ActivityIndicator
                      color="#1A1A1A"
                      size="small"
                    />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          isEditing ? "checkmark" : "create"
                        }
                        size={20}
                        color="#1A1A1A"
                      />
                      <Text style={styles.actionButtonText}>
                        {isEditing
                          ? "Guardar Cambios"
                          : "Editar Perfil"}
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              {/* ============================================================ */}
              {/* CARD DE CONFIGURACIÓN */}
              {/* ============================================================ */}
              <View
                style={[
                  styles.settingsCard,
                  { backgroundColor: theme.card },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: theme.primary },
                  ]}
                >
                  Configuración
                </Text>

                {/* TEMA */}
                <TouchableOpacity
                  style={[
                    styles.settingItem,
                    {
                      borderBottomColor: "transparent",
                    },
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
              {/* ============================================================ */}
              {/* CARD DE SEGURIDAD */}
              {/* ============================================================ */}
              <View
                style={[
                  styles.settingsCard,
                  { backgroundColor: theme.card },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    { color: theme.primary },
                  ]}
                >
                  Seguridad
                </Text>

                {/* CAMBIAR CONTRASEÑA */}
                <TouchableOpacity
                  style={[
                    styles.settingItem,
                    {
                      borderBottomColor: "transparent",
                    },
                  ]}
                  onPress={() =>
                    navigation.navigate("ChangePassword")
                  }
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

              {/* ============================================================ */}
              {/* BOTÓN CERRAR SESIÓN */}
              {/* ============================================================ */}
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
        {/* ============================================================ */}
        {/* DATE PICKER - ANDROID */}
        {/* ============================================================ */}
        {isDatePickerVisible && Platform.OS === "android" && (
          <DateTimePicker
            value={dob || new Date()}
            mode="date"
            display="default"
            onChange={handleDateChange}
            maximumDate={new Date()}
          />
        )}
        {/* ============================================================ */}
        {/* DATE PICKER - iOS */}
        {/* ============================================================ */}
        {Platform.OS === "ios" && isDatePickerVisible && (
          <Modal
            visible={isDatePickerVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setIsDatePickerVisible(false)}
            presentationStyle="overFullScreen"
          >
            <TouchableWithoutFeedback
              onPress={() => setIsDatePickerVisible(false)}
            >
              <View
                style={[
                  styles.modalOverlay,
                  { backgroundColor: theme.modalOverlay },
                ]}
              />
            </TouchableWithoutFeedback>
            <View style={styles.iosPickerContainer}>
              <View
                style={[
                  styles.iosPickerHeader,
                  { backgroundColor: theme.card },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setIsDatePickerVisible(false);
                    setTempDob(dob);
                  }}
                >
                  <Text
                    style={{
                      color: theme.textSecondary,
                      padding: 10,
                    }}
                  >
                    Cancelar
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setDob(tempDob);
                    setIsDatePickerVisible(false);
                  }}
                >
                  <Text
                    style={{
                      color: theme.primary,
                      fontWeight: "700",
                      padding: 10,
                    }}
                  >
                    Aceptar
                  </Text>
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
        {/* ============================================================ */}
        {/* MODALES DE DIRECCIÓN */}
        {/* ============================================================ */}
        <SelectionModal
          isVisible={isDepartmentModalVisible}
          onClose={() => setIsDepartmentModalVisible(false)}
          title="Selecciona Departamento"
          options={getDepartmentsList(province)}
          selectedValue={department}
          onSelectValue={(value) => {
            setDepartment(value);
            setStreet("");
          }}
          theme={theme}
        />

        <SelectionModal
          isVisible={isStreetModalVisible}
          onClose={() => setIsStreetModalVisible(false)}
          title="Selecciona Calle"
          options={getStreetsList(province, department)}
          selectedValue={street}
          onSelectValue={(value) => {
            setStreet(value);
          }}
          theme={theme}
        />

        {/* ============================================================ */}
        {/* MODAL DE ÁREA LOCAL DE TELÉFONO */}
        {/* ============================================================ */}
        <SelectionModal
          isVisible={isPhoneAreaModalVisible}
          onClose={() => setIsPhoneAreaModalVisible(false)}
          title="Selecciona Área Local"
          options={getPhoneAreasList()}
          selectedValue={phoneArea}
          onSelectValue={(value) => {
            setPhoneArea(value);
            setPhoneNumber("");
          }}
          theme={theme}
        />
        {/* ============================================================ */}
        {/* MODAL DE GÉNERO */}
        {/* ============================================================ */}
        <GenderModal
          isVisible={isGenderModalVisible}
          onClose={() => setIsGenderModalVisible(false)}
          selectedGender={gender}
          onSelectGender={(option) => {
            setGender(option);
          }}
          theme={theme}
        />

        {/* ============================================================ */}
        {/* MODAL DE TEMA */}
        {/* ============================================================ */}
        <ThemeModal
          isVisible={isThemeModalVisible}
          onClose={() => setIsThemeModalVisible(false)}
          selectedTheme={isDarkMode ? "dark" : "light"}
          onSelectTheme={handleThemeSelection}
          theme={theme}
        />
        {/* Modal de opciones de imagen */}
        <ImageOptionsModal
          isVisible={isImageOptionsVisible}
          onClose={() => setIsImageOptionsVisible(false)}
          onTakePhoto={async () => {
            setIsImageOptionsVisible(false);
            await takePhoto();
          }}
          onPickFromLibrary={async () => {
            setIsImageOptionsVisible(false);
            await pickFromLibrary();
          }}
          theme={theme}
        />
        {/* ============================================================ */}
        {/* NAVEGACIÓN INFERIOR */}
        {/* ============================================================ */}
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
            <Ionicons
              name="home-outline"
              size={26}
              color="#000"
            />
            <Text style={styles.textoNav}>Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Profile")}
            style={styles.itemNav}
          >
            <Ionicons name="person" size={26} color="#000" />
            <Text
              style={[
                styles.textoNav,
                { fontWeight: "900" },
              ]}
            >
              Perfil
            </Text>
          </TouchableOpacity>
        </View>
        {/* ============================================================ */}
        {/* MODAL DE LOGOUT */}
        {/* ============================================================ */}
        <Modal
          animationType="fade"
          transparent
          visible={showLogoutModal}
          onRequestClose={() => setShowLogoutModal(false)}
        >
          <TouchableWithoutFeedback
            onPress={() => setShowLogoutModal(false)}
          >
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
                  <Text
                    style={[
                      styles.modalTitle,
                      { color: theme.text },
                    ]}
                  >
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
        {/* ============================================================ */}
        {/* ALERTA PERSONALIZADA */}
        {/* ============================================================ */}
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

// Modal de opciones para imagen (Tomar foto / Elegir de la galería)
const ImageOptionsModal = ({ isVisible, onClose, onTakePhoto, onPickFromLibrary, theme }) => {
  const gradientColors = Array.isArray(theme.gradient) && theme.gradient.length ? theme.gradient : ['#FFD600', '#FFB300'];
  const isDark = theme && theme.text === '#FFFFFF';
  const galleryBg = isDark ? '#111' : theme.background || '#F2F2F2';

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.modalOverlay, { backgroundColor: theme.modalOverlay }]}>
          <TouchableWithoutFeedback>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <Ionicons name="images-outline" size={42} color={theme.primary} />
              <Text style={[styles.modalTitle, { color: theme.text, marginTop: 10 }]}>Seleccionar imagen</Text>
              <Text style={[styles.modalMessage, { color: theme.textSecondary }]}>Elige cómo deseas obtener tu imagen de perfil</Text>

              <View style={{ width: '100%', marginTop: 16 }}>
                <TouchableOpacity onPress={onTakePhoto} activeOpacity={0.85} style={{ marginBottom: 12 }}>
                  <LinearGradient
                    colors={gradientColors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', elevation: 6 }}
                  >
                    <Ionicons name="camera" size={18} color={'#1A1A1A'} />
                    <Text style={[styles.modalButtonTextConfirm, { color: '#1A1A1A', marginLeft: 10 }]}>Tomar foto</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={onPickFromLibrary} activeOpacity={0.85} style={{ marginBottom: 12 }}>
                  <View style={{ borderRadius: 14, paddingVertical: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', backgroundColor: galleryBg, borderWidth: 1, borderColor: theme.primary }}>
                    <Ionicons name="images" size={18} color={theme.primary} />
                    <Text style={[styles.modalButtonTextCancel, { color: theme.primary, marginLeft: 10 }]}>Elegir de la galería</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={onClose} activeOpacity={0.85}>
                  <View style={{ borderRadius: 14, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.background }}>
                    <Text style={[styles.modalButtonTextCancel, { color: theme.textSecondary }]}>Cancelar</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};
// ============================================================
// ESTILOS
// ============================================================
const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBackground: {
    width: "100%",
    height: 100,
    justifyContent: "center",
  },
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
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
  },
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
  helperText: { fontSize: 12, marginTop: 4 },
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

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
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

  searchInput: {
    marginHorizontal: 15,
    marginVertical: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 14,
  },

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
  themeItemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
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
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  settingText: { fontSize: 16 },
  settingValue: { fontSize: 14 },
});