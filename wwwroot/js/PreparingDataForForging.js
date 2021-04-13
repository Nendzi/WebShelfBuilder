var myShelf;
var dataForForging = [];
var coordOfshelfElement;
var coordOfElements = { x1: 0, y1: 0, x2: 0, y2: 0 };

function lineDataToJSON() {
    const shelfDepth = document.getElementById('shelfDepth').value;
    const shelfThk = document.getElementById('shelfThickness').value;
    const shelfElements = window.sessionStorage.getItem('ShelfGeomData').split(';>');
    const material = document.getElementById('selectMat').value;

    for (var i = 3; i < shelfElements.length - 1; i++) {
        coordOfshelfElement = shelfElements[i].split(';');
        putEndPointCoordInVar(coordOfshelfElement);
        jsonItem = {};
        jsonItem['length'] = getLineLength(coordOfElements);
        jsonItem['orientation'] = getOrientation(coordOfElements);
        jsonItem['midPoint'] = {};
        jsonItem['midPoint']['x'] = getCoordOfMidpoint('x', coordOfElements);
        jsonItem['midPoint']['y'] = getCoordOfMidpoint('y', coordOfElements);
        jsonItem['depth'] = shelfDepth;
        jsonItem['thickness'] = shelfThk;
        jsonItem['material'] = material;

        dataForForging.push(jsonItem);
    }
    myShelf = { 'MyShelfData': dataForForging };
}

function putEndPointCoordInVar(lineObj) {
    coordOfElements.x1 = parseInt(lineObj[0]);
    coordOfElements.y1 = parseInt(lineObj[1]);
    coordOfElements.x2 = parseInt(lineObj[3]);
    coordOfElements.y2 = parseInt(lineObj[4]);
}

function getLineLength(lineObj) {
    var deltaX = Math.abs(lineObj.x2 - lineObj.x1);
    var deltaY = Math.abs(lineObj.y2 - lineObj.y1);

    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
}

function getCoordOfMidpoint(which, lineObj) {

    if (which == 'x') {
        return getMidPoint(lineObj).x;
    }
    else {
        return getMidPoint(lineObj).y;
    }
}

function getMidPoint(lineObj) {
    var midPoint = { x: 0, y: 0 };

    midPoint.x = (lineObj.x1 + lineObj.x2) / 2;
    midPoint.y = (lineObj.y1 + lineObj.y2) / 2;

    return midPoint;
}

function getOrientation(lineObj) {
    var x1 = lineObj.x1;
    var y1 = lineObj.y1;
    var x2 = lineObj.x2;
    var y2 = lineObj.y2;

    var deltaX = Math.abs(x1 - x2);
    var deltaY = Math.abs(y1 - y2);

    if (deltaY < 0.0001) {
        return 'horizontal'
    }
    if (deltaX < 0.0001) {
        return 'vertical';
    }
    return 'incl';
}