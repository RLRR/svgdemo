var AbstractBehaviour = function() {}
AbstractBehaviour.prototype.onClick = function(event) {}
AbstractBehaviour.prototype.onDblClick = function(event) {}
AbstractBehaviour.prototype.onMouseMove = function(event) {}
AbstractBehaviour.prototype.onMouseDown = function(event) {}
AbstractBehaviour.prototype.onMouseUp = function(event) {}
AbstractBehaviour.prototype.onMouseLeave = function(event) {}
AbstractBehaviour.prototype.onMouseEnter = function(event) {}
AbstractBehaviour.prototype.abort = function() {}

var LineBehaviour = function(app) {
    this.app = app;

    this.currentLine = null;
    this.startX = null;
    this.startY = null;
}
LineBehaviour.prototype = new AbstractBehaviour();

LineBehaviour.prototype.onMouseDown = function(event) {
    if(!this.currentLine) {
        this.startX = this.app.getX(event);
        this.startY = this.app.getY(event);

        this.currentLine = this.app.canvas
            .line(this.startX, this.startY, this.startX, this.startY)
            .stroke(this.app.getStrokeParams(true, false))
            .attr({id: null});
    }
}

LineBehaviour.prototype.onMouseUp = function(event) {
    if(this.currentLine) {
        this.app.history.push(this.currentLine);
        this.currentLine = null;
        this.startX = null;
        this.startY = null;

        this.app.updateCode();
    }
}

LineBehaviour.prototype.onMouseMove = function(event) {
    if(this.currentLine) {
        this.currentLine.plot(
            this.startX,
            this.startY,
            this.app.getX(event),
            this.app.getY(event)
        );

       this.app.updateCodeThrottled();
    }
}

LineBehaviour.prototype.abort = function() {
    if(this.currentLine) {
        this.currentLine.remove();        
        this.currentLine = null;
        this.startX = null;
        this.startY = null;

        this.app.updateCode();
    }
}


var ShapeBehaviour = function(app, type) {
    this.app = app;

    this.currentShape = null;
    this.startX = null;
    this.startY = null;
    this.type = type;
}
ShapeBehaviour.prototype = new AbstractBehaviour();

ShapeBehaviour.prototype.onMouseDown = function(event) {
    if(this.currentShape) {
        return;
    }

    this.startX = this.app.getX(event);
    this.startY = this.app.getY(event);

    if(this.type == 'rect') {
        this.currentShape = this.app.canvas.rect(0, 0);
    } else {
        this.currentShape = this.app.canvas.ellipse(0, 0);
    }

    this.currentShape
        .x(this.startX)
        .y(this.startY)
        .stroke(this.app.getStrokeParams(false, true))
        .fill({
            color: $('#fill-color').minicolors('value'),
            opacity: $('#fill-color').minicolors('opacity')
        })
        .attr({id: null});
}

ShapeBehaviour.prototype.onMouseUp = function(event) {
    if(!this.currentShape) {
        return;
    }

    if(this.currentShape.width() == 0 && this.currentShape.height() == 0) {
        this.currentShape.remove();
    } else {
        this.app.history.push(this.currentShape);
    }

    this.currentShape = null;
    this.startX = null;
    this.startY = null;

    this.app.updateCode();

}

ShapeBehaviour.prototype.onMouseMove = function(event) {
    if(!this.currentShape) {
        return;
    }

    var x = this.app.getX(event);
    var y = this.app.getY(event);

    if(this.type == 'ellipse') {
        this.currentShape
            .cx(Math.round((x + this.startX) / 2))
            .cy(Math.round((y + this.startY) / 2));
    } else {
        x = Math.round(x);
        y = Math.round(y);

        if(x < this.startX) {                
            this.currentShape.x(x);
        } else {
            this.currentShape.x(this.startX);
        }

        if(y < this.startY) {
            this.currentShape.y(y);
        } else {
            this.currentShape.y(this.startY);
        }
    }

    this.currentShape.size(
        Math.round(Math.abs(x - this.startX)),
        Math.round(Math.abs(y - this.startY))
    );

    this.app.updateCodeThrottled();
}

