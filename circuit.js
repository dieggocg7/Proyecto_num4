const canvas = document.getElementById("circuit-canvas")
const ctx = canvas.getContext("2d")
const gridSize = 20
const components = []
const connections = []
let selected = null, dragging = false, dx = 0, dy = 0
let hoverComponent = null, hoverNodes = []
let nodeStart = null
let hoveredConnection = null

const propPanel = document.getElementById("component-properties")
const valueInput = document.getElementById("component-value")
const typeDisplay = document.getElementById("component-type-display")
const unitDisplay = document.getElementById("component-unit")
const canvasContainer = document.getElementById("canvas-container")
const componentCount = document.getElementById("component-count")
const rotateBtn = document.getElementById("rotate-btn")
const detailedAnalysis = document.getElementById("detailed-analysis")

rotateBtn.addEventListener("click", () => {
    if (selected) {
        selected.rotation = (selected.rotation + 90) % 180
        drawAll()
    }
})

function snapToGrid(value) {
    return Math.round(value / gridSize) * gridSize
}

function updateInstructionsVisibility() {
    canvasContainer.classList.toggle("has-components", components.length > 0)
}

function addComponent(type, x, y) {
    const value = (type === "resistor") ? 100 : 12
    const idPrefix = type === "resistor" ? "R" : "V"
    const component = { id: idPrefix + (components.length + 1), type, x: snapToGrid(x), y: snapToGrid(y), value, rotation: 0, selected: false }
    components.push(component)
    drawAll()
    updateAnalysis()
    updateInstructionsVisibility()
}

function getNodePosition(component, side) {
    const angle = (component.rotation || 0) * Math.PI / 180
    const baseOffset = { x: (side === 'A' ? -40 : 40), y: 0 }
    const rotatedOffset = {
        x: Math.cos(angle) * baseOffset.x - Math.sin(angle) * baseOffset.y,
        y: Math.sin(angle) * baseOffset.x + Math.cos(angle) * baseOffset.y
    }
    return {
        x: component.x + rotatedOffset.x,
        y: component.y + rotatedOffset.y
    }
}

document.querySelectorAll(".component-card").forEach(card => {
    card.addEventListener("dragstart", e => {
        e.dataTransfer.setData("type", card.dataset.type)
    })
})

canvas.addEventListener("dragover", e => e.preventDefault())
canvas.addEventListener("drop", e => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const type = e.dataTransfer.getData("type")
    addComponent(type, x, y)
})

canvas.addEventListener("mousedown", e => {
    const { x, y } = getPos(e)

    const clickedNode = hoverNodes.find(n => Math.hypot(n.x - x, n.y - y) < 6)

    if (!clickedNode && hoveredConnection) {
        const index = connections.indexOf(hoveredConnection)
        if (index !== -1) {
            connections.splice(index, 1)
            hoveredConnection = null
            drawAll()
            return
        }
    }

    if (clickedNode) {
        if (!nodeStart) {
            nodeStart = clickedNode
        } else {
            if (nodeStart.id !== clickedNode.id) {

                const alreadyExists = connections.some(conn => {
                    return (conn.from.id === nodeStart.id && conn.to.id === clickedNode.id) ||
                        (conn.from.id === clickedNode.id && conn.to.id === nodeStart.id)
                })
                if (!alreadyExists) {
                    connections.push({ from: nodeStart, to: clickedNode })
                }
            }
            nodeStart = null
            drawAll()
            console.log("Conexiones actuales:", connections)
        }
        return
    }

    selected = null
    components.forEach(c => c.selected = false)
    for (let i = components.length - 1; i >= 0; i--) {
        const c = components[i]
        ctx.save()
        ctx.translate(c.x, c.y)
        ctx.rotate((c.rotation || 0) * Math.PI / 180)
        const local = {
            x: Math.cos(-c.rotation * Math.PI / 180) * (x - c.x) - Math.sin(-c.rotation * Math.PI / 180) * (y - c.y),
            y: Math.sin(-c.rotation * Math.PI / 180) * (x - c.x) + Math.cos(-c.rotation * Math.PI / 180) * (y - c.y)
        }
        ctx.restore()
        if (Math.abs(local.x) < 40 && Math.abs(local.y) < 20) {
            selected = c
            c.selected = true
            dx = local.x
            dy = local.y
            propPanel.classList.remove("hidden")
            valueInput.value = c.value
            typeDisplay.textContent = c.type === "resistor" ? "Resistor" : "Fuente de Voltaje"
            unitDisplay.textContent = c.type === "resistor" ? "Ω" : "V"
            break
        }
    }
    if (!selected) propPanel.classList.add("hidden")
    dragging = !!selected
    drawAll()


})

