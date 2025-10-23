// screens/Products.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import * as ImagePicker from "expo-image-picker";
import { signOut } from "firebase/auth";
import { auth, db, storage } from "../src/firebaseConfig"; // <-- AGREGADO 'storage'
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
// IMPORTS PARA FIREBASE STORAGE
import { ref, uploadBytes, getDownloadURL } from "firebase/storage"; 
import CustomAlert from "../components/CustomAlert";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

// Colores base: AMARILLO (Primario/Iconos) y NEGRO (Fondo/Texto)
const PRIMARY_COLOR = "#FFD600";
const BACKGROUND_COLOR = "#000";
const TEXT_COLOR = "#fff";

export default function Products({ navigation }) {
  // estados UI
  const [menuVisible, setMenuVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false); 
  // form
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [precio, setPrecio] = useState("");
  const [stock, setStock] = useState("");
  const [categoria, setCategoria] = useState("");
  const [foto, setFoto] = useState(null); 

  // búsqueda + filtros
  const [searchText, setSearchText] = useState("");
  const [orden, setOrden] = useState("desc");
  const [filterCategory, setFilterCategory] = useState("");

  // edición
  const [editingProductId, setEditingProductId] = useState(null);

  // alert config (CustomAlert)
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertConfig, setAlertConfig] = useState({
    type: "success",
    message: "",
    customTitle: "",
    onConfirm: () => setAlertVisible(false),
    onCancel: () => setAlertVisible(false),
  });

  const categoriasFijas = [
    "Vajilla",
    "Mantelería",
    "Decoración",
    "Salón",
    "Cristalería",
  ];

  // Función para asignar colores a las categorías
  const getCategoryColor = (category) => {
    switch (category) {
      case "Vajilla":
        return "#FF8C00"; // Naranja
      case "Mantelería":
        return "#228B22"; // Verde
      case "Decoración":
        return "#800080"; // Púrpura
      case "Salón":
        return "#00BFFF"; // Azul claro
      case "Cristalería":
        return "#4169E1"; // Azul real
      default:
        return "#555"; // Gris por defecto
    }
  };

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const arr = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setProductos(arr);
        setLoading(false);
      },
      (err) => {
        console.log("Error al obtener productos:", err);
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

  const pickImage = async () => {
    try {
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

  const uploadImage = async (uri) => {
    if (!uri || uri.startsWith("http")) {
      return uri; 
    }

    try {
      const blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = function () {
          resolve(xhr.response);
        };
        xhr.onerror = function (e) {
          console.log("XHR Error:", e);
          reject(new TypeError("Network request failed"));
        };
        xhr.responseType = "blob";
        xhr.open("GET", uri, true);
        xhr.send(null);
      });

      const filename = `productos/${auth.currentUser.uid}/${Date.now()}`;
      const storageRef = ref(storage, filename);

      await uploadBytes(storageRef, blob);

      blob.close(); // Liberar Blob

      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("Error al subir imagen:", error);
      throw new Error("Fallo la subida de la imagen.");
    }
  };
  
  const onChangeNombre = (text) => {
    const cleaned = text.replace(/[0-9]/g, "");
    setNombre(cleaned);
  };

  const handleSaveProduct = async () => {
    // Validaciones
    if (!nombre.trim() || !precio.trim() || !stock.trim() || !categoria.trim()) {
      setAlertConfig({
        type: "error",
        message: "Completa todos los campos obligatorios.",
        customTitle: "Campos faltantes",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      return;
    }

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

    const precioNum = Number(precio.replace(',', '.'));
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
   
        const uploadedURL = await uploadImage(foto);
        finalPhotoURL = uploadedURL;
      }
  
      const dataToSave = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        precio: precioNum,
        stock: stockNum,
        categoria: categoria.trim(),
        foto: finalPhotoURL, // <-- URL final del Storage
      };

      if (editingProductId) {
        // actualizar
        const docRef = doc(db, "products", editingProductId);
        await updateDoc(docRef, dataToSave);

        setAlertConfig({
          type: "success",
          message: "Producto editado con éxito.",
          customTitle: "¡Listo!",
          onConfirm: () => {
            setAlertVisible(false);
            setAddModalVisible(false);
            resetForm();
            setEditingProductId(null);
          },
        });
        setAlertVisible(true);
      } else {
        // crear nuevo
        await addDoc(collection(db, "products"), {
          ...dataToSave,
          createdAt: serverTimestamp(),
          createdBy: auth.currentUser ? auth.currentUser.uid : null,
        });

        setAlertConfig({
          type: "success",
          message: "Producto creado con éxito.",
          customTitle: "¡Listo!",
          onConfirm: () => {
            setAlertVisible(false);
            setAddModalVisible(false);
            resetForm();
            setEditingProductId(null);
          },
        });
        setAlertVisible(true);
      }
    } catch (err) {
      console.log("Error guardar producto:", err);
      setAlertConfig({
        type: "error",
        message: "Ocurrió un error al guardar/subir el producto. Intenta de nuevo.",
        customTitle: "Error de Guardado",
        onConfirm: () => setAlertVisible(false),
      });
      setAlertVisible(true);
    } finally {
        setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNombre("");
    setDescripcion("");
    setPrecio("");
    setStock("");
    setCategoria("");
    setFoto(null);
    setEditingProductId(null);
  };

  const handleEditProduct = (item) => {
    setNombre(item.nombre || "");
    setDescripcion(item.descripcion || "");
    setPrecio(item.precio != null ? item.precio.toString() : "");
    setStock(item.stock != null ? item.stock.toString() : "");
    setCategoria(item.categoria || "");
    setFoto(item.foto || null); // Carga la URL de la imagen guardada
    setEditingProductId(item.id);
    setAddModalVisible(true);
  };
  
  // ... (El resto de las funciones: confirmDeleteProduct, handleMenuNavigate, productosFiltrados)
  const confirmDeleteProduct = (productId) => {
    setAlertConfig({
      type: "warning",
      message: "¿Deseás eliminar este producto?",
      customTitle: "Eliminar producto",
      onConfirm: async () => {
        setAlertVisible(false);
        try {
          // Nota: La eliminación de la imagen en Storage es opcional y requiere más código
          await deleteDoc(doc(db, "products", productId));
          setAlertConfig({
            type: "success",
            message: "Producto eliminado.",
            customTitle: "Eliminado",
            onConfirm: () => setAlertVisible(false),
          });
          setAlertVisible(true);
        } catch (err) {
          console.log("Error al eliminar:", err);
          setAlertConfig({
            type: "error",
            message: "No se pudo eliminar el producto.",
            customTitle: "Error",
            onConfirm: () => setAlertVisible(false),
          });
          setAlertVisible(true);
        }
      },
      onCancel: () => setAlertVisible(false),
    });
    setAlertVisible(true);
  };

  const handleMenuNavigate = (routeName) => {
    setMenuVisible(false);
    if (routeName === "Logout") {
      setAlertConfig({
        type: "warning",
        message: "¿Estás seguro de que deseas cerrar sesión?",
        customTitle: "Cerrar sesión",
        onConfirm: async () => {
          setAlertVisible(false);
          try {
            await AsyncStorage.removeItem("welcomeShown");
            await signOut(auth);
            navigation.navigate("Login");
          } catch (e) {
            console.log("Error signOut:", e);
            setAlertConfig({
              type: "error",
              message: "No se pudo cerrar sesión.",
              customTitle: "Error",
              onConfirm: () => setAlertVisible(false),
            });
            setAlertVisible(true);
          }
        },
        onCancel: () => setAlertVisible(false),
      });
      setAlertVisible(true);
      return;
    }

    const routeMap = {
      Productos: "Products",
      Incidentes: "Incidents",
      Empleados: "Employees",
      Pedidos: "Orders",
      Alquileres: "Rentals",
      Clientes: "Clients",
      Entregas: "Deliveries",
      Inicio: "Home",
    };

    const route = routeMap[routeName] || routeName;
    navigation.navigate(route);
  };

  // ===== filtrado local final (por búsqueda + categoría) =====
  const productosFiltrados = productos
    .filter((p) => p.nombre?.toLowerCase().includes(searchText.toLowerCase()))
    .filter((p) => (filterCategory ? p.categoria === filterCategory : true))
    .sort((a, b) => (orden === "asc" ? a.precio - b.precio : b.precio - a.precio));


  return (
    <View style={styles.container}>
      {/* HEADER (fondo amarillo, iconos negros) */}
      <View style={styles.header}>
        <View style={styles.leftHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={26} color={BACKGROUND_COLOR} />
          </TouchableOpacity>
          {/* Menu abre por la derecha */}
          <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginLeft: 15 }}>
            <Ionicons name="menu" size={26} color={BACKGROUND_COLOR} />
          </TouchableOpacity>
        </View>
        {/* Logo centrado */}
        <Image source={require("../assets/logo.png")} style={styles.logo} resizeMode="contain" />
        <View style={{ width: 41 }} />
      </View>

      {/* CONTENIDO */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <Text style={styles.title}>Productos</Text>
          <Text style={styles.subtitle}>Gestiona tus productos fácilmente</Text>

          {/* BUSCADOR */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color="#999" style={{ marginRight: 6 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              placeholderTextColor="#999"
              value={searchText}
              onChangeText={setSearchText}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText("")} style={{ marginLeft: 8 }}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* FILTROS TIPO CHIPS (DEBAJO DEL BUSCADOR) */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryChipsContainer}>
            <TouchableOpacity
              style={[styles.catFilterChip, filterCategory === "" && { backgroundColor: BACKGROUND_COLOR, borderColor: BACKGROUND_COLOR }]}
              onPress={() => setFilterCategory("")}
            >
              <Text style={[styles.catFilterText, filterCategory === "" && { color: PRIMARY_COLOR, fontWeight: "700" }]}>Todas</Text>
            </TouchableOpacity>

            {categoriasFijas.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.catFilterChip,
                  filterCategory === c && { backgroundColor: getCategoryColor(c), borderColor: getCategoryColor(c) },
                ]}
                onPress={() => setFilterCategory(filterCategory === c ? "" : c)}
              >
                <Text style={[styles.catFilterText, filterCategory === c && { color: TEXT_COLOR, fontWeight: "700" }]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* LISTADO */}
          {loading ? (
            <Text style={{ textAlign: "center", marginTop: 30 }}>Cargando...</Text>
          ) : productosFiltrados.length > 0 ? (
            productosFiltrados.map((item) => (
              <View key={item.id} style={styles.productCard}>
                <View style={{ flexDirection: 'row', flex: 1 }}>
                  {item.foto ? (
                    <Image source={{ uri: item.foto }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productImagePlaceholder}>
                      <Ionicons name="image-outline" size={30} color="#ccc" />
                    </View>
                  )}

                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.productName}>{item.nombre}</Text>
                    {item.descripcion ? <Text style={styles.productDetail}>{item.descripcion}</Text> : null}

                    <Text style={styles.productDetail}>
                      Precio: <Text style={{ fontWeight: 'bold' }}>${item.precio != null ? Number(item.precio).toFixed(2) : 'N/A'}</Text>
                    </Text>
                    <Text style={styles.productDetail}>
                      Stock: <Text style={{ fontWeight: 'bold' }}>{item.stock != null ? item.stock.toString() : 'N/A'}</Text>
                    </Text>

                    {/* Color dinámico de la categoría */}
                    <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.categoria) }]}>
                      <Text style={[styles.productCategory, { color: TEXT_COLOR, fontWeight: '700' }]}>
                        {item.categoria}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.iconsRight}>
                  <TouchableOpacity style={{ marginBottom: 10 }} onPress={() => handleEditProduct(item)}>
                    <Ionicons name="pencil-outline" size={20} color="#000" />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => confirmDeleteProduct(item.id)}>
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.noResults}>No hay productos. Pulsá + añadir para crear uno.</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* FILTROS INFERIORES: Orden de precio */}
      <View style={styles.filtersBottom}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity
            style={[styles.filterBtn, orden === "asc" && { backgroundColor: BACKGROUND_COLOR }]}
            onPress={() => setOrden("asc")}
          >
            <Text style={[styles.filterText, orden === "asc" && { fontWeight: "700", color: PRIMARY_COLOR }]}>
              Menor a mayor
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterBtn, orden === "desc" && { backgroundColor: BACKGROUND_COLOR, marginLeft: 8 }]}
            onPress={() => setOrden("desc")}
          >
            <Text style={[styles.filterText, orden === "desc" && { fontWeight: "700", color: PRIMARY_COLOR }]}>
              Mayor a menor
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 12, color: '#555', marginRight: 10 }}>Ordenar por Precio</Text>
      </View>

      {/* BOTÓN AÑADIR (flotante) */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => {
          resetForm();
          setAddModalVisible(true);
        }}
        disabled={isSaving} // Deshabilitar si se está guardando
      >
        <Ionicons name="add" size={22} color={PRIMARY_COLOR} />
        <Text style={styles.addText}>añadir</Text>
      </TouchableOpacity>

      {/* NAV INFERIOR (fondo Primary, iconos Background) */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Home")}>
          <Ionicons name="home" size={24} color={BACKGROUND_COLOR} />
          <Text style={styles.navText}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => navigation.navigate("Profile")}>
          <Ionicons name="person-outline" size={24} color={BACKGROUND_COLOR} />
          <Text style={styles.navText}>Perfil</Text>
        </TouchableOpacity>
      </View>

      {/* MENU LATERAL (Abre por la derecha) */}
      <Modal
        isVisible={menuVisible}
        onBackdropPress={() => setMenuVisible(false)}
        animationIn="slideInRight" 
        animationOut="slideOutRight"
        style={styles.menuModal}
      >
        <View style={styles.menuContainer}>
          <Text style={styles.menuTitle}>Menú rápido</Text>

          {[
            "Productos", 
            "Pedidos",
            "Entregas",
            "Clientes",
            "Empleados",
            "Alquileres",
            "Incidentes",
            "Inicio",
          ].map((m) => {
            const isCurrentScreen = m === "Productos";
            return (
              <TouchableOpacity
                key={m}
                style={[styles.menuItem, isCurrentScreen && { backgroundColor: PRIMARY_COLOR + '30', borderRadius: 8 }]} 
                onPress={() => handleMenuNavigate(m)}
              >
                <Ionicons
                  name={
                    m === "Productos" ? "cube-outline" :
                    m === "Pedidos" ? "receipt-outline" :
                    m === "Entregas" ? "car-outline" :
                    m === "Clientes" ? "people-outline" :
                    m === "Empleados" ? "person-outline" :
                    m === "Alquileres" ? "briefcase-outline" :
                    m === "Incidentes" ? "alert-circle-outline" :
                    m === "Inicio" ? "home-outline" :
                    "ellipsis-horizontal"
                  }
                  size={20}
                  color={isCurrentScreen ? PRIMARY_COLOR : BACKGROUND_COLOR} 
                />
                <Text style={[styles.menuItemText, isCurrentScreen && { color: PRIMARY_COLOR, fontWeight: '700' }]}>{m}</Text>
              </TouchableOpacity>
            );
          })}

          <View style={styles.menuFooter}>
            <TouchableOpacity style={[styles.menuItem, { marginTop: 8 }]} onPress={() => handleMenuNavigate("Logout")}>
              <Ionicons name="log-out-outline" size={20} color="red" />
              <Text style={[styles.menuItemText, { color: "red" }]}>Cerrar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODAL AÑADIR / EDITAR */}
      <Modal
        isVisible={addModalVisible}
        onBackdropPress={() => {
          setAddModalVisible(false);
          resetForm();
        }}
        animationIn="fadeIn"
        animationOut="fadeOut"
        avoidKeyboard
        style={styles.centeredModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.addModalWrapperCenter}
        >
          <ScrollView contentContainerStyle={styles.addModalCenter}>
            <Text style={styles.addModalTitle}>{editingProductId ? "Editar producto" : "Añadir producto"}</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre (sin números)"
              placeholderTextColor="#999"
              value={nombre}
              onChangeText={onChangeNombre}
            />

            <TextInput
              style={[styles.input, { height: 80 }]}
              placeholder="Descripción (opcional)"
              placeholderTextColor="#999"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
            />

            <TextInput
              style={styles.input}
              placeholder="Precio"
              placeholderTextColor="#999"
              value={precio}
              onChangeText={setPrecio}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="Stock"
              placeholderTextColor="#999"
              value={stock}
              onChangeText={setStock}
              keyboardType="numeric"
            />

            {/* Categorías (chips) */}
            <View style={styles.categoryContainer}>
              {categoriasFijas.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    { borderColor: getCategoryColor(cat) },
                    categoria === cat && { backgroundColor: getCategoryColor(cat), borderWidth: 2 },
                  ]}
                  onPress={() => setCategoria(cat)}
                >
                  <Text style={[styles.categoryText, categoria === cat && { color: TEXT_COLOR, fontWeight: "700" }]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Image picker grande con + centrado */}
            <TouchableOpacity style={styles.imagePickerLarge} onPress={pickImage} activeOpacity={0.8}>
              {foto ? (
                <Image source={{ uri: foto }} style={styles.previewImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Ionicons name="add" size={36} color="#000" />
                  <Text style={styles.imagePlaceholderText}>Agregar imagen</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 15 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => { setAddModalVisible(false); resetForm(); }} disabled={isSaving}>
                <Text style={{ color: BACKGROUND_COLOR, fontWeight: "700" }}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveBtn} 
                onPress={handleSaveProduct}
                disabled={isSaving} // Deshabilitar durante la subida/guardado
              >
                <Text style={{ color: TEXT_COLOR, fontWeight: "700" }}>
                  {isSaving ? "Guardando..." : (editingProductId ? "Guardar" : "Crear")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ALERTA (CustomAlert) */}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  // Header: Fondo amarillo (PRIMARY_COLOR), Iconos negros (BACKGROUND_COLOR)
  header: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 10,
    position: 'relative',
  },
  leftHeader: {
    position: "absolute",
    left: 20,
    top: 50,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  logo: { width: 100, height: 40 },

  content: { paddingHorizontal: 20, paddingTop: 10 },
  title: { fontSize: 28, fontWeight: "700", color: "#000", marginTop: 10 },
  subtitle: { color: "#555", fontSize: 14, marginBottom: 15 },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  searchInput: { flex: 1, fontSize: 14, color: "#000" },

  // Contenedor de chips de categoría (debajo del buscador)
  categoryChipsContainer: {
    paddingVertical: 5,
    marginBottom: 15,
  },

  productCard: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#eee",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  productName: { fontSize: 16, fontWeight: "700", color: "#000", marginBottom: 4 },
  productDetail: { fontSize: 13, color: "#555", marginBottom: 2 },
  productImage: { width: 80, height: 80, borderRadius: 8, flexShrink: 0 },
  productImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  iconsRight: { alignItems: "center", justifyContent: "space-between", height: 80, marginLeft: 10 },

  // Badge para la categoría en la card
  categoryBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  productCategory: { fontSize: 12 },

  addButton: {
    position: "absolute",
    bottom: 88,
    right: 20,
    backgroundColor: BACKGROUND_COLOR, // Fondo negro
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 30,
    paddingHorizontal: 18,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  addText: { color: PRIMARY_COLOR, fontWeight: "700", marginLeft: 8 }, 

  // Nav Inferior: Fondo amarillo 
  bottomNav: {
    backgroundColor: PRIMARY_COLOR,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 10,
    position: "absolute",
    bottom: 0,
    width: "100%",
  },
  navItem: { alignItems: "center" },
  navText: { fontSize: 12, fontWeight: "600", color: BACKGROUND_COLOR }, // Texto negro

  menuModal: { margin: 0, justifyContent: "flex-end", alignItems: "flex-end" },
  menuContainer: {
    width: "70%",
    height: "100%",
    backgroundColor: "#fff",
    paddingTop: 60,
    paddingHorizontal: 18,
    borderLeftWidth: 1,
    borderLeftColor: "#eee",
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    color: "#000",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuItemText: {
    fontSize: 16,
    marginLeft: 12,
    color: "#000",
  },
  menuFooter: { position: "absolute", bottom: 40, left: 18, right: 18 },

  // Modal centrado
  centeredModal: {
    margin: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  addModalWrapperCenter: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    overflow: 'hidden',
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
  input: {
    backgroundColor: "#F7F7F7",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 10,
    color: "#000",
    borderWidth: 1,
    borderColor: '#eee',
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
    backgroundColor: BACKGROUND_COLOR,
    paddingVertical: 12,
    paddingHorizontal: 26,
    borderRadius: 10,
    alignItems: "center",
    flex: 1,
    marginLeft: 8,
  },

  // categorías en modal
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
    justifyContent: "space-between",
  },
  categoryBtn: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 8,
    minWidth: "30%",
    alignItems: "center",
    backgroundColor: '#fff',
  },
  categoryText: { color: "#333", fontSize: 13 },

  // image picker grande
  imagePickerLarge: {
    marginTop: 15,
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

  // filtros bottom (orden de precio)
  filtersBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    backgroundColor: "#fff",
  },
  filterBtn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: "#F3F3F3",
  },
  filterText: { color: "#333", fontWeight: "600" },

  // chips de categoría filtro 
  catFilterChip: {
    backgroundColor: "#F3F3F3",
    borderWidth: 1,
    borderColor: "#eee",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    marginRight: 8,
    alignSelf: "center",
  },
  catFilterText: { color: "#333", fontWeight: "600" },
});