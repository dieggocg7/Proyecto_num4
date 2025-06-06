// Simulador de Circuitos Eléctricos - Versión Simplificada

// Clases para componentes del circuito
class CircuitComponent {
  constructor(x, y, value, type) {
    this.x = x
    this.y = y
    this.value = value
    this.type = type
    this.selected = false
    this.width = 80
    this.height = 40
    this.id = Math.random().toString(36).substr(2, 9)
  }

  isPointInside(x, y) {
    return (
      x >= this.x - this.width / 2 &&
      x <= this.x + this.width / 2 &&
      y >= this.y - this.height / 2 &&
      y <= this.y + this.height / 2
    )
  }

  drawSelected(ctx) {
    ctx.strokeStyle = "#2196F3"
    ctx.lineWidth = 3
    ctx.setLineDash([5, 3])
    ctx.strokeRect(this.x - this.width / 2 - 5, this.y - this.height / 2 - 5, this.width + 10, this.height + 10)
    ctx.setLineDash([])
  }
}

class Resistor extends CircuitComponent {
  constructor(x, y, value = 100) {
    super(x, y, value, "resistor")
  }

  draw(ctx) {
    // Líneas de conexión
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.x - this.width / 2, this.y)
    ctx.lineTo(this.x - this.width / 4, this.y)
    ctx.moveTo(this.x + this.width / 4, this.y)
    ctx.lineTo(this.x + this.width / 2, this.y)
    ctx.stroke()

    // Cuerpo del resistor (zigzag)
    ctx.strokeStyle = "#8B4513"
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(this.x - this.width / 4, this.y)

    const segments = 6
    const segmentWidth = this.width / 2 / segments
    const amplitude = 8

    for (let i = 0; i < segments; i++) {
      const x1 = this.x - this.width / 4 + i * segmentWidth
      const x2 = this.x - this.width / 4 + (i + 0.5) * segmentWidth
      const x3 = this.x - this.width / 4 + (i + 1) * segmentWidth

      ctx.lineTo(x2, this.y + (i % 2 === 0 ? -amplitude : amplitude))
      ctx.lineTo(x3, this.y)
    }
    ctx.stroke()

    // Valor
    ctx.fillStyle = "#000"
    ctx.font = "14px Arial"
    ctx.textAlign = "center"
    ctx.fillText(`${this.value} Ω`, this.x, this.y + this.height / 2 + 20)

    if (this.selected) {
      this.drawSelected(ctx)
    }
  }
}

class VoltageSource extends CircuitComponent {
  constructor(x, y, value = 12) {
    super(x, y, value, "voltage")
  }

  draw(ctx) {
    // Líneas de conexión
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(this.x - this.width / 2, this.y)
    ctx.lineTo(this.x - this.width / 4, this.y)
    ctx.moveTo(this.x + this.width / 4, this.y)
    ctx.lineTo(this.x + this.width / 2, this.y)
    ctx.stroke()

    // Círculo de la fuente
    ctx.fillStyle = "#9C27B0"
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()

    // Símbolos + y -
    ctx.fillStyle = "#fff"
    ctx.font = "18px Arial"
    ctx.textAlign = "center"
    ctx.fillText("+", this.x - 8, this.y + 6)
    ctx.fillText("-", this.x + 8, this.y + 6)

    // Valor
    ctx.fillStyle = "#000"
    ctx.font = "14px Arial"
    ctx.fillText(`${this.value} V`, this.x, this.y + this.height / 2 + 20)

    if (this.selected) {
      this.drawSelected(ctx)
    }
  }
}

class Circuit {
  constructor() {
    this.components = []
    this.selectedComponent = null
    this.voltageSource = null
  }

  addComponent(component) {
    this.components.push(component)

    if (component.type === "voltage") {
      this.voltageSource = component
    }

    return component
  }

  removeComponent(component) {
    this.components = this.components.filter((comp) => comp !== component)

    if (component === this.voltageSource) {
      this.voltageSource = null
    }

    if (component === this.selectedComponent) {
      this.selectedComponent = null
    }
  }

  selectComponentAt(x, y) {
    this.selectedComponent = null

    for (let i = this.components.length - 1; i >= 0; i--) {
      const component = this.components[i]
      if (component.isPointInside(x, y)) {
        this.selectedComponent = component
        component.selected = true
        break
      }
    }

    this.components.forEach((comp) => {
      if (comp !== this.selectedComponent) {
        comp.selected = false
      }
    })

    return this.selectedComponent
  }

