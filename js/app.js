var App = function() {
    var self = this;

    this.canvas = SVG('canvas')
        .viewbox(0, 0, 1000, 1000)
        .attr({id: null});

    this.editor = CodeMirror(document.getElementById('editor'), {
        mode:  "xml",
        lineNumbers: true,
        lineWrapping: true,
    });

    this.code = CodeMirror(document.getElementById('code'), {
        mode: "xml",
        lineNumbers: true,
        lineWrapping: true,
        readOnly: true
    });

    this.history = [];
    this.behaviour = new LineBehaviour(this);
    this.lmbPressed = false;
    this.canvasBlocked = false;
    this.zoom = 100;
    this.mode = 'draw';
    this.widthIndicator = null;

    this.setLayout();
    this.fillExamples();
    this.initControls();
    this.bindEvents();
}

App.prototype.setLayout = function() {
    $('.shrinkable').width(($(window).height() - 180) * 1.95);

    if(this.mode == 'draw') {
        this.ratio = 1000 / $('#canvas').width();
    } else {
        this.ratio = 1000 / $('.clip-window').width();
    }

    this.editor.refresh();
    this.code.refresh();
}

App.prototype.initControls = function() {
    var self = this;

    $('#stroke-color, #fill-color').minicolors({
        opacity: true,
        control: 'wheel',        
        theme: 'bootstrap',
        position: 'top left',
        show: function() {self.canvasBlocked = true;},
        hide: function() {self.canvasBlocked = false;}

    });

    $('#fill-color').minicolors('value', '#dc143c');
    $('#stroke-color').minicolors('value', '#34495e');

    $('.tool-btn.default-choice').button('toggle');

    $('.diam-slider')
        .slider({
            min: 0.001,
            max: 1,
            step: 0.001,
            value: 0.25,
            slide: function(e, ui) {
                self.updateWidthIndicator(ui.value);
            },
            start: function(e, ui) {
                self.showWidthIndicator();
            },
            stop: function (e, ui) {
                self.hideWidthIndicator();
            }
        });

}

