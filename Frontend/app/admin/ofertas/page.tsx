"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export type Oferta = {
  id: string;
  titulo: string;
  empresa: string;
  ciudad: string;
  modalidad: "presencial" | "remoto" | "hibrido" | string;
  salario_rango?: string | null;
  requisitos?: string | null;
  descripcion?: string | null;
  activa: boolean;
  created_at?: string;
};

type GroupByMode = "none" | "ciudad" | "modalidad" | "empresa";

const INITIAL_FORM: Omit<Oferta, "id"> = {
  titulo: "",
  empresa: "",
  ciudad: "Barranquilla",
  modalidad: "presencial",
  salario_rango: "",
  requisitos: "",
  descripcion: "",
  activa: true,
};

export default function AdminOfertasPage() {
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [ofertas, setOfertas] = useState<Oferta[]>([]);
  const [loading, setLoading] = useState(true);
  const [mensaje, setMensaje] = useState<{ tipo: "success" | "error"; texto: string } | null>(null);

  // Filtros y Agrupamiento
  const [busqueda, setBusqueda] = useState("");
  const [filtroCiudad, setFiltroCiudad] = useState("todos");
  const [filtroModalidad, setFiltroModalidad] = useState("todos");
  const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | activas | inactivas
  const [groupBy, setGroupBy] = useState<GroupByMode>("none");

  // Modales
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Omit<Oferta, "id">>(INITIAL_FORM);
  const [saving, setSaving] = useState(false);

  // Confirmación de eliminación
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Cargar sesión y ofertas
  const inicializar = async () => {
    setLoading(true);
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    if (!currentUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    setUser({ id: currentUser.id, email: currentUser.email });

    const { data, error } = await supabase
      .from("ofertas")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      mostrarMensaje("error", "Error al cargar ofertas: " + error.message);
    } else if (data) {
      setOfertas(data as Oferta[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    inicializar();
  }, []);

  const mostrarMensaje = (tipo: "success" | "error", texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  };

  // Extraer valores únicos para select de ciudades
  const ciudadesUnicas = useMemo(() => {
    const list = ofertas.map((o) => o.ciudad || "No especificada");
    return Array.from(new Set(list)).sort();
  }, [ofertas]);

  // Filtrado de ofertas
  const ofertasFiltradas = useMemo(() => {
    return ofertas.filter((o) => {
      // Filtro de texto
      const query = busqueda.toLowerCase().trim();
      const matchBusqueda =
        !query ||
        o.titulo.toLowerCase().includes(query) ||
        o.empresa.toLowerCase().includes(query) ||
        (o.ciudad && o.ciudad.toLowerCase().includes(query)) ||
        (o.descripcion && o.descripcion.toLowerCase().includes(query));

      // Filtro por ciudad
      const matchCiudad = filtroCiudad === "todos" || o.ciudad === filtroCiudad;

      // Filtro por modalidad
      const matchModalidad =
        filtroModalidad === "todos" || o.modalidad === filtroModalidad;

      // Filtro por estado
      const matchEstado =
        filtroEstado === "todos" ||
        (filtroEstado === "activas" && o.activa) ||
        (filtroEstado === "inactivas" && !o.activa);

      return matchBusqueda && matchCiudad && matchModalidad && matchEstado;
    });
  }, [ofertas, busqueda, filtroCiudad, filtroModalidad, filtroEstado]);

  // Agrupamiento
  const ofertasAgrupadas = useMemo(() => {
    if (groupBy === "none") return null;

    const grupos: Record<string, Oferta[]> = {};
    ofertasFiltradas.forEach((o) => {
      let clave = "Otros";
      if (groupBy === "ciudad") clave = o.ciudad || "Sin Ciudad";
      else if (groupBy === "modalidad") clave = o.modalidad || "Sin Modalidad";
      else if (groupBy === "empresa") clave = o.empresa || "Sin Empresa";

      if (!grupos[clave]) grupos[clave] = [];
      grupos[clave].push(o);
    });

    return grupos;
  }, [ofertasFiltradas, groupBy]);

  // Métricas
  const metricas = useMemo(() => {
    const total = ofertas.length;
    const activas = ofertas.filter((o) => o.activa).length;
    const inactivas = total - activas;
    const empresas = new Set(ofertas.map((o) => o.empresa)).size;
    return { total, activas, inactivas, empresas };
  }, [ofertas]);

  // Abrir modal de creación
  const handleNuevo = () => {
    setEditingId(null);
    setFormData(INITIAL_FORM);
    setModalOpen(true);
  };

  // Abrir modal de edición
  const handleEditar = (oferta: Oferta) => {
    setEditingId(oferta.id);
    setFormData({
      titulo: oferta.titulo,
      empresa: oferta.empresa,
      ciudad: oferta.ciudad || "Barranquilla",
      modalidad: oferta.modalidad || "presencial",
      salario_rango: oferta.salario_rango || "",
      requisitos: oferta.requisitos || "",
      descripcion: oferta.descripcion || "",
      activa: oferta.activa,
    });
    setModalOpen(true);
  };

  // Guardar (Crear o Actualizar)
  const handleGuardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.empresa.trim()) {
      mostrarMensaje("error", "El título y la empresa son campos obligatorios.");
      return;
    }

    setSaving(true);

    try {
      const payload = {
        titulo: formData.titulo,
        empresa: formData.empresa,
        ciudad: formData.ciudad,
        modalidad: formData.modalidad,
        salario_rango: formData.salario_rango || null,
        requisitos: formData.requisitos || null,
        descripcion: formData.descripcion || null,
        activa: formData.activa,
      };

      const response = await fetch(`${API_BASE}/api/ofertas${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo guardar la oferta.");
      }

      mostrarMensaje(
        "success",
        editingId ? "Oferta actualizada correctamente." : "Nueva oferta creada exitosamente."
      );
      setModalOpen(false);
      inicializar();
    } catch (error) {
      mostrarMensaje(
        "error",
        editingId ? "No se pudo actualizar: " + (error as Error).message : "No se pudo crear la oferta: " + (error as Error).message
      );
    } finally {
      setSaving(false);
    }
  };

  // Toggle rápido Activa / Inactiva
  const handleToggleActiva = async (oferta: Oferta) => {
    const nuevoEstado = !oferta.activa;

    // Actualización optimista en UI
    setOfertas((prev) =>
      prev.map((o) => (o.id === oferta.id ? { ...o, activa: nuevoEstado } : o))
    );

    try {
      const response = await fetch(`${API_BASE}/api/ofertas/${oferta.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: nuevoEstado }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo cambiar el estado.");
      }

      mostrarMensaje(
        "success",
        `Oferta "${oferta.titulo}" ${nuevoEstado ? "activada" : "desactivada"}.`
      );
    } catch (error) {
      mostrarMensaje("error", "Error al cambiar estado: " + (error as Error).message);
      inicializar(); // Revertir
    }
  };

  // Eliminar oferta
  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return;
    setDeleting(true);

    try {
      const response = await fetch(`${API_BASE}/api/ofertas/${deleteConfirmId}`, {
        method: "DELETE",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "No se pudo eliminar la oferta.");
      }

      mostrarMensaje("success", "Oferta eliminada correctamente.");
      setDeleteConfirmId(null);
      inicializar();
    } catch (error) {
      mostrarMensaje("error", "No se pudo eliminar la oferta: " + (error as Error).message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="card text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary-500 border-t-transparent mb-2"></div>
        <p className="text-ink/60 text-sm">Verificando credenciales administrativas...</p>
      </div>
    );
  }

  // GUARDA DE SEGURIDAD: Usuario no autenticado en Modo Privado
  if (!user) {
    return (
      <div className="card max-w-md mx-auto text-center py-10 my-8 space-y-4">
        <div className="w-12 h-12 rounded-full bg-accent-50 text-accent-500 flex items-center justify-center mx-auto text-2xl">
          🔒
        </div>
        <h2 className="text-xl font-display font-bold text-ink">
          Acceso Restringido - Modo Privado Admin
        </h2>
        <p className="text-ink/70 text-sm">
          El Panel de Administración requiere iniciar sesión con una cuenta autorizada de administrador.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/login" className="btn-primary bg-accent-500 hover:bg-accent-600">
            Ingresar como Administrador
          </Link>
          <Link href="/ofertas" className="btn-outline">
            Ir al Sitio Público
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER & ACCIÓN */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="badge bg-accent-50 text-accent-600 font-semibold mb-1">
            🔒 Modo Privado (Administrador)
          </span>
          <h1 className="text-3xl font-display font-bold text-ink">
            Gestión de Ofertas
          </h1>
          <p className="text-ink/60 text-sm">
            Administra vacantes, aplica filtros y agrupa empleos por ciudad, modalidad o empresa.
          </p>
        </div>
        <button onClick={handleNuevo} className="btn-primary self-start sm:self-auto">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nueva Oferta
        </button>
      </div>

      {/* NOTIFICACIÓN ALERTA */}
      {mensaje && (
        <div
          className={`p-4 rounded-xl border text-sm font-medium transition-all ${
            mensaje.tipo === "success"
              ? "bg-growth-50 text-growth-600 border-growth-500/20"
              : "bg-red-50 text-red-700 border-red-200"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-primary-50 shadow-soft">
          <p className="text-xs font-medium text-ink/50 uppercase tracking-wider">Total Ofertas</p>
          <p className="text-2xl font-display font-bold text-ink mt-1">{metricas.total}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-primary-50 shadow-soft">
          <p className="text-xs font-medium text-growth-600 uppercase tracking-wider">Activas</p>
          <p className="text-2xl font-display font-bold text-growth-600 mt-1">{metricas.activas}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-primary-50 shadow-soft">
          <p className="text-xs font-medium text-ink/40 uppercase tracking-wider">Inactivas</p>
          <p className="text-2xl font-display font-bold text-ink/40 mt-1">{metricas.inactivas}</p>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-primary-50 shadow-soft">
          <p className="text-xs font-medium text-primary-500 uppercase tracking-wider">Empresas</p>
          <p className="text-2xl font-display font-bold text-primary-500 mt-1">{metricas.empresas}</p>
        </div>
      </div>

      {/* BARRA DE FILTROS & AGRUPAMIENTO */}
      <div className="bg-white rounded-2xl p-5 border border-primary-50 shadow-soft space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Buscador */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar título, empresa o ciudad..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="input-field mb-0 pl-9"
            />
            <svg
              className="w-4 h-4 text-ink/40 absolute left-3 top-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          {/* Filtro Ciudad */}
          <select
            value={filtroCiudad}
            onChange={(e) => setFiltroCiudad(e.target.value)}
            className="input-field mb-0 cursor-pointer"
          >
            <option value="todos">Todas las ciudades ({ofertas.length})</option>
            {ciudadesUnicas.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Filtro Modalidad */}
          <select
            value={filtroModalidad}
            onChange={(e) => setFiltroModalidad(e.target.value)}
            className="input-field mb-0 cursor-pointer"
          >
            <option value="todos">Todas las modalidades</option>
            <option value="presencial">Presencial</option>
            <option value="remoto">Remoto</option>
            <option value="hibrido">Híbrido</option>
          </select>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="input-field mb-0 cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activas">Solo Activas</option>
            <option value="inactivas">Solo Inactivas</option>
          </select>
        </div>

        {/* SELECTOR DE AGRUPAMIENTO */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-primary-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink/60">
              Agrupar por:
            </span>
            <div className="inline-flex rounded-xl bg-primary-50 p-1">
              <button
                onClick={() => setGroupBy("none")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  groupBy === "none"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                Sin agrupar
              </button>
              <button
                onClick={() => setGroupBy("ciudad")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  groupBy === "ciudad"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                Ciudad
              </button>
              <button
                onClick={() => setGroupBy("modalidad")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  groupBy === "modalidad"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                Modalidad
              </button>
              <button
                onClick={() => setGroupBy("empresa")}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all ${
                  groupBy === "empresa"
                    ? "bg-white text-primary-600 shadow-sm"
                    : "text-ink/60 hover:text-ink"
                }`}
              >
                Empresa
              </button>
            </div>
          </div>

          <span className="text-xs text-ink/50">
            Mostrando <strong>{ofertasFiltradas.length}</strong> de {ofertas.length} ofertas
          </span>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL: LISTA O AGRUPADOS */}
      {ofertasFiltradas.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-ink/60 font-medium">No se encontraron ofertas con los filtros aplicados.</p>
          <button
            onClick={() => {
              setBusqueda("");
              setFiltroCiudad("todos");
              setFiltroModalidad("todos");
              setFiltroEstado("todos");
            }}
            className="text-xs text-accent-500 font-semibold mt-2 hover:underline"
          >
            Limpiar todos los filtros
          </button>
        </div>
      ) : groupBy === "none" ? (
        /* VISTA DE TABLA NORMAL */
        <div className="bg-white rounded-2xl border border-primary-50 shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-primary-50/70 text-ink/70 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Título & Oferta</th>
                  <th className="py-3.5 px-4">Empresa</th>
                  <th className="py-3.5 px-4">Ubicación & Modalidad</th>
                  <th className="py-3.5 px-4">Salario</th>
                  <th className="py-3.5 px-4 text-center">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-50">
                {ofertasFiltradas.map((oferta) => (
                  <tr key={oferta.id} className="hover:bg-primary-50/30 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-ink">{oferta.titulo}</p>
                      {oferta.descripcion && (
                        <p className="text-xs text-ink/60 line-clamp-1 max-w-xs">
                          {oferta.descripcion}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-ink/80">{oferta.empresa}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="badge bg-primary-50 text-primary-600">
                          {oferta.ciudad || "Remoto"}
                        </span>
                        <span className="badge bg-accent-50 text-accent-600 capitalize">
                          {oferta.modalidad}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-ink/70">
                      {oferta.salario_rango || <span className="text-ink/40">No especificado</span>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActiva(oferta)}
                        className={`badge cursor-pointer transition-all ${
                          oferta.activa
                            ? "bg-growth-50 text-growth-600 border border-growth-500/20 hover:bg-growth-500 hover:text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                        title="Haz clic para activar o desactivar"
                      >
                        {oferta.activa ? "✓ Activa" : "✕ Inactiva"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEditar(oferta)}
                          className="text-xs bg-primary-50 text-primary-600 px-3 py-1.5 rounded-lg font-medium hover:bg-primary-100 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(oferta.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-100 transition-colors"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* VISTA AGRUPADA (POR CIUDAD, MODALIDAD O EMPRESA) */
        <div className="space-y-6">
          {ofertasAgrupadas &&
            Object.entries(ofertasAgrupadas).map(([grupoNombre, ofertasGrupo]) => (
              <div
                key={grupoNombre}
                className="bg-white rounded-2xl p-5 border border-primary-50 shadow-soft space-y-4"
              >
                <div className="flex items-center justify-between pb-3 border-b border-primary-50">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-display font-bold text-ink capitalize">
                      {grupoNombre}
                    </h3>
                    <span className="badge bg-primary-100 text-primary-700 font-semibold">
                      {ofertasGrupo.length} {ofertasGrupo.length === 1 ? "oferta" : "ofertas"}
                    </span>
                  </div>
                  <span className="text-xs text-ink/50">
                    {ofertasGrupo.filter((o) => o.activa).length} activas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {ofertasGrupo.map((oferta) => (
                    <div
                      key={oferta.id}
                      className="p-4 rounded-xl border border-primary-100 bg-paper/50 flex flex-col justify-between gap-3 hover:border-primary-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-ink text-base">{oferta.titulo}</h4>
                          <button
                            onClick={() => handleToggleActiva(oferta)}
                            className={`badge text-xs cursor-pointer ${
                              oferta.activa
                                ? "bg-growth-50 text-growth-600"
                                : "bg-gray-200 text-gray-600"
                            }`}
                          >
                            {oferta.activa ? "Activa" : "Inactiva"}
                          </button>
                        </div>
                        <p className="text-xs text-ink/60 mb-2">
                          <strong>{oferta.empresa}</strong> · {oferta.ciudad} ({oferta.modalidad})
                        </p>
                        {oferta.descripcion && (
                          <p className="text-xs text-ink/75 line-clamp-2">{oferta.descripcion}</p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-primary-100/60 text-xs">
                        <span className="text-ink/60 font-medium">
                          {oferta.salario_rango || "Sin especificar salario"}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditar(oferta)}
                            className="text-primary-600 font-semibold hover:underline"
                          >
                            Editar
                          </button>
                          <span className="text-ink/20">•</span>
                          <button
                            onClick={() => setDeleteConfirmId(oferta.id)}
                            className="text-red-600 font-semibold hover:underline"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}

      {/* MODAL CREAR / EDITAR */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-lift space-y-4 my-8">
            <div className="flex items-center justify-between border-b border-primary-50 pb-3">
              <h3 className="text-xl font-display font-bold text-ink">
                {editingId ? "Editar Oferta" : "Nueva Oferta de Empleo"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-ink/40 hover:text-ink text-xl font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Título del Cargo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Practicante de Marketing Digital"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="input-field mb-0"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1">
                    Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. AgenciaViva"
                    value={formData.empresa}
                    onChange={(e) => setFormData({ ...formData, empresa: e.target.value })}
                    className="input-field mb-0"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1">
                    Ciudad
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Barranquilla, Bogotá"
                    value={formData.ciudad}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                    className="input-field mb-0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1">
                    Modalidad
                  </label>
                  <select
                    value={formData.modalidad}
                    onChange={(e) => setFormData({ ...formData, modalidad: e.target.value })}
                    className="input-field mb-0 cursor-pointer"
                  >
                    <option value="presencial">Presencial</option>
                    <option value="remoto">Remoto</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink/70 mb-1">
                    Rango Salarial
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. $1,500,000 - $1,800,000 COP"
                    value={formData.salario_rango || ""}
                    onChange={(e) => setFormData({ ...formData, salario_rango: e.target.value })}
                    className="input-field mb-0"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Requisitos
                </label>
                <textarea
                  rows={2}
                  placeholder="Ej. Estudiante de últimos semestres, manejo básico de Excel..."
                  value={formData.requisitos || ""}
                  onChange={(e) => setFormData({ ...formData, requisitos: e.target.value })}
                  className="input-field mb-0"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink/70 mb-1">
                  Descripción del Puesto
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe las funciones y beneficios de la oportunidad laboral..."
                  value={formData.descripcion || ""}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="input-field mb-0"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="activa-check"
                  checked={formData.activa}
                  onChange={(e) => setFormData({ ...formData, activa: e.target.checked })}
                  className="w-4 h-4 text-accent-500 rounded border-primary-200 focus:ring-accent-400 cursor-pointer"
                />
                <label htmlFor="activa-check" className="text-sm font-medium text-ink cursor-pointer">
                  Publicar oferta de inmediato (Estado Activo)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary-50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-outline text-xs px-4 py-2"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary text-xs px-5 py-2"
                >
                  {saving ? "Guardando..." : editingId ? "Actualizar Oferta" : "Crear Oferta"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DIÁLOGO CONFIRMACIÓN ELIMINACIÓN */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-lift space-y-4">
            <h3 className="text-lg font-display font-bold text-red-600">
              ¿Eliminar oferta?
            </h3>
            <p className="text-xs text-ink/70">
              Esta acción no se puede deshacer. La vacante será removida permanentemente del sistema.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="btn-outline text-xs px-4 py-2"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="bg-red-600 text-white font-medium px-4 py-2 rounded-xl text-xs hover:bg-red-700 transition-colors"
              >
                {deleting ? "Eliminando..." : "Sí, Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