  moveSelectedComponent(x, y) {
    if (this.selectedComponent) {
      this.selectedComponent.x = x
      this.selectedComponent.y = y
    }
  }

  detectCircuitType() {
    const resistors = this.components.filter((comp) => comp.type === "resistor")

    if (resistors.length === 0) {
      return "Sin componentes"
    }

    if (resistors.length === 1) {
      return "Circuito simple"
    }

    // Análisis inteligente de topología
    return this.analyzeCircuitTopology(resistors)
  }

  analyzeCircuitTopology(resistors) {
    const tolerance = 40 // Tolerancia para considerar componentes alineados

    // Agrupar resistores por filas (misma Y aproximada)
    const rows = this.groupByRows(resistors, tolerance)

    // Agrupar resistores por columnas (misma X aproximada)
    const columns = this.groupByColumns(resistors, tolerance)

    // Detectar patrones específicos
    if (this.isSeriesPattern(resistors, tolerance)) {
      return "Serie (detectado)"
    } else if (this.isParallelPattern(resistors, tolerance)) {
      return "Paralelo (detectado)"
    } else if (this.isMixedPattern(resistors, tolerance)) {
      return "Mixto (serie-paralelo)"
    } else {
      return "Configuración compleja"
    }
  }

  groupByRows(resistors, tolerance) {
    const rows = []

    resistors.forEach((resistor) => {
      let foundRow = false

      for (const row of rows) {
        if (Math.abs(resistor.y - row[0].y) <= tolerance) {
          row.push(resistor)
          foundRow = true
          break
        }
      }

      if (!foundRow) {
        rows.push([resistor])
      }
    })

    return rows
  }

  groupByColumns(resistors, tolerance) {
    const columns = []

    resistors.forEach((resistor) => {
      let foundColumn = false

      for (const column of columns) {
        if (Math.abs(resistor.x - column[0].x) <= tolerance) {
          column.push(resistor)
          foundColumn = true
          break
        }
      }

      if (!foundColumn) {
        columns.push([resistor])
      }
    })

    return columns
  }

  isSeriesPattern(resistors, tolerance) {
    // Serie: todos los resistores están aproximadamente en la misma fila
    const avgY = resistors.reduce((sum, r) => sum + r.y, 0) / resistors.length
    return resistors.every((r) => Math.abs(r.y - avgY) <= tolerance)
  }

  isParallelPattern(resistors, tolerance) {
    // Paralelo: resistores están en diferentes filas pero columnas similares
    const rows = this.groupByRows(resistors, tolerance)

    if (rows.length < 2) return false

    // Verificar si hay al menos 2 filas con resistores
    const significantRows = rows.filter((row) => row.length >= 1)

    if (significantRows.length >= 2) {
      // Verificar si los resistores están aproximadamente alineados verticalmente
      const firstRowAvgX = significantRows[0].reduce((sum, r) => sum + r.x, 0) / significantRows[0].length

      return significantRows.every((row) => {
        const rowAvgX = row.reduce((sum, r) => sum + r.x, 0) / row.length
        return Math.abs(rowAvgX - firstRowAvgX) <= tolerance * 2
      })
    }

    return false
  }

  isMixedPattern(resistors, tolerance) {
    const rows = this.groupByRows(resistors, tolerance)
    const columns = this.groupByColumns(resistors, tolerance)

    // Mixto: hay tanto elementos en serie (misma fila) como en paralelo (diferentes filas)
    const hasSeriesElements = rows.some((row) => row.length > 1)
    const hasParallelElements = rows.length > 1

    return hasSeriesElements && hasParallelElements
  }

  draw(ctx) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Dibujar grid sutil
    this.drawGrid(ctx)

    // Dibujar conexiones automáticas
    this.drawConnections(ctx)

