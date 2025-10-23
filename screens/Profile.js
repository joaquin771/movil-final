import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    ScrollView,
    SafeAreaView,
    TextInput,
    Platform,
    Dimensions,
    ImageBackground,
    Modal,
    TouchableWithoutFeedback,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth } from "../src/firebaseConfig"; 
import { signOut, updateProfile } from "firebase/auth";
import CustomAlert from "../components/CustomAlert"; 
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker"; 
import { format } from "date-fns";
import { es } from "date-fns/locale"; // 📅 Para español

const CLOUDINARY_CLOUD_NAME = 'duveiniyf'; 
const CLOUDINARY_UPLOAD_PRESET = 'profile';
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/duveiniyf/image/upload`;

const screenWidth = Dimensions.get("window").width;
const DRAWER_WIDTH = screenWidth * 0.75;
const HEADER_IMAGE_SOURCE = require("../assets/header.jpg"); 
const DRAWER_HEADER_IMAGE_SOURCE = require("../assets/headerhome.jpg"); 
const LOGO_SOURCE = require("../assets/logo.png"); 

const COLORS = {
    light: {
        background: "#F7F7F7",
        card: "#FFFFFF",
        text: "#000000",
        secondaryText: "#333333",
        separator: "#f0f0f0",
    },
    dark: {
        background: "#121212",
        card: "#1E1E1E",
        text: "#FFFFFF",
        secondaryText: "#CCCCCC",
        separator: "#333333",
    },
};
const PRIMARY_COLOR = "#FFD600";
const BACKGROUND_COLOR = "#000";
const TEXT_COLOR = "#fff";

const GENDER_OPTIONS = [
    "Seleccionar", 
    "Hombre", 
    "Mujer", 
    "No especificado", 
    "Prefiero no decirlo"
];

const validateDNI = (dni) => {
    const cleanDNI = dni.replace(/[^0-9]/g, ''); 
    const regex = /^\d{7,8}$/;
    if (!dni.trim()) return true; 
    return regex.test(cleanDNI);
};

const validatePhoneNumber = (number) => {
    const cleanNumber = number.replace(/[^0-9]/g, '');
    const regex = /^\d{10}$/; 
    
    if (!number.trim()) return true; 
    return regex.test(cleanNumber);
};

// ✨ NUEVO: Tab Navigation Component
const TabNavigation = ({ currentScreen, onNavigate, isDarkMode }) => {
    const currentColors = isDarkMode ? COLORS.dark : COLORS.light;
    
    return (
        <View style={[tabStyles.container, { backgroundColor: PRIMARY_COLOR }]}>
            {/* Tab Inicio */}
            <TouchableOpacity 
                style={[tabStyles.tab, currentScreen === 'Home' && tabStyles.activeTab]}
                onPress={() => onNavigate('Home')}
            >
                <Ionicons 
                    name={currentScreen === 'Home' ? "home" : "home-outline"} 
                    size={24} 
                    color="#000" 
                />
                <Text style={tabStyles.tabText}>Inicio</Text>
            </TouchableOpacity>

            {/* Tab Perfil */}
            <TouchableOpacity 
                style={[tabStyles.tab, currentScreen === 'Profile' && tabStyles.activeTab]}
                onPress={() => onNavigate('Profile')}
            >
                <Ionicons 
                    name={currentScreen === 'Profile' ? "person" : "person-outline"} 
                    size={24} 
                    color="#000" 
                />
                <Text style={tabStyles.tabText}>Perfil</Text>
            </TouchableOpacity>
        </View>
    );
};

const CustomHeader = React.memo(({ onMenuPress }) => {
    return (
        <ImageBackground source={HEADER_IMAGE_SOURCE} style={headerStyles.headerBackground} resizeMode="cover">
            <View style={[headerStyles.headerOverlay, { backgroundColor: "rgba(0, 0, 0, 0.65)" }]} />
            <View style={headerStyles.headerContent}>
                <TouchableOpacity style={headerStyles.headerMenuButton} onPress={onMenuPress}>
                    <Ionicons name="menu-outline" size={28} color="#FFD600" />
                </TouchableOpacity>
                <View style={headerStyles.headerLogoContainer}>
                    <Image source={LOGO_SOURCE} style={headerStyles.logoImage} resizeMode="contain" />
                    <Text style={headerStyles.headerTitleText}>Perfil</Text>
                </View>
                <View style={headerStyles.headerLogoutButton} /> 
            </View>
        </ImageBackground>
    );
});

const DrawerItem = ({ icon, label, onPress, isCurrent, isDarkMode, toggleDarkMode }) => {
    const currentColors = isDarkMode ? COLORS.dark : COLORS.light;
    const itemStyle = [
        drawerStyles.drawerItem,
        { borderBottomColor: currentColors.separator },
        isCurrent && { backgroundColor: "rgba(255, 214, 0, 0.2)" },
    ];
    const labelStyle = [
        drawerStyles.drawerItemLabel,
        { color: currentColors.secondaryText },
    ];
    const iconColor = currentColors.secondaryText;

    if (label === "Modo Oscuro") {
        return (
            <TouchableOpacity style={itemStyle} onPress={toggleDarkMode}>
                <Ionicons name={isDarkMode ? "sunny-outline" : "moon-outline"} size={24} color={iconColor} />
                <Text style={labelStyle}>{isDarkMode ? "Modo Claro" : "Modo Oscuro"}</Text>
            </TouchableOpacity>
        );
    }

    return (
        <TouchableOpacity style={itemStyle} onPress={onPress}>
            <Ionicons name={icon} size={24} color={iconColor} />
            <Text style={labelStyle}>{label}</Text>
        </TouchableOpacity>
    );
};

const DrawerMenu = ({
    isOpen,
    onClose,
    navigation,
    confirmarCerrarSesion,
    user,
    isDarkMode,
    toggleDarkMode,
    setAlertConfig, 
    setAlertVisible,
}) => {
    
    const navigateToScreen = useCallback(
        (screenName, displayMessage) => {
            onClose();
            if (screenName) {
                navigation.navigate(screenName);
            } else {
                setAlertConfig({
                    type: "info",
                    message: displayMessage,
                    customTitle: "Próximamente",
                    onConfirm: () => setAlertVisible(false),
                    onCancel: undefined,
                });
                setAlertVisible(true);
            }
        },
        [onClose, navigation, setAlertConfig, setAlertVisible]
    );

    const displayName = user?.displayName || "Empleado";
    const email = user?.email || "Sin Email";
    const photoURL = user?.photoURL;

    const currentColors = isDarkMode ? COLORS.dark : COLORS.light;
    const drawerBackgroundColor = currentColors.card;

    return (
        <Modal animationType="fade" transparent visible={isOpen} onRequestClose={onClose}>
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={drawerStyles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={[drawerStyles.drawer, { backgroundColor: drawerBackgroundColor }]}>
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <ImageBackground
                                    source={DRAWER_HEADER_IMAGE_SOURCE}
                                    style={drawerStyles.profileHeaderBackground}
                                    resizeMode="cover"
                                >
                                    <View style={drawerStyles.profileHeaderOverlay}>
                                        {photoURL ? (
                                            <Image source={{ uri: photoURL }} style={drawerStyles.profileImage} />
                                        ) : (
                                            <Ionicons name="person-circle-outline" size={70} color="#FFD600" />
                                        )}
                                        <Text style={[drawerStyles.profileName, { color: TEXT_COLOR }]} numberOfLines={1}>
                                            {displayName}
                                        </Text>
                                        <Text style={[drawerStyles.profileEmail, { color: '#ccc' }]} numberOfLines={1}>
                                            {email}
                                        </Text>
                                    </View>
                                </ImageBackground>

                                <DrawerItem icon="home-outline" label="Inicio (Dashboard)" onPress={() => navigateToScreen("Home")} isDarkMode={isDarkMode} />
                                <DrawerItem icon="cube-outline" label="Productos" onPress={() => navigateToScreen("Products")} isDarkMode={isDarkMode} />
                                <DrawerItem icon="people-outline" label="Empleados" onPress={() => navigateToScreen(null, "Módulo de Empleados en desarrollo.")} isDarkMode={isDarkMode} />
                                <DrawerItem icon="receipt-outline" label="Pedidos" onPress={() => navigateToScreen(null, "Módulo de Pedidos en desarrollo.")} isDarkMode={isDarkMode} />
                                <DrawerItem icon="location-outline" label="Entregas" onPress={() => navigateToScreen(null, "Módulo de Entregas en desarrollo.")} isDarkMode={isDarkMode} />
                                <DrawerItem icon="alert-circle-outline" label="Incidentes" onPress={() => navigateToScreen(null, "Módulo de Incidentes en desarrollo.")} isDarkMode={isDarkMode} />
                                
                                <View style={{ marginVertical: 10 }} />
                                
                                <DrawerItem
                                    icon={isDarkMode ? "sunny-outline" : "moon-outline"}
                                    label="Modo Oscuro"
                                    onPress={toggleDarkMode}
                                    isDarkMode={isDarkMode}
                                    toggleDarkMode={toggleDarkMode}
                                />

                                <View style={{ marginVertical: 20 }} />
                                
                                <DrawerItem
                                    icon="log-out-outline"
                                    label="Cerrar Sesión"
                                    onPress={() => {
                                        onClose();
                                        confirmarCerrarSesion();
                                    }}
                                    isDarkMode={isDarkMode}
                                />
                            </ScrollView>
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
};

export default function Profile({ navigation }) {
    const currentUser = auth.currentUser;

    const [isEditing, setIsEditing] = useState(false);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false); 
    const [isGenderModalVisible, setIsGenderModalVisible] = useState(false); 
    const [isDatePickerVisible, setIsDatePickerVisible] = useState(false); 
    const [isSaving, setIsSaving] = useState(false);

    const currentColors = useMemo(() => isDarkMode ? COLORS.dark : COLORS.light, [isDarkMode]);

    const [displayName, setDisplayName] = useState(currentUser?.displayName || "");
    const [profileImageUri, setProfileImageUri] = useState(currentUser?.photoURL);
    
    const [dni, setDni] = useState("");
    const [address, setAddress] = useState("");
    const [gender, setGender] = useState(""); 
    const [dob, setDob] = useState(null); 
    const [phoneNumber, setPhoneNumber] = useState("");

    const [validationErrors, setValidationErrors] = useState({});

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertConfig, setAlertConfig] = useState({ 
        type: "success",
        message: "",
        customTitle: "",
        onConfirm: () => setAlertVisible(false),
        onCancel: () => setAlertVisible(false),
    });
    
    const toggleDarkMode = useCallback(async () => {
        const newMode = !isDarkMode;
        setIsDarkMode(newMode);
        try {
            await AsyncStorage.setItem("darkMode", newMode.toString());
        } catch (e) {
            console.error("Error al guardar modo oscuro:", e);
        }
    }, [isDarkMode]);
    
    const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);
    
    const handleTabNavigation = useCallback((screen) => {
        if (screen === 'Home') {
            navigation.navigate('Home');
        }
        // Si es 'Profile', ya estamos aquí, no hacer nada
    }, [navigation]);
    
    useEffect(() => {
        if (!currentUser) return; 

        const loadUserData = async () => {
            try {
                const uid = currentUser.uid;
                const storedDni = await AsyncStorage.getItem(`dni_${uid}`);
                const storedAddress = await AsyncStorage.getItem(`address_${uid}`);
                const storedGender = await AsyncStorage.getItem(`gender_${uid}`);
                const storedDobString = await AsyncStorage.getItem(`dob_${uid}`); 
                const storedNumber = await AsyncStorage.getItem(`phone_${uid}`);
                const storedMode = await AsyncStorage.getItem("darkMode");

                if (storedDni) setDni(storedDni);
                if (storedAddress) setAddress(storedAddress);
                if (storedGender) setGender(storedGender);
                
                if (storedDobString) {
                    const parts = storedDobString.split('/');
                    if (parts.length === 3) {
                        const dateObject = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                        setDob(dateObject);
                    }
                }
                
                if (storedNumber) setPhoneNumber(storedNumber);
                if (storedMode !== null) setIsDarkMode(storedMode === "true");
                
            } catch (e) {
                console.error("Error al cargar datos del perfil extendido:", e);
            }
        };
        loadUserData();

        (async () => {
            if (Platform.OS !== 'web') {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permiso Denegado', 'Necesitamos permiso para acceder a tu galería.');
                }
            }
        })();

    }, [currentUser]);

    const handleDateChange = useCallback((event, selectedDate) => {
        setIsDatePickerVisible(false);
        if (event.type === 'set' && selectedDate) {
            const today = new Date();
            if (selectedDate > today) {
                setValidationErrors(prev => ({ ...prev, dob: "La fecha de nacimiento no puede ser una fecha futura." }));
                setDob(null); 
            } else {
                setDob(selectedDate);
                setValidationErrors(prev => {
                    const { dob, ...rest } = prev;
                    return rest;
                });
            }
        }
    }, []);

    const uploadImageToCloudinary = async (imageUri) => {
        if (!imageUri) return null;

        const formData = new FormData();
        formData.append('file', {
            uri: imageUri,
            type: 'image/jpeg',
            name: `profile-${currentUser.uid}-${Date.now()}.jpg`,
        });
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(CLOUDINARY_URL, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (!response.ok) {
                 const errorBody = await response.json();
                 console.error("Cloudinary Error Response:", errorBody);
                 throw new Error(`Cloudinary upload failed: ${errorBody.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            return data.secure_url; 

        } catch (error) {
            console.error('Error al subir imagen a Cloudinary:', error);
            setAlertConfig({
                type: 'error',
                customTitle: 'Error de Subida',
                message: `No se pudo subir la imagen. Verifica tus credenciales de Cloudinary y conexión: ${error.message}`,
                onConfirm: () => setAlertVisible(false),
            });
            setAlertVisible(true);
            return null;
        }
    };
    
    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled) {
            setProfileImageUri(result.assets[0].uri);
        }
    };

    const handleSaveProfile = async () => {
        if (!currentUser) return;
        setIsSaving(true);

        const errors = {};
        if (validationErrors.dob) errors.dob = validationErrors.dob;
        if (!validateDNI(dni)) errors.dni = "El DNI debe contener 7 u 8 dígitos.";
        if (!validatePhoneNumber(phoneNumber)) errors.phoneNumber = "El número debe contener 10 dígitos (Cód. Área + Número).";
        
        setValidationErrors(prev => ({ ...prev, ...errors }));

        if (Object.keys(errors).length > 0) {
            setIsSaving(false);
            setAlertConfig({
                type: "warning",
                message: "Por favor, corrige los errores de formato en el formulario antes de guardar.",
                customTitle: "Error de Validación",
                onConfirm: () => setAlertVisible(false),
            });
            setAlertVisible(true);
            return;
        }
        
        setValidationErrors({});

        try {
            const uid = currentUser.uid;
            const dobString = dob ? format(dob, 'dd/MM/yyyy') : ''; 
            
            await AsyncStorage.setItem(`dni_${uid}`, dni.trim());
            await AsyncStorage.setItem(`address_${uid}`, address.trim());
            await AsyncStorage.setItem(`gender_${uid}`, gender.trim());
            await AsyncStorage.setItem(`dob_${uid}`, dobString);
            await AsyncStorage.setItem(`phone_${uid}`, phoneNumber.trim());
        } catch (e) {
            console.error("Error al guardar datos extendidos:", e);
        }

        try {
            let newPhotoURL = profileImageUri;
            let updateNeeded = false;
            
            if (profileImageUri && !profileImageUri.startsWith('http') && profileImageUri !== currentUser.photoURL) {
                newPhotoURL = await uploadImageToCloudinary(profileImageUri);
                if (newPhotoURL) updateNeeded = true;
            }
            
            if (displayName.trim() !== currentUser.displayName || newPhotoURL !== currentUser.photoURL) {
                updateNeeded = true;
            }
            
            if (updateNeeded) {
                await updateProfile(currentUser, {
                    displayName: displayName.trim(),
                    photoURL: newPhotoURL || currentUser.photoURL,
                });
                
                setProfileImageUri(currentUser.photoURL); 
            }
            
            setIsEditing(false);
            
            setAlertConfig({
                type: "success",
                message: "Tu perfil ha sido actualizado con éxito.",
                customTitle: "¡Guardado!",
                onConfirm: () => setAlertVisible(false),
            });
            setAlertVisible(true);

        } catch (e) {
            console.error("Error al actualizar perfil de Firebase:", e);
            setAlertConfig({
                type: "error",
                message: "Ocurrió un error al actualizar el nombre o la foto. Intenta de nuevo.",
                customTitle: "Error al Guardar",
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
                } catch (error) {
                    console.error("Error al cerrar sesión:", error);
                }
            },
            onCancel: () => setAlertVisible(false),
        });
        setAlertVisible(true);
    }, []);
    
    const getInitial = (name) => {
        const fallbackName = name || currentUser?.email;
        return fallbackName ? fallbackName.charAt(0).toUpperCase() : '';
    };
    
    const AdditionalFields = useMemo(() => ({ currentColors }) => (
        <View style={[styles.section, { backgroundColor: currentColors.card }]}>
            <Text style={styles.sectionTitle}>Datos Personales Adicionales</Text>
            
            {/* Dirección - 🔧 ARREGLADO CON blurOnSubmit={false} */}
            <View style={[styles.menuItem, { borderBottomColor: currentColors.separator }]}>
                <Ionicons name="location-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                <Text style={[styles.menuItemText, { color: currentColors.text }]}>Dirección</Text>
                <TextInput
                    style={[styles.menuItemInput, { color: currentColors.text }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="Calle y Número"
                    placeholderTextColor={currentColors.secondaryText}
                    blurOnSubmit={false}
                    returnKeyType="done"
                />
            </View>
            
            {/* DNI - 🔧 ARREGLADO CON blurOnSubmit={false} */}
            <View style={[styles.menuItem, { borderBottomColor: currentColors.separator, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <Ionicons name="card-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, { color: currentColors.text, flex: 1 }]}>DNI</Text>
                    <TextInput
                        style={[
                            styles.menuItemInput, 
                            { color: currentColors.text, width: 'auto', textAlign: 'right' }
                        ]}
                        value={dni}
                        onChangeText={setDni}
                        keyboardType="numeric"
                        placeholder="7 u 8 dígitos"
                        placeholderTextColor={currentColors.secondaryText}
                        maxLength={10}
                        blurOnSubmit={false}
                        returnKeyType="done"
                    />
                </View>
                {validationErrors.dni && <Text style={styles.errorText}>{validationErrors.dni}</Text>}
            </View>
            
            <View style={[styles.menuItem, { borderBottomColor: currentColors.separator, flexDirection: 'column', alignItems: 'flex-start' }]}>
                <TouchableOpacity onPress={() => setIsDatePickerVisible(true)} style={{ flexDirection: 'row', alignItems: 'center', width: '100%', paddingVertical: 0 }}>
                    <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, { color: currentColors.text, flex: 1 }]}>Fecha de Nacimiento</Text>
                    
                    <Text
                        style={[
                            styles.menuItemValue, 
                            { 
                                color: dob ? currentColors.text : currentColors.secondaryText, 
                                fontWeight: '600'
                            }
                        ]}
                    >
                        {dob ? format(dob, 'dd/MM/yyyy') : "DD/MM/AAAA"}
                    </Text>
                </TouchableOpacity>

                {isDatePickerVisible && (
                    <DateTimePicker
                        value={dob || new Date()} 
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                        locale="es-ES"
                    />
                )}
                {validationErrors.dob && <Text style={styles.errorText}>{validationErrors.dob}</Text>}
            </View>

            {/* Sexo/Género */}
            <View style={[styles.menuItem, styles.lastMenuItem, { borderBottomColor: currentColors.separator }]}>
                <Ionicons name="body-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                <Text style={[styles.menuItemText, { color: currentColors.text }]}>Sexo</Text>
                
                <TouchableOpacity 
                    style={styles.menuItemSelect} 
                    onPress={() => setIsGenderModalVisible(true)}
                >
                    <Text 
                        style={[
                            styles.menuItemValue, 
                            { color: gender === 'Seleccionar' || !gender ? currentColors.secondaryText : currentColors.text }
                        ]}
                    >
                        {gender || "Seleccionar"}
                    </Text>
                    <Ionicons name="chevron-forward" size={18} color={currentColors.secondaryText} style={{marginLeft: 5}} />
                </TouchableOpacity>
            </View>
        </View>
    ), [address, dni, dob, gender, currentColors, validationErrors, isDatePickerVisible, handleDateChange]); 

    const DisplayAdditionalFields = useMemo(() => ({ currentColors }) => (
        <View style={[styles.section, { backgroundColor: currentColors.card }]}>
            <Text style={styles.sectionTitle}>Datos Personales</Text>
            
            <View style={[styles.menuItem, { borderBottomColor: currentColors.separator }]}>
                <Ionicons name="location-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                <Text style={[styles.menuItemText, { color: currentColors.text }]}>Dirección</Text>
                <Text style={[styles.menuItemValue, { color: currentColors.secondaryText }]}>{address || "Sin agregar"}</Text>
            </View>
            
            <View style={[styles.menuItem, { borderBottomColor: currentColors.separator }]}>
                <Ionicons name="card-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                <Text style={[styles.menuItemText, { color: currentColors.text }]}>DNI</Text>
                <Text style={[styles.menuItemValue, { color: currentColors.secondaryText }]}>{dni || "Sin agregar"}</Text>
            </View>
            
            <View style={[styles.menuItem, { borderBottomColor: currentColors.separator }]}>
                <Ionicons name="calendar-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                <Text style={[styles.menuItemText, { color: currentColors.text }]}>Fecha Nacimiento</Text>
                <Text style={[styles.menuItemValue, { color: currentColors.secondaryText }]}>
                    {dob ? format(dob, 'dd/MM/yyyy') : "Sin agregar"}
                </Text>
            </View>

            {(gender && (gender !== 'Seleccionar')) && (
                <View style={[styles.menuItem, styles.lastMenuItem]}>
                    <Ionicons name="body-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                    <Text style={[styles.menuItemText, { color: currentColors.text }]}>Sexo</Text>
                    <Text style={[styles.menuItemValue, { color: currentColors.secondaryText }]}>{gender}</Text>
                </View>
            )}

        </View>
    ), [address, dni, dob, gender, currentColors]); 

    const SecuritySection = useMemo(() => ({ currentColors }) => (
        <View style={[styles.section, { backgroundColor: currentColors.card }]}>
            <Text style={styles.sectionTitle}>Seguridad</Text>
            
            <TouchableOpacity style={[styles.menuItem, styles.lastMenuItem]} onPress={() => {
                setAlertConfig({
                    type: "info",
                    message: "Se enviará un correo de recuperación a tu email para que puedas cambiar la contraseña.",
                    customTitle: "Cambiar Contraseña",
                    onConfirm: () => setAlertVisible(false),
                });
                setAlertVisible(true);
            }}>
                <Ionicons name="lock-closed-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                <Text style={[styles.menuItemText, { color: currentColors.text }]}>Cambiar Contraseña</Text>
                <Ionicons name="chevron-forward" size={18} color={currentColors.secondaryText} />
            </TouchableOpacity>
        </View>
    ), [currentColors]); 
    
    const GenderModal = () => {
        const currentColors = isDarkMode ? COLORS.dark : COLORS.light;
        return (
            <Modal
                animationType="slide"
                transparent={true}
                visible={isGenderModalVisible}
                onRequestClose={() => setIsGenderModalVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setIsGenderModalVisible(false)}>
                    <View style={modalStyles.centeredView}>
                        <TouchableWithoutFeedback>
                            <View style={[modalStyles.modalView, { backgroundColor: currentColors.card }]}>
                                <Text style={[modalStyles.modalTitle, { color: currentColors.text }]}>Selecciona tu sexo</Text>
                                
                                <Picker
                                    selectedValue={gender}
                                    onValueChange={(itemValue) => {
                                        setGender(itemValue); 
                                    }}
                                    style={[modalStyles.picker, { color: currentColors.text }]}
                                    itemStyle={{ color: currentColors.text }}
                                >
                                    {GENDER_OPTIONS.map((item) => (
                                        <Picker.Item key={item} label={item} value={item} color={currentColors.text} />
                                    ))}
                                </Picker>

                                <TouchableOpacity
                                    style={[modalStyles.closeButton, { backgroundColor: PRIMARY_COLOR }]}
                                    onPress={() => setIsGenderModalVisible(false)}
                                >
                                    <Text style={modalStyles.closeButtonText}>Confirmar</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableWithoutFeedback>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        );
    };


    return (
        <SafeAreaView style={[safeAreaStyles.safeArea, { backgroundColor: currentColors.background }]}>
            <View style={[safeAreaStyles.container, { backgroundColor: currentColors.background }]}>
                
                <CustomHeader onMenuPress={toggleDrawer} />

                <KeyboardAvoidingView 
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
                >
                    <ScrollView 
                        contentContainerStyle={styles.contentContainer} 
                        keyboardShouldPersistTaps="handled" 
                        showsVerticalScrollIndicator={false}
                    >
                            
                        <View style={[styles.profileSummary, { backgroundColor: currentColors.card }]}>
                            <TouchableOpacity 
                                onPress={isEditing ? pickImage : null} 
                                disabled={!isEditing}
                                style={styles.avatarButton}
                            >
                                {profileImageUri ? (
                                    <Image 
                                        key={profileImageUri}
                                        source={{ uri: profileImageUri }} 
                                        style={styles.avatar} 
                                    />
                                ) : (
                                    <View style={[styles.avatarPlaceholder, { backgroundColor: PRIMARY_COLOR }]}>
                                        <Text style={styles.avatarInitial}>{getInitial(displayName)}</Text>
                                    </View>
                                )}
                                {isEditing && (
                                    <View style={styles.cameraIconContainer}>
                                        <Ionicons name="camera" size={20} color={currentColors.card} />
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.nameContainer}>
                                {isEditing ? (
                                    <TextInput
                                        style={[styles.displayNameInput, { color: currentColors.text }]}
                                        value={displayName}
                                        onChangeText={setDisplayName}
                                        placeholder="Tu Nombre"
                                        placeholderTextColor={currentColors.secondaryText}
                                        maxLength={30}
                                        blurOnSubmit={false}
                                    />
                                ) : (
                                    <Text style={[styles.displayName, { color: currentColors.text }]}>
                                        {displayName || "Mi Perfil"}
                                    </Text>
                                )}
                                <Text style={[styles.emailText, { color: currentColors.secondaryText }]}>{currentUser?.email}</Text>
                            </View>
                            
                            {/* 📱 TELÉFONO EDITABLE - 🔧 ARREGLADO */}
                            <View style={[styles.menuItem, styles.lastMenuItem, { borderBottomColor: currentColors.separator, width: '100%', paddingHorizontal: 0, flexDirection: 'column', alignItems: 'flex-start' }]}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                                    <Ionicons name="call-outline" size={20} color={PRIMARY_COLOR} style={{ marginRight: 10 }} />
                                    <Text style={[styles.menuItemText, { color: currentColors.text, flex: 1 }]}>Teléfono</Text>
                                    {isEditing ? (
                                        <TextInput
                                            style={[styles.menuItemInput, { color: currentColors.text, textAlign: 'right' }]}
                                            value={phoneNumber}
                                            onChangeText={setPhoneNumber}
                                            keyboardType="phone-pad"
                                            placeholder="Ej: 1123456789"
                                            placeholderTextColor={currentColors.secondaryText}
                                            maxLength={10}
                                            blurOnSubmit={false}
                                            returnKeyType="done"
                                        />
                                    ) : (
                                        <Text style={[styles.menuItemValue, { color: currentColors.secondaryText }]}>
                                            {phoneNumber || "Sin agregar"}
                                        </Text>
                                    )}
                                </View>
                                {validationErrors.phoneNumber && <Text style={[styles.errorText, {width: '100%', textAlign: 'right', marginTop: 5}]}>{validationErrors.phoneNumber}</Text>}
                            </View>

                            
                            <TouchableOpacity 
                                style={[styles.editButton, { backgroundColor: PRIMARY_COLOR }]}
                                onPress={isEditing ? handleSaveProfile : () => setIsEditing(true)}
                                disabled={isSaving}
                            >
                                {isSaving ? (
                                    <ActivityIndicator color="#000" size="small" />
                                ) : (
                                    <Text style={styles.editButtonText}>
                                        {isEditing ? "Guardar Cambios" : "Editar Perfil"}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>

                        {isEditing ? (
                            <AdditionalFields currentColors={currentColors} />
                        ) : (
                            <DisplayAdditionalFields currentColors={currentColors} />
                        )}

                        <SecuritySection currentColors={currentColors} />
                        
                        <View style={{ height: 80 }} />

                    </ScrollView>
                </KeyboardAvoidingView>

                <TabNavigation 
                    currentScreen="Profile" 
                    onNavigate={handleTabNavigation}
                    isDarkMode={isDarkMode}
                />
                
                <DrawerMenu 
                    isOpen={isDrawerOpen}
                    onClose={toggleDrawer}
                    user={currentUser}
                    isDarkMode={isDarkMode}
                    toggleDarkMode={toggleDarkMode}
                    confirmarCerrarSesion={confirmarCerrarSesion}
                    navigation={navigation}
                    setAlertConfig={setAlertConfig}
                    setAlertVisible={setAlertVisible}
                />
                
                <GenderModal />
                
                <CustomAlert 
                    isVisible={alertVisible}
                    type={alertConfig.type}
                    message={alertConfig.message}
                    customTitle={alertConfig.customTitle}
                    onConfirm={alertConfig.onConfirm}
                    onCancel={alertConfig.onCancel}
                />
            </View>
        </SafeAreaView>
    );
}

// STYLESHEETS

const safeAreaStyles = StyleSheet.create({
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
});

const headerStyles = StyleSheet.create({
    headerBackground: {
        height: 100, 
        width: "100%",
        justifyContent: "center",
        paddingTop: Platform.OS === "android" ? 30 : 0, 
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        height: 100,
    },
    headerMenuButton: {
        padding: 5,
    },
    headerLogoContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    logoImage: {
        width: 35,
        height: 35,
        marginRight: 10,
    },
    headerTitleText: {
        color: "#fff",
        fontSize: 20,
        fontWeight: "bold",
    },
    headerLogoutButton: {
        width: 38, 
    },
});

const drawerStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
    },
    drawer: {
        position: "absolute",
        top: 0,
        left: 0,
        width: DRAWER_WIDTH,
        height: "100%",
        paddingTop: 0, 
        borderRightWidth: 1,
        borderRightColor: "#333",
    },
    profileHeaderBackground: {
        height: 150,
        width: "100%",
        justifyContent: "flex-end",
    },
    profileHeaderOverlay: {
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: 15,
        alignItems: "flex-start",
    },
    profileImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 2,
        borderColor: PRIMARY_COLOR,
        marginBottom: 5,
    },
    profileName: {
        fontSize: 18,
        fontWeight: "bold",
    },
    profileEmail: {
        fontSize: 14,
    },
    drawerItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    drawerItemLabel: {
        marginLeft: 15,
        fontSize: 16,
        fontWeight: "500",
    },
});

const tabStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        height: 80,
        backgroundColor: PRIMARY_COLOR,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: Platform.OS === 'ios' ? 20 : 0,
        paddingTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 10,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    activeTab: {
      
    },
    tabText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#000',
        marginTop: 6,
    },
});