ShapeBehaviour.prototype.abort = function() {
    if(this.currentShape) {
        this.currentShape.remove();
        this.currentShape = null;
        this.startX = null;
        this.startY = null;

        this.app.updateCode();
    }
}

var CurveBehaviour = function(app) {
    this.app = app;

    this.currentCurve = null;
    this.currentPoints = null;
    this.lastPoint = null;
}
CurveBehaviour.prototype = new AbstractBehaviour();

CurveBehaviour.prototype.onClick = function(event) {
    if(!this.currentCurve) {
        var x = this.app.getX(event);
        var y = this.app.getY(event);

        this.currentPoints = [['M', x, y]];
        this.lastPoint = ['T', x, y];

        this.currentCurve = this.app.canvas
            .path(new SVG.PathArray(this.currentPoints.concat([this.lastPoint])))
            .stroke(this.app.getStrokeParams(true, false))
            .fill('none')
            .attr({id: null});
    } else {
        this.currentPoints.push(this.lastPoint);
        this.app.updateCode();
    }
}

CurveBehaviour.prototype.onDblClick = function(event) {
    if(this.currentCurve) {
        this.app.history.push(this.currentCurve);
        this.currentCurve = null;
        this.currentPoints = null;
        this.lastPoint = null;
    }
}

CurveBehaviour.prototype.onMouseMove = function(event) {
    if(!this.currentCurve) {
        return;
    }    

    this.lastPoint = ['T',
        this.app.getX(event),
        this.app.getY(event)
    ];

    if(this.lastPoint[1] != this.currentPoints[this.currentPoints.length - 1][1] &&
       this.lastPoint[2] != this.currentPoints[this.currentPoints.length - 1][2]) {
        this.currentCurve.plot(new SVG.PathArray(this.currentPoints.concat([this.lastPoint])));
    }
    

    this.app.updateCodeThrottled();
}

CurveBehaviour.prototype.abort = function(event) {
    if(this.currentCurve) {
        this.currentCurve.plot(new SVG.PathArray(this.currentPoints));
        this.app.history.push(this.currentCurve);
        this.currentCurve = null;
        this.currentPoints = null;
        this.lastPoint = null;
    }

    this.app.updateCode();
}

var PencilBehaviour = function(app) {
    this.app = app;

    this.currentPath = null;
    this.currentPoints = null;
}
PencilBehaviour.prototype = new AbstractBehaviour();

PencilBehaviour.prototype.onMouseDown = function(event) {
    if(this.currentPath) {
        return;
    }

    var x = this.app.getX(event);
    var y = this.app.getY(event);

    this.currentPoints = [['M', x, y], ['L', x, y]];

    this.currentPath = this.app.canvas
        .path(new SVG.PathArray(this.currentPoints))
        .stroke(this.app.getStrokeParams(true, true))
        .fill('none')
        .attr({id: null});
}

PencilBehaviour.prototype.onMouseMove = function(event) {
    if(!this.currentPath) {
        return;
    }

    var x = this.app.getX(event);
    var y = this.app.getY(event);

    this.currentPoints.push(['L', x, y]);
    this.currentPath.plot(new SVG.PathArray(this.currentPoints));
}

PencilBehaviour.prototype.onMouseUp = function(event) {
    if(!this.currentPath) {
        return;
    }

    this.app.history.push(this.currentPath);
    this.currentPath = null;
    this.currentPoints = null;

    this.app.updateCode();
}

PencilBehaviour.prototype.onMouseLeave = function(event) {
    this.onMouseUp(event);
}

PencilBehaviour.prototype.onMouseEnter = function(event) {
    if(this.app.lmbPressed) {
        this.onMouseDown(event);
    }
}

PencilBehaviour.prototype.abort = function(event) {
    this.currentPath = null;
    this.currentPoints = null;

    this.app.updateCode();
}
