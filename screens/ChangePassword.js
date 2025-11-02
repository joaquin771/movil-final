import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    Dimensions,
    Alert,
    ActivityIndicator,
    ImageBackground,
    Image,
    ScrollView,
    KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { auth } from "../src/firebaseConfig";
import { 
    updatePassword, 
    EmailAuthProvider, 
    reauthenticateWithCredential 
} from "firebase/auth";
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';


const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Imágenes
const HEADER_IMAGE_SOURCE = require("../assets/header.jpg");
const LOGO_SOURCE = require("../assets/logo.png");

// Colores del tema
const THEME = {
    primary: "#FFD600",
    secondary: "#FFA500",
    dark: "#1A1A1A",
    darker: "#0D0D0D",
    card: "#252525",
    text: "#FFFFFF",
    textSecondary: "#B0B0B0",
    border: "#333333",
    success: "#4CAF50",
    error: "#FF5252",
    gradient: ["#FFD600", "#FFA500"],
};

// Header personalizado
const CustomHeader = ({ onBackPress }) => {
    return (
        <ImageBackground 
            source={HEADER_IMAGE_SOURCE} 
            style={styles.headerBackground} 
            resizeMode="cover"
        >
            <View style={styles.headerOverlay} />
            <View style={styles.headerContent}>
                <TouchableOpacity style={styles.headerMenuButton} onPress={onBackPress}>
                    <Ionicons name="arrow-back-outline" size={28} color={THEME.primary} />
                </TouchableOpacity>
                <View style={styles.headerLogoContainer}>
                    <Image source={LOGO_SOURCE} style={styles.logoImage} resizeMode="contain" />
                    <Text style={styles.headerTitleText}>Cambiar Contraseña</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>
        </ImageBackground>
    );
};

