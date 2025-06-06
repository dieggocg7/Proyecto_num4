/**
 * Funciones de cálculo para el simulador de circuitos
 */

// Cálculo de resistencia total en serie
function calculateSeriesResistance(resistors) {
  return resistors.reduce((total, resistor) => total + Number.parseFloat(resistor.value), 0)
}

// Cálculo de resistencia total en paralelo
function calculateParallelResistance(resistors) {
  if (resistors.length === 0) return 0

  const reciprocalSum = resistors.reduce((sum, resistor) => {
    return sum + 1 / Number.parseFloat(resistor.value)
  }, 0)

  return reciprocalSum === 0 ? 0 : 1 / reciprocalSum
}

// Cálculo de corriente usando la Ley de Ohm (I = V/R)
function calculateCurrent(voltage, resistance) {
  return resistance === 0 ? 0 : voltage / resistance
}

// Cálculo de potencia (P = V * I)
function calculatePower(voltage, current) {
  return voltage * current
}

// Cálculo de corrientes en un circuito usando las Leyes de Kirchhoff
function solveKirchhoffCircuit(nodes, branches) {
  // Esta es una implementación simplificada para resolver un circuito básico
  // En un caso real, se necesitaría resolver un sistema de ecuaciones lineales

  // Ejemplo de resultado para un circuito simple
  const result = {
    equations: [
      "I1 + I2 - I3 = 0 (Nodo A)",
      "I3 - I4 - I5 = 0 (Nodo B)",
      "V1 - R1*I1 = 0 (Malla 1)",
      "R2*I2 + R3*I3 - V2 = 0 (Malla 2)",
    ],
    currents: {
      I1: 0.5,
      I2: 0.3,
      I3: 0.8,
      I4: 0.5,
      I5: 0.3,
    },
  }

  return result
}

// Cálculo del Puente de Wheatstone
function calculateWheatstone(r1, r2, r3, rx) {
  // Calcular la resistencia que equilibraría el puente
  const balancedRx = (r2 * r3) / r1

  // Calcular la corriente a través del galvanómetro (simplificado)
  // En un puente equilibrado, esta corriente sería 0
  const bridgeRatio = rx / balancedRx
  const currentFactor = Math.abs(bridgeRatio - 1) / (bridgeRatio + 1)
  const galvanometerCurrent = 0.01 * currentFactor // Valor simplificado

  return {
    balancedRx,
    isBalanced: Math.abs(rx - balancedRx) < 0.01,
    galvanometerCurrent,
  }
}

// Función para dibujar el diagrama del circuito en serie
function drawSeriesCircuit(ctx, resistors, voltage) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerY = height / 2

  ctx.clearRect(0, 0, width, height)

  // Si no hay componentes, mostrar mensaje
  if (resistors.length === 0) {
    ctx.font = "16px Arial"
    ctx.fillStyle = "#666"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Agregue componentes al circuito", width / 2, centerY)
    return
  }

  const componentWidth = 60
  const componentHeight = 30
  const totalComponents = resistors.length + 1 // +1 para la fuente
  const totalWidth = totalComponents * componentWidth + (totalComponents - 1) * 20
  let startX = (width - totalWidth) / 2

  // Dibujar fuente de voltaje
  drawVoltageSymbol(ctx, startX + componentWidth / 2, centerY, componentWidth, componentHeight, voltage)

  // Dibujar línea de conexión
  startX += componentWidth
  ctx.beginPath()
  ctx.moveTo(startX, centerY)
  ctx.lineTo(startX + 20, centerY)
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.stroke()
  startX += 20

  // Dibujar resistores en serie
  for (let i = 0; i < resistors.length; i++) {
    drawResistorSymbol(ctx, startX + componentWidth / 2, centerY, componentWidth, componentHeight, resistors[i].value)

    // Dibujar línea de conexión si no es el último resistor
    if (i < resistors.length - 1) {
      startX += componentWidth
      ctx.beginPath()
      ctx.moveTo(startX, centerY)
      ctx.lineTo(startX + 20, centerY)
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.stroke()
      startX += 20
    }
  }

  // Dibujar línea de retorno
  ctx.beginPath()
  ctx.moveTo(startX + componentWidth, centerY)
  ctx.lineTo(startX + componentWidth + 20, centerY)
  ctx.lineTo(startX + componentWidth + 20, centerY + 50)
  ctx.lineTo((width - totalWidth) / 2 - 20, centerY + 50)
  ctx.lineTo((width - totalWidth) / 2 - 20, centerY)
  ctx.lineTo((width - totalWidth) / 2, centerY)
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.stroke()
}

