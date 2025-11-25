import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ImageBackground,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal as RNModal,
  TouchableWithoutFeedback,
  StatusBar,
  Animated,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { auth, db } from "../src/firebaseConfig";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
} from "firebase/firestore";
import CustomAlert from "../components/CustomAlert";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ProductDetails from "./ProductDetails";
import { useTheme } from "../src/theme/ThemeContext";

const { width, height } = Dimensions.get("window");

const PRIMARY_COLOR = "#FFD600";
const HEADER_IMAGE_SOURCE = require("../assets/header.jpg");
const LOGO_SOURCE = require("../assets/logo.png");
const DRAWER_WIDTH = width * 0.75;

/* ============================= */
/*     CLOUDINARY (PRODUCTO)     */
/* ============================= */
const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dtqsvxsm9/image/upload";
const CLOUDINARY_UPLOAD_PRESET = "producto";

const uploadImageToCloudinary = async (uri) => {
  try {
    const formData = new FormData();
    const ext = (uri.split(".").pop() || "jpg").toLowerCase();
    formData.append("file", {
      uri,
      type: `image/${ext}`,
      name: `photo_${Date.now()}.${ext}`,
    });
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("cloud_name", "dtqsvxsm9");

    const res = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: formData,
      // En RN no fijar Content-Type al enviar FormData
    });

    const data = await res.json();
    if (res.ok && data.secure_url) return data.secure_url;
    throw new Error(data.error?.message || "Error al subir imagen");
  } catch (e) {
    console.error("Cloudinary:", e);
    throw e;
  }
};