App.prototype.bindEvents = function() {
    var self = this;

    $('.mode-link')
        .click(function(event) {
            self.behaviour.abort();
            var mode = $(this).data('mode');
            self.setMode(mode);

            $('.menu-item').removeClass('active');
            $('.' + mode + '-item').addClass('active');
        });

    $(window).resize($.debounce(100, function() {
        self.setLayout();
    }));

    $('#canvas')
        .click(function(event) {
            if(!self.canvasBlocked) {
                self.behaviour.onClick(event);
            }
        })
        .dblclick(function(event) {
            if(!self.canvasBlocked) {
                self.behaviour.onDblClick(event);
            }
        })
        .mousedown(function(event) {
            event.originalEvent.preventDefault();
            if(!self.canvasBlocked) {
                self.behaviour.onMouseDown(event);
            }
        })
        .mouseup(function(event) {
            self.behaviour.onMouseUp(event);
        })
        .mousemove(function(event) {
            self.behaviour.onMouseMove(event);
        })
        .mouseleave(function(event) {
            self.behaviour.onMouseLeave(event);
        })
        .mouseenter(function(event) {
            self.behaviour.onMouseEnter(event);
        })
        .contextmenu(function(event) {
            return false;
        })
        .mousewheel(function(event) {
            event.preventDefault();
            var oldValue = $('.diam-slider').slider("option", "value");

            var newValue = oldValue + event.deltaY * 0.02;
            newValue = newValue < 0 ? 0 : newValue;
            newValue = newValue > 1 ? 1 : newValue;

            $('.diam-slider').slider("option", "value", newValue);
            self.showWidthIndicator();
            self.updateWidthIndicator();
        })
        .mousewheel($.debounce(500, function(event) {
            self.hideWidthIndicator();
        }));

    $('.tool-btn').button()
        .click(function() {
            self.setBehaviour($(this).data('tool'));
        });        

    $('.undo-btn').button()
        .click(function() {
            self.undo();
        });

    $('.clear-btn').button()
        .click(function() {
            self.clear();
        })

    $('.render-btn').button()
        .click(function() {
            self.renderDisplay();
        });

    $('.display')
        .on('load', function(e) {
            $('.draggable').show();
            $('.invalid-alert').hide();
        })
        .on('error', function(e) {
            $('.draggable').hide();
            $('.invalid-alert').show();
        });

    $('.zoom-in-btn')
        .click(function() {
            self.setZoom(
                self.zoom * 1.3,
                $('.clip-window').width() / 2 - self.getDisplayLeftOffset(),
                $('.clip-window').height() / 2 - self.getDisplayTopOffset()
            );
        });

    $('.zoom-out-btn')
        .click(function() {
            self.setZoom(
                self.zoom / 1.3,
                $('.clip-window').width() / 2 - self.getDisplayLeftOffset(),
                $('.clip-window').height() / 2 - self.getDisplayTopOffset()
            );
        });
    $('.fit-btn')
        .click(function() {
            self.fit();
        });

    $('.draggable')
        .draggable()
        .mousewheel(function(event) {
            event.preventDefault();

            self.setZoom(
                self.zoom * Math.pow(1.1, event.deltaY),
                self.getX(event, 1) - 2000,
                self.getY(event, 1) - 2000
            );
        });

    $('#editor').mousewheel(function(event) {
        var currentPosition = self.editor.getScrollInfo().top;
        self.editor.scrollTo(0, currentPosition - 40 * event.deltaY);

        if(self.editor.getScrollInfo().top != currentPosition) {
            event.preventDefault();
        }
    });

    $('#code').mousewheel(function(event) {
        var currentPosition = self.code.getScrollInfo().top;
        self.code.scrollTo(0, currentPosition - 40 * event.deltaY);
        
        if(self.code.getScrollInfo().top != currentPosition) {
            event.preventDefault();
        }
    });

    $(document)
        .mousedown(function(event) {
            self.lmbPressed = true;
        })
        .mouseup(function(event) {
            self.lmbPressed = false;
        });
}

App.prototype.fillExamples = function() {
    this.updateCode();

    this.editor.setValue(svgSample);
    this.renderDisplay();
}

App.prototype.renderDisplay = function() {
    var base64 = $.base64.encode(this.editor.getValue());

    $('.display')
        .attr('src', 'data:image/svg+xml;base64,' + base64);

    //Ulitmate IE hack
    setTimeout(function() {
        $('.display')
            .attr('src', 'data:image/svg+xml;base64,' + base64);
    }, 50);
}

App.prototype.updateCode = function() {
    var rawSvg = this.canvas
        .exportSvg({
            whitespace: '    ',
            exclude: function() {
                return this.data('exclude')
            }
        })
        .replace(/\n    <desc>[^<>]*<\/desc>\n    /g, '')
        .replace(/<defs id="SvgjsDefs1001">\n    <\/defs>/g, '');
    

    this.code.setValue(rawSvg);
    this.code.execCommand('goDocEnd');    
}

App.prototype.updateCodeThrottled = $.throttle(300, App.prototype.updateCode);

App.prototype.setBehaviour = function(behaviour) {
    this.behaviour.abort();

    switch(behaviour) {
        case 'pencil': this.behaviour = new PencilBehaviour(this); break;
        case 'line': this.behaviour = new LineBehaviour(this); break;
        case 'curve': this.behaviour = new CurveBehaviour(this); break;
        case 'rect': this.behaviour = new ShapeBehaviour(this, 'rect'); break;
        case 'ellipse': this.behaviour = new ShapeBehaviour(this, 'ellipse'); break;
    }
}

App.prototype.setMode = function(mode) {
    if(mode == 'draw') {
        $('.write').hide();
        $('.draw').show();
        this.mode = 'draw';
        this.code.refresh();
    } else {
        $('.draw').hide();
        $('.write').show();
        this.mode = 'write';
        this.editor.refresh();
    }
}

