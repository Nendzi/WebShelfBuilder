var lineCoordinates = { x1: 0, y1: 0, x2: 0, y2: 0 };
var actualLength;
var newLength;
var clipboardCoord = { x: 0, y: 0 }

document.getElementById('updateLength1').onclick = function (event) {
    updateCoordinates('first');
}

document.getElementById('updateLength2').onclick = function (event) {
    updateCoordinates('second');
}

function lineOrj() {
    var output = false;
    populateLineCoords();

    var x1 = lineCoordinates.x1;
    var y1 = lineCoordinates.y1;
    var x2 = lineCoordinates.x2;
    var y2 = lineCoordinates.y2;

    var deltaX = Math.abs(x1 - x2);
    var deltaY = Math.abs(y1 - y2);

    if (deltaY <0.0001) {
        return 'hor'
    }
    if (deltaX < 0.0001) {
        return 'ver';
    }
    return 'incl';
}

document.getElementById('pasteStartPoint1').onclick = function (event) {
    // da li je horizontalan
    if (lineOrj() == 'hor') {
        // ako je horizontalan menjaj samo Y koordinate
        pickedObject.geometry.attributes.position.array[1] = clipboardCoord.y;
        pickedObject.geometry.attributes.position.array[4] = clipboardCoord.y;
    }
    if (lineOrj() == 'ver') {
        // ako je vertikalan menjaj samo X koordinate
        pickedObject.geometry.attributes.position.array[0] = clipboardCoord.x;
        pickedObject.geometry.attributes.position.array[3] = clipboardCoord.x;
    }
    if (lineOrj() == 'incl') {
        // samo tačku jedan menjaj
        pickedObject.geometry.attributes.position.array[0] = clipboardCoord.x;
        pickedObject.geometry.attributes.position.array[1] = clipboardCoord.y;
    }
    pickedObject.geometry.attributes.position.needsUpdate = true;
    render();
    // simulate esc pressed
    escPressed();
}

document.getElementById('pasteStartPoint2').onclick = function (event) {
    // da li je horizontalan
    if (lineOrj() == 'hor') {
        // ako je horizontalan menjaj samo Y koordinate
        pickedObject.geometry.attributes.position.array[1] = clipboardCoord.y;
        pickedObject.geometry.attributes.position.array[4] = clipboardCoord.y;
    }
    if (lineOrj() == 'ver') {
        // ako je vertikalan menjaj samo X koordinate
        pickedObject.geometry.attributes.position.array[0] = clipboardCoord.x;
        pickedObject.geometry.attributes.position.array[3] = clipboardCoord.x;
    }
    if (lineOrj() == 'incl') {
        // samo tačku jedan menjaj
        pickedObject.geometry.attributes.position.array[3] = clipboardCoord.x;
        pickedObject.geometry.attributes.position.array[4] = clipboardCoord.y;
    }
    pickedObject.geometry.attributes.position.needsUpdate = true;
    render();
    // simulate esc pressed
    escPressed();
}

document.getElementById('copyStartPoint1').onclick = function (event) {
    clipboardCoord.x = pickedObject.geometry.attributes.position.array[0];
    clipboardCoord.y = pickedObject.geometry.attributes.position.array[1];
}

document.getElementById('copyStartPoint2').onclick = function (event) {
    clipboardCoord.x = pickedObject.geometry.attributes.position.array[3];
    clipboardCoord.y = pickedObject.geometry.attributes.position.array[4];
}

function populateLineCoords() {
    lineCoordinates.x1 = pickedObject.geometry.attributes.position.array[0];
    lineCoordinates.y1 = pickedObject.geometry.attributes.position.array[1];
    lineCoordinates.x2 = pickedObject.geometry.attributes.position.array[3];
    lineCoordinates.y2 = pickedObject.geometry.attributes.position.array[4];
}

function showLineProperties() {
    const propPanel = document.getElementById('lineProp');
    propPanel.style.visibility = 'visible';
    populateLineCoords();

    var x1 = lineCoordinates.x1;
    var y1 = lineCoordinates.y1;
    var x2 = lineCoordinates.x2;
    var y2 = lineCoordinates.y2;

    fillFirstCoord(x1, y1);
    fillSecondCoord(x2, y2);

    actualLength = Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
    document.getElementById('lineLen').value = actualLength;
}

//update only current line changing coordinate depends on input parametar
function updateCoordinates(whichEnd) {
    var newX;
    var newY;

    newLength = document.getElementById('lineLen').value;

    var deltaXn = newLength / actualLength * (lineCoordinates.x2 - lineCoordinates.x1);
    var deltaYn = newLength / actualLength * (lineCoordinates.y2 - lineCoordinates.y1);

    if (whichEnd == 'first') {
        newX = lineCoordinates.x2 - deltaXn;
        newY = lineCoordinates.y2 - deltaYn;
        fillFirstCoord(newX, newY);
    }
    else {
        newX = lineCoordinates.x1 + deltaXn;
        newY = lineCoordinates.y1 + deltaYn;
        fillSecondCoord(newX, newY);
    }
    pickedObject.geometry.attributes.position.needsUpdate = true;
    render();
    // simulate esc pressed
    escPressed();
}

function updateAllCoordinates() {

}

function fillFirstCoord(x, y) {
    document.getElementById('firstPoint_x').value = x;
    document.getElementById('firstPoint_y').value = y;

    pickedObject.geometry.attributes.position.array[0] = x;
    pickedObject.geometry.attributes.position.array[1] = y;
}

function fillSecondCoord(x, y) {
    document.getElementById('lastPoint_x').value = x;
    document.getElementById('lastPoint_y').value = y;

    pickedObject.geometry.attributes.position.array[3] = x;
    pickedObject.geometry.attributes.position.array[4] = y;
}