/*       UI: CUSTOM HEADER     */
const CustomHeader = React.memo(({ onMenuPress, theme }) => {
  const iosSafe = 52;
  const androidSafe = (StatusBar.currentHeight || 24) + 8;
  return (
    <ImageBackground
      source={HEADER_IMAGE_SOURCE}
      style={headerStyles.headerBackground}
      resizeMode="cover"
    >
      <View
        style={[
          headerStyles.headerOverlay,
          { backgroundColor: theme.headerOverlay },
        ]}
      />
      <View
        style={[
          headerStyles.headerContent,
          { paddingTop: Platform.OS === "ios" ? iosSafe : androidSafe },
        ]}
      >
        <TouchableOpacity
          style={headerStyles.headerMenuButton}
          onPress={onMenuPress}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
        >
          <Ionicons name="menu-outline" size={28} color={theme.primary} />
        </TouchableOpacity>

        <View style={headerStyles.headerCenterBlock}>
          <Image
            source={LOGO_SOURCE}
            style={headerStyles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={{ width: 28 }} />
      </View>
    </ImageBackground>
  );
});


/*       UI: DRAWER ITEM       */

const DrawerItem = ({ icon, label, onPress, isCurrent, theme }) => {
  return (
    <TouchableOpacity
      style={[
        drawerStyles.drawerItem,
        { borderBottomColor: theme.border },
        isCurrent && { backgroundColor: "rgba(255,214,0,0.2)" },
      ]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={24} color={theme.textSecondary} />
      <Text
        style={[drawerStyles.drawerItemLabel, { color: theme.textSecondary }]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};


/*        UI: DRAWER MENU      */

const DrawerMenu = ({
  isOpen,
  onClose,
  navigation,
  confirmarCerrarSesion,
  user,
  theme,
  setAlertConfig,
  setAlertVisible,
}) => {
  const navigateTo = useCallback(
    (screenName, placeholderMsg) => {
      onClose();
      if (screenName) {
        navigation.navigate(screenName);
      } else {
        setAlertConfig({
          type: "info",
          message: placeholderMsg,
          customTitle: "Próximamente",
          onConfirm: () => setAlertVisible(false),
        });
        setAlertVisible(true);
      }
    },
    [onClose, navigation, setAlertConfig, setAlertVisible]
  );

  const displayName = user?.displayName || "Empleado";
  const email = user?.email || "Sin Email";
  const photoURL = user?.photoURL;

  return (
    <RNModal animationType="fade" transparent visible={isOpen} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={drawerStyles.overlay}>
          <TouchableWithoutFeedback>
            <View
              style={[
                drawerStyles.drawer,
                { backgroundColor: theme.card, borderRightColor: theme.border },
              ]}
            >
              <ScrollView showsVerticalScrollIndicator={false}>
                <ImageBackground
                  source={require("../assets/headerhome.jpg")}
                  style={drawerStyles.profileHeaderBackground}
                  resizeMode="cover"
                >
                  <View
                    style={[
                      drawerStyles.profileHeaderOverlay,
                      { backgroundColor: theme.headerOverlay },
                    ]}
                  >
                    {photoURL ? (
                      <Image
                        source={{ uri: photoURL }}
                        style={[
                          drawerStyles.profileImage,
                          { borderColor: theme.primary },
                        ]}
                      />
                    ) : (
                      <Ionicons
                        name="person-circle-outline"
                        size={70}
                        color={theme.primary}
                      />
                    )}

                    <Text
                      style={[drawerStyles.profileName, { color: theme.text }]}
                      numberOfLines={1}
                    >
                      {displayName}
                    </Text>
                    <Text
                      style={[drawerStyles.profileEmail, { color: "#000" }]}
                      numberOfLines={1}
                    >
                      {email}
                    </Text>
                  </View>
                </ImageBackground>

                <DrawerItem
                  icon="home-outline"
                  label="Inicio"
                  onPress={() => navigateTo("Home")}
                  theme={theme}
                />
                <DrawerItem
                  icon="person-circle-outline"
                  label="Perfil"
                  onPress={() => navigateTo("Profile")}
                  theme={theme}
                />
                <DrawerItem
                  icon="cube-outline"
                  label="Productos"
                  onPress={onClose}
                  isCurrent
                  theme={theme}
                />
                <DrawerItem
                  icon="people-outline"
                  label="Empleados"
                  onPress={() => navigateTo(null, "Módulo de Empleados en desarrollo.")}
                  theme={theme}
                />
                <DrawerItem
                  icon="receipt-outline"
                  label="Pedidos"
                  onPress={() => navigateTo(null, "Módulo de Pedidos en desarrollo.")}
                  theme={theme}
                />
                <DrawerItem
                  icon="location-outline"
                  label="Entregas"
                  onPress={() => navigateTo(null, "Módulo de Entregas en desarrollo.")}
                  theme={theme}
                />
                <DrawerItem
                  icon="alert-circle-outline"
                  label="Incidentes"
                  onPress={() => navigateTo(null, "Módulo de Incidentes en desarrollo.")}
                  theme={theme}
                />

                <View style={{ height: 20 }} />

                <DrawerItem
                  icon="log-out-outline"
                  label="Cerrar Sesión"
                  onPress={() => {
                    onClose();
                    confirmarCerrarSesion();
                  }}
                  theme={theme}
                />
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
};


/*   HELPERS DE FORMATO/UI     */
const formatMoney = (n = 0) =>
  Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(Number(n || 0));

const getStockStatus = (stock) => {
  const s = Number(stock || 0);
  if (s <= 0) return { label: "No Disponible", text: "#fff", bg: "#E74C3C" };
  if (s <= 10) return { label: "Poco Stock", text: "#000", bg: "#F4C542" };
  return { label: "Disponible", text: "#000", bg: "#52D273" };
};


/*     CARD DE PRODUCTO UI     */

const ProductCard = ({
  item,
  theme,
  onView,
  onEdit,
  getCategoryColor,
}) => {
  const status = getStockStatus(item.stock);
  const inactive = item.activo === false;

  return (
    <View
      style={[
        styles.productCard,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: inactive ? 0.6 : 1 },
      ]}
    >
      {item.foto ? (
        <Image source={{ uri: item.foto }} style={styles.productImage} />
      ) : (
        <View style={[styles.productImagePlaceholder, { backgroundColor: "#222" }]}>
          <Ionicons name="image-outline" size={30} color="#ccc" />
        </View>
      )}

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={[styles.productName, { color: theme.text }]} numberOfLines={1}>
          {item.nombre}
        </Text>

        <Text style={[styles.productDetail, { color: theme.textSecondary }]} numberOfLines={1}>
          {formatMoney(item.precio)} <Text>/ unidad</Text>{"   "}
          <Text>Stock: </Text>
          <Text style={{ fontWeight: "bold", color: theme.text }}>{item.stock}</Text>
        </Text>

        <View style={styles.pillsRow}>
          <View style={[styles.pill, { backgroundColor: status.bg }]}>
            <Text style={[styles.pillText, { color: status.text }]}>{status.label}</Text>
          </View>

          <View
            style={[styles.pill, { backgroundColor: getCategoryColor(item.categoria) || "#555" }]}
          >
            <Text style={[styles.pillText, { color: "#fff" }]}>{item.categoria}</Text>
          </View>

        <View
            style={[
              styles.pill,
              { backgroundColor: inactive ? "#6b7280" : "#10b981" },
            ]}
          >
            <Text style={[styles.pillText, { color: "#fff" }]}>
              {inactive ? "Inactivo" : "Activo"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.actionsCol}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: "#151515", borderColor: "#242424" }]}
          onPress={() => onView(item)}
        >
          <Ionicons name="eye-outline" size={18} color="#0ea5e9" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: "#151515", borderColor: "#242424" }]}
          onPress={() => onEdit(item)}
        >
          <Ionicons name="create-outline" size={18} color="#a3e635" />
        </TouchableOpacity>
        {/* Botón de eliminar/restaurar eliminado */}
      </View>
    </View>
  );
};


