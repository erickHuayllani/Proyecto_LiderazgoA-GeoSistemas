
 // ECOALERTA - FUNCIONES COMPARTIDAS
document.addEventListener("DOMContentLoaded", () => {
    configurarMenu();
    configurarVistaFoto();
    configurarFormularioReporte();
    configurarSeguimiento();
    configurarAccesoDemo();
    configurarTema(); // NUEVO: modo claro y oscuro
});

// Abre y cierra el menú en celulares.
function configurarMenu() {
    const boton = document.querySelector(".menu-boton");
    const navegacion = document.getElementById("navegacion");

    if (!boton || !navegacion) return;

    boton.addEventListener("click", () => {
        const abierto = navegacion.classList.toggle("abierto");
        boton.setAttribute("aria-expanded", String(abierto));
    });
}

// NUEVO: configura el modo claro y oscuro.
function configurarTema() {
    const boton = document.getElementById("tema-boton");

    if (!boton) return;

    let temaGuardado = "claro";

    try {
        temaGuardado = localStorage.getItem("tema") || "claro";
    } catch (error) {
        // Si el navegador bloquea el almacenamiento, usa modo claro.
    }

    aplicarTema(temaGuardado === "oscuro");

    boton.addEventListener("click", () => {
        const oscuro = !document.body.classList.contains("modo-oscuro");

        aplicarTema(oscuro);

        try {
            localStorage.setItem("tema", oscuro ? "oscuro" : "claro");
        } catch (error) {
            // El tema seguirá funcionando mientras la página esté abierta.
        }
    });
}

// NUEVO: aplica los colores y actualiza el botón.
function aplicarTema(oscuro) {
    document.body.classList.toggle("modo-oscuro", oscuro);

    const boton = document.getElementById("tema-boton");

    if (!boton) return;

    boton.textContent = oscuro ? "☀️ Modo claro" : "🌙 Modo oscuro";

    boton.setAttribute("aria-pressed", String(oscuro));

    boton.setAttribute(
        "aria-label",
        oscuro ? "Activar modo claro" : "Activar modo oscuro"
    );
}

// Lee los reportes guardados en este navegador.
function leerReportes() {
    try {
        const datos = JSON.parse(
            localStorage.getItem("ecoAlertaReportes") || "[]"
        );

        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

// Guarda los reportes localmente.
function guardarReportes(reportes) {
    try {
        localStorage.setItem(
            "ecoAlertaReportes",
            JSON.stringify(reportes)
        );
        return true;
    } catch {
        return false;
    }
}

// Muestra una vista previa de la fotografía.
function configurarVistaFoto() {
    const input = document.getElementById("foto");
    const vista = document.getElementById("vistaFoto");

    if (!input || !vista) return;

    let urlAnterior = null;

    input.addEventListener("change", () => {
        if (urlAnterior) {
            URL.revokeObjectURL(urlAnterior);
        }

        const archivo = input.files[0];

        if (!archivo) {
            vista.hidden = true;
            vista.removeAttribute("src");
            return;
        }

        if (!archivo.type.startsWith("image/")) {
            input.value = "";
            vista.hidden = true;
            return;
        }

        urlAnterior = URL.createObjectURL(archivo);
        vista.src = urlAnterior;
        vista.hidden = false;
    });
}

// Registra una incidencia y genera un código.
function configurarFormularioReporte() {
    const formulario = document.getElementById("formReporte");

    if (!formulario) return;

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const mensaje = document.getElementById("mensajeFormulario");
        const datos = new FormData(formulario);
        const reportes = leerReportes();

        const siguiente = reportes.reduce(
            (maximo, reporte) =>
                Math.max(maximo, Number(reporte.numero) || 0),
            0
        ) + 1;

        const reporte = {
            numero: siguiente,
            codigo: `EA-${String(siguiente).padStart(4, "0")}`,
            tipo: String(datos.get("tipo") || ""),
            ubicacion: String(datos.get("ubicacion") || "").trim(),
            descripcion: String(datos.get("descripcion") || "").trim(),
            contacto: String(datos.get("contacto") || "").trim(),
            fecha: new Date().toLocaleDateString("es-PE"),
            estado: "Recibido"
        };

        if (!guardarReportes([reporte, ...reportes])) {
            mostrarMensaje(
                mensaje,
                "No se pudo guardar el reporte en este navegador.",
                false
            );
            return;
        }

        formulario.reset();

        const vista = document.getElementById("vistaFoto");

        if (vista) {
            vista.hidden = true;
            vista.removeAttribute("src");
        }

        mostrarMensaje(
            mensaje,
            `Reporte registrado. Tu código es ${reporte.codigo}. Guárdalo para consultar su estado.`,
            true
        );
    });
}

