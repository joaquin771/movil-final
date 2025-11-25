// screens/ProductDetails.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import Modal from "react-native-modal";
import { Ionicons } from "@expo/vector-icons";
import CustomAlert from "../components/CustomAlert";

const { width } = Dimensions.get("window");

/* ===== Paleta ===== */
const COLORS = {
  overlay: "rgba(0,0,0,0.6)",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#475569",
  blue: "#2F8FFF",
  blueSoft: "#E6F0FF",
  borderSoft: "#E6EEF7",
  dot: "#C7D3E6",
  gold: "#FFD700",
};

const CARD_MAX_W = Math.min(width * 0.92, 520);
const CARD_RADIUS = 18;

const formatMoney = (n = 0) =>
  Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(Number(n || 0));

const getStockStatus = (stock) => {
  const s = Number(stock || 0);
  if (s <= 0) return { label: "No disponible", bg: "#FEE2E2", fg: "#B91C1C" };
  if (s <= 10) return { label: "Poco stock", bg: "#FEF3C7", fg: "#B45309" };
  return { label: "Disponible", bg: "#DCFCE7", fg: "#166534" };
};

/**
 * Modal no full-screen de Detalles de Producto
 * Props:
 *  - visible: boolean
 *  - onClose: () => void
 *  - product: { nombre, descripcion, precio, stock, categoria, estado, imagenes[] }
 *  - onViewBookings?: (product) => void
 *  - onEdit?: (product) => Promise<void>
 */
export default function ProductDetails({
  visible = false,
  onClose = () => {},
  onViewBookings = () => {},
  onEdit = async () => {},
  product,
}) {
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "warning",
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    customTitle: "",
  });

  // datos por defecto (los de tu mock)
  const p = useMemo(
    () =>
      product || {
        nombre: "Silla Plegable Blanca Premium",
        descripcion:
          "Nuestra silla plegable blanca premium es la elección perfecta para cualquier evento, desde bodas elegantes hasta conferencias corporativas. Fabricada con resina de alta calidad y un marco de acero reforzado, garantiza durabilidad y comodidad. Su diseño clásico y limpio se adapta a cualquier decoración.",
        precio: 5,
        stock: 120,
        categoria: "Mobiliario",
        estado: "Nuevo",
        disponibilidad: {
          etiqueta: "Próxima reserva",
          rango: "15 Nov - 18 Nov",
          unidades: 50,
        },
        imagenes: [
          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?q=80&w=1000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1555041469-3f9f9bfb0a34?q=80&w=1000&auto=format&fit=crop",
          "https://images.unsplash.com/photo-1493666438817-866a91353ca9?q=80&w=1000&auto=format&fit=crop",
        ],
      },
    [product]
  );

  const stockInfo = getStockStatus(p.stock);

  const handleEditPress = () => {
    setAlertConfig({
      type: "warning",
      customTitle: "Confirmar edición",
      message: "¿Deseas editar este producto?",
      onConfirm: async () => {
        setAlertVisible(false);
        // Pequeño delay para que la animación del alert se complete
        setTimeout(async () => {
          try {
            await onEdit(p);
            // Mostrar alert de éxito
            setAlertConfig({
              type: "success",
              customTitle: "¡Editado!",
              message: "El producto se actualizó correctamente.",
              onConfirm: () => {
                setAlertVisible(false);
                onClose(); // Cerrar el modal de detalles
              },
            });
            setAlertVisible(true);
          } catch (error) {
            console.error("Error al editar:", error);
            // Mostrar alert de error
            setAlertConfig({
              type: "error",
              customTitle: "Error",
              message: "No se pudo editar el producto. Intenta nuevamente.",
              onConfirm: () => setAlertVisible(false),
            });
            setAlertVisible(true);
          }
        }, 300);
      },
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  };

  return (
    <>
      <Modal
        isVisible={visible}
        onBackdropPress={onClose}
        onBackButtonPress={onClose}
        useNativeDriver
        backdropOpacity={0.6}
        backdropColor="#000"
        style={styles.modal}
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="close" size={20} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Detalles del Producto</Text>
            <View style={styles.iconBtn} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            {/* Galería */}
            <View style={styles.galleryRow}>
              <Image
                source={{ uri: p.imagenes?.[0] }}
                style={styles.mainImage}
              />
              <View style={styles.thumbsCol}>
                <Image
                  source={{ uri: p.imagenes?.[1] || p.imagenes?.[0] }}
                  style={styles.thumb}
                />
                <Image
                  source={{ uri: p.imagenes?.[2] || p.imagenes?.[0] }}
                  style={styles.thumb}
                />
              </View>
            </View>

            {/* Título y chips */}
            <Text style={styles.title} numberOfLines={2}>
              {p.nombre || "Producto"}
            </Text>
            <View style={styles.chipsRow}>
              {!!p.categoria && (
                <View style={[styles.chip, { borderColor: "#3B82F6" }]}>
                  <Text style={styles.chipText}>{p.categoria}</Text>
                </View>
              )}
              {!!p.estado && (
                <View style={[styles.chip, { borderColor: "#10B981" }]}>
                  <Text style={styles.chipText}>{p.estado}</Text>
                </View>
              )}
              <View
                style={[
                  styles.chipFilled,
                  { backgroundColor: stockInfo.bg, borderColor: "transparent" },
                ]}
              >
                <Text style={[styles.chipText, { color: stockInfo.fg }]}>
                  {stockInfo.label}
                </Text>
              </View>
            </View>

            {/* Precio y Stock */}
            <View style={styles.infoRow}>
              <View style={styles.infoBox}>
                <View style={styles.infoHeader}>
                  <Ionicons name="pricetag-outline" size={16} color={COLORS.blue} />
                  <Text style={[styles.infoLabel, { color: COLORS.blue }]}>
                    Precio
                  </Text>
                </View>
                <Text style={styles.infoValue}>
                  {formatMoney(p.precio)} / día
                </Text>
              </View>

              <View style={styles.infoBox}>
                <View style={styles.infoHeader}>
                  <Ionicons name="cube-outline" size={16} color={COLORS.muted} />
                  <Text style={styles.infoLabel}>Stock</Text>
                </View>
                <Text style={styles.infoValue}>{String(p.stock || 0)}</Text>
              </View>
            </View>

            {/* Descripción */}
            {!!p.descripcion && (
              <>
                <Text style={styles.sectionTitle}>Descripción</Text>
                <Text style={styles.description}>{p.descripcion}</Text>
              </>
            )}

            {/* Disponibilidad */}
            {!!p.disponibilidad && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>
                  Disponibilidad
                </Text>
                <View style={styles.availabilityBox}>
                  <View style={styles.availabilityBadge}>
                    <Ionicons name="time-outline" size={16} color={COLORS.text} />
                    <Text style={styles.availabilityBadgeText}>
                      {p.disponibilidad.etiqueta || "Próxima reserva"}
                    </Text>
                  </View>
                  <Text style={styles.availabilityLine}>
                    {p.disponibilidad.rango}{" "}
                    <Text style={{ color: COLORS.muted }}>
                      ({p.disponibilidad.unidades} unidades)
                    </Text>
                  </Text>
                </View>
              </>
            )}

            {/* Botones */}
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => onViewBookings(p)}
              activeOpacity={0.9}
            >
              <Ionicons name="calendar" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Ver Reservas</Text>
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
              <TouchableOpacity 
                style={styles.editBtn} 
                onPress={handleEditPress} 
                activeOpacity={0.9}
              >
                <Ionicons name="pencil" size={16} color="#111" style={{ marginRight: 8 }} />
                <Text style={styles.editBtnText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.secondaryBtn} 
                onPress={onClose} 
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryBtnText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Alert */}
      <CustomAlert
        isVisible={alertVisible}
        type={alertConfig.type}
        message={alertConfig.message}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
        customTitle={alertConfig.customTitle}
      />
    </>
  );
}

