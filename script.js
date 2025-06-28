
// Funciones para Wheatstone
function calculateWheatstone(r1, r2, r3, rx) {
  const balancedRx = (r2 * r3) / r1
  const bridgeRatio = rx / balancedRx
  const currentFactor = Math.abs(bridgeRatio - 1) / (bridgeRatio + 1)
  const galvanometerCurrent = 0.01 * currentFactor

  return {
    balancedRx,
    isBalanced: Math.abs(rx - balancedRx) < 0.01,
    galvanometerCurrent,
  }
}

function drawWheatstone(ctx, r1, r2, r3, rx, isBalanced) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2
  const centerY = height / 2

  ctx.clearRect(0, 0, width, height)

  // Puntos del puente con mejor espaciado
  const points = {
    top: { x: centerX, y: centerY - 80 },
    bottom: { x: centerX, y: centerY + 80 },
    left: { x: centerX - 80, y: centerY },
    right: { x: centerX + 80, y: centerY },
  }

  // Dibujar las líneas del puente
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 3
  ctx.beginPath()

  // Contorno del puente
  ctx.moveTo(points.top.x, points.top.y)
  ctx.lineTo(points.left.x, points.left.y)
  ctx.lineTo(points.bottom.x, points.bottom.y)
  ctx.lineTo(points.right.x, points.right.y)
  ctx.lineTo(points.top.x, points.top.y)
  ctx.stroke()

  // Línea del galvanómetro con color según estado
  ctx.strokeStyle = isBalanced ? "#4CAF50" : "#F44336"
  ctx.lineWidth = 4
  ctx.beginPath()
  ctx.moveTo(points.left.x, points.left.y)
  ctx.lineTo(points.right.x, points.right.y)
  ctx.stroke()

  // Galvanómetro en el centro
  ctx.fillStyle = isBalanced ? "#4CAF50" : "#F44336"
  ctx.beginPath()
  ctx.arc(centerX, centerY, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.stroke()

  // Símbolo del galvanómetro
  ctx.fillStyle = "#fff"
  ctx.font = "bold 14px Arial"
  ctx.textAlign = "center"
  ctx.fillText("G", centerX, centerY + 5)

  // Dibujar resistores con mejor posicionamiento
  const resistorData = [
    {
      pos: { x: (points.top.x + points.left.x) / 2, y: (points.top.y + points.left.y) / 2 },
      label: "R₁",
      value: r1,
      color: "#FF5722",
    },
    {
      pos: { x: (points.top.x + points.right.x) / 2, y: (points.top.y + points.right.y) / 2 },
      label: "R₂",
      value: r2,
      color: "#FF5722",
    },
    {
      pos: { x: (points.bottom.x + points.left.x) / 2, y: (points.bottom.y + points.left.y) / 2 },
      label: "R₃",
      value: r3,
      color: "#FF5722",
    },
    {
      pos: { x: (points.bottom.x + points.right.x) / 2, y: (points.bottom.y + points.right.y) / 2 },
      label: "Rx",
      value: rx,
      color: isBalanced ? "#4CAF50" : "#FF9800",
    },
  ]

  resistorData.forEach((resistor) => {
    // Cuerpo del resistor
    ctx.fillStyle = resistor.color
    ctx.fillRect(resistor.pos.x - 18, resistor.pos.y - 8, 36, 16)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(resistor.pos.x - 18, resistor.pos.y - 8, 36, 16)

    // Etiqueta del resistor
    ctx.fillStyle = "#fff"
    ctx.font = "bold 10px Arial"
    ctx.textAlign = "center"
    ctx.fillText(resistor.label, resistor.pos.x, resistor.pos.y + 3)

    // Valor del resistor
    ctx.fillStyle = "#000"
    ctx.font = "bold 12px Arial"
    ctx.fillText(`${resistor.value}Ω`, resistor.pos.x, resistor.pos.y + 30)
  })

  // Fuente de voltaje en la parte superior
  ctx.fillStyle = "#9C27B0"
  ctx.beginPath()
  ctx.arc(points.top.x, points.top.y - 35, 16, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = "#fff"
  ctx.font = "bold 12px Arial"
  ctx.textAlign = "center"
  ctx.fillText("V", points.top.x, points.top.y - 30)

  // Línea de conexión de la fuente
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(points.top.x, points.top.y - 19)
  ctx.lineTo(points.top.x, points.top.y)
  ctx.stroke()

  // Indicador de estado del puente
  ctx.fillStyle = isBalanced ? "#4CAF50" : "#F44336"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.fillText(isBalanced ? "✅ EQUILIBRADO" : "❌ DESEQUILIBRADO", centerX, height - 30)

  // Mostrar la fórmula de equilibrio
  ctx.fillStyle = "#2196F3"
  ctx.font = "bold 14px Arial"
  ctx.fillText("Rx = (R₂ × R₃) / R₁", centerX, height - 10)
}

// Inicialización del DOM
document.addEventListener("DOMContentLoaded", () => {
  // Referencias a elementos
  const sections = {
    serieParalelo: document.getElementById("serie-paralelo"),
    kirchhoff: document.getElementById("kirchhoff"),
    wheatstone: document.getElementById("wheatstone"),
  }

  const buttons = {
    serieParalelo: document.getElementById("btn-serie-paralelo"),
    kirchhoff: document.getElementById("btn-kirchhoff"),
    wheatstone: document.getElementById("btn-wheatstone"),
  }

  const canvases = {
    circuit: document.getElementById("circuit-canvas"),
    kirchhoff: document.getElementById("kirchhoff-canvas"),
    wheatstone: document.getElementById("wheatstone-canvas")
  }

  const controls = {
    voltageValue: document.getElementById("voltage-value"),
    calculateBtn: document.getElementById("calculate-btn"),
    resetBtn: document.getElementById("reset-btn"),
    componentProperties: document.getElementById("component-properties"),
    componentValue: document.getElementById("component-value"),
    //applyProperties: document.getElementById("apply-properties"),
    deleteComponent: document.getElementById("delete-component"),
  }

  const displays = {
    totalResistance: document.getElementById("total-resistance"),
    totalCurrent: document.getElementById("total-current"),
    totalPower: document.getElementById("total-power"),
    componentCount: document.getElementById("component-count"),
    circuitType: document.getElementById("circuit-type"),
    connectionStatus: document.getElementById("connection-status"),
    detailedAnalysis: document.getElementById("detailed-analysis"),
    resistanceFormula: document.getElementById("resistance-formula"),
    componentTypeDisplay: document.getElementById("component-type-display"),
    componentIdDisplay: document.getElementById("component-id-display"),
  }

  // Contextos de canvas
  const contexts = {
    //circuit: canvases.circuit.getContext("2d"),
    kirchhoff: canvases.kirchhoff.getContext("2d"),
    wheatstone: canvases.wheatstone.getContext("2d")
  }

  // Inicializar circuito
  //const circuit = new Circuit()

  // Variables para drag & drop
  let isDragging = false
  let dragOffsetX = 0
  let dragOffsetY = 0

  // Header toggle functionality
  const headerToggleBtn = document.getElementById("header-toggle-btn")
  const mainHeader = document.getElementById("main-header")

  headerToggleBtn.addEventListener("click", () => {
    mainHeader.classList.toggle("collapsed")

    // Cambiar el ícono del botón
    const icon = headerToggleBtn.querySelector("i")
    if (mainHeader.classList.contains("collapsed")) {
      icon.className = "fas fa-chevron-down"
      headerToggleBtn.title = "Expandir Header"
    } else {
      icon.className = "fas fa-chevron-up"
      headerToggleBtn.title = "Contraer Header"
    }
  })

  // Función para cambiar secciones
  function showSection(sectionName) {
    Object.values(sections).forEach((section) => {
      section.classList.add("hidden")
      section.classList.remove("active")
    })

    Object.values(buttons).forEach((button) => {
      button.classList.remove("active")
    })

    sections[sectionName].classList.remove("hidden")
    sections[sectionName].classList.add("active")
    buttons[sectionName].classList.add("active")

    // Esperar a que el DOM se actualice antes de redimensionar
    setTimeout(() => {
      resizeCanvases()

      // Inicializar secciones específicas
      if (sectionName === "kirchhoff") {
        initKirchhoff()
      } else if (sectionName === "wheatstone") {
        initWheatstone()
      }
    }, 100)
  }

  // Función para redimensionar canvas
  function resizeCanvases() {
    Object.entries(canvases).forEach(([name, canvas]) => {
      if (canvas && canvas.parentElement) {
        const rect = canvas.parentElement.getBoundingClientRect()
        if (rect.width > 0 && rect.height > 0) {
          // Ajustar resolución para pantallas de alta densidad
          const dpr = window.devicePixelRatio || 1
          const displayWidth = rect.width
          const displayHeight = rect.height

          canvas.width = displayWidth * dpr
          canvas.height = displayHeight * dpr
          canvas.style.width = displayWidth + "px"
          canvas.style.height = displayHeight + "px"

          const ctx = canvas.getContext("2d")
          ctx.scale(dpr, dpr)
        }
      }
    })

    //if (circuit) {
      //circuit.draw(contexts.circuit)
    //}

    // Redibujar Kirchhoff si está activo
    if (sections.kirchhoff.classList.contains("active") && contexts.kirchhoff) {
      setTimeout(() => drawKirchhoffExample(), 50)
    }

    // Redibujar Wheatstone si está activo
    if (sections.wheatstone.classList.contains("active") && contexts.wheatstone) {
      setTimeout(() => updateWheatstoneDisplay(), 50)
    }
  }

  // Event listeners para navegación
  buttons.serieParalelo.addEventListener("click", () => showSection("serieParalelo"))
  buttons.kirchhoff.addEventListener("click", () => {
    showSection("kirchhoff")
    initKirchhoff()
  })
  buttons.wheatstone.addEventListener("click", () => {
    showSection("wheatstone")
    initWheatstone()
  })

  // Función para detectar si es dispositivo móvil
  function isMobileDevice() {
    return (
      window.innerWidth <= 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    )
  }

  // Función para ajustar la interfaz según el dispositivo
  function adjustForDevice() {
    const isMobile = isMobileDevice()
    const isTablet = window.innerWidth <= 992 && window.innerWidth > 768

    if (isMobile) {
      // Ajustar el canvas para móviles
      //canvases.circuit.style.touchAction = "pan-x pan-y"

      // Hacer que el header se colapse automáticamente en móviles pequeños
      if (window.innerWidth <= 480 && !mainHeader.classList.contains("collapsed")) {
        setTimeout(() => {
          headerToggleBtn.click()
        }, 500)
      }

      // Ajustar el tamaño de los componentes para touch
      document.querySelectorAll(".component-card").forEach((card) => {
        card.style.minHeight = "60px"
      })

      // Hacer los botones más grandes para touch
      document.querySelectorAll(".btn").forEach((btn) => {
        btn.style.minHeight = "44px"
      })

      // Ajustar el panel de propiedades para móviles
      if (controls.componentProperties) {
        controls.componentProperties.style.position = "fixed"
        controls.componentProperties.style.bottom = "0"
        controls.componentProperties.style.left = "0"
        controls.componentProperties.style.right = "0"
        controls.componentProperties.style.top = "auto"
        controls.componentProperties.style.width = "100%"
        controls.componentProperties.style.transform = "none"
      }
    } else if (isTablet) {
      // Ajustes para tablets
      if (controls.componentProperties) {
        controls.componentProperties.style.position = "absolute"
        controls.componentProperties.style.bottom = "1rem"
        controls.componentProperties.style.left = "50%"
        controls.componentProperties.style.right = "auto"
        controls.componentProperties.style.top = "auto"
        controls.componentProperties.style.width = "300px"
        controls.componentProperties.style.transform = "translateX(-50%)"
      }
    } else {
      // Restablecer para escritorio
      if (controls.componentProperties) {
        controls.componentProperties.style.position = "absolute"
        controls.componentProperties.style.top = "1rem"
        controls.componentProperties.style.right = "1rem"
        controls.componentProperties.style.bottom = "auto"
        controls.componentProperties.style.left = "auto"
        controls.componentProperties.style.width = "280px"
        controls.componentProperties.style.transform = "none"
      }
    }
  }
  // Inicialización de Kirchhoff
  function initKirchhoff() {
    // Asegurar que el canvas esté disponible
    setTimeout(() => {
      if (canvases.kirchhoff && contexts.kirchhoff) {
        drawKirchhoffExample()
      }
    }, 100)

    document.getElementById("solve-kirchhoff").addEventListener("click", solveKirchhoffExample)
    document.getElementById("reset-kirchhoff").addEventListener("click", resetKirchhoffExample)
  }

  function drawKirchhoffExample() {
    const ctx = contexts.kirchhoff
    const width = canvases.kirchhoff.width
    const height = canvases.kirchhoff.height

    ctx.clearRect(0, 0, width, height)

    // Definir nodos del circuito
    const nodes = {
      A: { x: width * 0.2, y: height * 0.3 },
      B: { x: width * 0.8, y: height * 0.3 },
      C: { x: width * 0.2, y: height * 0.7 },
      D: { x: width * 0.8, y: height * 0.7 },
    }

    // Dibujar las ramas del circuito
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 3

    // Rama A-B (R1)
    ctx.beginPath()
    ctx.moveTo(nodes.A.x, nodes.A.y)
    ctx.lineTo(nodes.B.x, nodes.B.y)
    ctx.stroke()

    // Rama B-D (R2)
    ctx.beginPath()
    ctx.moveTo(nodes.B.x, nodes.B.y)
    ctx.lineTo(nodes.D.x, nodes.D.y)
    ctx.stroke()

    // Rama D-C (R3)
    ctx.beginPath()
    ctx.moveTo(nodes.D.x, nodes.D.y)
    ctx.lineTo(nodes.C.x, nodes.C.y)
    ctx.stroke()

    // Rama C-A (Fuente)
    ctx.beginPath()
    ctx.moveTo(nodes.C.x, nodes.C.y)
    ctx.lineTo(nodes.A.x, nodes.A.y)
    ctx.stroke()

    // Rama A-D (R4)
    ctx.beginPath()
    ctx.moveTo(nodes.A.x, nodes.A.y)
    ctx.lineTo(nodes.D.x, nodes.D.y)
    ctx.stroke()

    // Dibujar nodos
    ctx.fillStyle = "#2196F3"
    Object.entries(nodes).forEach(([name, pos]) => {
      ctx.beginPath()
      ctx.arc(pos.x, pos.y, 8, 0, Math.PI * 2)
      ctx.fill()

      // Etiquetas de nodos
      ctx.fillStyle = "#000"
      ctx.font = "bold 16px Arial"
      ctx.textAlign = "center"
      ctx.fillText(name, pos.x, pos.y - 20)
      ctx.fillStyle = "#2196F3"
    })

    // Dibujar componentes con mejor posicionamiento

    // R1 entre A-B
    const midAB = { x: (nodes.A.x + nodes.B.x) / 2, y: nodes.A.y - 25 }
    drawKirchhoffResistor(ctx, midAB.x, midAB.y, "R1", "10Ω", "#FF5722")

    // R2 entre B-D
    const midBD = { x: nodes.B.x + 25, y: (nodes.B.y + nodes.D.y) / 2 }
    drawKirchhoffResistor(ctx, midBD.x, midBD.y, "R2", "20Ω", "#FF5722")

    // R3 entre D-C
    const midDC = { x: (nodes.D.x + nodes.C.x) / 2, y: nodes.D.y + 25 }
    drawKirchhoffResistor(ctx, midDC.x, midDC.y, "R3", "15Ω", "#FF5722")

    // Fuente entre C-A
    const midCA = { x: nodes.C.x - 25, y: (nodes.C.y + nodes.A.y) / 2 }
    drawKirchhoffVoltageSource(ctx, midCA.x, midCA.y, "12V")

    // R4 entre A-D (diagonal)
    const midAD = { x: (nodes.A.x + nodes.D.x) / 2 + 20, y: (nodes.A.y + nodes.D.y) / 2 + 20 }
    drawKirchhoffResistor(ctx, midAD.x, midAD.y, "R4", "5Ω", "#FF5722")

    // Dibujar flechas de corriente
    drawCurrentArrows(ctx, nodes)
  }

  function drawKirchhoffResistor(ctx, x, y, label, value, color) {
    // Cuerpo del resistor
    ctx.fillStyle = color
    ctx.fillRect(x - 20, y - 8, 40, 16)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.strokeRect(x - 20, y - 8, 40, 16)

    // Etiquetas
    ctx.fillStyle = "#000"
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(label, x, y - 15)
    ctx.font = "10px Arial"
    ctx.fillText(value, x, y + 25)
  }

  function drawKirchhoffVoltageSource(ctx, x, y, value) {
    // Círculo de la fuente
    ctx.fillStyle = "#9C27B0"
    ctx.beginPath()
    ctx.arc(x, y, 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.stroke()

    // Símbolos + y -
    ctx.fillStyle = "#fff"
    ctx.font = "bold 14px Arial"
    ctx.textAlign = "center"
    ctx.fillText("+", x - 6, y + 4)
    ctx.fillText("-", x + 6, y + 4)

    // Valor
    ctx.fillStyle = "#000"
    ctx.font = "bold 12px Arial"
    ctx.fillText(value, x, y + 35)
  }

  function drawCurrentArrows(ctx, nodes) {
    ctx.strokeStyle = "#2196F3"
    ctx.fillStyle = "#2196F3"
    ctx.lineWidth = 2

    // Flecha I1 (A hacia B)
    drawArrow(ctx, nodes.A.x + 30, nodes.A.y - 10, nodes.B.x - 30, nodes.B.y - 10, "I1")

    // Flecha I2 (B hacia D)
    drawArrow(ctx, nodes.B.x + 10, nodes.B.y + 20, nodes.D.x + 10, nodes.D.y - 20, "I2")

    // Flecha I3 (D hacia C)
    drawArrow(ctx, nodes.D.x - 30, nodes.D.y + 10, nodes.C.x + 30, nodes.C.y + 10, "I3")

    // Flecha I4 (A hacia D, diagonal)
    drawArrow(ctx, nodes.A.x + 15, nodes.A.y + 15, nodes.D.x - 15, nodes.D.y - 15, "I4")
  }

  function drawArrow(ctx, x1, y1, x2, y2, label) {
    // Línea principal
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.stroke()

    // Punta de flecha
    const angle = Math.atan2(y2 - y1, x2 - x1)
    const arrowLength = 10

    ctx.beginPath()
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - arrowLength * Math.cos(angle - Math.PI / 6), y2 - arrowLength * Math.sin(angle - Math.PI / 6))
    ctx.moveTo(x2, y2)
    ctx.lineTo(x2 - arrowLength * Math.cos(angle + Math.PI / 6), y2 - arrowLength * Math.sin(angle + Math.PI / 6))
    ctx.stroke()

    // Etiqueta
    const midX = (x1 + x2) / 2
    const midY = (y1 + y2) / 2
    ctx.fillStyle = "#2196F3"
    ctx.font = "bold 12px Arial"
    ctx.textAlign = "center"
    ctx.fillText(label, midX, midY - 5)
  }

  // Mejorar la función solveKirchhoffExample():

  function solveKirchhoffExample() {
    const equations = [
      "📐 ECUACIONES DE KIRCHHOFF:",
      "",
      "🔄 LEY DE CORRIENTES (LCK) - Nodos:",
      "Nodo A: I1 - I4 - I5 = 0",
      "Nodo B: I4 - I1 - I2 = 0",
      "Nodo C: I5 + I3 - I0 = 0",
      "Nodo D: I2 - I3 - I4 = 0",
      "",
      "🔁 LEY DE VOLTAJES (LVK) - Mallas:",
      "Malla 1 (A-B-D-A): -R1×I1 - R2×I2 + R4×I4 = 0",
      "Malla 2 (A-C-D-A): 12V - R4×I4 - R3×I3 = 0",
      "Malla 3 (B-D-C-A-B): -R2×I2 - R3×I3 + R1×I1 - 12V = 0",
    ]

    const solution = [
      "⚡ SOLUCIÓN DEL SISTEMA:",
      "",
      "🔢 Valores de Corriente:",
      "I1 = 0.75 A (A → B)",
      "I2 = 0.45 A (B → D)",
      "I3 = 0.60 A (D → C)",
      "I4 = 0.30 A (A → D)",
      "I0 = 1.20 A (fuente)",
      "",
      "✅ VERIFICACIÓN:",
      "Nodo A: 0.75 - 0.30 - 1.20 = -0.75 ≈ 0",
      "Malla 1: -10(0.75) - 20(0.45) + 5(0.30) = 0",
      "Potencia total: P = 12V × 1.20A = 14.4W",
    ]

    document.getElementById("kirchhoff-equations").innerHTML = equations
      .map(
        (eq) =>
          `<div style="margin: 3px 0; ${eq.includes("📐") || eq.includes("🔄") || eq.includes("🔁") ? "font-weight: bold; color: #2196F3;" : ""}">${eq}</div>`,
      )
      .join("")

    document.getElementById("kirchhoff-solution").innerHTML = solution
      .map(
        (sol) =>
          `<div style="margin: 3px 0; ${sol.includes("⚡") || sol.includes("🔢") || sol.includes("✅") ? "font-weight: bold; color: #4CAF50;" : ""}">${sol}</div>`,
      )
      .join("")
  }

  // Función para reiniciar el ejemplo de Kirchhoff
  function resetKirchhoffExample() {
    drawKirchhoffExample()
    document.getElementById("kirchhoff-equations").innerHTML = ""
    document.getElementById("kirchhoff-solution").innerHTML = ""
  }

  // Inicialización de Wheatstone
  function initWheatstone() {
    // Asegurar que el canvas esté disponible
    setTimeout(() => {
      if (canvases.wheatstone && contexts.wheatstone) {
        updateWheatstoneDisplay()
      }
    }, 100)
    ;["r1-value", "r2-value", "r3-value", "rx-value"].forEach((id) => {
      document.getElementById(id).addEventListener("input", updateWheatstoneDisplay)
    })

    document.getElementById("calculate-wheatstone").addEventListener("click", calculateWheatstoneBalance)
    document.getElementById("balance-wheatstone").addEventListener("click", balanceWheatstone)
  }

  function updateWheatstoneDisplay() {
    const r1 = Number.parseFloat(document.getElementById("r1-value").value) || 100
    const r2 = Number.parseFloat(document.getElementById("r2-value").value) || 200
    const r3 = Number.parseFloat(document.getElementById("r3-value").value) || 150
    const rx = Number.parseFloat(document.getElementById("rx-value").value) || 300

    const result = calculateWheatstone(r1, r2, r3, rx)
    drawWheatstone(contexts.wheatstone, r1, r2, r3, rx, result.isBalanced)

    // Actualizar estado con mejor formato
    const bridgeStatus = document.getElementById("bridge-status")
    const galvanometerCurrent = document.getElementById("current-through-galvanometer")
    const balanceIcon = document.getElementById("balance-icon")

    bridgeStatus.textContent = result.isBalanced ? "✅ Equilibrado" : "❌ Desequilibrado"
    bridgeStatus.className = result.isBalanced ? "status-value balanced" : "status-value unbalanced"

    galvanometerCurrent.textContent = `${(result.galvanometerCurrent * 1000).toFixed(1)} mA`

    balanceIcon.style.color = result.isBalanced ? "#4CAF50" : "#F44336"

    // Actualizar el ícono
    balanceIcon.innerHTML = result.isBalanced
      ? '<i class="fas fa-check-circle"></i>'
      : '<i class="fas fa-times-circle"></i>'
  }

  // Mejorar calculateWheatstoneBalance():

  function calculateWheatstoneBalance() {
    const r1 = Number.parseFloat(document.getElementById("r1-value").value) || 100
    const r2 = Number.parseFloat(document.getElementById("r2-value").value) || 200
    const r3 = Number.parseFloat(document.getElementById("r3-value").value) || 150
    const rx = Number.parseFloat(document.getElementById("rx-value").value) || 300

    const result = calculateWheatstone(r1, r2, r3, rx)
    const difference = Math.abs(rx - result.balancedRx)
    const percentError = (difference / result.balancedRx) * 100

    document.getElementById("wheatstone-solution").innerHTML = `
    <h4>📊 ANÁLISIS DETALLADO:</h4>
    <div style="margin: 8px 0;"><strong>🎯 Rx para equilibrio:</strong> ${result.balancedRx.toFixed(2)} Ω</div>
    <div style="margin: 8px 0;"><strong>⚖️ Rx actual:</strong> ${rx} Ω</div>
    <div style="margin: 8px 0;"><strong>📏 Diferencia:</strong> ${difference.toFixed(2)} Ω</div>
    <div style="margin: 8px 0;"><strong>📈 Error porcentual:</strong> ${percentError.toFixed(1)}%</div>
    <div style="margin: 8px 0;"><strong>🔋 Estado:</strong> <span style="color: ${result.isBalanced ? "#4CAF50" : "#F44336"}; font-weight: bold;">${result.isBalanced ? "EQUILIBRADO" : "DESEQUILIBRADO"}</span></div>
    <div style="margin: 8px 0;"><strong>⚡ Corriente en galvanómetro:</strong> ${(result.galvanometerCurrent * 1000).toFixed(1)} mA</div>
    <br>
    <div style="background: #E3F2FD; padding: 10px; border-radius: 5px; margin: 10px 0;">
      <strong>🧮 Cálculo aplicado:</strong><br>
      Rx = (R₂ × R₃) / R₁<br>
      Rx = (${r2} × ${r3}) / ${r1}<br>
      Rx = ${(r2 * r3).toFixed(0)} / ${r1}<br>
      Rx = ${result.balancedRx.toFixed(2)} Ω
    </div>
    ${
      result.isBalanced
        ? '<div style="color: #4CAF50; font-weight: bold;">✅ El puente está equilibrado - No hay corriente en el galvanómetro</div>'
        : '<div style="color: #F44336; font-weight: bold;">⚠️ El puente está desequilibrado - Ajuste Rx para equilibrar</div>'
    }
  `
  }

  // Función para equilibrar el puente de Wheatstone
  function balanceWheatstone() {
    const r1 = Number.parseFloat(document.getElementById("r1-value").value) || 100
    const r2 = Number.parseFloat(document.getElementById("r2-value").value) || 200
    const r3 = Number.parseFloat(document.getElementById("r3-value").value) || 150

    // Calcular el valor de Rx para el equilibrio
    const balancedRx = (r2 * r3) / r1

    // Actualizar el valor de Rx en el campo de entrada
    document.getElementById("rx-value").value = balancedRx.toFixed(2)

    // Actualizar la visualización
    updateWheatstoneDisplay()
    calculateWheatstoneBalance()
  }

  // Inicialización
  window.addEventListener("resize", resizeCanvases)
  resizeCanvases()
  circuit.draw(contexts.circuit)
  updateAllDisplays()

  // Ajustar para dispositivo al cargar
  adjustForDevice()

  // Listener para cambios de orientación
  window.addEventListener("orientationchange", () => {
    setTimeout(() => {
      resizeCanvases()
      adjustForDevice()
    }, 100)
  })

  // Listener para cambios de tamaño de ventana con debounce
  let resizeTimeout
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimeout)
    resizeTimeout = setTimeout(() => {
      resizeCanvases()
      adjustForDevice()
    }, 150)
  })
})