canvas.addEventListener("contextmenu", e => e.preventDefault())

canvas.addEventListener("mousemove", e => {
    const { x, y } = getPos(e)
    hoverComponent = null
    hoverNodes = []
    hoveredConnection = null

    for (let c of components) {
        if (Math.abs(c.x - x) < 50 && Math.abs(c.y - y) < 50) {
            hoverComponent = c
            hoverNodes = ['A', 'B'].map(side => {
                const pos = getNodePosition(c, side)
                return { x: pos.x, y: pos.y, id: c.id + '-' + side }
            })
            break
        }
    }

    for (let conn of connections) {
        const fromComp = components.find(c => conn.from.id.startsWith(c.id))
        const toComp = components.find(c => conn.to.id.startsWith(c.id))
        if (!fromComp || !toComp) continue

        const from = getNodePosition(fromComp, conn.from.id.endsWith("A") ? 'A' : 'B')
        const to = getNodePosition(toComp, conn.to.id.endsWith("A") ? 'A' : 'B')

        
        const mid = { x: from.x, y: to.y } // punto de quiebre en forma de L
        const distToHoriz = Math.abs((mid.y - from.y) * x - (mid.x - from.x) * y + mid.x * from.y - mid.y * from.x) / Math.hypot(mid.y - from.y, mid.x - from.x)
        const distToVert = Math.abs((to.y - mid.y) * x - (to.x - mid.x) * y + to.x * mid.y - to.y * mid.x) / Math.hypot(to.y - mid.y, to.x - mid.x)

        const isNearHoriz = distToHoriz < 10 && Math.min(from.x, mid.x) - 5 <= x && x <= Math.max(from.x, mid.x) + 5 && Math.min(from.y, mid.y) - 5 <= y && y <= Math.max(from.y, mid.y) + 5
        const isNearVert = distToVert < 10 && Math.min(mid.x, to.x) - 5 <= x && x <= Math.max(mid.x, to.x) + 5 && Math.min(mid.y, to.y) - 5 <= y && y <= Math.max(mid.y, to.y) + 5

        if (isNearHoriz || isNearVert) {
            hoveredConnection = conn
            break
        }

    }

    if (dragging && selected) {
        selected.x = snapToGrid(x - Math.cos(selected.rotation * Math.PI / 180) * dx + Math.sin(selected.rotation * Math.PI / 180) * dy)
        selected.y = snapToGrid(y - Math.sin(selected.rotation * Math.PI / 180) * dx - Math.cos(selected.rotation * Math.PI / 180) * dy)
        drawAll()
        updateAnalysis()
    } else {
        drawAll()
    }
})

canvas.addEventListener("mouseup", () => dragging = false)

function getPos(e) {
    const rect = canvas.getBoundingClientRect()
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
}

function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    drawGrid()
    drawConnections()
    components.forEach(drawComponent)
    drawNodes()
}

function drawGrid() {
    ctx.strokeStyle = "#e6e6e6"
    ctx.lineWidth = 1
    for (let x = 0; x <= canvas.width; x += gridSize) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
    }
    for (let y = 0; y <= canvas.height; y += gridSize) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()
    }
}

