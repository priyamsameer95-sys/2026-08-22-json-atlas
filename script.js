let network = null;

function renderGraph() {
    const input = document.getElementById('json-input').value;
    const errorMsg = document.getElementById('error-msg');
    
    let data;
    try {
        data = JSON.parse(input);
        errorMsg.style.display = 'none';
    } catch (e) {
        errorMsg.textContent = e.message;
        errorMsg.style.display = 'block';
        return;
    }

    const nodes = [];
    const edges = [];
    let idCounter = 1;

    function traverse(key, value, parentId) {
        const currentId = idCounter++;
        let label = key !== null ? String(key) : '';
        let color = '#10b981'; // value color
        let shape = 'box';
        let fontColor = '#ffffff';

        if (Array.isArray(value)) {
            label = key !== null ? `${key} []` : 'Array []';
            color = '#ec4899';
            shape = 'hexagon';
        } else if (value !== null && typeof value === 'object') {
            label = key !== null ? `${key} {}` : 'Object {}';
            color = '#8b5cf6';
            shape = 'ellipse';
        } else {
            // Leaf node: format value
            let valStr = String(value);
            if (valStr.length > 20) valStr = valStr.substring(0, 20) + '...';
            label = key !== null ? `${key}: ${valStr}` : valStr;
        }

        nodes.push({
            id: currentId,
            label: label,
            color: { background: color, border: color },
            font: { color: fontColor, face: 'monospace' },
            shape: shape
        });

        if (parentId !== null) {
            edges.push({
                from: parentId,
                to: currentId,
                color: { color: '#3f3f46' },
                arrows: 'to'
            });
        }

        // Recursion
        if (Array.isArray(value)) {
            value.forEach((item, index) => {
                traverse(`[${index}]`, item, currentId);
            });
        } else if (value !== null && typeof value === 'object') {
            Object.keys(value).forEach(k => {
                traverse(k, value[k], currentId);
            });
        }
    }

    // Start traversal
    traverse(null, data, null);

    // Initialize Network
    const container = document.getElementById('network');
    const graphData = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };
    
    const options = {
        layout: {
            hierarchical: {
                direction: 'LR',
                sortMethod: 'directed',
                nodeSpacing: 100,
                levelSeparation: 250
            }
        },
        physics: {
            hierarchicalRepulsion: {
                nodeDistance: 120
            }
        },
        interaction: {
            dragNodes: true,
            hover: true
        }
    };

    if (network) {
        network.destroy();
    }
    network = new vis.Network(container, graphData, options);
}

// Initial render
window.onload = renderGraph;