// Permite buscar un reporte por su código.
function configurarSeguimiento() {
    const formulario = document.getElementById("formBusqueda");
    const botonTodos = document.getElementById("verTodos");

    if (formulario) {
        formulario.addEventListener("submit", (evento) => {
            evento.preventDefault();

            const codigo = document.getElementById("codigoBusqueda")
                .value.trim().toUpperCase();

            const resultados = leerReportes().filter(
                reporte => reporte.codigo.toUpperCase() === codigo
            );

            mostrarReportes(resultados);

            mostrarMensaje(
                document.getElementById("mensajeBusqueda"),
                resultados.length
                    ? "Reporte encontrado en este navegador."
                    : "No encontramos el código. Comprueba que sea correcto o utiliza el navegador donde registraste el reporte.",
                resultados.length > 0
            );
        });
    }

    if (botonTodos) {
        botonTodos.addEventListener("click", () => {
            const reportes = leerReportes();

            mostrarReportes(reportes);

            mostrarMensaje(
                document.getElementById("mensajeBusqueda"),
                `Reportes guardados en este navegador: ${reportes.length}.`,
                true
            );
        });
    }
}

// Presenta los resultados sin interpretar el texto como HTML.
function mostrarReportes(reportes) {
    const contenedor = document.getElementById("listaReportes");

    if (!contenedor) return;

    contenedor.replaceChildren();

    if (reportes.length === 0) {
        const texto = document.createElement("p");
        texto.className = "texto-secundario";
        texto.textContent = "No hay reportes para mostrar.";
        contenedor.append(texto);
        return;
    }

    reportes.forEach(reporte => {
        const articulo = document.createElement("article");
        articulo.className = "reporte-item";

        const titulo = document.createElement("h3");
        titulo.textContent = `${reporte.codigo} · ${reporte.tipo}`;

        const estado = document.createElement("p");
        estado.append(document.createTextNode("Estado: "));

        const etiqueta = document.createElement("span");
        etiqueta.className = "estado estado-info";
        etiqueta.textContent = reporte.estado || "Recibido";
        estado.append(etiqueta);

        const ubicacion = document.createElement("p");
        ubicacion.className = "reporte-meta";
        ubicacion.textContent =
            `Ubicación: ${reporte.ubicacion} · Fecha: ${reporte.fecha}`;

        const descripcion = document.createElement("p");
        descripcion.textContent = reporte.descripcion;

        articulo.append(titulo, estado, ubicacion, descripcion);
        contenedor.append(articulo);
    });
}

// Muestra paneles de ejemplo para gerencia o especialistas.
function configurarAccesoDemo() {
    const formulario = document.getElementById("formAcceso");

    if (!formulario) return;

    formulario.addEventListener("submit", (evento) => {
        evento.preventDefault();

        const area = document.getElementById("area").value;
        const usuario = document.getElementById("usuario").value.trim();
        const mensaje = document.getElementById("mensajeAcceso");

        if (!area || !usuario) {
            mostrarMensaje(
                mensaje,
                "Completa los campos para continuar.",
                false
            );
            return;
        }

        const esGerencia = area === "gerencia";
        const panel = document.getElementById("panelDemo");
        const titulo = document.getElementById("tituloPanel");
        const descripcion = document.getElementById("descripcionPanel");
        const lista = document.getElementById("listaFunciones");

        titulo.textContent = esGerencia
            ? "Panel demostrativo de gerencia"
            : "Panel demostrativo de especialistas";

        descripcion.textContent = esGerencia
            ? "Funciones que podría utilizar el equipo de gerencia minera."
            : "Funciones que podría utilizar el equipo técnico ambiental.";

        const funciones = esGerencia
            ? [
                "Revisar reportes recibidos y sus prioridades.",
                "Asignar responsables de atención.",
                "Consultar indicadores e informes.",
                "Registrar acuerdos y compromisos aprobados."
            ]
            : [
                "Revisar incidencias derivadas al área técnica.",
                "Registrar observaciones e inspecciones.",
                "Documentar medidas recomendadas.",
                "Preparar información técnica para la comunidad."
            ];

        lista.replaceChildren();

        funciones.forEach(funcion => {
            const elemento = document.createElement("li");
            elemento.textContent = funcion;
            lista.append(elemento);
        });

        panel.hidden = false;

        mostrarMensaje(
            mensaje,
            `Vista de demostración abierta para ${usuario}. No se inició una sesión real.`,
            true
        );

        panel.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

// Muestra mensajes de confirmación o error.
function mostrarMensaje(elemento, texto, exito) {
    if (!elemento) return;

    elemento.textContent = texto;
    elemento.classList.toggle("exito", Boolean(exito));
    elemento.classList.toggle("error", !exito);
}
