/* Interacciones del formulario de Consulta Municipal (prototipo). */
(() => {
"use strict";

    const get = id => document.getElementById(id);
    const panels = [...document.querySelectorAll(".panel")];
    const steps = [...document.querySelectorAll(".step")];

    let currentStep = 0;

    const requiredPersonal = ["nombre", "correo"];
    const requiredConsulta = ["tema", "pregunta"];

    // VALIDACIONES

    function checkField(id) {
      const input = get(id);
      const value = input.value.trim();

      let valid = value.length > 0;

      if (id === "correo") {
        valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      }

      input.closest(".field").classList.toggle("invalid", !valid);
      input.setAttribute("aria-invalid", String(!valid));

      return valid;
    }

    function validateFields(ids) {
      let firstInvalid = null;

      ids.forEach(id => {
        if (!checkField(id) && !firstInvalid) {
          firstInvalid = get(id);
        }
      });

      if (firstInvalid && firstInvalid.getClientRects().length) {
        firstInvalid.focus();
      }

      return !firstInvalid;
    }

    // MOSTRAR PASOS

    function renderStep() {
      panels.forEach((panel, index) => {
        panel.classList.toggle("active", index === currentStep);
        panel.setAttribute("aria-hidden", String(index !== currentStep));
      });

      steps.forEach((step, index) => {
        step.classList.toggle("active", index === currentStep);
        step.classList.toggle("done", index < currentStep);
      });

      get("prev").hidden = currentStep === 0;
      get("next").hidden = currentStep === 3;
      get("send").hidden = currentStep !== 3;

      get("next").textContent =
        currentStep === 0 ? "Comenzar consulta →" : "Siguiente →";

      get("progressFill").style.width =
        ((currentStep + 1) * 25) + "%";

      if (currentStep === 3) {
        generateSummary();
      }
    }

    function goToStep(step) {
      currentStep = Math.max(0, Math.min(3, step));
      renderStep();

      get("stepper").scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }

    // SIGUIENTE Y ANTERIOR

    get("next").addEventListener("click", () => {
      // En el prototipo se permite avanzar aunque los datos estén vacíos.
      goToStep(currentStep + 1);
    });

    get("prev").addEventListener("click", () => {
      goToStep(currentStep - 1);
    });

    // RESUMEN

    function generateSummary() {
      const groups = [
        {
          title: "Datos personales",
          step: 1,
          rows: [
            ["Nombre", get("nombre").value.trim() || "No indicado"]
          ]
        },
        {
          title: "Contacto",
          step: 1,
          rows: [
            ["Correo", get("correo").value.trim() || "No indicado"],
            ["Teléfono", get("telefono").value || "No indicado"]
          ]
        },
        {
          title: "Consulta",
          step: 2,
          rows: [
            ["Tema", get("tema").value || "No seleccionado"],
            ["Pregunta", get("pregunta").value.trim() || "No indicada"],
            ["Adjunto", get("archivo").files[0]?.name || "Sin archivo"]
          ]
        }
      ];

      get("resumen").replaceChildren();

      groups.forEach(groupData => {
        const group = document.createElement("div");
        group.className = "summary-block";

        const title = document.createElement("h3");
        title.textContent = groupData.title;
        group.append(title);

        groupData.rows.forEach(([label, value]) => {
          const p = document.createElement("p");
          const bold = document.createElement("b");
          bold.textContent = label + ": ";
          p.append(bold, document.createTextNode(value));
          group.append(p);
        });

        const edit = document.createElement("button");
        edit.type = "button";
        edit.className = "edit";
        edit.textContent = "✎ Editar";
        edit.addEventListener("click", () => goToStep(groupData.step));

        group.append(edit);
        get("resumen").append(group);
      });
    }

    // ENVÍO SIMULADO

    get("form").addEventListener("submit", event => {
      event.preventDefault();

      // Envío de ejemplo: sin bloqueo por campos pendientes.

      get("form").hidden = true;
      get("stepper").hidden = true;
      get("progress").hidden = true;
      get("success").hidden = false;

      get("success").scrollIntoView({ behavior: "smooth" });
    });

    // REINICIAR

    get("restart").addEventListener("click", () => {
      get("form").reset();

      document.querySelectorAll(".field").forEach(field => {
        field.classList.remove("invalid");
      });

      document.querySelectorAll("[aria-invalid]").forEach(input => {
        input.removeAttribute("aria-invalid");
      });

      get("counter").textContent = "0";
      get("archivoInfo").textContent =
        "PDF, JPG o PNG. Máximo ilustrativo: 5 MB.";
      get("archivoInfo").style.color = "";

      get("form").hidden = false;
      get("stepper").hidden = false;
      get("progress").hidden = false;
      get("success").hidden = true;

      goToStep(0);
    });

    // ACTUALIZAR ERRORES

    [...requiredPersonal, ...requiredConsulta].forEach(id => {
      ["input", "change"].forEach(eventName => {
        get(id).addEventListener(eventName, () => {
          if (get(id).closest(".field").classList.contains("invalid")) {
            checkField(id);
          }
        });
      });
    });

    // CONTADOR DE CARACTERES

    get("pregunta").addEventListener("input", event => {
      get("counter").textContent = event.target.value.length;
    });

    // ARCHIVOS ADJUNTOS

    get("archivo").addEventListener("change", event => {
      const file = event.target.files[0];
      const info = get("archivoInfo");

      if (!file) {
        info.textContent = "PDF, JPG o PNG. Máximo ilustrativo: 5 MB.";
        return;
      }

      const allowedTypes = [
        "application/pdf",
        "image/jpeg",
        "image/png"
      ];

      if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) {
        info.textContent = "Formato no admitido o tamaño mayor de 5 MB.";
        info.style.color = "#b62222";
        event.target.value = "";
        return;
      }

      info.textContent = "Seleccionado: " + file.name;
      info.style.color = "#217346";
    });

    // MENÚ MÓVIL

    get("menu").addEventListener("click", () => {
      const open = get("nav").classList.toggle("open");
      get("menu").setAttribute("aria-expanded", String(open));
    });

    // ENCUESTA

    const votes = {
      Excelente: 0,
      Buena: 0,
      Regular: 0,
      Mala: 0
    };

    let voted = false;

    function drawResults() {
      const total = Object.values(votes).reduce((a, b) => a + b, 0);
      get("resultRows").replaceChildren();

      Object.entries(votes).forEach(([name, count]) => {
        const percent = total ? Math.round(count * 100 / total) : 0;

        const row = document.createElement("div");
        row.className = "result-row";

        const label = document.createElement("div");
        const text = document.createElement("span");
        const value = document.createElement("span");

        text.textContent = name;
        value.textContent = `${percent}% (${count})`;
        label.append(text, value);

        const track = document.createElement("div");
        track.className = "track";

        const fill = document.createElement("span");
        fill.style.width = percent + "%";

        track.append(fill);
        row.append(label, track);
        get("resultRows").append(row);
      });

      get("results").hidden = false;
    }

    get("vote").addEventListener("click", () => {
      const selected = document.querySelector(
        'input[name="opinion"]:checked'
      );

      if (!selected) {
        get("voteStatus").textContent = "Seleccioná una opción primero.";
        return;
      }

      if (voted) {
        get("voteStatus").textContent =
          "Ya votaste durante esta demostración.";
        return;
      }

      votes[selected.value]++;
      voted = true;

      get("voteStatus").textContent = "¡Gracias por tu opinión!";
      drawResults();
    });

    get("showResults").addEventListener("click", () => {
      if (get("results").hidden) {
        drawResults();
      } else {
        get("results").hidden = true;
      }
    });

    // CHAT FLOTANTE

    function setChatOpen(open) {
      get("chat").classList.toggle("open", open);
      get("chatToggle").setAttribute("aria-expanded", String(open));

      if (open) get("chatInput").focus();
    }

    get("chatToggle").addEventListener("click", () => {
      setChatOpen(!get("chat").classList.contains("open"));
    });

    get("chatClose").addEventListener("click", () => {
      setChatOpen(false);
    });

    function addMessage(text, mine = false) {
      const div = document.createElement("div");
      div.className = "message" + (mine ? " mine" : "");
      div.textContent = text;
      get("messages").append(div);
      get("messages").scrollTop = get("messages").scrollHeight;
    }

    get("chatForm").addEventListener("submit", event => {
      event.preventDefault();

      const text = get("chatInput").value.trim();
      if (!text) return;

      addMessage(text, true);
      get("chatInput").value = "";

      const question = text.toLowerCase();

      let response;

      if (question.includes("horario")) {
        response = "El horario ilustrado es de lunes a viernes, de 8 a. m. a 4 p. m.";
      } else if (question.includes("teléfono") || question.includes("telefono")) {
        response = "El número mostrado es 2666-0169.";
      } else if (question.includes("consulta") || question.includes("paso")) {
        response = "El formulario tiene cuatro etapas: información, datos, consulta y confirmación.";
      } else {
        response = "Soy un asistente de demostración. Puedo explicar los pasos del formulario y los datos de contacto.";
      }

      addMessage(response);
    });

    renderStep();
})();