const styles = StyleSheet.create({
    contentContainer: {
        paddingVertical: 15,
        paddingHorizontal: 0, 
    },
    section: {
        borderRadius: 12,
        marginHorizontal: 15,
        marginTop: 20,
        paddingHorizontal: 15,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    profileSummary: {
        borderRadius: 12,
        marginHorizontal: 15,
        padding: 20,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 3,
    },
    avatarButton: {
        position: 'relative',
        marginBottom: 10,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: PRIMARY_COLOR,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: PRIMARY_COLOR,
    },
    avatarInitial: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#000', 
    },
    cameraIconContainer: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: PRIMARY_COLOR,
        borderRadius: 15,
        padding: 5,
        borderWidth: 2,
        borderColor: '#fff',
    },
    nameContainer: {
        alignItems: 'center',
        marginBottom: 15,
    },
    displayName: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    displayNameInput: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        borderBottomWidth: 1,
        borderBottomColor: PRIMARY_COLOR,
        paddingVertical: 2,
        width: '80%',
    },
    emailText: {
        fontSize: 14,
        textAlign: 'center',
        marginTop: 4,
    },
    editButton: {
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 30,
        marginTop: 20,
        minWidth: 180,
        alignItems: 'center',
    },
    editButtonText: {
        color: '#000',
        fontSize: 16,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: PRIMARY_COLOR,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    lastMenuItem: {
        borderBottomWidth: 0,
    },
    menuItemText: {
        fontSize: 16,
        flex: 1,
    },
    menuItemValue: {
        fontSize: 16,
        textAlign: 'right',
        marginLeft: 10,
    },
    menuItemInput: {
        fontSize: 16,
        textAlign: 'right',
        flex: 1,
        marginLeft: 10,
        paddingVertical: 0,
    },
    menuItemSelect: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 5,
        marginBottom: 5,
        width: '100%',
        textAlign: 'left',
    }
});

const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(0,0,0,0.5)",
    },
    modalView: {
        margin: 20,
        borderRadius: 20,
        padding: 35,
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        textAlign: 'center',
    },
    picker: {
        width: '100%',
        height: 150,
        marginBottom: 10,
    },
    closeButton: {
        borderRadius: 20,
        padding: 10,
        elevation: 2,
        marginTop: 15,
        minWidth: 120,
        backgroundColor: PRIMARY_COLOR,
    },
    closeButtonText: {
        color: "white",
        fontWeight: "bold",
        textAlign: "center"
    }
});