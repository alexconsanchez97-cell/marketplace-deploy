class Producto {
  constructor(id, nombre, descripcion, precio, imagenUrl, proveedorId, estado = "pendiente") {
    if (!nombre || nombre.trim().length < 2) {
      throw new Error("El nombre del producto debe tener al menos 2 caracteres");
    }

    // Number(precio) convierte texto a número si llega como string desde el
    // formulario; isNaN revisa que sí sea un número válido.
    const precioNumerico = Number(precio);
    if (isNaN(precioNumerico) || precioNumerico <= 0) {
      throw new Error("El precio debe ser un número mayor a 0");
    }

    if (!proveedorId) {
      throw new Error("El producto debe pertenecer a un proveedor (proveedorId requerido)");
    }

    this.id = id;
    this.nombre = nombre.trim();
    this.descripcion = descripcion ? descripcion.trim() : "";
    this.precio = precioNumerico;
    this.imagenUrl = imagenUrl || "";
    this.proveedorId = proveedorId;
    this.estado = estado; // 'pendiente' | 'activo'
  }

  // El super llama esto para aprobar el producto y que ya aparezca
  // en el catálogo público que ve el cliente.
  aprobar() {
    this.estado = "activo";
  }

  // Se usa antes de guardar cambios de un PUT, para no repetir las
  // validaciones de precio/nombre en la capa de aplicación.
  actualizarDatos({ nombre, descripcion, precio, imagenUrl }) {
    if (nombre !== undefined) {
      if (nombre.trim().length < 2) throw new Error("El nombre debe tener al menos 2 caracteres");
      this.nombre = nombre.trim();
    }
    if (descripcion !== undefined) this.descripcion = descripcion.trim();
    if (precio !== undefined) {
      const precioNumerico = Number(precio);
      if (isNaN(precioNumerico) || precioNumerico <= 0) throw new Error("El precio debe ser mayor a 0");
      this.precio = precioNumerico;
    }
    if (imagenUrl !== undefined) this.imagenUrl = imagenUrl;
  }
}

module.exports = Producto;