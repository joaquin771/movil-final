import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PieChart } from "react-native-chart-kit";
import { db, auth } from "../src/firebaseConfig";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import CustomAlert from "../components/CustomAlert";

// 👇 usamos el theme global
import { useTheme } from "../src/theme/ThemeContext";

const PIE_COLORS = ["#FFD600", "#FFB300", "#FF8F00"];
const HEADER_IMAGE = require("../assets/header.jpg");

export default function Home({ navigation }) {
  const { theme, isDarkMode } = useTheme();

  const [productos, setProductos] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [user, setUser] = useState(null);

  // auth listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return unsubAuth;
  }, []);

  // productos
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          stock: parseFloat(data.stock || 0),
          precio: parseFloat(data.precio || 0),
        };
      });
      setProductos(arr);
    });
    return unsub;
  }, []);

  // pedidos pendientes
  useEffect(() => {
    const q = query(
      collection(db, "orders"),
      where("estado", "==", "pendiente")
    );
    const unsub = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const { totalStock, bajoStock, pieData } = useMemo(() => {
    let totalStock = 0;
    let bajoStock = 0;
    const categorias = {};

    productos.forEach((p) => {
      const stock = Number(p.stock) || 0;
      totalStock += stock;
      if (stock < 5) bajoStock++;
      const cat = p.categoria || "Sin categoría";
      categorias[cat] = (categorias[cat] || 0) + 1;
    });

    const pieData = Object.keys(categorias).map((cat, i) => ({
      name: cat,
      count: categorias[cat],
      color: PIE_COLORS[i % PIE_COLORS.length],
      legendFontColor: theme.text,
      legendFontSize: 13,
    }));

    return { totalStock, bajoStock, pieData };
  }, [productos, theme.text]);

  // Colores derivados del theme para las tarjetas especiales
  const colorsForCards = {
    totalInventoryBg: theme.primary, // dorado
    totalInventoryText: "#000", // contraste fijo negro sobre dorado
    lowStockCardBg: theme.card,
    lowStockText: theme.text,
    pedidosCardBg: theme.primary,
    pedidosText: "#000",
    pedidosBtnBg: "#000",
    pedidosBtnText: theme.primary,
  };

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    color: () => theme.text,
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.background },
      ]}
    >
      {/* Header */}
      <ImageBackground source={HEADER_IMAGE} style={styles.headerBackground}>
        <View
          style={[
            styles.headerOverlay,
            { backgroundColor: theme.headerOverlay },
          ]}
        />
        <View style={styles.headerContent}>
          <Image
            source={require("../assets/logo.png")}
            style={styles.logoGrande}
            resizeMode="contain"
          />
        </View>
      </ImageBackground>

      {/* Contenido principal */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160, paddingHorizontal: 20 }}
      >
        <Text style={[styles.title, { color: theme.text }]}>Dashboard</Text>

        {/* TOTAL INVENTARIO */}
        <View
          style={[
            styles.totalValueCard,
            { backgroundColor: colorsForCards.totalInventoryBg },
          ]}
        >
          <Text
            style={[
              styles.totalValueLabel,
              { color: colorsForCards.totalInventoryText },
            ]}
          >
            TOTAL INVENTARIO DISPONIBLE
          </Text>
          <Text
            style={[
              styles.totalValueNumber,
              { color: colorsForCards.totalInventoryText },
            ]}
          >
            {isNaN(totalStock)
              ? "0"
              : totalStock.toLocaleString("es-AR")}
          </Text>
        </View>

        {/* Bajo stock / Pedidos pendientes */}
        <View style={styles.infoRow}>
          {/* Bajo stock */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colorsForCards.lowStockCardBg },
            ]}
          >
            <Text
              style={[
                styles.infoTitle,
                { color: colorsForCards.lowStockText },
              ]}
            >
              Bajo stock
            </Text>
            <Text style={[styles.infoNumber, { color: "#FF3B30" }]}>
              {bajoStock}
            </Text>
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: theme.primary },
              ]}
              onPress={() =>
                navigation.navigate("Products", {
                  filter: "lowStock",
                })
              }
            >
              <Text
                style={[
                  styles.infoButtonText,
                  { color: "#000" },
                ]}
              >
                Revisar stock
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pedidos pendientes */}
          <View
            style={[
              styles.infoCard,
              { backgroundColor: colorsForCards.pedidosCardBg },
            ]}
          >
            <Text
              style={[
                styles.infoTitle,
                { color: colorsForCards.pedidosText },
              ]}
            >
              Pedidos pendientes
            </Text>
            <Text
              style={[
                styles.infoNumber,
                { color: colorsForCards.pedidosText },
              ]}
            >
              {pedidos.length}
            </Text>
            <TouchableOpacity
              style={[
                styles.infoButton,
                { backgroundColor: colorsForCards.pedidosBtnBg },
              ]}
              onPress={() => navigation.navigate("Orders")}
            >
              <Text
                style={[
                  styles.infoButtonText,
                  { color: colorsForCards.pedidosBtnText },
                ]}
              >
                Ver pedidos
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Agregar */}
        <Text
          style={[
            styles.tituloSeccion,
            { color: theme.text },
          ]}
        >
          Agregar
        </Text>

        <View style={styles.filaIconos}>
          <TouchableOpacity
            style={[
              styles.cajaIcono,
              { backgroundColor: theme.card },
            ]}
            onPress={() => navigation.navigate("Products")}
          >
            <Ionicons
              name="cube-outline"
              size={28}
              color={theme.text}
            />
            <Text
              style={[
                styles.textoIcono,
                { color: theme.text },
              ]}
            >
              Productos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cajaIcono,
              { backgroundColor: theme.card },
            ]}
            onPress={() => navigation.navigate("Orders")}
          >
            <Ionicons
              name="receipt-outline"
              size={28}
              color={theme.text}
            />
            <Text
              style={[
                styles.textoIcono,
                { color: theme.text },
              ]}
            >
              Pedidos
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cajaIcono,
              { backgroundColor: theme.card },
            ]}
            onPress={() => setAlertVisible(true)}
          >
            <Ionicons
              name="alert-circle-outline"
              size={28}
              color={theme.text}
            />
            <Text
              style={[
                styles.textoIcono,
                { color: theme.text },
              ]}
            >
              Incidentes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.cajaIcono,
              { backgroundColor: theme.card },
            ]}
            onPress={() => navigation.navigate("Empleados")}
          >
            <Ionicons
              name="people-outline"
              size={28}
              color={theme.text}
            />
            <Text
              style={[
                styles.textoIcono,
                { color: theme.text },
              ]}
            >
              Empleados
            </Text>
          </TouchableOpacity>
        </View>

        {/* Gráfico de categorías */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text },
            ]}
          >
            Productos por categoría
          </Text>
          {pieData.length > 0 ? (
            <PieChart
              data={pieData}
              width={Dimensions.get("window").width - 60}
              height={200}
              accessor="count"
              backgroundColor="transparent"
              chartConfig={chartConfig}
              paddingLeft="15"
              style={{ alignSelf: "center" }}
            />
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: theme.textSecondary,
              }}
            >
              No hay datos de productos todavía.
            </Text>
          )}
        </View>

        {/* Actividades recientes */}
        <Text
          style={[
            styles.tituloSeccion,
            { color: theme.text },
          ]}
        >
          Actividades recientes
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: theme.card },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.text },
            ]}
          >
            Últimos productos creados
          </Text>

          {productos.length > 0 ? (
            productos.slice(0, 5).map((p) => (
              <View key={p.id} style={styles.activityItem}>
                <Ionicons
                  name="cube-outline"
                  size={20}
                  color={theme.primary}
                />
                <Text
                  style={[
                    styles.activityText,
                    { color: theme.text },
                  ]}
                >
                  Se agregó{" "}
                  <Text style={{ fontWeight: "700" }}>
                    {p.nombre}
                  </Text>{" "}
                  con stock {p.stock} uds.
                </Text>
              </View>
            ))
          ) : (
            <Text
              style={{
                textAlign: "center",
                color: theme.textSecondary,
              }}
            >
              No hay productos cargados aún.
            </Text>
          )}
        </View>
      </ScrollView>

      {/* Footer */}
      <View
        style={[
          styles.footer,
          { backgroundColor: theme.primary },
        ]}
      >
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate("Home")}
        >
          <Ionicons name="home-outline" size={26} color={"#000"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => navigation.navigate("Profile")}
        >
          <Ionicons name="person-outline" size={26} color={"#000"} />
        </TouchableOpacity>
      </View>

      {/* Alert genérica */}
      <CustomAlert
        isVisible={alertVisible}
        type="info"
        message="Módulo en desarrollo."
        customTitle="Próximamente"
        onConfirm={() => setAlertVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  headerBackground: {
    width: "100%",
    height: 180,
    justifyContent: "center",
  },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  headerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  logoGrande: { width: 120, height: 120 },

  title: {
    fontSize: 26,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 10,
  },

  totalValueCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
  },
  totalValueLabel: {
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1.5,
  },
  totalValueNumber: {
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 5,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  infoCard: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 16,
    padding: 15,
    alignItems: "center",
    elevation: 5,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 5,
  },
  infoNumber: {
    fontSize: 28,
    fontWeight: "900",
    marginBottom: 10,
  },
  infoButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  infoButtonText: {
    fontWeight: "700",
  },

  card: {
    borderRadius: 16,
    padding: 15,
    marginBottom: 20,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },

  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  activityText: {
    marginLeft: 8,
    fontSize: 14,
  },

  tituloSeccion: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 20,
    marginBottom: 12,
  },

  filaIconos: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 18,
    paddingBottom: 4,
  },
  cajaIcono: {
    width: 70,
    height: 70,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  textoIcono: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 5,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    height: 90,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 22 : 12,
    borderTopWidth: 0,
  },
  footerItem: { alignItems: "center", justifyContent: "center" },
});