App.prototype.undo = function() {
    var self = this;

    this.behaviour.abort();
    var lastElem = this.history.pop();    
    if(lastElem) {
        lastElem
            .animate(250, '>', 0)
            .attr({opacity: 0})
            .after(function() {
                lastElem.remove();
                self.updateCode();
            });        
    }    
}

App.prototype.clear = function() {
    var self = this;

    this.behaviour.abort();
    this.canvas
        .animate(250, '>', 0)
        .attr({opacity: 0})
        .after(function() {
            self.canvas.clear();
            self.canvas.attr({opacity: null});
            self.updateCode();
            self.history = [];
        });

    
}

App.prototype.showWidthIndicator = function() {
    if(this.widthIndicator) {
        return;
    }

    this.widthIndicator = this.canvas
        .circle(this.getStrokeWidth())
        .stroke({
            opacity: 0
        })
        .data({exclude: true});
    this.updateWidthIndicator();
}

App.prototype.hideWidthIndicator = function() {
    if(!this.widthIndicator) {
        return;
    }

    this.widthIndicator.remove();
    this.widthIndicator = null;
}

App.prototype.updateWidthIndicator = function(value) {
    if(!this.widthIndicator) {
        return;
    }

    var radius = this.getStrokeWidth(value) / 2;
    this.widthIndicator
        .radius(radius)
        .cx(1000 - radius - 10)
        .cy(1000 - radius - 10)
        .fill({
            color: $('#stroke-color').minicolors('value'),
            opacity: $('#stroke-color').minicolors('opacity')
        });
}

App.prototype.setZoom = function(newZoom, x, y) {
    var left = this.getDisplayLeftOffset();
    var top = this.getDisplayTopOffset();

    var oldWidth = $('.display').width();
    var oldHeight = $('.display').height();

    var widthDiff = oldWidth / this.zoom * newZoom - oldWidth;
    var heightDiff = oldHeight / this.zoom * newZoom - oldHeight;

    left = left - widthDiff * x / oldWidth;
    top = top - heightDiff * y / oldHeight;

    $('.draggable')[0].style.left = left + 'px';
    $('.draggable')[0].style.top = top + 'px';

    $('.display')
        .width(newZoom + '%')
        .height(newZoom + '%');

    this.zoom = newZoom;
}

App.prototype.fit = function() {
    this.zoom = 100;
    $('.draggable')[0].style.left = '0px';
    $('.draggable')[0].style.top = '0px';
    $('.display')
        .width(this.zoom + '%')
        .height(this.zoom + '%');

}

App.prototype.getDisplayLeftOffset = function() {
    return parseInt($('.draggable')[0].style.left || '0px');
}

App.prototype.getDisplayTopOffset = function() {
    return parseInt($('.draggable')[0].style.top || '0px');
}

App.prototype.getX = function(e, ratio) {
    var x =  e.offsetX === undefined ? e.originalEvent.layerX : e.offsetX;
    return Math.round(x * (ratio || this.ratio));
}

App.prototype.getY = function(e, ratio) {
    var y =  e.offsetY === undefined ? e.originalEvent.layerY : e.offsetY;
    return Math.round(y * (ratio || this.ratio));
}

App.prototype.getStrokeWidth = function(value) {
    var uiValue = value || $('.diam-slider').slider("option", "value");

    var base = 5;
    return Math.round(2000 * (Math.pow(base, uiValue) - 1) / (base - 1)) / 10;
}

App.prototype.getStrokeParams = function(linecap, linejoin) {
    var params = {
        color: $('#stroke-color').minicolors('value'),
        opacity: $('#stroke-color').minicolors('opacity'),
        width: this.getStrokeWidth(),
    }
    if(linecap) params.linecap = 'round';
    if(linejoin) params.linejoin = 'round';

    return params;
}
