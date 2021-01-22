const sketch = document.getElementById('visual')
var windowWidth = sketch.clientWidth;
var windowHeight = sketch.clientHeight;

var renderer, scene, camera

var linePreview;
var line;
var MAX_POINTS = 80;
var drawCount;

var points = [];
var pointsNumber = 0;

var cursor_x = -1;
var cursor_y = -1;

var needAnimate = false;
var canDrawNewLine = false;
var selectionMode = false;

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
var pickedObjectColor;
var pickedObject = null;

initEnv();

function initEnv() {
    // renderer
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(windowWidth, windowHeight);
    document.getElementById('sketchViewer').appendChild(renderer.domElement);

    //scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color('white');

    //camera
    var hlfscrw = windowWidth / 2
    var hlfscrh = windowHeight / 2;
    camera = new THREE.OrthographicCamera(-hlfscrw, hlfscrw, -hlfscrh, hlfscrh, 1, 500);
    //camera = new THREE.PerspectiveCamera(45, windowWidth / windowHeight, 1, 500);
    camera.position.set(0, 0, 100);
    camera.lookAt(0, 0, 0);

    //geometry
    const preLineGeometry = new THREE.BufferGeometry();
    const lineGeometry = new THREE.BufferGeometry();

    //attributes
    var positions = new Float32Array(6);
    preLineGeometry.addAttribute('position', new THREE.BufferAttribute(positions, 3));
    var nurbs = new Float32Array(MAX_POINTS * 3);
    lineGeometry.addAttribute('nurb', new THREE.BufferAttribute(nurbs, 3));

    //drawcalls
    drawCount = 2;
    preLineGeometry.setDrawRange(0, drawCount);

    //material    
    const preLineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });

    //line
    linePreview = new THREE.Line(preLineGeometry, preLineMaterial);
    scene.add(linePreview);

    //first render
    render();
}

function updatePosition(x, y) {
    var positions = linePreview.geometry.attributes.position.array;
    var index = 0;

    positions[index++] = x;
    positions[index++] = y;
    positions[index++] = 0;
}

function render() {

    renderer.render(scene, camera);
}

//this function will be for animate
document.getElementById('sketchViewer').onmousemove = function (event) {

    var x_coord = event.offsetX - windowWidth / 2;
    var y_coord = event.offsetY - windowHeight / 2;
    
    // part for preview line drawing
    if (pointsNumber > 0) {
        if (needAnimate) {
            var positions = linePreview.geometry.attributes.position.array;
            var index = 3;

            positions[index++] = x_coord;
            positions[index++] = y_coord;
            positions[index++] = 0;

            updatePreview();
        }
    }

    //part for raycasting
    if (selectionMode) {
        mouse.x = event.offsetX / windowWidth * 2 - 1;
        mouse.y = -(event.offsetY / windowHeight * 2 - 1);
                
        if (pickedObject) {
            pickedObject.material.color.setHex(pickedObjectColor);
            pickedObject = undefined;
        }

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length) {
            pickedObject = intersects[0].object;
            pickedObjectColor = pickedObject.material.color.getHex();
            pickedObject.material.color.setHex(0x00ff00);
        }
        render();
    }
}

function updatePreview() {
    linePreview.geometry.attributes.position.needsUpdate = true;
    //console.log('Cursor at: ' + x_coord + ', ' + y_coord + ' - ' + pointsNumber);
    render();
}

document.getElementById('sketchViewer').onclick = function (event) {
    //this part is for drawing lines
    var x_coord = event.offsetX - windowWidth / 2;
    var y_coord = event.offsetY - windowHeight / 2;

    updatePosition(x_coord, y_coord);

    points.push(new THREE.Vector3(x_coord, y_coord, 0));

    pointsNumber++;

    if (pointsNumber > 1) {
        var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0x0000ff });
        var line = new THREE.Line(lineGeometry, lineMaterial);
        scene.add(line);
        pointsNumber = 1;
        points.shift();

        render();
    }

    if (canDrawNewLine) {
        pointsNumber = 0;
        points = [];
        needAnimate = false;
        canDrawNewLine = false;
        updatePreview();
    }
    else {
        selectionMode = false;
        needAnimate = true;
    }

    // this is temporary condition checker for stoping drawing lines after 5 lines made.
    // this should be replaced with stop command from contetual menu.
    if (scene.children.length % 5 == 0) {
        canDrawNewLine = true;
        selectionMode = true;
    }
}