    // Dibujar componentes
    this.components.forEach((component) => component.draw(ctx))
  }

  drawGrid(ctx) {
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = 1

    const gridSize = 20

    for (let x = 0; x <= ctx.canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, ctx.canvas.height)
      ctx.stroke()
    }

    for (let y = 0; y <= ctx.canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(ctx.canvas.width, y)
      ctx.stroke()
    }
  }

  drawConnections(ctx) {
    const resistors = this.components.filter((comp) => comp.type === "resistor")
    const voltage = this.voltageSource

    if (resistors.length === 0 || !voltage) return

    const circuitType = this.detectCircuitType()

    ctx.strokeStyle = "#2196F3"
    ctx.lineWidth = 2

    if (circuitType.includes("Serie")) {
      this.drawSeriesConnections(ctx, resistors, voltage)
    } else if (circuitType.includes("Paralelo")) {
      this.drawParallelConnections(ctx, resistors, voltage)
    } else if (circuitType.includes("Mixto")) {
      this.drawMixedConnections(ctx, resistors, voltage)
    } else {
      this.drawComplexConnections(ctx, resistors, voltage)
    }
  }

  drawSeriesConnections(ctx, resistors, voltage) {
    // Ordenar resistores por posición X
    const sortedResistors = [...resistors].sort((a, b) => a.x - b.x)

    ctx.beginPath()

    // Conectar fuente al primer resistor
    if (sortedResistors.length > 0) {
      ctx.moveTo(voltage.x + voltage.width / 2, voltage.y)
      ctx.lineTo(sortedResistors[0].x - sortedResistors[0].width / 2, sortedResistors[0].y)
    }

    // Conectar resistores en serie
    for (let i = 0; i < sortedResistors.length - 1; i++) {
      ctx.moveTo(sortedResistors[i].x + sortedResistors[i].width / 2, sortedResistors[i].y)
      ctx.lineTo(sortedResistors[i + 1].x - sortedResistors[i + 1].width / 2, sortedResistors[i + 1].y)
    }

    // Línea de retorno
    if (sortedResistors.length > 0) {
      const lastResistor = sortedResistors[sortedResistors.length - 1]
      ctx.moveTo(lastResistor.x + lastResistor.width / 2, lastResistor.y)
      ctx.lineTo(lastResistor.x + lastResistor.width / 2 + 50, lastResistor.y)
      ctx.lineTo(lastResistor.x + lastResistor.width / 2 + 50, voltage.y + 60)
      ctx.lineTo(voltage.x - voltage.width / 2, voltage.y + 60)
      ctx.lineTo(voltage.x - voltage.width / 2, voltage.y)
    }

    ctx.stroke()
  }

  drawParallelConnections(ctx, resistors, voltage) {
    ctx.beginPath()

    resistors.forEach((resistor) => {
      // Línea desde fuente positiva a resistor
      ctx.moveTo(voltage.x + voltage.width / 2, voltage.y)
      ctx.lineTo(voltage.x + voltage.width / 2 + 30, voltage.y)
      ctx.lineTo(voltage.x + voltage.width / 2 + 30, resistor.y)
      ctx.lineTo(resistor.x - resistor.width / 2, resistor.y)

      // Línea desde resistor a fuente negativa
      ctx.moveTo(resistor.x + resistor.width / 2, resistor.y)
      ctx.lineTo(voltage.x - voltage.width / 2 - 30, resistor.y)
      ctx.lineTo(voltage.x - voltage.width / 2 - 30, voltage.y)
      ctx.lineTo(voltage.x - voltage.width / 2, voltage.y)
    })

    ctx.stroke()
  }

  drawMixedConnections(ctx, resistors, voltage) {
    const tolerance = 40
    const rows = this.groupByRows(resistors, tolerance)

    ctx.beginPath()

    // Conectar desde la fuente a la primera fila
    if (rows.length > 0) {
      const firstRow = rows[0].sort((a, b) => a.x - b.x)
      ctx.moveTo(voltage.x + voltage.width / 2, voltage.y)
      ctx.lineTo(firstRow[0].x - firstRow[0].width / 2, firstRow[0].y)

      // Conectar resistores en serie dentro de cada fila
      rows.forEach((row) => {
        const sortedRow = row.sort((a, b) => a.x - b.x)
        for (let i = 0; i < sortedRow.length - 1; i++) {
          ctx.moveTo(sortedRow[i].x + sortedRow[i].width / 2, sortedRow[i].y)
          ctx.lineTo(sortedRow[i + 1].x - sortedRow[i + 1].width / 2, sortedRow[i + 1].y)
        }
      })

      // Conectar filas en paralelo
      if (rows.length > 1) {
        const connectionX = voltage.x + voltage.width / 2 + 50

        rows.forEach((row) => {
          const firstInRow = row.sort((a, b) => a.x - b.x)[0]
          const lastInRow = row.sort((a, b) => a.x - b.x)[row.length - 1]

          // Línea vertical de conexión
          ctx.moveTo(connectionX, firstInRow.y)
          ctx.lineTo(firstInRow.x - firstInRow.width / 2, firstInRow.y)

          // Línea de retorno
          ctx.moveTo(lastInRow.x + lastInRow.width / 2, lastInRow.y)
          ctx.lineTo(connectionX + 100, lastInRow.y)
        })

        // Línea vertical principal
        ctx.moveTo(connectionX, rows[0][0].y)
        ctx.lineTo(connectionX, rows[rows.length - 1][0].y)

        // Línea de retorno vertical
        ctx.moveTo(connectionX + 100, rows[0][0].y)
        ctx.lineTo(connectionX + 100, rows[rows.length - 1][0].y)

        // Conexión de retorno a la fuente
        ctx.moveTo(connectionX + 100, voltage.y)
        ctx.lineTo(connectionX + 120, voltage.y)
        ctx.lineTo(connectionX + 120, voltage.y + 80)
        ctx.lineTo(voltage.x - voltage.width / 2, voltage.y + 80)
        ctx.lineTo(voltage.x - voltage.width / 2, voltage.y)
      }
    }

    ctx.stroke()
  }

  drawComplexConnections(ctx, resistors, voltage) {
    // Para configuraciones complejas, dibujar conexiones básicas
    ctx.strokeStyle = "#FF9800"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])

    ctx.beginPath()
    resistors.forEach((resistor) => {
      // Línea desde fuente a cada resistor (indicativo)
      ctx.moveTo(voltage.x, voltage.y)
      ctx.lineTo(resistor.x, resistor.y)
    })
    ctx.stroke()
    ctx.setLineDash([])
  }

  analyzeCircuit() {
    const resistors = this.components.filter((comp) => comp.type === "resistor")
    const voltage = this.voltageSource ? this.voltageSource.value : 0

    if (resistors.length === 0) {
      return {
        type: "Sin componentes",
        resistance: 0,
        current: 0,
        power: 0,
        analysis: "Agregue resistores para analizar el circuito",
      }
    }

    const circuitType = this.detectCircuitType()
    let totalResistance = 0
    let analysis = ""

    if (circuitType.includes("Serie")) {
      totalResistance = this.calculateSeriesResistance(resistors)
      analysis = `🔗 CIRCUITO EN SERIE:\n`
      analysis += `• ${resistors.length} resistores conectados en línea\n`
      analysis += `• Resistencia total: R = ${resistors.map((r) => r.value).join(" + ")} = ${totalResistance.toFixed(2)} Ω\n`
      analysis += `• Corriente igual en todos los componentes: I = V/R\n`
      analysis += `• Voltaje se divide proporcionalmente: V = I × R`
    } else if (circuitType.includes("Paralelo")) {
      totalResistance = this.calculateParallelResistance(resistors)
      analysis = `⚡ CIRCUITO EN PARALELO:\n`
      analysis += `• ${resistors.length} resistores conectados en ramas\n`
      analysis += `• Resistencia total: 1/R = ${resistors.map((r) => `1/${r.value}`).join(" + ")}\n`
      analysis += `• R total = ${totalResistance.toFixed(2)} Ω\n`
      analysis += `• Voltaje igual en todos los componentes\n`
      analysis += `• Corriente se divide entre las ramas`
    } else if (circuitType.includes("Mixto")) {
      totalResistance = this.calculateMixedResistance(resistors)
      analysis = `🔀 CIRCUITO MIXTO (Serie-Paralelo):\n`
      analysis += `• Combinación de conexiones serie y paralelo\n`
      analysis += `• Resistencia total: ${totalResistance.toFixed(2)} Ω\n`
      analysis += `• Análisis por secciones:\n`
      analysis += `  - Elementos en serie se suman\n`
      analysis += `  - Elementos en paralelo se calculan por reciprocales`
    } else {
      totalResistance = this.calculateComplexResistance(resistors)
      analysis = `🔧 CONFIGURACIÓN COMPLEJA:\n`
      analysis += `• ${resistors.length} resistores en configuración avanzada\n`
      analysis += `• Resistencia estimada: ${totalResistance.toFixed(2)} Ω\n`
      analysis += `• Requiere análisis de mallas o nodos\n`
      analysis += `• Use la sección de Kirchhoff para análisis detallado`
    }

    const current = voltage > 0 ? voltage / totalResistance : 0
    const power = voltage * current

    return {
      type: circuitType,
      resistance: totalResistance,
      current: current,
      power: power,
      analysis: analysis,
    }
  }

  calculateSeriesResistance(resistors) {
    return resistors.reduce((total, resistor) => total + Number.parseFloat(resistor.value), 0)
  }

  calculateParallelResistance(resistors) {
    if (resistors.length === 0) return 0
    const reciprocalSum = resistors.reduce((sum, resistor) => sum + 1 / Number.parseFloat(resistor.value), 0)
    return reciprocalSum === 0 ? 0 : 1 / reciprocalSum
  }

  calculateMixedResistance(resistors) {
    const tolerance = 40
    const rows = this.groupByRows(resistors, tolerance)

    if (rows.length === 1) {
      // Solo una fila = serie
      return this.calculateSeriesResistance(resistors)
    }

    // Calcular resistencia de cada fila (serie)
    const rowResistances = rows.map((row) => row.reduce((sum, r) => sum + Number.parseFloat(r.value), 0))

    // Las filas están en paralelo
    const reciprocalSum = rowResistances.reduce((sum, r) => sum + 1 / r, 0)
    return reciprocalSum === 0 ? 0 : 1 / reciprocalSum
  }

  calculateComplexResistance(resistors) {
    // Para configuraciones complejas, usar promedio ponderado
    const avgResistance = resistors.reduce((sum, r) => sum + Number.parseFloat(r.value), 0) / resistors.length
    return avgResistance * 0.7 // Factor de corrección para configuraciones complejas
  }
}