/* ===== Estilos ===== */
const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: CARD_MAX_W,
    backgroundColor: COLORS.card,
    borderRadius: CARD_RADIUS,
    borderWidth: 2,
    borderColor: COLORS.gold,
    padding: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 16,
  },

  /* Galería */
  galleryRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  mainImage: {
    width: CARD_MAX_W * 0.55,
    height: CARD_MAX_W * 0.55,
    borderRadius: 12,
    backgroundColor: "#EDEFF3",
  },
  thumbsCol: { flex: 1, gap: 8, justifyContent: "space-between" },
  thumb: {
    width: "100%",
    height: (CARD_MAX_W * 0.55 - 8) / 2,
    borderRadius: 12,
    backgroundColor: "#EDEFF3",
  },

  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "800",
    marginTop: 12,
  },
  chipsRow: { flexDirection: "row", gap: 8, marginTop: 8, flexWrap: "wrap" },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  chipFilled: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 2,
    borderRadius: 12,
  },
  chipText: { fontWeight: "700", color: COLORS.text },

  infoRow: { flexDirection: "row", gap: 12, marginTop: 14 },
  infoBox: {
    flex: 1,
    backgroundColor: COLORS.blueSoft,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
  },
  infoHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  infoLabel: { fontSize: 12, fontWeight: "700", color: COLORS.muted },
  infoValue: { marginTop: 6, fontSize: 16, fontWeight: "800", color: COLORS.text },

  sectionTitle: { marginTop: 8, fontSize: 14, fontWeight: "800", color: COLORS.text },
  description: { marginTop: 6, fontSize: 14, lineHeight: 20, color: COLORS.muted },

  availabilityBox: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.borderSoft,
    borderRadius: 14,
    padding: 12,
    backgroundColor: "#FAFAFA",
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  availabilityBadgeText: { fontSize: 12, fontWeight: "700", color: COLORS.text },
  availabilityLine: { marginTop: 10, fontSize: 14, color: COLORS.text, fontWeight: "700" },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.blue,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  secondaryBtn: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnText: { color: COLORS.text, fontWeight: "700" },
  
  editBtn: {
    flex: 1,
    backgroundColor: COLORS.gold,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  editBtnText: { color: "#111", fontWeight: "800" },
});