function drawConnections() {
    connections.forEach(conn => {
        const fromComp = components.find(c => conn.from.id.startsWith(c.id))
        const toComp = components.find(c => conn.to.id.startsWith(c.id))
        if (!fromComp || !toComp) return
        const from = getNodePosition(fromComp, conn.from.id.endsWith("A") ? 'A' : 'B')
        const to = getNodePosition(toComp, conn.to.id.endsWith("A") ? 'A' : 'B')

        const mouseNearNode = hoverNodes.some(n => Math.hypot(n.x - from.x, n.y - from.y) < 8 || Math.hypot(n.x - to.x, n.y - to.y) < 8)
        const shouldHighlight = conn === hoveredConnection && !mouseNearNode

        ctx.strokeStyle = shouldHighlight ? "red" : "#333"
        ctx.lineWidth = 2

        const mid = { x: from.x, y: to.y }

        ctx.beginPath()
        ctx.moveTo(from.x, from.y)
        ctx.lineTo(mid.x, mid.y)
        ctx.lineTo(to.x, to.y)
        ctx.stroke()
    })
}

function drawComponent(c) {
    ctx.save()
    ctx.translate(c.x, c.y)
    ctx.rotate((c.rotation || 0) * Math.PI / 180)
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(-40, 0); ctx.lineTo(-20, 0)
    ctx.moveTo(20, 0); ctx.lineTo(40, 0)
    ctx.stroke()

    if (c.type === "resistor") {
        ctx.strokeStyle = "#8B4513"
        ctx.beginPath(); ctx.moveTo(-20, 0)
        for (let i = 0; i < 6; i++) {
            const x1 = -20 + i * 6.66
            const x2 = x1 + 3.33
            const x3 = x1 + 6.66
            ctx.lineTo(x2, i % 2 === 0 ? -8 : 8)
            ctx.lineTo(x3, 0)
        }
        ctx.stroke()
        ctx.textAlign = "center"
        ctx.font = "14px Arial"
        ctx.fillStyle = "#000"
        ctx.fillText(c.value + " Ω", 0, 30)
    } else {
        ctx.fillStyle = "#9C27B0"
        ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2)
        ctx.fill(); ctx.stroke()
        ctx.fillStyle = "#fff"
        ctx.font = "18px Arial"
        ctx.textAlign = "center"
        ctx.fillText("+", -8, 5)
        ctx.fillText("-", 8, 5)
        ctx.font = "12px Arial"
        ctx.fillStyle = "#000"
        ctx.fillText(c.value + " V", 0, 35)
    }

    if (c.selected) {
        ctx.strokeStyle = "#2196F3"
        ctx.setLineDash([5, 3])
        ctx.strokeRect(-45, -25, 90, 50)
        ctx.setLineDash([])
    }
    ctx.restore()
}

function drawNodes() {
    hoverNodes.forEach(n => {
        ctx.beginPath()
        ctx.arc(n.x, n.y, 4, 0, Math.PI * 2)
        ctx.fillStyle = "red"
        ctx.fill()
    })
}

document.getElementById("apply-properties").addEventListener("click", () => {
    if (selected) {
        selected.value = parseFloat(valueInput.value)
        drawAll()
        updateAnalysis()
        propPanel.classList.add("hidden")
    }
})

document.getElementById("delete-component").addEventListener("click", () => {
    if (selected) {
        const i = components.indexOf(selected)
        if (i !== -1) components.splice(i, 1)
        selected = null
        drawAll()
        updateAnalysis()
        propPanel.classList.add("hidden")
        if (components.length === 0) {
            canvasContainer.classList.remove("has-components")
        }
    }
})