// Función para dibujar el diagrama del circuito en paralelo
function drawParallelCircuit(ctx, resistors, voltage) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2

  ctx.clearRect(0, 0, width, height)

  // Si no hay componentes, mostrar mensaje
  if (resistors.length === 0) {
    ctx.font = "16px Arial"
    ctx.fillStyle = "#666"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("Agregue componentes al circuito", centerX, height / 2)
    return
  }

  const componentWidth = 60
  const componentHeight = 30
  const totalHeight = resistors.length * (componentHeight + 30) + 60
  let startY = (height - totalHeight) / 2

  // Dibujar fuente de voltaje
  drawVoltageSymbol(ctx, centerX - 100, startY + 30, componentWidth, componentHeight, voltage)

  // Dibujar líneas verticales
  const leftX = centerX - 40
  const rightX = centerX + 40

  ctx.beginPath()
  ctx.moveTo(centerX - 100 + componentWidth, startY + 30)
  ctx.lineTo(rightX, startY + 30)
  ctx.moveTo(centerX - 100, startY + 30)
  ctx.lineTo(leftX, startY + 30)
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.stroke()

  // Dibujar líneas verticales principales
  ctx.beginPath()
  ctx.moveTo(leftX, startY + 30)
  ctx.lineTo(leftX, startY + totalHeight - 30)
  ctx.moveTo(rightX, startY + 30)
  ctx.lineTo(rightX, startY + totalHeight - 30)
  ctx.stroke()

  // Dibujar resistores en paralelo
  startY += 60
  for (let i = 0; i < resistors.length; i++) {
    // Líneas horizontales de conexión
    ctx.beginPath()
    ctx.moveTo(leftX, startY)
    ctx.lineTo(leftX + 20, startY)
    ctx.moveTo(rightX - 20, startY)
    ctx.lineTo(rightX, startY)
    ctx.stroke()

    // Dibujar resistor
    drawResistorSymbol(ctx, centerX, startY, componentWidth, componentHeight, resistors[i].value)

    startY += componentHeight + 30
  }

  // Dibujar línea inferior
  ctx.beginPath()
  ctx.moveTo(leftX, startY - 30)
  ctx.lineTo(rightX, startY - 30)
  ctx.stroke()

  // Conectar la línea inferior a la fuente
  ctx.beginPath()
  ctx.moveTo(centerX - 100, startY - 30)
  ctx.lineTo(leftX, startY - 30)
  ctx.stroke()
}

// Función para dibujar un símbolo de resistor
function drawResistorSymbol(ctx, x, y, width, height, value) {
  // Dibujar el cuerpo del resistor
  ctx.beginPath()
  ctx.rect(x - width / 2, y - height / 2, width, height)
  ctx.fillStyle = "#f39c12"
  ctx.fill()
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 1
  ctx.stroke()

  // Dibujar el valor
  ctx.font = "12px Arial"
  ctx.fillStyle = "#000"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`${value} Ω`, x, y)
}

// Función para dibujar un símbolo de fuente de voltaje
function drawVoltageSymbol(ctx, x, y, width, height, value) {
  // Dibujar el círculo de la fuente
  ctx.beginPath()
  ctx.arc(x, y, width / 2, 0, Math.PI * 2)
  ctx.fillStyle = "#9b59b6"
  ctx.fill()
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 1
  ctx.stroke()

  // Dibujar los símbolos + y -
  ctx.font = "16px Arial"
  ctx.fillStyle = "#fff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("+", x - 10, y)
  ctx.fillText("-", x + 10, y)

  // Dibujar el valor
  ctx.font = "12px Arial"
  ctx.fillStyle = "#000"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`${value} V`, x, y + height)
}

// Función para dibujar el puente de Wheatstone
function drawWheatstone(ctx, r1, r2, r3, rx, isBalanced) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2
  const centerY = height / 2

  ctx.clearRect(0, 0, width, height)

  // Puntos del puente
  const topPoint = { x: centerX, y: centerY - 100 }
  const bottomPoint = { x: centerX, y: centerY + 100 }
  const leftPoint = { x: centerX - 100, y: centerY }
  const rightPoint = { x: centerX + 100, y: centerY }

  // Dibujar las líneas del puente
  ctx.beginPath()
  ctx.moveTo(topPoint.x, topPoint.y)
  ctx.lineTo(leftPoint.x, leftPoint.y)
  ctx.lineTo(bottomPoint.x, bottomPoint.y)
  ctx.lineTo(rightPoint.x, rightPoint.y)
  ctx.lineTo(topPoint.x, topPoint.y)
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.stroke()

  // Dibujar el galvanómetro (línea central)
  ctx.beginPath()
  ctx.moveTo(leftPoint.x, leftPoint.y)
  ctx.lineTo(rightPoint.x, rightPoint.y)
  ctx.strokeStyle = isBalanced ? "#2ecc71" : "#e74c3c"
  ctx.lineWidth = 2
  ctx.stroke()

  // Dibujar el símbolo del galvanómetro
  ctx.beginPath()
  ctx.arc(centerX, centerY, 15, 0, Math.PI * 2)
  ctx.fillStyle = isBalanced ? "#2ecc71" : "#e74c3c"
  ctx.fill()
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = "12px Arial"
  ctx.fillStyle = "#fff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("G", centerX, centerY)

  // Dibujar los valores de las resistencias
  // R1 (arriba-izquierda)
  drawResistorLabel(ctx, (topPoint.x + leftPoint.x) / 2, (topPoint.y + leftPoint.y) / 2, "R1", r1)

  // R2 (arriba-derecha)
  drawResistorLabel(ctx, (topPoint.x + rightPoint.x) / 2, (topPoint.y + rightPoint.y) / 2, "R2", r2)

  // R3 (abajo-izquierda)
  drawResistorLabel(ctx, (bottomPoint.x + leftPoint.x) / 2, (bottomPoint.y + leftPoint.y) / 2, "R3", r3)

  // Rx (abajo-derecha)
  drawResistorLabel(ctx, (bottomPoint.x + rightPoint.x) / 2, (bottomPoint.y + rightPoint.y) / 2, "Rx", rx)

  // Dibujar la fuente de voltaje
  ctx.beginPath()
  ctx.arc(topPoint.x, topPoint.y - 30, 15, 0, Math.PI * 2)
  ctx.fillStyle = "#9b59b6"
  ctx.fill()
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.font = "12px Arial"
  ctx.fillStyle = "#fff"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText("V", topPoint.x, topPoint.y - 30)
}

// Función para dibujar etiqueta de resistor en el puente
function drawResistorLabel(ctx, x, y, label, value) {
  ctx.font = "14px Arial"
  ctx.fillStyle = "#000"
  ctx.textAlign = "center"
  ctx.textBaseline = "middle"
  ctx.fillText(`${label}: ${value} Ω`, x, y)
}
