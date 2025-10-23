import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  ImageBackground,
  Alert,
  Platform,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart, BarChart } from "react-native-chart-kit";
import { db, auth } from "../src/firebaseConfig";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import CustomAlert from "../components/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";

// --- Constantes y Configuración ---
const PIE_COLORS = ["#FFD600", "#FFB300", "#FF8F00", "#FDD835", "#FFE082", "#FFC107"];
const screenWidth = Dimensions.get("window").width;
const CHART_INNER_WIDTH = screenWidth - 60;
const DRAWER_WIDTH = screenWidth * 0.75;

// COLORES PARA MODO OSCURO/CLARO
const COLORS = {
  light: {
    background: "#F7F7F7",
    card: "#FFFFFF",
    text: "#000000",
    secondaryText: "#333333",
    invertedCard: "#1E1E1E",
    invertedText: "#fff",
    footerBackground: "#FFD600",
    separator: "#f0f0f0",
    chartBackground: "#fff",
    chartColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
    totalValueLabelLight: "#888",
    totalValueFooterLight: "#555",
  },
  dark: {
    background: "#121212",
    card: "#1E1E1E",
    text: "#FFFFFF",
    secondaryText: "#CCCCCC",
    invertedCard: "#FFD600",
    invertedText: "#000",
    footerBackground: "#FFD600",
    separator: "#333333",
    chartBackground: "#1E1E1E",
    chartColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    totalValueLabelDark: "#333",
    totalValueFooterDark: "#333",
  },
};

// RUTAS LOCALES
const HEADER_IMAGE_SOURCE = require("../assets/header.jpg");
const DRAWER_HEADER_IMAGE_SOURCE = require("../assets/headerhome.jpg");

// --- Lógica de gráficos ---
const prepareChartData = (productos) => {
  const categoriesCount = {};
  let totalInventoryValue = 0;

  productos.forEach((p) => {
    const stock = parseFloat(p.stock || 0);
    const precio = parseFloat(p.precio || 0);
    const cat = p.categoria || "Sin Categoría";
    categoriesCount[cat] = (categoriesCount[cat] || 0) + 1;
    totalInventoryValue += stock * precio;
  });

  const pieData = Object.keys(categoriesCount)
    .map((cat, i) => ({
      name: cat,
      count: categoriesCount[cat],
      color: PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: "#000",
      legendFontSize: 13,
    }))
    .filter((item) => item.count > 0);

  const topStockProducts = productos
    .filter((p) => (p.stock || 0) > 0)
    .sort((a, b) => (b.stock || 0) - (a.stock || 0))
    .slice(0, 5);

  const labels = topStockProducts.map((p) =>
    p.nombre?.length > 10 ? p.nombre.substring(0, 9) + "..." : p.nombre || ""
  );
  const data = topStockProducts.map((p) => Number(p.stock) || 0);

  const barChartData = {
    labels,
    datasets: [
      {
        data,
        colors: data.map((_, i) => (opacity = 1) => PIE_COLORS[i % PIE_COLORS.length]),
      },
    ],
  };

  return { pieData, barChartData, totalInventoryValue };
};

// --- Header ---
const CustomHeader = React.memo(({ onMenuPress }) => {
  return (
    <ImageBackground source={HEADER_IMAGE_SOURCE} style={styles.headerBackground} resizeMode="cover">
      <View style={[styles.headerOverlay, { backgroundColor: "rgba(0, 0, 0, 0.65)" }]} />
      <View style={styles.headerContent}>
        <TouchableOpacity style={styles.headerMenuButton} onPress={onMenuPress}>
          <Ionicons name="menu-outline" size={28} color="#FFD600" />
        </TouchableOpacity>
        <Image source={require("../assets/logo.png")} style={styles.logoGrande} resizeMode="contain" />
        <View style={styles.headerLogoutButton} />
      </View>
    </ImageBackground>
  );
});

