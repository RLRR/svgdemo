var getX = function(e, ratio) {
    var x =  e.offsetX === undefined ? e.originalEvent.layerX : e.offsetX;
    return Math.round(x * ratio);
}

var getY = function(e, ratio) {
    var y =  e.offsetY === undefined ? e.originalEvent.layerY : e.offsetY;
    return Math.round(y * ratio);
}

var getStrokeWidth = function(value) {
    var uiValue = value || $('.diam-slider').slider("option", "value");

    var base = 5;
    return Math.round(2000 * (Math.pow(base, uiValue) - 1) / (base - 1)) / 10;
}

var getStrokeParams = function(linecap, linejoin) {
    var params = {
        color: $('#stroke-color').minicolors('value'),
        opacity: $('#stroke-color').minicolors('opacity'),
        width: getStrokeWidth(),
    }
    if(linecap) params.linecap = 'round';
    if(linejoin) params.linejoin = 'round';

    return params;
}