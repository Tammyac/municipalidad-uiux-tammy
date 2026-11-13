
const form = document.getElementById("consultaForm");
const panels = document.querySelectorAll(".wizard-step");
const indicators = document.querySelectorAll(".step");
const btnAnterior = document.getElementById("anterior");
const btnSiguiente = document.getElementById("siguiente");
const btnEnviar = document.getElementById("enviar");
const success = document.getElementById("success");
const layout = document.getElementById("contentLayout");

const mobileQuery = window.matchMedia("(max-width: 768px)");
let currentStep = 0;

const get = id => document.getElementById(id);

function isValid(id) {
  const input = get(id);
  const value = input.value.trim();

  let valid = value.length > 0;

  if (id === "correo") {
    valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  const field = input.closest(".field");
  field.classList.toggle("invalid", !valid);
  input.setAttribute("aria-invalid", String(!valid));

  return valid;
}

function validateFields(ids) {
  let firstInvalid = null;

  ids.forEach(id => {
    if (!isValid(id) && !firstInvalid) {
      firstInvalid = get(id);
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    return false;
  }

  return true;
}

function validateStep() {
  if (currentStep === 0) {
    return validateFields(["cedula", "nombre", "correo"]);
  }

  if (currentStep === 1) {
    return validateFields(["tema", "pregunta"]);
  }

  return true;
}


function showStep() {
  // Mostrar únicamente la sección correspondiente
  panels.forEach((panel, index) => {
    panel.classList.toggle("active", index === currentStep);
  });

  // Actualizar los indicadores de progreso
  indicators.forEach((indicator, index) => {
    indicator.classList.toggle("active", index === currentStep);
    indicator.classList.toggle("completed", index < currentStep);
  });

  // Botones visibles según el paso actual
  btnAnterior.style.display =
    currentStep > 0 ? "block" : "none";

  btnSiguiente.style.display =
    currentStep < 2 ? "block" : "none";

  btnEnviar.style.display =
    currentStep === 2 ? "block" : "none";

  // Preparar el resumen del último paso
  if (currentStep === 2) {
    renderSummary();
  }
}


function renderSummary() {
  const summary = get("resumen");

  const rows = [
    ["Nombre", get("nombre").value],
    ["Identificación", get("cedula").value],
    ["Correo", get("correo").value],
    ["Teléfono", get("telefono").value || "No indicado"],
    ["Tema", get("tema").value],
    ["Consulta", get("pregunta").value],
    [
      "Archivo",
      get("archivo").files[0]?.name || "Sin archivo"
    ]
  ];

  summary.replaceChildren();

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    const bold = document.createElement("strong");
    const text = document.createElement("span");

    bold.textContent = label + ": ";
    text.textContent = value;

    row.append(bold, text);
    summary.append(row);
  });
}

btnSiguiente.addEventListener("click", () => {
  if (!validateStep()) return;

  currentStep = Math.min(currentStep + 1, 2);
  showStep();
});

btnAnterior.addEventListener("click", () => {
  currentStep = Math.max(currentStep - 1, 0);
  showStep();
});

get("pregunta").addEventListener("input", event => {
  get("contador").textContent = event.target.value.length;
});

get("archivo").addEventListener("change", event => {
  const file = event.target.files[0];
  const info = get("archivoInfo");

  if (!file) {
    info.textContent = "PDF, JPG o PNG. Máximo de prueba: 5 MB.";
    return;
  }

  const types = [
    "application/pdf",
    "image/jpeg",
    "image/png"
  ];

  if (!types.includes(file.type) || file.size > 5 * 1024 * 1024) {
    info.textContent = "Formato no permitido o archivo mayor a 5 MB.";
    event.target.value = "";
    return;
  }

  info.textContent = "Archivo seleccionado: " + file.name;
});


form.addEventListener("submit", event => {
  event.preventDefault();

  const valid = validateFields([
    "cedula",
    "nombre",
    "correo",
    "tema",
    "pregunta"
  ]);

  if (!valid) {
    // Identificar si el error está en el primer paso
    const personalFields = ["cedula", "nombre", "correo"];

    const hasPersonalErrors = personalFields.some(id => {
      return get(id)
        .closest(".field")
        .classList.contains("invalid");
    });

    // Regresar al paso que contiene el error
    currentStep = hasPersonalErrors ? 0 : 1;

    showStep();

    // Enfocar el primer campo incorrecto que esté visible
    const firstInvalid = panels[currentStep].querySelector(
      ".field.invalid input, " +
      ".field.invalid select, " +
      ".field.invalid textarea"
    );

    if (firstInvalid) {
      firstInvalid.focus();
    }

    return;
  }

  // Simular envío correcto
  layout.style.display = "none";
  get("stepper").style.display = "none";
  success.hidden = false;

  success.scrollIntoView({
    behavior: "smooth",
    block: "start"
  });
});

get("nuevaConsulta").addEventListener("click", () => {
  form.reset();
  currentStep = 0;

  document.querySelectorAll(".field").forEach(field => {
    field.classList.remove("invalid");
  });

  get("contador").textContent = "0";
  get("archivoInfo").textContent =
    "PDF, JPG o PNG. Máximo de prueba: 5 MB.";

  success.hidden = true;
  layout.style.display = "";
  get("stepper").style.display = "";

  showStep();
});

const toggle = get("menuToggle");
const nav = get("nav");

toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

document.querySelectorAll(".survey-options button")
  .forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".survey-options button")
        .forEach(item => item.classList.remove("selected"));

      button.classList.add("selected");

      get("surveyMessage").textContent =
        "Seleccionaste: " + button.textContent +
        ". Valoración simulada, sin almacenamiento.";
    });
  });


showStep();
