/**
 * Definición de componentes para el simulador de circuitos
 */

// Clase base para todos los componentes
class CircuitComponent {
  constructor(x, y, value) {
    this.x = x
    this.y = y
    this.value = value
    this.selected = false
    this.width = 80
    this.height = 40
    this.connections = { start: null, end: null }
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

  getConnectionPoints() {
    return {
      start: { x: this.x - this.width / 2, y: this.y },
      end: { x: this.x + this.width / 2, y: this.y },
    }
  }

  draw(ctx) {
    // Método a implementar en las clases hijas
  }

  drawSelected(ctx) {
    ctx.strokeStyle = "#3498db"
    ctx.lineWidth = 2
    ctx.setLineDash([5, 3])
    ctx.strokeRect(this.x - this.width / 2 - 5, this.y - this.height / 2 - 5, this.width + 10, this.height + 10)
    ctx.setLineDash([])
  }
}

// Clase para resistores
class Resistor extends CircuitComponent {
  constructor(x, y, value = 100) {
    super(x, y, value)
    this.type = "resistor"
  }

  draw(ctx) {
    // Dibujar líneas de conexión
    ctx.beginPath()
    ctx.moveTo(this.x - this.width / 2, this.y)
    ctx.lineTo(this.x - this.width / 4, this.y)
    ctx.moveTo(this.x + this.width / 4, this.y)
    ctx.lineTo(this.x + this.width / 2, this.y)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.stroke()

    // Dibujar el cuerpo del resistor
    ctx.beginPath()
    ctx.rect(this.x - this.width / 4, this.y - this.height / 4, this.width / 2, this.height / 2)
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
    ctx.fillText(`${this.value} Ω`, this.x, this.y + this.height / 2 + 15)

    // Si está seleccionado, dibujar el borde de selección
    if (this.selected) {
      this.drawSelected(ctx)
    }
  }
}

// Clase para fuentes de voltaje
class VoltageSource extends CircuitComponent {
  constructor(x, y, value = 12) {
    super(x, y, value)
    this.type = "voltage"
  }

  draw(ctx) {
    // Dibujar líneas de conexión
    ctx.beginPath()
    ctx.moveTo(this.x - this.width / 2, this.y)
    ctx.lineTo(this.x - this.width / 4, this.y)
    ctx.moveTo(this.x + this.width / 4, this.y)
    ctx.lineTo(this.x + this.width / 2, this.y)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.stroke()

    // Dibujar el círculo de la fuente
    ctx.beginPath()
    ctx.arc(this.x, this.y, this.width / 4, 0, Math.PI * 2)
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
    ctx.fillText("+", this.x - 8, this.y)
    ctx.fillText("-", this.x + 8, this.y)

    // Dibujar el valor
    ctx.font = "12px Arial"
    ctx.fillStyle = "#000"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText(`${this.value} V`, this.x, this.y + this.height / 2 + 15)

    // Si está seleccionado, dibujar el borde de selección
    if (this.selected) {
      this.drawSelected(ctx)
    }
  }
}

// Clase para conexiones entre componentes
class Connection {
  constructor(startComponent, endComponent, startPoint, endPoint) {
    this.startComponent = startComponent
    this.endComponent = endComponent
    this.startPoint = startPoint // 'start' o 'end'
    this.endPoint = endPoint // 'start' o 'end'
    this.id = Math.random().toString(36).substr(2, 9)
  }

  draw(ctx) {
    const start = this.startComponent.getConnectionPoints()[this.startPoint]
    const end = this.endComponent.getConnectionPoints()[this.endPoint]

    ctx.beginPath()
    ctx.moveTo(start.x, start.y)

    // Si es una conexión en serie, línea directa
    if (this.startPoint !== this.endPoint) {
      ctx.lineTo(end.x, end.y)
    }
    // Si es una conexión en paralelo, crear un camino con curvas
    else {
      const midX = (start.x + end.x) / 2
      const offset = 40 // Desplazamiento para la curva

      if (this.startPoint === "start") {
        ctx.bezierCurveTo(start.x - offset, start.y, end.x - offset, end.y, end.x, end.y)
      } else {
        ctx.bezierCurveTo(start.x + offset, start.y, end.x + offset, end.y, end.x, end.y)
      }
    }

    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.stroke()
  }
}

// Clase para el circuito completo
class Circuit {
  constructor() {
    this.components = []
    this.connections = []
    this.selectedComponent = null
    this.connectionType = "series" // 'series' o 'parallel'
    this.voltageSource = null
  }

  addComponent(component) {
    this.components.push(component)

    // Si es una fuente de voltaje, la guardamos como referencia
    if (component.type === "voltage") {
      this.voltageSource = component
    }

    return component
  }

  removeComponent(component) {
    // Eliminar todas las conexiones asociadas a este componente
    this.connections = this.connections.filter(
      (conn) => conn.startComponent !== component && conn.endComponent !== component,
    )

    // Eliminar el componente
    this.components = this.components.filter((comp) => comp !== component)

    // Si era la fuente de voltaje, resetear la referencia
    if (component === this.voltageSource) {
      this.voltageSource = null
    }

    // Si era el componente seleccionado, deseleccionar
    if (component === this.selectedComponent) {
      this.selectedComponent = null
    }
  }

  selectComponentAt(x, y) {
    this.selectedComponent = null

    // Recorremos los componentes en orden inverso para seleccionar el que está encima
    for (let i = this.components.length - 1; i >= 0; i--) {
      const component = this.components[i]
      if (component.isPointInside(x, y)) {
        this.selectedComponent = component
        component.selected = true
        break
      }
    }

    // Deseleccionar todos los demás componentes
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

  connectComponents() {
    // Limpiar conexiones existentes
    this.connections = []

    // Filtrar solo resistores
    const resistors = this.components.filter((comp) => comp.type === "resistor")

    // Si no hay resistores o fuente de voltaje, no hay nada que conectar
    if (resistors.length === 0 || !this.voltageSource) return

    if (this.connectionType === "series") {
      this.createSeriesConnections(resistors)
    } else {
      this.createParallelConnections(resistors)
    }
  }

  createSeriesConnections(resistors) {
    // Ordenar resistores por posición x
    resistors.sort((a, b) => a.x - b.x)

    // Conectar la fuente al primer resistor
    this.connections.push(new Connection(this.voltageSource, resistors[0], "end", "start"))

    // Conectar resistores en serie
    for (let i = 0; i < resistors.length - 1; i++) {
      this.connections.push(new Connection(resistors[i], resistors[i + 1], "end", "start"))
    }

    // Conectar el último resistor a la fuente
    this.connections.push(new Connection(resistors[resistors.length - 1], this.voltageSource, "end", "start"))
  }

  createParallelConnections(resistors) {
    // Conectar cada resistor directamente a la fuente
    resistors.forEach((resistor) => {
      // Conectar inicio del resistor al inicio de la fuente
      this.connections.push(new Connection(resistor, this.voltageSource, "start", "start"))

      // Conectar fin del resistor al fin de la fuente
      this.connections.push(new Connection(resistor, this.voltageSource, "end", "end"))
    })
  }

  draw(ctx) {
    // Limpiar el canvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)

    // Dibujar conexiones
    this.connections.forEach((connection) => connection.draw(ctx))

    // Dibujar componentes
    this.components.forEach((component) => component.draw(ctx))
  }
}