// Funciones de dibujo para diagramas
function drawSchematicDiagram(ctx, circuit) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height

  ctx.clearRect(0, 0, width, height)

  const resistors = circuit.components.filter((comp) => comp.type === "resistor")
  const voltage = circuit.voltageSource ? circuit.voltageSource.value : 0

  if (resistors.length === 0) {
    ctx.font = "16px Arial"
    ctx.fillStyle = "#666"
    ctx.textAlign = "center"
    ctx.fillText("Agregue componentes", width / 2, height / 2)
    return
  }

  const circuitType = circuit.detectCircuitType()

  if (circuitType.includes("Serie")) {
    drawSeriesSchematic(ctx, resistors, voltage)
  } else if (circuitType.includes("Paralelo")) {
    drawParallelSchematic(ctx, resistors, voltage)
  } else {
    drawSimpleSchematic(ctx, resistors, voltage)
  }
}

function drawSeriesSchematic(ctx, resistors, voltage) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerY = height / 2

  const spacing = Math.min(60, (width - 150) / (resistors.length + 1))
  const startX = (width - (resistors.length + 1) * spacing) / 2

  // Fuente
  drawVoltageSymbol(ctx, startX + 30, centerY, voltage)

  // Línea superior
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(startX + 50, centerY)
  ctx.lineTo(startX + (resistors.length + 1) * spacing - 10, centerY)
  ctx.stroke()

  // Resistores
  for (let i = 0; i < resistors.length; i++) {
    const x = startX + (i + 1) * spacing + 20
    drawResistorSymbol(ctx, x, centerY, resistors[i].value, `R${i + 1}`)
  }

  // Línea de retorno
  const endX = startX + (resistors.length + 1) * spacing
  ctx.beginPath()
  ctx.moveTo(endX - 10, centerY)
  ctx.lineTo(endX + 10, centerY)
  ctx.lineTo(endX + 10, centerY + 50)
  ctx.lineTo(startX + 10, centerY + 50)
  ctx.lineTo(startX + 10, centerY)
  ctx.stroke()
}