// --- Drawer ---
const DrawerItem = ({ icon, label, onPress, isCurrent, isDarkMode, toggleDarkMode }) => {
  const currentColors = isDarkMode ? COLORS.dark : COLORS.light;
  const itemStyle = [
    drawerStyles.drawerItem,
    { borderBottomColor: currentColors.separator },
    isCurrent && { backgroundColor: "rgba(255, 214, 0, 0.2)" },
  ];
  const labelStyle = [
    drawerStyles.drawerItemLabel,
    { color: isDarkMode ? COLORS.dark.text : COLORS.light.secondaryText },
  ];
  const iconColor = isDarkMode ? COLORS.dark.secondaryText : COLORS.light.secondaryText;

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
  setAlertConfig,
  setAlertVisible,
  isDarkMode,
  toggleDarkMode,
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
  const photoURL = user?.photoURL || "https://placehold.co/100x100/FFD600/000?text=HP";

  const drawerBackgroundColor = isDarkMode ? COLORS.dark.background : COLORS.light.card;
  const profileTextColor = "#fff";
  const profileEmailColor = "#ccc";

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
                    <Image
                      source={{ uri: photoURL }}
                      style={drawerStyles.profileImage}
                      onError={(e) => console.log("Error loading profile image:", e.nativeEvent.error)}
                    />
                    <Text style={[drawerStyles.profileName, { color: profileTextColor }]} numberOfLines={1}>
                      {displayName}
                    </Text>
                    <Text style={[drawerStyles.profileEmail, { color: profileEmailColor }]} numberOfLines={1}>
                      {email}
                    </Text>
                  </View>
                </ImageBackground>

                <DrawerItem
                  icon="home-outline"
                  label="Inicio (Dashboard)"
                  onPress={onClose}
                  isCurrent
                  isDarkMode={isDarkMode}
                />
                <DrawerItem
                  icon="cube-outline"
                  label="Productos"
                  onPress={() => navigation.navigate("Products")}
                  isDarkMode={isDarkMode}
                />
                <DrawerItem
                  icon="people-outline"
                  label="Empleados"
                  onPress={() => navigateToScreen(null, "Módulo de Empleados en desarrollo.")}
                  isDarkMode={isDarkMode}
                />
                <DrawerItem
                  icon="receipt-outline"
                  label="Pedidos"
                  onPress={() => navigateToScreen(null, "Módulo de Pedidos en desarrollo.")}
                  isDarkMode={isDarkMode}
                />
                <DrawerItem
                  icon="location-outline"
                  label="Entregas"
                  onPress={() => navigateToScreen(null, "Módulo de Entregas en desarrollo.")}
                  isDarkMode={isDarkMode}
                />
                <DrawerItem
                  icon="alert-circle-outline"
                  label="Incidentes"
                  onPress={() => navigateToScreen(null, "Módulo de Incidentes en desarrollo.")}
                  isDarkMode={isDarkMode}
                />

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

// --- Home ---
export default function Home({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    message: "",
    customTitle: "",
    onConfirm: () => setAlertVisible(false),
    onCancel: () => setAlertVisible(false),
  });

  const { pieData, barChartData, totalInventoryValue } = useMemo(
    () => prepareChartData(productos),
    [productos]
  );

  const toggleDarkMode = useCallback(async () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    try {
      await AsyncStorage.setItem("darkMode", newMode ? "true" : "false");
    } catch (error) {
      console.error("Error saving dark mode preference:", error);
    }
  }, [isDarkMode]);

  const currentColors = isDarkMode ? COLORS.dark : COLORS.light;

  const chartConfig = {
    backgroundColor: currentColors.chartBackground,
    backgroundGradientFrom: currentColors.chartBackground,
    backgroundGradientTo: currentColors.chartBackground,
    decimalPlaces: 0,
    color: currentColors.chartColor,
    labelColor: currentColors.chartColor,
    barPercentage: 0.6,
    fillShadowGradient: "#FFD600",
    fillShadowGradientOpacity: 0.7,
    style: { borderRadius: 16 },
  };

  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const storedMode = await AsyncStorage.getItem("darkMode");
        if (storedMode !== null) setIsDarkMode(storedMode === "true");
      } catch (error) {
        console.error("Failed to load dark mode preference:", error);
      }
    };
    loadPreferences();

    const authUnsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userData = {
          ...currentUser,
          displayName: currentUser.displayName || `Usuario ${currentUser.uid.substring(0, 4)}`,
          photoURL: currentUser.photoURL || "https://placehold.co/100x100/FFD600/000?text=HP",
        };
        setUser(userData);

        const welcomeShownKey = `welcomeShown_${currentUser.uid}`;
        const yaMostrada = await AsyncStorage.getItem(welcomeShownKey);

        if (!yaMostrada) {
          setAlertConfig({
            type: "success",
            message: `¡Has iniciado sesión en Hollywood Producciones, ${userData.displayName || "empleado"}!`,
            customTitle: "¡Bienvenido!",
            onConfirm: async () => {
              setAlertVisible(false);
              await AsyncStorage.setItem(welcomeShownKey, "true");
            },
            onCancel: undefined,
          });
          setAlertVisible(true);
        }
      } else {
        setUser(null);
      }
    });

    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const firestoreUnsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        stock: parseFloat(d.data().stock || 0),
        precio: parseFloat(d.data().precio || 0),
      }));
      setProductos(arr);
    });

    return () => {
      authUnsub && authUnsub();
      firestoreUnsub && firestoreUnsub();
    };
  }, []);

  const confirmarCerrarSesion = useCallback(() => {
    setAlertConfig({
      type: "warning",
      message: "¿Estás seguro de que deseas cerrar sesión y volver a la pantalla de inicio?",
      customTitle: "Confirmar Cierre de Sesión",
      onConfirm: async () => {
        setAlertVisible(false);
        try {
          if (user?.uid) {
            await AsyncStorage.removeItem(`welcomeShown_${user.uid}`);
          }
          await signOut(auth);
        } catch (error) {
          console.error("Error al cerrar sesión:", error);
        }
      },
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  }, [user]);

  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  const dynamicStyles = useMemo(
    () =>
      StyleSheet.create({
        container: { flex: 1, backgroundColor: currentColors.background },

        totalValueCard: {
          backgroundColor: currentColors.invertedCard,
          borderRadius: 16,
          padding: 20,
          marginBottom: 15,
          alignItems: "center",
          elevation: 10,
        },
        totalValueLabel: {
          fontSize: 14,
          color: isDarkMode ? COLORS.dark.totalValueLabelDark : COLORS.light.totalValueLabelLight,
          fontWeight: "600",
          letterSpacing: 1.5,
        },
        totalValueNumber: {
          fontSize: 36,
          fontWeight: "900",
          color: isDarkMode ? COLORS.light.text : "#FFD600",
          marginVertical: 5,
        },
        totalValueFooter: {
          fontSize: 12,
          color: isDarkMode ? COLORS.dark.totalValueFooterDark : COLORS.light.totalValueFooterLight,
        },

        card: {
          backgroundColor: currentColors.card,
          marginTop: 15,
          borderRadius: 16,
          padding: 10,
          elevation: 4,
        },
        cardTitle: {
          fontSize: 18,
          fontWeight: "700",
          color: currentColors.text,
          marginBottom: 10,
          paddingHorizontal: 10,
        },
        emptyText: {
          textAlign: "center",
          color: currentColors.secondaryText,
          marginTop: 10,
          paddingBottom: 10,
        },

        tituloSeccion: {
          fontSize: 20,
          fontWeight: "700",
          color: currentColors.text,
          marginTop: 30,
          marginBottom: 10,
        },
        activityItem: {
          flexDirection: "row",
          alignItems: "center",
          marginTop: 8,
          paddingVertical: 8,
          paddingHorizontal: 10,
          borderBottomWidth: 1,
          borderBottomColor: currentColors.separator,
        },
        activityText: {
          marginLeft: 8,
          fontSize: 14,
          color: currentColors.secondaryText,
        },

        cajaIcono: {
          backgroundColor: currentColors.card,
          borderRadius: 15,
          borderWidth: 1,
          borderColor: currentColors.separator,
          width: 70,
          height: 70,
          justifyContent: "center",
          alignItems: "center",
          elevation: 2,
        },
        textoIcono: {
          fontSize: 12,
          fontWeight: "600",
          color: currentColors.text,
          textAlign: "center",
          marginTop: 5,
        },

        navInferior: {
          backgroundColor: COLORS.light.footerBackground,
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
        textoNav: {
          fontSize: 12,
          fontWeight: "600",
          color: currentColors.text,
        },
      }),
    [isDarkMode, currentColors]
  );

  return (
    <View style={dynamicStyles.container}>
      <CustomHeader onMenuPress={toggleDrawer} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 80, paddingHorizontal: 20 }}
      >
        <Text style={[styles.title, { color: currentColors.text }]}>Dashboard</Text>

        <View style={dynamicStyles.totalValueCard}>
          <Text style={dynamicStyles.totalValueLabel}>VALOR TOTAL INVENTARIO</Text>
          <Text style={dynamicStyles.totalValueNumber}>
            $ {totalInventoryValue.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={dynamicStyles.totalValueFooter}>Stock total y precios registrados</Text>
        </View>

        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>Top 5 Productos con Mayor Stock</Text>
          {barChartData.datasets[0].data.length > 0 ? (
            <BarChart
              data={barChartData}
              width={CHART_INNER_WIDTH}
              height={250}
              // ⬇️ ⬇️ Fix importante: usar sufijo, no label con “Uds”
              yAxisSuffix=" uds"
              chartConfig={chartConfig}
              verticalLabelRotation={-15}
              fromZero
              style={{ marginVertical: 8, alignSelf: "center", backgroundColor: currentColors.card, borderRadius: 16 }}
              withCustomBarColorFromData
              flatColor
            />
          ) : (
            <Text style={dynamicStyles.emptyText}>Carga productos con stock para este reporte.</Text>
          )}
        </View>

        <View style={dynamicStyles.card}>
          <Text style={dynamicStyles.cardTitle}>Distribución de Productos (por Item)</Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData.map((item) => ({
                ...item,
                legendFontColor: currentColors.secondaryText,
              }))}
              width={CHART_INNER_WIDTH}
              height={200}
              accessor="count"
              backgroundColor="transparent"
              paddingLeft="15"
              chartConfig={{ ...chartConfig, color: currentColors.chartColor }}
              center={[CHART_INNER_WIDTH / 6, 0]}
              style={{ alignSelf: "center", marginTop: 10, paddingRight: 15 }}
            />
          ) : (
            <Text style={dynamicStyles.emptyText}>No hay datos de productos todavía</Text>
          )}
        </View>

        <Text style={dynamicStyles.tituloSeccion}>Agregar</Text>
        <View style={styles.filaIconos}>
          <TouchableOpacity style={dynamicStyles.cajaIcono} onPress={() => navigation.navigate("Products")}>
            <Ionicons name="cube-outline" size={28} color={currentColors.text} />
            <Text style={dynamicStyles.textoIcono}>Productos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.cajaIcono} onPress={() => setAlertVisible(true)}>
            <Ionicons name="receipt-outline" size={28} color={currentColors.text} />
            <Text style={dynamicStyles.textoIcono}>Pedidos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.cajaIcono} onPress={() => setAlertVisible(true)}>
            <Ionicons name="alert-circle-outline" size={28} color={currentColors.text} />
            <Text style={dynamicStyles.textoIcono}>Incidentes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={dynamicStyles.cajaIcono} onPress={() => setAlertVisible(true)}>
            <Ionicons name="people-outline" size={28} color={currentColors.text} />
            <Text style={dynamicStyles.textoIcono}>Empleados</Text>
          </TouchableOpacity>
        </View>

        <Text style={dynamicStyles.tituloSeccion}>Actividades recientes</Text>
        <View style={[dynamicStyles.card, { marginBottom: 20 }]}>
          <Text style={[dynamicStyles.cardTitle, { marginBottom: 10 }]}>Últimos productos creados</Text>
          {productos.length > 0 ? (
            productos.slice(0, 5).map((p) => (
              <View key={p.id} style={dynamicStyles.activityItem}>
                <Ionicons name="cube-outline" size={20} color="#FFD600" />
                <Text style={dynamicStyles.activityText}>
                  Se agregó <Text style={{ fontWeight: "700" }}>{p.nombre}</Text> con stock {p.stock} uds.
                </Text>
              </View>
            ))
          ) : (
            <Text style={dynamicStyles.emptyText}>No hay productos cargados aún.</Text>
          )}
        </View>
      </ScrollView>

      <View style={dynamicStyles.navInferior}>
        <TouchableOpacity onPress={() => navigation.navigate("Home")} style={styles.itemNav}>
          <Ionicons name="home" size={26} color="#000" />
          <Text style={[dynamicStyles.textoNav, { color: "#000", fontWeight: "900" }]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate("Profile")} style={styles.itemNav}>
          <Ionicons name="person-outline" size={26} color={currentColors.text} />
          <Text style={dynamicStyles.textoNav}>Perfil</Text>
        </TouchableOpacity>
      </View>

      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
        navigation={navigation}
        confirmarCerrarSesion={confirmarCerrarSesion}
        user={user}
        setAlertConfig={setAlertConfig}
        setAlertVisible={setAlertVisible}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      <CustomAlert
        isVisible={alertVisible}
        type={alertConfig.type}
        message={alertConfig.message}
        customTitle={alertConfig.customTitle}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />
    </View>
  );
}

const drawerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-start",
    flexDirection: "row",
  },
  drawer: {
    width: DRAWER_WIDTH,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
    height: "100%",
  },
  profileHeaderBackground: {
    width: "100%",
    height: 180,
  },
  profileHeaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.65)",
    padding: 20,
    justifyContent: "flex-end",
    alignItems: "flex-start",
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: "#FFD600",
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    width: "100%",
    textAlign: "left",
  },
  profileEmail: {
    fontSize: 12,
    color: "#ccc",
    marginTop: 2,
    width: "100%",
    textAlign: "left",
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

// Estilos generales
const styles = StyleSheet.create({
  headerBackground: {
    width: "100%",
    height: 180,
    justifyContent: "center",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  logoGrande: {
    width: 120,
    height: 120,
  },
  headerMenuButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 20,
    padding: 5,
    borderRadius: 50,
  },
  headerLogoutButton: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    right: 20,
    padding: 5,
    width: 38,
    height: 38,
    opacity: 0,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },
  filaIconos: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  itemNav: { alignItems: "center" },
});