export default function ChangePassword({ navigation }) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        // Validar contraseña actual
        if (!currentPassword.trim()) {
            newErrors.currentPassword = "La contraseña actual es requerida";
        }

        // Validar nueva contraseña
        if (!newPassword.trim()) {
            newErrors.newPassword = "La nueva contraseña es requerida";
        } else if (newPassword.length < 6) {
            newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres";
        } else if (newPassword === currentPassword) {
            newErrors.newPassword = "La nueva contraseña debe ser diferente a la actual";
        }

        // Validar confirmación
        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = "Debes confirmar la nueva contraseña";
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChangePassword = async () => {
        // Validar formulario
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            const user = auth.currentUser;

            if (!user || !user.email) {
                Alert.alert(
                    "Error",
                    "No hay usuario autenticado. Por favor, inicia sesión nuevamente."
                );
                return;
            }

            // Crear credenciales para reautenticar
            const credential = EmailAuthProvider.credential(
                user.email,
                currentPassword
            );

            // Reautenticar usuario
            try {
                await reauthenticateWithCredential(user, credential);
            } catch (reauthError) {
                console.error("Reauth error:", reauthError);
                
                // Manejar errores específicos de reautenticación
                if (reauthError.code === "auth/invalid-credential" || 
                    reauthError.code === "auth/wrong-password") {
                    setErrors({ 
                        currentPassword: "La contraseña actual es incorrecta" 
                    });
                    Alert.alert(
                        "Error",
                        "La contraseña actual que ingresaste es incorrecta. Por favor, verifica e intenta de nuevo."
                    );
                } else if (reauthError.code === "auth/too-many-requests") {
                    Alert.alert(
                        "Error",
                        "Demasiados intentos fallidos. Por favor, espera un momento e intenta de nuevo."
                    );
                } else if (reauthError.code === "auth/network-request-failed") {
                    Alert.alert(
                        "Error de conexión",
                        "No se pudo conectar con el servidor. Verifica tu conexión a internet."
                    );
                } else {
                    Alert.alert(
                        "Error",
                        "No se pudo verificar tu identidad. Intenta cerrar sesión y volver a iniciar."
                    );
                }
                return;
            }

            // Actualizar contraseña
            await updatePassword(user, newPassword);

            // Limpiar campos
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setErrors({});

            // Mostrar mensaje de éxito
            Alert.alert(
                "¡Éxito!",
                "Tu contraseña ha sido actualizada correctamente.",
                [
                    {
                        text: "OK",
                        onPress: () => navigation.goBack()
                    }
                ]
            );

        } catch (error) {
            console.error("ChangePassword error:", error);
            
            // Manejar errores de actualización de contraseña
            if (error.code === "auth/weak-password") {
                setErrors({ 
                    newPassword: "La contraseña es demasiado débil" 
                });
                Alert.alert(
                    "Contraseña débil",
                    "Por favor, elige una contraseña más segura."
                );
            } else if (error.code === "auth/requires-recent-login") {
                Alert.alert(
                    "Sesión expirada",
                    "Por razones de seguridad, debes cerrar sesión y volver a iniciar para cambiar tu contraseña."
                );
            } else {
                Alert.alert(
                    "Error",
                    "No se pudo cambiar la contraseña. Por favor, intenta de nuevo."
                );
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <CustomHeader onBackPress={() => navigation.goBack()} />

                    <ScrollView 
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.content}>
                            {/* Icono principal */}
                            <View style={styles.iconContainer}>
                                <LinearGradient
                                    colors={THEME.gradient}
                                    style={styles.iconGradient}
                                >
                                    <Ionicons name="lock-closed" size={50} color={THEME.dark} />
                                </LinearGradient>
                            </View>

                            {/* Título y descripción */}
                            <Text style={styles.title}>Cambiar Contraseña</Text>
                            <Text style={styles.subtitle}>
                                Por seguridad, necesitamos verificar tu identidad antes de cambiar tu contraseña
                            </Text>

                            {/* Formulario */}
                            <View style={styles.form}>
                                {/* Contraseña Actual */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Contraseña Actual</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        errors.currentPassword && styles.inputError
                                    ]}>
                                        <Ionicons 
                                            name="lock-closed-outline" 
                                            size={20} 
                                            color={errors.currentPassword ? THEME.error : THEME.textSecondary} 
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ingresa tu contraseña actual"
                                            placeholderTextColor={THEME.textSecondary}
                                            secureTextEntry={!showCurrentPassword}
                                            value={currentPassword}
                                            onChangeText={(text) => {
                                                setCurrentPassword(text);
                                                if (errors.currentPassword) {
                                                    setErrors({ ...errors, currentPassword: null });
                                                }
                                            }}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                                        >
                                            <Ionicons 
                                                name={showCurrentPassword ? "eye-off" : "eye"} 
                                                size={20} 
                                                color={THEME.textSecondary} 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.currentPassword && (
                                        <Text style={styles.errorText}>
                                            {errors.currentPassword}
                                        </Text>
                                    )}
                                </View>

                                {/* Nueva Contraseña */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Nueva Contraseña</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        errors.newPassword && styles.inputError
                                    ]}>
                                        <Ionicons 
                                            name="key-outline" 
                                            size={20} 
                                            color={errors.newPassword ? THEME.error : THEME.textSecondary} 
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Mínimo 6 caracteres"
                                            placeholderTextColor={THEME.textSecondary}
                                            secureTextEntry={!showNewPassword}
                                            value={newPassword}
                                            onChangeText={(text) => {
                                                setNewPassword(text);
                                                if (errors.newPassword) {
                                                    setErrors({ ...errors, newPassword: null });
                                                }
                                            }}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowNewPassword(!showNewPassword)}
                                        >
                                            <Ionicons 
                                                name={showNewPassword ? "eye-off" : "eye"} 
                                                size={20} 
                                                color={THEME.textSecondary} 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.newPassword && (
                                        <Text style={styles.errorText}>
                                            {errors.newPassword}
                                        </Text>
                                    )}
                                </View>

                                {/* Confirmar Nueva Contraseña */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                                    <View style={[
                                        styles.inputWrapper,
                                        errors.confirmPassword && styles.inputError
                                    ]}>
                                        <Ionicons 
                                            name="checkmark-circle-outline" 
                                            size={20} 
                                            color={errors.confirmPassword ? THEME.error : THEME.textSecondary} 
                                        />
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Repite la nueva contraseña"
                                            placeholderTextColor={THEME.textSecondary}
                                            secureTextEntry={!showConfirmPassword}
                                            value={confirmPassword}
                                            onChangeText={(text) => {
                                                setConfirmPassword(text);
                                                if (errors.confirmPassword) {
                                                    setErrors({ ...errors, confirmPassword: null });
                                                }
                                            }}
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                        />
                                        <TouchableOpacity
                                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            <Ionicons 
                                                name={showConfirmPassword ? "eye-off" : "eye"} 
                                                size={20} 
                                                color={THEME.textSecondary} 
                                            />
                                        </TouchableOpacity>
                                    </View>
                                    {errors.confirmPassword && (
                                        <Text style={styles.errorText}>
                                            {errors.confirmPassword}
                                        </Text>
                                    )}
                                </View>

                                {/* Mensaje de seguridad */}
                                <View style={styles.securityNote}>
                                    <Ionicons name="shield-checkmark" size={16} color={THEME.success} />
                                    <Text style={styles.securityNoteText}>
                                        Usa al menos 6 caracteres con una combinación de letras y números
                                    </Text>
                                </View>

                                {/* Botón de Cambiar Contraseña */}
                                <TouchableOpacity
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleChangePassword}
                                    disabled={loading}
                                >
                                    <LinearGradient
                                        colors={THEME.gradient}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 0 }}
                                        style={styles.buttonGradient}
                                    >
                                        {loading ? (
                                            <ActivityIndicator color={THEME.dark} />
                                        ) : (
                                            <>
                                                <Ionicons name="save" size={20} color={THEME.dark} />
                                                <Text style={styles.buttonText}>
                                                    Cambiar Contraseña
                                                </Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* Botón de Cancelar */}
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => navigation.goBack()}
                                    disabled={loading}
                                >
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.darker,
    },
    headerBackground: {
        width: "100%",
        height: 100,
        justifyContent: "center",
    },
    headerOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
    },
    headerContent: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        paddingTop: Platform.OS === 'ios' ? 20 : 10,
    },
    headerMenuButton: {
        padding: 8,
    },
    headerLogoContainer: {
        flexDirection: "row",
        alignItems: "center",
        flex: 1,
        justifyContent: "center",
    },
    logoImage: {
        width: 32,
        height: 32,
        marginRight: 8,
    },
    headerTitleText: {
        fontSize: 18,
        fontWeight: "bold",
        color: THEME.primary,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        padding: 20,
    },
    iconContainer: {
        alignItems: 'center',
        marginVertical: 20,
    },
    iconGradient: {
        width: 100,
        height: 100,
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitle: {
        fontSize: 14,
        color: THEME.textSecondary,
        textAlign: 'center',
        marginBottom: 30,
        lineHeight: 20,
        paddingHorizontal: 10,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: THEME.text,
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: THEME.border,
    },
    inputError: {
        borderColor: THEME.error,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: THEME.text,
        marginLeft: 10,
    },
    errorText: {
        fontSize: 12,
        color: THEME.error,
        marginTop: 5,
        marginLeft: 5,
    },
    securityNote: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        padding: 12,
        borderRadius: 12,
        marginBottom: 25,
        gap: 8,
    },
    securityNoteText: {
        fontSize: 12,
        color: THEME.textSecondary,
        flex: 1,
        lineHeight: 18,
    },
    button: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 15,
        elevation: 5,
        shadowColor: THEME.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: THEME.dark,
    },
    cancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: THEME.textSecondary,
        fontWeight: '600',
    },
});