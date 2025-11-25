// ChangePassword.js — FINAL con requisitos dinámicos + ThemeContext
import React, { useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Platform,
    Dimensions,
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
import { useTheme } from "../src/theme/ThemeContext";
import { LinearGradient } from 'expo-linear-gradient';
import CustomAlert from "../components/CustomAlert";
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const HEADER_IMAGE_SOURCE = require("../assets/header.jpg");
const LOGO_SOURCE = require("../assets/logo.png");

export default function ChangePassword({ navigation }) {
    
    const { theme } = useTheme();
    const styles = createStyles(theme);

    // Estados
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [errors, setErrors] = useState({});

    const [alertVisible, setAlertVisible] = useState(false);
    const [alertType, setAlertType] = useState("success");
    const [alertMessage, setAlertMessage] = useState("");
    const [alertTitle, setAlertTitle] = useState("");
    const [alertOnConfirm, setAlertOnConfirm] = useState(() => () => {});

    const [mostrarValidaciones, setMostrarValidaciones] = useState(false);

    // Validaciones dinamicas
    const [validacionesPassword, setValidacionesPassword] = useState({
        longitud: false,
        mayuscula: false,
        minuscula: false,
        numero: false,
        noSimbolos: true,
    });

    const validarPassword = (texto) => {

        const soloLetrasNumeros = /^[A-Za-z0-9]*$/.test(texto);

        setNewPassword(texto);
        setValidacionesPassword({
            longitud: texto.length >= 6,
            mayuscula: /[A-Z]/.test(texto),
            minuscula: /[a-z]/.test(texto),
            numero: /[0-9]/.test(texto),
            noSimbolos: soloLetrasNumeros,
        });

        if (errors.newPassword) {
            setErrors({ ...errors, newPassword: null });
        }
    };

    // Alertas
    const showAlert = (type, title, message, onConfirm = () => {}) => {
        setAlertType(type);
        setAlertTitle(title);
        setAlertMessage(message);
        setAlertOnConfirm(() => onConfirm);
        setAlertVisible(true);
    };

    // Validación final
    const validateForm = () => {
        const newErrors = {};

        if (!currentPassword.trim()) {
            newErrors.currentPassword = "La contraseña actual es requerida";
        }

        if (!newPassword.trim()) {
            newErrors.newPassword = "La nueva contraseña es requerida";
        } 
        else if (!Object.values(validacionesPassword).every(Boolean)) {
            newErrors.newPassword = "La contraseña no cumple con los requisitos";
        } 
        else if (newPassword === currentPassword) {
            newErrors.newPassword = "Debe ser diferente a la actual";
        }

        if (!confirmPassword.trim()) {
            newErrors.confirmPassword = "Debes confirmar la contraseña";
        } else if (newPassword !== confirmPassword) {
            newErrors.confirmPassword = "Las contraseñas no coinciden";
        }

        setErrors(newErrors);

        return Object.keys(newErrors).length === 0;
    };

    // Cambiar contraseña
    const handleChangePassword = async () => {
        if (!validateForm()) return;

        setLoading(true);

        try {
            const user = auth.currentUser;

            if (!user || !user.email) {
                showAlert("error", "Error", "Debes iniciar sesión nuevamente.");
                return;
            }

            const credential = EmailAuthProvider.credential(user.email, currentPassword);

            try {
                await reauthenticateWithCredential(user, credential);
            } catch (reauthError) {
                if (reauthError.code === "auth/wrong-password") {
                    setErrors({ currentPassword: "La contraseña es incorrecta" });
                    showAlert("error", "Contraseña inválida", "La contraseña actual es incorrecta.");
                } else {
                    showAlert("error", "Error", "No se pudo verificar tu identidad.");
                }
                return;
            }

            await updatePassword(user, newPassword);

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            showAlert(
                "success",
                "¡Contraseña cambiada!",
                "Tu contraseña se actualizó correctamente.",
                () => navigation.goBack()
            );

        } catch (error) {
            if (error.code === "auth/weak-password") {
                setErrors({ newPassword: "La contraseña es muy débil" });
                showAlert("warning", "Contraseña débil", "Elige una contraseña más segura.");
            } else if (error.code === "auth/requires-recent-login") {
                showAlert("warning", "Sesión expirada", "Debes volver a iniciar sesión.");
            } else {
                showAlert("error", "Error", "No se pudo cambiar la contraseña.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Header
    const CustomHeader = ({ onBackPress }) => (
        <ImageBackground source={HEADER_IMAGE_SOURCE} style={styles.headerBackground}>
            <View style={styles.headerOverlay} />
            <View style={styles.headerContent}>
                <TouchableOpacity style={styles.headerMenuButton} onPress={onBackPress}>
                    <Ionicons name="arrow-back-outline" size={28} color={theme.primary} />
                </TouchableOpacity>

                <View style={styles.headerLogoContainer}>
                    <Image source={LOGO_SOURCE} style={styles.logoImage} />
                    <Text style={[styles.headerTitleText, { color: theme.primary }]}>
                        Cambiar Contraseña
                    </Text>
                </View>

                <View style={{ width: 44 }} />
            </View>
        </ImageBackground>
    );

    return (
        <SafeAreaProvider>
            <SafeAreaView style={styles.container}>
                
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>

                    <CustomHeader onBackPress={() => navigation.goBack()} />

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <View style={styles.content}>
                            
                            {/* ICONO */}
                            <View style={styles.iconContainer}>
                                <LinearGradient colors={theme.gradient} style={styles.iconGradient}>
                                    <Ionicons name="lock-closed" size={50} color={theme.background} />
                                </LinearGradient>
                            </View>

                            <Text style={styles.title}>Cambiar Contraseña</Text>
                            <Text style={styles.subtitle}>
                                Verificamos tu identidad antes de actualizar tu contraseña
                            </Text>

                            {/* FORM */}
                            <View style={styles.form}>

                                {/* CONTRASEÑA ACTUAL */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Contraseña Actual</Text>

                                    <View style={[styles.inputWrapper, errors.currentPassword && styles.inputError]}>
                                        <Ionicons name="lock-closed-outline" size={20} color={theme.textSecondary} />

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Ingresa tu contraseña actual"
                                            secureTextEntry={!showCurrentPassword}
                                            value={currentPassword}
                                            onChangeText={(t) => {
                                                setCurrentPassword(t);
                                                setErrors({ ...errors, currentPassword: null });
                                            }}
                                            placeholderTextColor={theme.textSecondary}
                                        />

                                        <TouchableOpacity onPress={() => setShowCurrentPassword(!showCurrentPassword)}>
                                            <Ionicons name={showCurrentPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {errors.currentPassword && (
                                        <Text style={styles.errorText}>{errors.currentPassword}</Text>
                                    )}
                                </View>

                                {/* NUEVA CONTRASEÑA */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Nueva Contraseña</Text>

                                    <View style={[styles.inputWrapper, errors.newPassword && styles.inputError]}>
                                        <Ionicons name="key-outline" size={20} color={theme.textSecondary} />

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Mínimo 6 caracteres"
                                            secureTextEntry={!showNewPassword}
                                            value={newPassword}
                                            onFocus={() => setMostrarValidaciones(true)}
                                            onChangeText={validarPassword}
                                            placeholderTextColor={theme.textSecondary}
                                        />

                                        <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                                            <Ionicons name={showNewPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {errors.newPassword && (
                                        <Text style={styles.errorText}>{errors.newPassword}</Text>
                                    )}

                                    {/* 🔥 VALIDACIONES DINÁMICAS QUE APARECEN AL TOCAR */}
                                    {mostrarValidaciones && (
                                        <View style={styles.validacionesBox}>
                                            
                                            <Requisito label="Mínimo 6 caracteres" ok={validacionesPassword.longitud} />
                                            <Requisito label="Una mayúscula (A-Z)" ok={validacionesPassword.mayuscula} />
                                            <Requisito label="Una minúscula (a-z)" ok={validacionesPassword.minuscula} />
                                            <Requisito label="Al menos un número (0-9)" ok={validacionesPassword.numero} />
                                           

                                        </View>
                                    )}

                                </View>

                                {/* CONFIRMAR */}
                                <View style={styles.inputContainer}>
                                    <Text style={styles.label}>Confirmar Nueva Contraseña</Text>

                                    <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputError]}>
                                        <Ionicons name="checkmark-circle-outline" size={20} color={theme.textSecondary} />

                                        <TextInput
                                            style={styles.input}
                                            placeholder="Repite la contraseña"
                                            secureTextEntry={!showConfirmPassword}
                                            value={confirmPassword}
                                            onChangeText={(text) => {
                                                setConfirmPassword(text);
                                                setErrors({ ...errors, confirmPassword: null });
                                            }}
                                            placeholderTextColor={theme.textSecondary}
                                        />

                                        <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                                            <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={20} color={theme.textSecondary} />
                                        </TouchableOpacity>
                                    </View>

                                    {errors.confirmPassword && (
                                        <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                                    )}
                                </View>

                                {/* BOTÓN */}
                                <TouchableOpacity 
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleChangePassword}
                                    disabled={loading}
                                >
                                    <LinearGradient colors={theme.gradient} style={styles.buttonGradient}>
                                        {loading ? (
                                            <ActivityIndicator color={theme.background} />
                                        ) : (
                                            <>
                                                <Ionicons name="save" size={20} color={theme.background} />
                                                <Text style={styles.buttonText}>Cambiar Contraseña</Text>
                                            </>
                                        )}
                                    </LinearGradient>
                                </TouchableOpacity>

                                {/* CANCELAR */}
                                <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
                                    <Text style={styles.cancelButtonText}>Cancelar</Text>
                                </TouchableOpacity>
                            </View>

                        </View>
                    </ScrollView>

                </KeyboardAvoidingView>

                {/* ALERTA */}
                <CustomAlert
                    isVisible={alertVisible}
                    type={alertType}
                    message={alertMessage}
                    customTitle={alertTitle}
                    onConfirm={() => {
                        setAlertVisible(false);
                        alertOnConfirm();
                    }}
                    onCancel={() => setAlertVisible(false)}
                />

            </SafeAreaView>
        </SafeAreaProvider>
    );
}

// ================= COMPONENTE REQUISITO =================

const Requisito = ({ label, ok }) => {
    return (
        <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 3 }}>
            <Ionicons 
                name={ok ? "checkmark-circle" : "close-circle"} 
                size={18} 
                color={ok ? "#4CAF50" : "#FF4F4F"} 
                style={{ marginRight: 8 }}
            />
            <Text style={{ color: "#444", fontSize: 14 }}>{label}</Text>
        </View>
    );
};

// ================= ESTILOS =================

const createStyles = (theme) =>
    StyleSheet.create({
        container: { flex: 1, backgroundColor: theme.background },

        headerBackground: { width: "100%", height: 100 },
        headerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: theme.headerOverlay },

        headerContent: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 15
        },
        headerMenuButton: { padding: 8 },
        headerLogoContainer: { flexDirection: "row", alignItems: "center", flex: 1, justifyContent: "center" },
        logoImage: { width: 32, height: 32, marginRight: 8 },
        headerTitleText: { fontSize: 18, fontWeight: "bold" },

        content: { padding: 20 },
        iconContainer: { alignItems: "center", marginVertical: 20 },
        iconGradient: { width: 100, height: 100, borderRadius: 50, justifyContent: "center", alignItems: "center" },

        title: { fontSize: 28, color: theme.text, textAlign: "center", marginBottom: 5, fontWeight: "bold" },
        subtitle: { fontSize: 14, color: theme.textSecondary, textAlign: "center", marginBottom: 30 },

        form: { marginTop: 10 },
        inputContainer: { marginBottom: 20 },

        label: { color: theme.text, marginBottom: 8, fontSize: 14, fontWeight: "600" },

        inputWrapper: {
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: theme.card,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: theme.border,
            height: 52,
            paddingHorizontal: 15,
        },

        inputError: { borderColor: theme.error },

        input: {
            flex: 1,
            marginLeft: 10,
            color: theme.text,
            fontSize: 16,
            paddingVertical: 12,
        },

        errorText: { color: theme.error, fontSize: 12, marginTop: 6 },

        validacionesBox: {
             backgroundColor: theme.card, // oscuro en dark, claro en ligh
            padding: 12,
            borderRadius: 10,
            marginTop: 10,
            borderWidth: 1,
            borderColor: "rgba(0,0,0,0.1)"
        },

        button: { borderRadius: 12, overflow: "hidden", marginTop: 10 },
        buttonDisabled: { opacity: 0.6 },

        buttonGradient: {
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 16,
            gap: 8
        },

        buttonText: { fontSize: 16, fontWeight: "bold", color: theme.background },

        cancelButton: { paddingVertical: 16, alignItems: "center" },
        cancelButtonText: { color: theme.textSecondary, fontSize: 16, fontWeight: "600" },
    });