function updateAnalysis() {
    const res = components.filter(c => c.type === "resistor")
    const volt = components.find(c => c.type === "voltage")
    if (res.length === 0) return show("-", "0", "0", "0")

    const topology = detectTopology(res)
    const totalR = (topology === "Serie") ?
        res.reduce((sum, r) => sum + r.value, 0) :
        1 / res.reduce((sum, r) => sum + (1 / r.value), 0)

    const V = volt ? volt.value : 0
    const I = V / totalR
    const P = V * I

    show(topology, totalR.toFixed(2), I.toFixed(2), P.toFixed(2))
    analyzeCircuit()
}
// no se usa pero no lo borro pq se descuadra :p
function detectTopology(resistors) {
    const graph = {}
    const nodeUsage = {}

    connections.forEach(conn => {
        const keyA = `${conn.from.id}`
        const keyB = `${conn.to.id}`
        if (!graph[keyA]) graph[keyA] = new Set()
        if (!graph[keyB]) graph[keyB] = new Set()
        graph[keyA].add(keyB)
        graph[keyB].add(keyA)

        nodeUsage[keyA] = (nodeUsage[keyA] || 0) + 1
        nodeUsage[keyB] = (nodeUsage[keyB] || 0) + 1
    })

    const visited = new Set()
    let resistorNodesReached = new Set()
    let branchPoints = 0

    function dfs(node) {
        if (visited.has(node)) return
        visited.add(node)
        if (graph[node]) {
            if (graph[node].size > 2) branchPoints++
            for (const neighbor of graph[node]) dfs(neighbor)
        }
    }

    const startNode = Object.keys(graph)[0]
    dfs(startNode)

    resistors.forEach(r => {
        if (visited.has(`${r.id}-A`) || visited.has(`${r.id}-B`)) {
            resistorNodesReached.add(r.id)
        }
    })

    const allConnected = resistorNodesReached.size === resistors.length
    if (!allConnected) return "Complejo"

    const parallelCandidates = Object.values(nodeUsage).filter(c => c >= 3).length
    if (parallelCandidates >= 2) return "Paralelo"
    if (branchPoints > 0) return "Mixto"
    return "Serie"

}
// Botón de reinicio
const resetBtn = document.getElementById("reset-btn")

resetBtn.addEventListener("click", () => {
    components.length = 0
    selected = null
    drawAll()
    updateAnalysis()
    propPanel.classList.add("hidden")
    updateInstructionsVisibility()
})

const calculateBtn = document.getElementById("calculate-btn")

calculateBtn.addEventListener("click", () => {
    updateAnalysis()
})

function show(type, r, i, p) {
    document.getElementById("circuit-type").textContent = type
    document.getElementById("total-resistance").textContent = r + " Ω"
    document.getElementById("total-current").textContent = i + " A"
    document.getElementById("total-power").textContent = p + " W"
    const formula = document.getElementById("resistance-formula")
    componentCount.textContent = components.length.toString()
    if (!formula) return
    if (type.includes("Serie")) {
        formula.innerHTML = "<strong>Serie:</strong> R<sub>total</sub> = R₁ + R₂ + R₃..."
    } else if (type.includes("Paralelo")) {
        formula.innerHTML = "<strong>Paralelo:</strong> 1/R<sub>total</sub> = 1/R₁ + 1/R₂ + 1/R₃..."
    } else {
        formula.innerHTML = "<strong>Resistencia:</strong> Depende del tipo de circuito"
    }
}