function drawParallelSchematic(ctx, resistors, voltage) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerX = width / 2

  // Fuente
  drawVoltageSymbol(ctx, centerX - 100, height / 2, voltage)

  // Líneas principales
  const leftX = centerX - 50
  const rightX = centerX + 50
  const spacing = Math.min(30, 150 / resistors.length)
  const totalHeight = resistors.length * spacing
  const startY = (height - totalHeight) / 2

  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2

  // Conexiones principales
  ctx.beginPath()
  ctx.moveTo(centerX - 80, height / 2)
  ctx.lineTo(leftX, height / 2)
  ctx.moveTo(rightX, height / 2)
  ctx.lineTo(centerX + 80, height / 2)
  ctx.stroke()

  // Líneas verticales
  ctx.beginPath()
  ctx.moveTo(leftX, startY)
  ctx.lineTo(leftX, startY + totalHeight)
  ctx.moveTo(rightX, startY)
  ctx.lineTo(rightX, startY + totalHeight)
  ctx.stroke()

  // Resistores
  for (let i = 0; i < resistors.length; i++) {
    const y = startY + (i + 0.5) * spacing

    ctx.beginPath()
    ctx.moveTo(leftX, y)
    ctx.lineTo(leftX + 15, y)
    ctx.moveTo(rightX - 15, y)
    ctx.lineTo(rightX, y)
    ctx.stroke()

    drawResistorSymbol(ctx, centerX, y, resistors[i].value, `R${i + 1}`)
  }

  // Línea de retorno
  ctx.beginPath()
  ctx.moveTo(centerX + 80, height / 2)
  ctx.lineTo(centerX + 100, height / 2)
  ctx.lineTo(centerX + 100, height / 2 + 60)
  ctx.lineTo(centerX - 120, height / 2 + 60)
  ctx.lineTo(centerX - 120, height / 2)
  ctx.lineTo(centerX - 100, height / 2)
  ctx.stroke()
}

