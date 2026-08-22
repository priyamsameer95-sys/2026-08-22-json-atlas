// ─── STATE ───
let network = null;
let allNodes = [];
let allEdges = [];
let pathMap = {};  // nodeId → json path string

// ─── CORE: PARSE & BUILD GRAPH ───
function renderGraph() {
    const raw = document.getElementById('json-input').value;
    const errEl = document.getElementById('error-msg');

    let data;
    try {
        data = JSON.parse(raw);
        errEl.style.display = 'none';
    } catch (e) {
        errEl.textContent = '✕ ' + e.message;
        errEl.style.display = 'block';
        return;
    }

    allNodes = [];
    allEdges = [];
    pathMap = {};
    let idCounter = 1;
    let stats = { obj: 0, arr: 0, val: 0, maxDepth: 0 };

    function walk(key, value, parentId, path, depth) {
        const id = idCounter++;
        if (depth > stats.maxDepth) stats.maxDepth = depth;

        let label, color, shape;

        if (Array.isArray(value)) {
            stats.arr++;
            label = key !== null ? key + ' [ ]' : 'Array [ ]';
            color = '#f472b6';
            shape = 'box';
        } else if (value !== null && typeof value === 'object') {
            stats.obj++;
            label = key !== null ? key + ' { }' : 'Root { }';
            color = '#a78bfa';
            shape = 'box';
        } else {
            stats.val++;
            let v = String(value);
            if (v.length > 25) v = v.slice(0, 25) + '…';
            label = (key !== null ? key + ': ' : '') + v;
            color = '#34d399';
            shape = 'box';
        }

        allNodes.push({
            id: id,
            label: label,
            color: { background: color, border: color, highlight: { background: '#fff', border: color } },
            font: { color: '#fff', face: 'monospace', size: 13 },
            shape: shape,
            borderWidth: 2,
            borderWidthSelected: 3,
            margin: 10
        });

        pathMap[id] = path;

        if (parentId !== null) {
            allEdges.push({
                from: parentId,
                to: id,
                color: { color: '#333', highlight: '#666' },
                arrows: { to: { enabled: true, scaleFactor: 0.5 } },
                width: 1.5,
                smooth: { type: 'cubicBezier', forceDirection: 'horizontal', roundness: 0.4 }
            });
        }

        if (Array.isArray(value)) {
            value.forEach((item, i) => {
                walk('[' + i + ']', item, id, path + '[' + i + ']', depth + 1);
            });
        } else if (value !== null && typeof value === 'object') {
            Object.keys(value).forEach(k => {
                walk(k, value[k], id, path + '.' + k, depth + 1);
            });
        }
    }

    walk(null, data, null, '$', 0);

    // Update stats display
    document.getElementById('stat-obj').textContent = stats.obj;
    document.getElementById('stat-arr').textContent = stats.arr;
    document.getElementById('stat-val').textContent = stats.val;
    document.getElementById('stat-depth').textContent = stats.maxDepth;
    document.getElementById('stat-size').textContent = formatBytes(raw.length);

    // Build vis.js network
    const container = document.getElementById('network');
    const graphData = {
        nodes: new vis.DataSet(allNodes),
        edges: new vis.DataSet(allEdges)
    };

    const options = {
        layout: {
            hierarchical: {
                direction: 'LR',
                sortMethod: 'directed',
                nodeSpacing: 60,
                levelSeparation: 220,
                treeSpacing: 80
            }
        },
        physics: {
            hierarchicalRepulsion: { nodeDistance: 90, centralGravity: 0 },
            stabilization: { iterations: 150 }
        },
        interaction: {
            dragNodes: true,
            hover: true,
            tooltipDelay: 100,
            zoomView: true,
            dragView: true
        },
        nodes: {
            borderWidth: 2,
            shadow: { enabled: true, color: 'rgba(0,0,0,0.3)', size: 8, x: 2, y: 2 }
        }
    };

    if (network) network.destroy();
    network = new vis.Network(container, graphData, options);

    // Click handler → show JSON path
    network.on('click', function (params) {
        const panel = document.getElementById('path-panel');
        if (params.nodes.length > 0) {
            const nodeId = params.nodes[0];
            const path = pathMap[nodeId] || '$';
            document.getElementById('path-display').textContent = path;
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    });
}

// ─── SEARCH ───
function searchNodes(query) {
    if (!network || allNodes.length === 0) return;
    const q = query.toLowerCase().trim();

    const updates = allNodes.map(node => {
        const matches = q && node.label.toLowerCase().includes(q);
        const originalColor = node.color.background;
        return {
            id: node.id,
            color: {
                background: (q === '') ? originalColor : (matches ? '#fbbf24' : originalColor),
                border: (q === '') ? originalColor : (matches ? '#fbbf24' : originalColor)
            },
            font: {
                color: (q === '') ? '#fff' : (matches ? '#000' : 'rgba(255,255,255,0.25)'),
                face: 'monospace', size: 13
            },
            opacity: (q === '') ? 1 : (matches ? 1 : 0.3)
        };
    });

    network.body.data.nodes.update(updates);
}

// ─── TOOLBAR ACTIONS ───
function formatJSON() {
    const el = document.getElementById('json-input');
    try {
        const obj = JSON.parse(el.value);
        el.value = JSON.stringify(obj, null, 2);
        liveValidate();
    } catch (e) { /* ignore */ }
}

function minifyJSON() {
    const el = document.getElementById('json-input');
    try {
        const obj = JSON.parse(el.value);
        el.value = JSON.stringify(obj);
        liveValidate();
    } catch (e) { /* ignore */ }
}

function copyJSON() {
    const el = document.getElementById('json-input');
    navigator.clipboard.writeText(el.value).catch(() => {});
}

function downloadJSON() {
    const el = document.getElementById('json-input');
    const blob = new Blob([el.value], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(a.href);
}

function loadSample() {
    document.getElementById('json-input').value = JSON.stringify({
        "order": {
            "id": "ORD-9182",
            "customer": { "name": "Jane Doe", "email": "jane@example.com", "tier": "premium" },
            "items": [
                { "sku": "WDG-001", "name": "Dashboard Widget", "qty": 2, "price": 29.99 },
                { "sku": "PLG-044", "name": "Analytics Plugin", "qty": 1, "price": 79.00 }
            ],
            "shipping": { "method": "express", "address": { "city": "San Francisco", "state": "CA", "zip": "94105" } },
            "total": 138.98,
            "status": "shipped"
        }
    }, null, 2);
    liveValidate();
    renderGraph();
}

function clearAll() {
    document.getElementById('json-input').value = '{}';
    document.getElementById('error-msg').style.display = 'none';
    document.getElementById('path-panel').style.display = 'none';
    document.getElementById('search-input').value = '';
    document.getElementById('stat-obj').textContent = '0';
    document.getElementById('stat-arr').textContent = '0';
    document.getElementById('stat-val').textContent = '0';
    document.getElementById('stat-depth').textContent = '0';
    document.getElementById('stat-size').textContent = '0';
    if (network) { network.destroy(); network = null; }
}

// ─── LIVE VALIDATION ───
function liveValidate() {
    const raw = document.getElementById('json-input').value;
    const errEl = document.getElementById('error-msg');
    try {
        JSON.parse(raw);
        errEl.style.display = 'none';
    } catch (e) {
        errEl.textContent = '✕ ' + e.message;
        errEl.style.display = 'block';
    }
}

// ─── MODAL ───
function openModal() { document.getElementById('help-modal').style.display = 'flex'; }
function closeModal() { document.getElementById('help-modal').style.display = 'none'; }

// ─── UTIL ───
function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

// ─── INIT ───
window.onload = renderGraph;