/*        PRODUCTS SCREEN      */
export default function Products({ navigation }) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const currentUser = auth.currentUser;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((p) => !p), []);

  const scrollRef = useRef(null);

  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const showToast = useCallback(
    (msg) => {
      setToastMessage(msg);
      setToastVisible(true);
      Animated.timing(toastOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start(
        () => {
          setTimeout(() => {
            Animated.timing(toastOpacity, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              setToastVisible(false);
              setToastMessage("");
            });
          }, 2000);
        }
      );
    },
    [toastOpacity]
  );

  const [addModalVisible, setAddModalVisible] = useState(false);

  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [detailsVisible, setDetailsVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // form
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [categoria, setCategoria] = useState("");
  const [foto, setFoto] = useState(null);
  const [activoState, setActivoState] = useState(true); // estado del switch

  // búsqueda + filtros
  const [searchText, setSearchText] = useState("");
  const [orden, setOrden] = useState("desc");
  const [filterCategory, setFilterCategory] = useState("");

  // filtro de actividad
  const [filterActive, setFilterActive] = useState("todos");

  // edición
  const [editingProductId, setEditingProductId] = useState(null);

  // alert global custom
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    message: "",
    customTitle: "",
    onConfirm: () => setAlertVisible(false),
    onCancel: () => setAlertVisible(false),
  });

  const getCategoryColor = (category) => {
    switch (category) {
      case "Vajilla":
        return "#FF8C00";
      case "Mantelería":
        return "#228B22";
      case "Decoración":
        return "#800080";
      case "Salón":
        return "#00BFFF";
      case "Cristalería":
        return "#4169E1";
      default:
        return "#555";
    }
  };

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        setProductos(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
        setLoading(false);
      },
      () => {
        setLoading(false);
        setAlertConfig({
          type: "error",
          message: "No se pudieron cargar los productos.",
          customTitle: "Error",
          onConfirm: () => setAlertVisible(false),
        });
        setAlertVisible(true);
      }
    );
    return () => unsub();
  }, []);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      setAlertConfig({
        type: "warning",
        message: "Se requieren permisos para acceder a la galería.",
        customTitle: "Permisos",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    }
  };

  const pickImage = async () => {
    try {
      await requestPermissions();
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
      });
      if (!result.canceled) setFoto(result.assets[0].uri);
    } catch (err) {
      console.log("Error al seleccionar imagen:", err);
    }
  };

  const onChangeNombre = (text) => {
    const cleaned = text.replace(/[0-9]/g, "");
    setNombre(cleaned);
  };

  const handleViewProduct = (item) => {
    setSelectedProduct(item);
    setDetailsVisible(true);
  };

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setCategoria("");
    setFoto(null);
    setActivoState(true);
    setEditingProductId(null);
  };

  const handleEditProduct = (item) => {
    setNombre(item.nombre || "");
    setDescripcion(item.descripcion || "");
    setPrecio(item.precio != null ? String(item.precio) : "");
    setStock(item.stock != null ? String(item.stock) : "");
    setCategoria(item.categoria || "");
    setFoto(item.foto || null);
    setActivoState(item.activo !== false);
    setEditingProductId(item.id);
    setAddModalVisible(true);
  };

  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ y: 0, animated: true });
    }
  };

  const handleSaveProduct = async () => {
  // Validaciones de campos vacíos
  if (!nombre.trim() || !precio.trim() || !stock.trim() || !categoria.trim()) {
    setAlertConfig({
      type: "error",
      message: "Por favor, completá todos los campos obligatorios para continuar.",
      customTitle: "Campos incompletos",
      onConfirm: () => setAlertVisible(false),
    });
    setAlertVisible(true);
    return;
  }

  // Validación de nombre sin números
  if (/\d/.test(nombre)) {
    setAlertConfig({
      type: "error",
      message: "El nombre no puede contener números.",
      customTitle: "Nombre inválido",
      onConfirm: () => setAlertVisible(false),
    });
    setAlertVisible(true);
    return;
  }

  // Validación de formato numérico
  const precioNum = Number(String(precio).replace(",", "."));
  const stockNum = Number(stock);
  if (isNaN(precioNum) || isNaN(stockNum)) {
    setAlertConfig({
      type: "error",
      message: "Precio y stock deben ser números válidos.",
      customTitle: "Formato inválido",
      onConfirm: () => setAlertVisible(false),
    });
    setAlertVisible(true);
    return;
  }

  setIsSaving(true);
  try {
    let finalPhotoURL = foto;
    if (foto && !foto.startsWith("http")) {
      finalPhotoURL = await uploadImageToCloudinary(foto);
    }

    const dataToSave = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      precio: precioNum,
      stock: stockNum,
      categoria: categoria.trim(),
      foto: finalPhotoURL || null,
      activo: !!activoState,
    };

    if (editingProductId) {
      // EDICIÓN
      await updateDoc(doc(db, "products", editingProductId), dataToSave);
      
      setIsSaving(false);
      setAddModalVisible(false);
      resetForm();
      scrollToTop();
      
      // Alert de éxito para edición
      setAlertConfig({
        type: "success",
        customTitle: "¡Producto actualizado!",
        message: "Los cambios se guardaron correctamente.",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      return;
    }

    // CREACIÓN
    await addDoc(collection(db, "products"), {
      ...dataToSave,
      createdAt: serverTimestamp(),
      createdBy: currentUser ? currentUser.uid : null,
    });

    setIsSaving(false);
    setAddModalVisible(false);
    resetForm();
    scrollToTop();
    
    // Alert de éxito para creación
    setAlertConfig({
      type: "success",
      customTitle: "¡Producto creado!",
      message: "El producto se agregó correctamente al inventario.",
      onConfirm: () => setAlertVisible(false),
    });
    setAlertVisible(true);
    
  } catch (err) {
    console.log("Error guardar producto:", err);
    setIsSaving(false);
    
    // Alert de error
    setAlertConfig({
      type: "error",
      message: "Ocurrió un inconveniente al guardar el producto. Intentá nuevamente en unos instantes.",
      customTitle: "No se pudo completar la acción",
      onConfirm: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  }
};

  // === CANCELAR en el form: alerta nativa
  const handleCancelPress = () => {
  setAlertConfig({
    type: "warning",
    customTitle: "¿Deseás descartar cambios?",
    message: "Si descartás los cambios, se va a cerrar la edición y vas a volver a Gestión de Productos sin guardar nada.",
    onConfirm: () => {
      setAlertVisible(false);
      setAddModalVisible(false);
      resetForm();
    },
    onCancel: () => setAlertVisible(false),
  });
  setAlertVisible(true);
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
        } catch (e) {
          console.error("signOut:", e);
        }
      },
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  }, []);

  const formReady =
    nombre.trim() && precio.trim() && stock.trim() && categoria.trim();

  // === PIPELINE DE FILTROS (lista)
  const productosFiltrados = productos
    .filter((p) => p.nombre?.toLowerCase().includes(searchText.toLowerCase()))
    .filter((p) => (filterCategory ? p.categoria === filterCategory : true))
    .filter((p) =>
      filterActive === "activos"
        ? p.activo !== false
        : filterActive === "inactivos"
        ? p.activo === false
        : true
    )
    .sort((a, b) => (orden === "asc" ? a.precio - b.precio : b.precio - a.precio));

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* HEADER */}
      <CustomHeader onMenuPress={toggleDrawer} theme={theme} />

      {/* CONTENIDO */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, { color: theme.text }]}>Productos</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Gestiona tus productos fácilmente
          </Text>

          {/* BUSCADOR */}
          <View
            style={[
              styles.searchContainer,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Ionicons
              name="search-outline"
              size={18}
              color={theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Buscar productos..."
              placeholderTextColor={theme.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")} style={{ marginLeft: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* TITULO CATEGORIAS */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Categorías
          </Text>

          {/* FILTROS POR CATEGORÍA */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryChipsContainer}
          >
            <TouchableOpacity
              style={[
                styles.catFilterChip,
                {
                  backgroundColor: filterCategory === "" ? theme.text : theme.card,
                  borderColor: filterCategory === "" ? theme.text : theme.border,
                },
              ]}
              onPress={() => setFilterCategory("")}
            >
              <Text
                style={[
                  styles.catFilterText,
                  { color: filterCategory === "" ? theme.background : theme.text },
                ]}
              >
                Todas
              </Text>
            </TouchableOpacity>

            {["Vajilla", "Mantelería", "Decoración", "Salón", "Cristalería"].map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.catFilterChip,
                  {
                    backgroundColor:
                      filterCategory === c ? getCategoryColor(c) : theme.card,
                    borderColor:
                      filterCategory === c ? getCategoryColor(c) : theme.border,
                  },
                ]}
                onPress={() => setFilterCategory(filterCategory === c ? "" : c)}
              >
                <Text
                  style={[
                    styles.catFilterText,
                    {
                      color: filterCategory === c ? "#fff" : theme.text,
                      fontWeight: filterCategory === c ? "700" : "600",
                    },
                  ]}
                >
                  {c}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* TITULO ESTADO */}
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
            Estado
          </Text>

          {/* FILTROS ESTADO */}
          <View style={{ flexDirection: "row", marginBottom: 12 }}>
            {[
              { key: "todos", label: "Todos" },
              { key: "activos", label: "Activos" },
              { key: "inactivos", label: "Inactivos" },
            ].map((f) => {
              const isSel = filterActive === f.key;
              return (
                <TouchableOpacity
                  key={f.key}
                  style={[
                    styles.catFilterChip,
                    {
                      backgroundColor: isSel ? theme.text : theme.card,
                      borderColor: isSel ? theme.text : theme.border,
                      marginRight: 8,
                    },
                  ]}
                  onPress={() => setFilterActive(f.key)}
                >
                  <Text
                    style={[
                      styles.catFilterText,
                      { color: isSel ? theme.background : theme.text, fontWeight: "700" },
                    ]}
                  >
                    {f.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* LISTA */}
          {loading ? (
            <Text style={{ textAlign: "center", marginTop: 30, color: theme.textSecondary }}>
              Cargando...
            </Text>
          ) : productosFiltrados.length > 0 ? (
            productosFiltrados.map((item) => (
              <ProductCard
                key={item.id}
                item={item}
                theme={theme}
                onView={handleViewProduct}
                onEdit={handleEditProduct}
                getCategoryColor={getCategoryColor}
              />
            ))
          ) : (
            <Text style={[styles.noResults, { color: theme.textSecondary }]}>
              No hay productos. Pulsá + añadir para crear uno.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BOTÓN AÑADIR */}
      <TouchableOpacity
        style={[
          styles.addButton,
          {
            bottom: 24 + insets.bottom,
            backgroundColor: theme.background,
            opacity: isSaving ? 0.6 : 1,
          },
        ]}
        onPress={() => {
          resetForm();
          setAddModalVisible(true);
        }}
        disabled={isSaving}
      >
        <Ionicons name="add" size={26} color={theme.primary} />
        <Text style={[styles.addText, { color: theme.primary }]}>añadir</Text>
      </TouchableOpacity>

      {/* DRAWER */}
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={toggleDrawer}
        navigation={navigation}
        confirmarCerrarSesion={confirmarCerrarSesion}
        user={currentUser}
        theme={theme}
        setAlertConfig={setAlertConfig}
        setAlertVisible={setAlertVisible}
      />

      {/* MODAL AÑADIR / EDITAR PRODUCTO */}
      <Modal
        isVisible={addModalVisible}
        onBackdropPress={handleCancelPress}
        onBackButtonPress={handleCancelPress}
        animationIn="fadeIn"
        animationOut="fadeOut"
        avoidKeyboard
        style={styles.centeredModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.addModalWrapperCenter}
        >
          <ScrollView
            contentContainerStyle={styles.addModalCenter}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.addModalTitle}>
              {editingProductId ? "Editar producto" : "Añadir producto"}
            </Text>

            {/* NOMBRE */}
            <Text style={styles.inlineLabel}>Nombre del producto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Fuente Oval Vintage Red"
              placeholderTextColor="#999"
              value={nombre}
              onChangeText={onChangeNombre}
              editable={!isSaving}
            />

            {/* DESCRIPCIÓN */}
            <Text style={styles.inlineLabel}>Descripción del producto</Text>
            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Ej: Fuente ovalada de porcelana con borde ondulado rojo..."
              placeholderTextColor="#999"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              editable={!isSaving}
            />

            {/* PRECIO */}
            <Text style={styles.inlineLabel}>Precio del producto</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 1900"
              placeholderTextColor="#999"
              value={precio}
              onChangeText={setPrecio}
              keyboardType="numeric"
              editable={!isSaving}
            />

            {/* STOCK */}
            <Text style={styles.inlineLabel}>Stock disponible</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: 100"
              placeholderTextColor="#999"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
              editable={!isSaving}
            />

            {/* CATEGORÍA */}
            <Text style={styles.inlineLabel}>Categoría</Text>
            <View style={styles.categoryContainer}>
              {["Vajilla", "Mantelería", "Decoración", "Salón", "Cristalería"].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    {
                      borderColor: getCategoryColor(cat),
                      backgroundColor: categoria === cat ? getCategoryColor(cat) : "#fff",
                      borderWidth: categoria === cat ? 2 : 1,
                      opacity: isSaving ? 0.5 : 1,
                    },
                  ]}
                  disabled={isSaving}
                  onPress={() => setCategoria(cat)}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      categoria === cat && { color: "#fff", fontWeight: "700" },
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ESTADO (Switch) — ahora debajo de Categoría */}
            <View style={[styles.switchRow, { marginTop: 6 }]}>
              <Text style={styles.inlineLabel}>Estado</Text>
              <View style={{ flex: 1 }} />
              <Text style={{ marginRight: 8, color: "#000", fontWeight: "600" }}>
                {activoState ? "Activo" : "Inactivo"}
              </Text>
              <Switch value={activoState} onValueChange={setActivoState} />
            </View>

            {/* IMAGEN */}
            <Text style={styles.inlineLabel}>Imagen del producto</Text>
            <TouchableOpacity
              style={styles.imagePickerLarge}
              onPress={pickImage}
              activeOpacity={0.8}
              disabled={isSaving}
            >
              {foto ? (
                <Image source={{ uri: foto }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="add" size={36} color="#000" />
                  <Text style={styles.imagePlaceholderText}>Agregar imagen</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* BOTONES */}
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelPress} disabled={isSaving}>
                <Text style={{ color: "#000", fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, (!formReady || isSaving) && { opacity: 0.5 }]}
                onPress={handleSaveProduct}
                disabled={isSaving || !formReady}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {isSaving ? "Guardando..." : editingProductId ? "Guardar" : "Crear"}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ALERTA GLOBAL */}
      <CustomAlert
        isVisible={alertVisible}
        type={alertConfig.type}
        message={alertConfig.message}
        customTitle={alertConfig.customTitle}
        onConfirm={alertConfig.onConfirm}
        onCancel={alertConfig.onCancel}
      />

      {/* DETALLES */}
      <ProductDetails
        visible={detailsVisible}
        onClose={() => setDetailsVisible(false)}
        product={
          selectedProduct
            ? {
                nombre: selectedProduct.nombre,
                descripcion: selectedProduct.descripcion,
                precio: selectedProduct.precio,
                stock: selectedProduct.stock,
                categoria: selectedProduct.categoria,
                estado: getStockStatus(selectedProduct.stock).label,
                imagenes: selectedProduct.foto ? [selectedProduct.foto] : [],
                disponibilidad: null,
              }
            : null
        }
      />

      {/* TOAST */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toastContainer,
            {
              bottom: 16 + insets.bottom,
              opacity: toastOpacity,
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle-outline"
            size={20}
            color={theme.primary}
            style={{ marginRight: 8 }}
          />
          <Text style={{ color: theme.text, fontWeight: "600", fontSize: 14 }}>
            {toastMessage}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}


/*            STYLES             */

const headerStyles = StyleSheet.create({
  headerBackground: { height: 140, width: "100%", justifyContent: "flex-end" },
  headerOverlay: { ...StyleSheet.absoluteFillObject },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingBottom: 12,
  },
  headerMenuButton: { padding: 6 },
  headerCenterBlock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    pointerEvents: "none",
  },
  logoImage: { width: 70, height: 70, marginRight: 10 },
  headerTitleText: { color: "#fff", fontSize: 22, fontWeight: "bold" },
});

const drawerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: "100%",
    paddingTop: 0,
    borderRightWidth: 1,
  },
  profileHeaderBackground: { height: 150, width: "100%", justifyContent: "flex-end" },
  profileHeaderOverlay: { padding: 15, alignItems: "flex-start" },
  profileImage: { width: 60, height: 60, borderRadius: 30, borderWidth: 2, marginBottom: 5 },
  profileName: { fontSize: 18, fontWeight: "bold" },
  profileEmail: { fontSize: 14, color: "#000", fontWeight: "400" },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  drawerItemLabel: { marginLeft: 15, fontSize: 16, fontWeight: "500" },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 10 },

  title: { fontSize: 28, fontWeight: "800", marginTop: 6, textAlign: "left", alignSelf: "flex-start" },
  subtitle: { marginTop: 6, marginBottom: 14, fontSize: 14, textAlign: "left", alignSelf: "flex-start" },

  // mini títulos de secciones
  sectionTitle: {
    marginTop: 6,
    marginBottom: 6,
    fontSize: 13,
    fontWeight: "700",
    textAlign: "left",
    alignSelf: "flex-start",
  },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14 },

  categoryChipsContainer: { paddingVertical: 5, marginBottom: 12 },

  productCard: {
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  productName: { fontSize: 16, fontWeight: "700", marginBottom: 2 },

  productDetail: { fontSize: 13, marginBottom: 4 },

  productImage: { width: 70, height: 70, borderRadius: 8, flexShrink: 0 },
  productImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },

  actionsCol: { marginLeft: 8, alignItems: "center", justifyContent: "center", gap: 8 },

  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  pillsRow: { flexDirection: "row", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" },
  pill: {
    height: 26,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  pillText: { fontSize: 12, fontWeight: "700", includeFontPadding: false, textAlignVertical: "center" },

  addButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 32,
    paddingHorizontal: 22,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 6,
  },
  addText: { fontWeight: "700", marginLeft: 8, fontSize: 16 },

  centeredModal: { margin: 0, justifyContent: "center", alignItems: "center" },
  addModalWrapperCenter: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    overflow: "hidden",
  },
  addModalCenter: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    borderWidth: 2,
    borderColor: PRIMARY_COLOR,
  },
  addModalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 15, color: "#000", textAlign: "center" },

  inlineLabel: { marginTop: 10, fontSize: 15, fontWeight: "600", color: "#000" },

  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 6,
    color: "#000",
    borderWidth: 1,
    borderColor: "#eee",
  },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  cancelBtn: {
    backgroundColor: "#EEE",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  saveBtn: {
    backgroundColor: "#000",
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },

  categoryContainer: { flexDirection: "row", flexWrap: "wrap", marginTop: 10, justifyContent: "space-between" },
  categoryBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    minWidth: "30%",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  categoryText: { color: "#333", fontSize: 13 },

  imagePickerLarge: {
    marginTop: 10,
    height: 160,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DDD",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF9E6",
    overflow: "hidden",
  },
  imagePlaceholder: { alignItems: "center" },
  imagePlaceholderText: { marginTop: 8, color: "#000", fontWeight: "600" },
  previewImage: { width: "100%", height: "100%" },

  catFilterChip: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    alignSelf: "center",
  },
  catFilterText: { fontWeight: "600" },

  noResults: { textAlign: "center", marginTop: 30, fontSize: 14 },

  toastContainer: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 160,
    maxWidth: Dimensions.get("window").width * 0.8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },
});