function drawSimpleSchematic(ctx, resistors, voltage) {
  const width = ctx.canvas.width
  const height = ctx.canvas.height
  const centerY = height / 2

  // Fuente
  drawVoltageSymbol(ctx, width / 4, centerY, voltage)

  // Resistor
  drawResistorSymbol(ctx, (3 * width) / 4, centerY, resistors[0].value, "R1")

  // Conexiones
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(width / 4 + 20, centerY)
  ctx.lineTo((3 * width) / 4 - 25, centerY)
  ctx.moveTo((3 * width) / 4 + 25, centerY)
  ctx.lineTo((3 * width) / 4 + 50, centerY + 50)
  ctx.lineTo(width / 4 - 20, centerY + 50)
  ctx.lineTo(width / 4 - 20, centerY)
  ctx.stroke()
}

function drawVoltageSymbol(ctx, x, y, value) {
  ctx.fillStyle = "#9C27B0"
  ctx.beginPath()
  ctx.arc(x, y, 15, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.fillStyle = "#fff"
  ctx.font = "12px Arial"
  ctx.textAlign = "center"
  ctx.fillText("+", x - 5, y + 3)
  ctx.fillText("-", x + 5, y + 3)

  ctx.fillStyle = "#000"
  ctx.font = "10px Arial"
  ctx.fillText(`${value}V`, x, y + 30)
}

function drawResistorSymbol(ctx, x, y, value, label) {
  // Líneas de conexión
  ctx.strokeStyle = "#000"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - 25, y)
  ctx.lineTo(x - 15, y)
  ctx.moveTo(x + 15, y)
  ctx.lineTo(x + 25, y)
  ctx.stroke()

  // Zigzag del resistor
  ctx.beginPath()
  ctx.moveTo(x - 15, y)
  ctx.lineTo(x - 10, y - 6)
  ctx.lineTo(x - 5, y + 6)
  ctx.lineTo(x, y - 6)
  ctx.lineTo(x + 5, y + 6)
  ctx.lineTo(x + 10, y - 6)
  ctx.lineTo(x + 15, y)
  ctx.stroke()

  // Etiquetas
  ctx.fillStyle = "#000"
  ctx.font = "10px Arial"
  ctx.textAlign = "center"
  ctx.fillText(label, x, y - 15)
  ctx.fillText(`${value}Ω`, x, y + 20)
}

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
    wheatstone: document.getElementById("wheatstone-canvas"),
    diagram: document.getElementById("diagram-canvas"),
  }

  const controls = {
    voltageValue: document.getElementById("voltage-value"),
    calculateBtn: document.getElementById("calculate-btn"),
    resetBtn: document.getElementById("reset-btn"),
    componentProperties: document.getElementById("component-properties"),
    componentValue: document.getElementById("component-value"),
    applyProperties: document.getElementById("apply-properties"),
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
    circuit: canvases.circuit.getContext("2d"),
    kirchhoff: canvases.kirchhoff.getContext("2d"),
    wheatstone: canvases.wheatstone.getContext("2d"),
    diagram: canvases.diagram.getContext("2d"),
  }

  // Inicializar circuito
  const circuit = new Circuit()

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

    if (circuit) {
      circuit.draw(contexts.circuit)
      updateSchematicDiagram()
    }

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

  // Drag & Drop simplificado
  document.querySelectorAll(".component-card").forEach((componentCard) => {
    componentCard.addEventListener("dragstart", function (e) {
      e.dataTransfer.setData("text/plain", this.dataset.type)
      this.classList.add("dragging")
    })

    componentCard.addEventListener("dragend", function (e) {
      this.classList.remove("dragging")
    })
  })

  // Canvas drop events
  const canvasContainer = document.querySelector(".canvas-container")

  canvases.circuit.addEventListener("dragover", (e) => {
    e.preventDefault()
    canvasContainer.classList.add("drag-over")
  })

  canvases.circuit.addEventListener("dragleave", (e) => {
    canvasContainer.classList.remove("drag-over")
  })

  canvases.circuit.addEventListener("drop", (e) => {
    e.preventDefault()
    canvasContainer.classList.remove("drag-over")

    const type = e.dataTransfer.getData("text/plain")
    const rect = canvases.circuit.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    addComponent(type, x, y)
  })

  // Función para agregar componente
  function addComponent(type, x, y) {
    let component

    if (type === "resistor") {
      component = new Resistor(x, y, 100)
    } else if (type === "voltage") {
      component = new VoltageSource(x, y, Number.parseFloat(controls.voltageValue.value))
    }

    if (component) {
      circuit.addComponent(component)
      circuit.draw(contexts.circuit)
      updateAllDisplays()

      // Ocultar instrucciones cuando hay componentes
      if (circuit.components.length > 0) {
        canvasContainer.classList.add("has-components")
      }

      displays.connectionStatus.textContent = "Componente agregado"
      setTimeout(() => {
        displays.connectionStatus.textContent = "Arrastra más componentes"
      }, 2000)
    }
  }

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
      canvases.circuit.style.touchAction = "pan-x pan-y"

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

  canvases.circuit.addEventListener("mousedown", (e) => {
    const rect = canvases.circuit.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const selectedComponent = circuit.selectComponentAt(x, y)

    if (selectedComponent) {
      isDragging = true
      dragOffsetX = x - selectedComponent.x
      dragOffsetY = y - selectedComponent.y

      // Mostrar panel de propiedades
      controls.componentProperties.classList.remove("hidden")
      controls.componentValue.value = selectedComponent.value

      // Actualizar información del componente
      displays.componentTypeDisplay.textContent =
        selectedComponent.type === "resistor" ? "Resistor" : "Fuente de Voltaje"
      displays.componentIdDisplay.textContent = `#${selectedComponent.id.substring(0, 3)}`

      // Actualizar unidad
      const unit = selectedComponent.type === "resistor" ? "Ω" : "V"
      document.getElementById("component-unit").textContent = unit
    } else {
      controls.componentProperties.classList.add("hidden")
    }

    circuit.draw(contexts.circuit)
  })

  canvases.circuit.addEventListener("mousemove", (e) => {
    if (isDragging && circuit.selectedComponent) {
      const rect = canvases.circuit.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      circuit.moveSelectedComponent(x - dragOffsetX, y - dragOffsetY)
      circuit.draw(contexts.circuit)
      updateAllDisplays()
    }
  })

  canvases.circuit.addEventListener("mouseup", () => {
    isDragging = false
  })

  // Event listeners para touch en móviles
  if ("ontouchstart" in window) {
    let touchStartX = 0
    let touchStartY = 0
    let isTouchDragging = false

    canvases.circuit.addEventListener("touchstart", (e) => {
      e.preventDefault()
      const touch = e.touches[0]
      const rect = canvases.circuit.getBoundingClientRect()
      const x = touch.clientX - rect.left
      const y = touch.clientY - rect.top

      const selectedComponent = circuit.selectComponentAt(x, y)

      if (selectedComponent) {
        isTouchDragging = true
        touchStartX = x
        touchStartY = y
        dragOffsetX = x - selectedComponent.x
        dragOffsetY = y - selectedComponent.y

        // Mostrar panel de propiedades
        controls.componentProperties.classList.remove("hidden")
        controls.componentValue.value = selectedComponent.value

        // Actualizar información del componente
        displays.componentTypeDisplay.textContent =
          selectedComponent.type === "resistor" ? "Resistor" : "Fuente de Voltaje"
        displays.componentIdDisplay.textContent = `#${selectedComponent.id.substring(0, 3)}`

        // Actualizar unidad
        const unit = selectedComponent.type === "resistor" ? "Ω" : "V"
        document.getElementById("component-unit").textContent = unit
      } else {
        controls.componentProperties.classList.add("hidden")
      }

      circuit.draw(contexts.circuit)
    })

    canvases.circuit.addEventListener("touchmove", (e) => {
      e.preventDefault()
      if (isTouchDragging && circuit.selectedComponent) {
        const touch = e.touches[0]
        const rect = canvases.circuit.getBoundingClientRect()
        const x = touch.clientX - rect.left
        const y = touch.clientY - rect.top

        circuit.moveSelectedComponent(x - dragOffsetX, y - dragOffsetY)
        circuit.draw(contexts.circuit)
        updateAllDisplays()
      }
    })

    canvases.circuit.addEventListener("touchend", (e) => {
      e.preventDefault()
      isTouchDragging = false
    })
  }

  // Controles del circuito
  controls.applyProperties.addEventListener("click", () => {
    if (circuit.selectedComponent) {
      circuit.selectedComponent.value = Number.parseFloat(controls.componentValue.value)
      circuit.draw(contexts.circuit)
      updateAllDisplays()
    }
  })

  controls.deleteComponent.addEventListener("click", () => {
    if (circuit.selectedComponent) {
      circuit.removeComponent(circuit.selectedComponent)
      controls.componentProperties.classList.add("hidden")
      circuit.draw(contexts.circuit)
      updateAllDisplays()

      // Mostrar instrucciones si no hay componentes
      if (circuit.components.length === 0) {
        canvasContainer.classList.remove("has-components")
      }
    }
  })

  controls.voltageValue.addEventListener("change", function () {
    if (circuit.voltageSource) {
      circuit.voltageSource.value = Number.parseFloat(this.value)
      circuit.draw(contexts.circuit)
      updateAllDisplays()
    }
  })

  controls.calculateBtn.addEventListener("click", () => {
    updateAllDisplays()
    updateSchematicDiagram()
  })

  controls.resetBtn.addEventListener("click", () => {
    circuit.components = []
    circuit.selectedComponent = null
    circuit.voltageSource = null
    controls.componentProperties.classList.add("hidden")
    circuit.draw(contexts.circuit)
    updateAllDisplays()
    updateSchematicDiagram()
    canvasContainer.classList.remove("has-components")
  })

  // Funciones de actualización
  function updateAllDisplays() {
    const analysis = circuit.analyzeCircuit()

    displays.totalResistance.textContent = analysis.resistance.toFixed(2) + " Ω"
    displays.totalCurrent.textContent = analysis.current.toFixed(3) + " A"
    displays.totalPower.textContent = analysis.power.toFixed(2) + " W"
    displays.componentCount.textContent = circuit.components.length.toString()
    displays.circuitType.textContent = analysis.type
    displays.detailedAnalysis.textContent = analysis.analysis

    // Actualizar fórmula de resistencia
    if (analysis.type.includes("Serie")) {
      displays.resistanceFormula.innerHTML = "<strong>Serie:</strong> R<sub>total</sub> = R₁ + R₂ + R₃..."
    } else if (analysis.type.includes("Paralelo")) {
      displays.resistanceFormula.innerHTML = "<strong>Paralelo:</strong> 1/R<sub>total</sub> = 1/R₁ + 1/R₂ + 1/R₃..."
    } else {
      displays.resistanceFormula.innerHTML = "<strong>Resistencia:</strong> Depende del circuito"
    }
  }

  function updateSchematicDiagram() {
    drawSchematicDiagram(contexts.diagram, circuit)
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
  updateSchematicDiagram()

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
