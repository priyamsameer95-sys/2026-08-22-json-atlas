let Graph = null;

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
    const links = [];
    let idCounter = 1;

    function traverse(key, value, parentId) {
        const currentId = idCounter++;
        let label = key !== null ? String(key) : 'Root';
        let color = '#34d399'; // value color

        if (Array.isArray(value)) {
            label = key !== null ? `${key} []` : 'Array []';
            color = '#f472b6';
        } else if (value !== null && typeof value === 'object') {
            label = key !== null ? `${key} {}` : 'Object {}';
            color = '#a78bfa';
        } else {
            let valStr = String(value);
            if (valStr.length > 20) valStr = valStr.substring(0, 20) + '...';
            label = key !== null ? `${key}: ${valStr}` : valStr;
        }

        nodes.push({ id: currentId, name: label, color: color });

        if (parentId !== null) {
            links.push({ source: parentId, target: currentId });
        }

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

    traverse(null, data, null);

    const container = document.getElementById('network');
    const width = document.getElementById('graph-container').clientWidth;
    const height = document.getElementById('graph-container').clientHeight;

    if (!Graph) {
        Graph = ForceGraph3D()(container)
            .width(width)
            .height(height)
            .nodeColor(node => node.color)
            .nodeRelSize(6)
            .linkColor(() => 'rgba(255,255,255,0.2)')
            .nodeThreeObject(node => {
                const sprite = new SpriteText(node.name);
                sprite.color = '#ffffff';
                sprite.textHeight = 4;
                sprite.backgroundColor = 'rgba(0,0,0,0.6)';
                sprite.padding = 2;
                sprite.borderRadius = 2;
                return sprite;
            })
            .nodeThreeObjectExtend(true);
    }

    Graph.graphData({ nodes, links });
}

// Initial render
window.onload = renderGraph;
// Handle window resize
window.addEventListener('resize', () => {
    if(Graph) {
        Graph.width(document.getElementById('graph-container').clientWidth)
             .height(document.getElementById('graph-container').clientHeight);
    }
});