function analyzeCircuit() {
    const graph = {}
    const nodeDegree = {};

    for (let i = connections.length - 1; i >= 0; i--) {
        const conn = connections[i]
        const validFrom = components.find(c => conn.from.id.startsWith(c.id))
        const validTo = components.find(c => conn.to.id.startsWith(c.id))
        if (!validFrom || !validTo) {
            connections.splice(i, 1)
        }
    }

    connections.forEach(conn => {
        const keyA = `${conn.from.id}`
        const keyB = `${conn.to.id}`
        if (!graph[keyA]) graph[keyA] = new Set()
        if (!graph[keyB]) graph[keyB] = new Set()
        graph[keyA].add(keyB)
        graph[keyB].add(keyA)

        nodeDegree[keyA] = (nodeDegree[keyA] || 0) + 1
        nodeDegree[keyB] = (nodeDegree[keyB] || 0) + 1
    })

    const resistors = components.filter((comp) => comp.type === "resistor")
    const voltageSource = components.filter((comp) => comp.type === "voltage")

    if (voltageSource.length > 1) {
        const result = {
            type: "Error",
            resistance: 0,
            current: 0,
            power: 0,
            analysis: "❌ Solo se permite una pila en el circuito. Elimine las adicionales para continuar.",
        }
        displayAnalysis(result)
        return result
    }

    const voltage = voltageSource.length === 1 ? voltageSource[0].value : 0

    if (resistors.length === 0 && voltageSource.length === 0) {
        const result = {
            type: "Sin componentes",
            resistance: 0,
            current: 0,
            power: 0,
            analysis: "Agregue resistores para analizar el circuito",
        }
        displayAnalysis(result)
        return result
    }

    if (connections.length === 0) {
        const result = {
            type: "Sin conexiones",
            resistance: 0,
            current: 0,
            power: 0,
            analysis: "⚠️ Conecte los componentes con líneas antes de analizar el circuito (Actualizar manualmente en caso de no hacerse automáticamente)",
        }
        displayAnalysis(result)
        return result
    }

    let circuitType = "Complejo"

    const nodeConnections = {};

    connections.forEach(conn => {
        const fromKey = `${conn.from.x},${conn.from.y}`;
        const toKey = `${conn.to.x},${conn.to.y}`;

        if (!nodeConnections[fromKey]) nodeConnections[fromKey] = [];
        if (!nodeConnections[toKey]) nodeConnections[toKey] = [];

        nodeConnections[fromKey].push(conn.from.id);
        nodeConnections[toKey].push(conn.to.id);
    });

    const parallelConnections = [];
    for (const key in nodeConnections) {
        if (nodeConnections[key].length > 1) {

            parallelConnections.push(nodeConnections[key]);
        }
    }
    console.log("Conexiones paralelas:", parallelConnections);
    const isParallel = parallelConnections.length > 0;

    function isPureParallel(resistors, graph) {
        if (resistors.length === 0) return false;

        const aNodes = resistors.map(r => `${r.id}-A`);
        const bNodes = resistors.map(r => `${r.id}-B`);

        const areAllConnected = (nodes) => {
            const visited = new Set();

            const dfs = (node) => {
                if (visited.has(node)) return;
                visited.add(node);
                for (const neighbor of graph[node] || []) {
                    if (nodes.includes(neighbor)) dfs(neighbor);
                }
            };

            dfs(nodes[0]);
            return nodes.every(n => visited.has(n));
        };

        return areAllConnected(aNodes) && areAllConnected(bNodes);
    }



    function isPureSeries(nodeDegree, resistors) {
        for (const r of resistors) {
            const a = `${r.id}-A`;
            const b = `${r.id}-B`;
            const degreeA = nodeDegree[a] || 0;
            const degreeB = nodeDegree[b] || 0;

            if (degreeA !== 1 || degreeB !== 1) {
                return false;
            }
        }
        return true;
    }

    const isSeries = isPureSeries(nodeDegree, resistors);
    const isParallelPure = isPureParallel(resistors, graph);

    console.log("Series: " + isSeries)
    console.log("Paralelo: " + isParallel)
    console.log("Paralelo Puro: " + isParallelPure)

    if (isSeries) {
        circuitType = "Serie";
    } else if (isParallel && isParallelPure) {
        circuitType = "Paralelo";
    } else if (isParallel) {
        circuitType = "Mixto";
    } else {
        circuitType = "Complejo";
    }

    console.log("Grados de nodo:", nodeDegree);

    console.log("Tipo de circuito detectado:", circuitType)


    let totalResistance = 0
    let analysis = ""


    const disconnectedResistors = resistors.filter(r => {
        const nodeA = `${r.id}-A`;
        const nodeB = `${r.id}-B`;
        return !graph[nodeA] && !graph[nodeB];
    });

    if (disconnectedResistors.length > 0) {
        const result = {
            type: "Componentes desconectados",
            resistance: 0,
            current: 0,
            power: 0,
            analysis: "⚠️ Conecte los componentes con líneas antes de analizar el circuito (Actualizar manualmente en caso de no hacerse automáticamente)",
        }
        displayAnalysis(result)
        return result
    }

    if (circuitType.includes("Serie")) {
        totalResistance = calculateSeriesResistance(resistors)
        analysis = `🔗 CIRCUITO EN SERIE:\n`
        analysis += `• ${resistors.length} resistores conectados en línea\n`
        analysis += `• Resistencia total: R = ${resistors.map((r) => r.value).join(" + ")} = ${totalResistance.toFixed(2)} Ω\n`
        analysis += `• Corriente igual en todos los componentes: I = V/R\n`
        analysis += `• Voltaje se divide proporcionalmente: V = I × R`
    } else if (circuitType.includes("Paralelo")) {
        totalResistance = calculateParallelResistance(resistors)
        analysis = `⚡ CIRCUITO EN PARALELO:\n`
        analysis += `• ${resistors.length} resistores conectados en ramas\n`
        analysis += `• Resistencia total: 1/R = ${resistors.map((r) => `1/${r.value}`).join(" + ")}\n`
        analysis += `• R total = ${totalResistance.toFixed(2)} Ω\n`
        analysis += `• Voltaje igual en todos los componentes\n`
        analysis += `• Corriente se divide entre las ramas`
    } else if (circuitType.includes("Mixto")) {
        analysis = `🔀 CIRCUITO MIXTO (Serie-Paralelo):\n`
        analysis += `• Combinación de conexiones serie y paralelo, requiere análisis manual\n`
        analysis += `• Pasos para análisis por secciones:\n`
        analysis += `  - Elementos en serie se suman\n`
        analysis += `  - Elementos en paralelo se calculan por reciprocales\n`
        analysis += `• En serie: el voltaje se divide entre los elementos según su resistencia.\n`
        analysis += `• En paralelo: todos los elementos tienen el mismo voltaje.`
    } else {
        analysis = `🔧 CONFIGURACIÓN COMPLEJA:\n`
        analysis += `• ${resistors.length} resistores en configuración avanzada\n`
        analysis += `• Requiere análisis de mallas o nodos\n`
        analysis += `• Use la sección de Kirchhoff para análisis detallado`
    }

    const current = voltage > 0 ? voltage / totalResistance : 0
    const power = voltage * current

    const result = {
        type: circuitType,
        resistance: totalResistance,
        current: current,
        power: power,
        analysis: analysis,
    }
    displayAnalysis(result)
    return result
}

function displayAnalysis(result) {
    if (!detailedAnalysis) return
    detailedAnalysis.innerText = result.analysis
    document.getElementById("total-resistance").textContent = result.resistance.toFixed(2) + " Ω"
    document.getElementById("total-current").textContent = result.current.toFixed(3) + " A"
    document.getElementById("total-power").textContent = result.power.toFixed(2) + " W"
    document.getElementById("component-count").textContent = components.length.toString()
    document.getElementById("circuit-type").textContent = result.type

    if (result.type.includes("Serie")) {
        document.getElementById("resistance-formula").innerHTML = "<strong>Serie:</strong> R<sub>total</sub> = R₁ + R₂ + R₃..."
    } else if (result.type.includes("Paralelo")) {
        document.getElementById("resistance-formula").innerHTML = "<strong>Paralelo:</strong> 1/R<sub>total</sub> = 1/R₁ + 1/R₂ + 1/R₃..."
    } else {
        document.getElementById("resistance-formula").innerHTML = "<strong>Resistencia:</strong> Depende del circuito"
    }
    if (result.type.includes("Mixto")) {
        document.getElementById("total-resistance").textContent = "-- Ω"
        document.getElementById("total-current").textContent = "-- A"
        document.getElementById("total-power").textContent = "-- W"
    }
}

function calculateSeriesResistance(resistors) {
    return resistors.reduce((sum, r) => sum + r.value, 0)
}

function calculateParallelResistance(resistors) {
    return 1 / resistors.reduce((sum, r) => sum + (1 / r.value), 0)
}



