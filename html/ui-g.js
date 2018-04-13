/**
 * 
 */
'use strict';

if (!window.Path2D) {
    var Path2D = new Class({
        initialize: function(p) {

            var me = this;
            me._path = [];
            if (p) {
                me._path = p._path.slice(0);
            }

        },
        moveTo: function(x, y) {
            var me = this;
            me._path.push(['moveTo', x, y]);
        },
        lineTo: function(x, y) {
            var me = this;
            me._path.push(['lineTo', x, y]);
        },
        closePath: function() {
            var me = this;
            me._path.push(['closePath']);
        },
        stroke: function(context) {
            var me = this;
            me._path.forEach(function(op) {
                context[op[0]].apply(context, op.slice(1));
            });
            context.stroke();
        }

    });
}



var UIGraph = new Class({
    Implements: Events,
    initialize: function(element, data, options) {
        var me = this;
        me.options = Object.append({

            classNamePrefix: 'Graph_',
            title: 'Example Graph',
            graphTemplate: UIGraph.DefaultGraphTemplate,
            lineTemplate: UIGraph.CubicSplineTemplate,
            highlightTemplate: false,
            unhighlightTemplate: false,
            titleTemplate: UIGraph.DefaultTitleTemplate,
            width: 1500,
            widthUnit: 'px',
            height: 700,
            padding: 50,
            lineColor: 'blue',
            fillColor: false,
            pointColors: [function(data) {
                var me = this;
                return 'rgba(' + Math.round((256 * (me.data.indexOf(data) / me.data.length))) + ',16,16,0.4)';
            }],
            fillGradient: false,
            lineWidth: 0.5,
            fillGradientArray: [
                'rgba(0, 255, 255, 0.7)',
                'rgba(0, 191, 255,  0.7)',
                'rgba(0, 127, 255, 0.7)',
                'rgba(0, 63, 255, 0.7)',
                'rgba(0, 0, 255, 0.7)',
                'rgba(0, 0, 223, 0.7)',
                'rgba(0, 0, 191, 0.7)',
                'rgba(0, 0, 159, 0.7)',
                'rgba(0, 0, 127, 0.7)',
                'rgba(63, 0, 91, 0.7)',
                'rgba(127, 0, 63, 0.7)',
                'rgba(191, 0, 31, 0.7)'
            ],
            highlightFillGradientArray:[
                'rgba(0, 0, 191, 0.7)',
                'rgba(127, 0, 63, 0.7)',
                'rgba(191, 0, 31, 0.7)'
            ],
            highlightLineColor: 'magenta',
            minYValue: 0,
            minXValue: 0,
            shadowColor: false,
            parseX: function(dataValue, i) {
                return i;
            },
            parseY: function(dataValue, i) {
                return parseFloat(dataValue);
            },
            parseMeta: function(dataValue, i) {
                return null;
            },
            parseSets:function(dataset){
                return dataset;
            },
            parseSetData:function(set){
                return set;
            },
            parseSetOptions:function(set, i){
                return null;
            }

        }, options);
        if (me.options.onAddedPoint) {
            me.addEvent('onAddedPoint', me.options.onAddedPoint);
        }

        me.element = element;

        me.options.titleTemplate.bind(me)(me.options.title);
        me.options.graphTemplate.bind(me)(element);

        me.setData(data);

        me.addInteractionBehavior();

        me.isLoaded = true;

    },

    setData: function(arg) {
        var me = this;

        me.data = [];
        me.maxYValue = 0;
        me.maxXValue = 0;

        var sets=me.options.parseSets(arg);

        sets.forEach(function(set){
            var data=me.options.parseSetData(set);

            if (data && data.length) {
                Array.each(data, function(v, i) {
                    var y = me.options.parseY(v, i);
                    if (me.maxYValue < y) {
                        me.maxYValue = y;
                    }

                    var x = me.options.parseX(v, i);
                    if (me.maxXValue < x) {
                        me.maxXValue = x;
                    }
                    
                });
            }

        });

        

        if (me.maxYValue < me.options.minYValue) {
            me.maxYValue = me.options.minYValue;
        }

        if (me.maxXValue < me.options.minXValue) {
            me.maxXValue = me.options.minXValue;
        }

        if (me.context) {
            me.context.clearRect(0, 0, me.canvas.width, me.canvas.height);
        }

         sets.forEach(function(set, setIndex){
            var data=me.options.parseSetData(set);
            if (data && data.length) {
                me.data=data.map(function(v,i){

                    var value = {
                        x: me.options.parseX(v, i),
                        y: me.options.parseY(v, i)
                    };

                    var meta = me.options.parseMeta(v, i);
                    if (meta) {
                        value.meta = meta;
                    }
                    return value;

                });
                me._render(me.data, me.options.parseSetOptions(set, setIndex));
            }
        });


    },

    _render: function(data, options) {
        var me = this;

        var config = Object.append(Object.append({}, me.options), options);

        me._path = new Path2D();
        var start = me.getXYPixels([data[0].x, data[0].y]);
        me._path.moveTo(start[0], start[1]);

        var lineTemplate=config.lineTemplate;
        if(typeof lineTemplate=='string'){
            lineTemplate=({
                "UIGraph.CubicSplineTemplate":UIGraph.CubicSplineTemplate,
                "UIGraph.LineTemplate":UIGraph.LineTemplate,
                "UIGraph.UnitStepTemplate":UIGraph.UnitStepTemplate,
                "UIGraph.UnitStepBarsTemplate":UIGraph.UnitStepTemplate
            })[lineTemplate]
        }

        lineTemplate.bind(me)(data, {});


        if (config.fillColor || config.fillGradient) {

            //can close the box along y=0.
            var area = new Path2D(me._path);
            var br = me.getXYPixels([data[data.length - 1].x, 0]);
            var bl = me.getXYPixels([data[0].x, 0]);

            area.lineTo(br[0], br[1]);
            area.lineTo(bl[0], bl[1]);

            area.closePath();

            if (config.fillGradient) {

                var grd = me.context.createLinearGradient(0, me.getYPixel(0), 0, me.getYPixel(me.maxYValue));

                var colorStop = 1.0 / config.fillGradientArray.length;
                Array.each(config.fillGradientArray, function(c, i) {
                    grd.addColorStop(colorStop * i, c);
                });

                me.context.fillStyle = grd;

            } else {
                me.context.fillStyle = config.fillColor;
            }
            if (config.shadowColor) {
                me.context.shadowColor = config.shadowColor;
                me.context.shadowOffsetX = 0;
                me.context.shadowOffsetY = 0;
                me.context.shadowBlur = 10;
            } else {
                me.context.shadowColor = null;
            }

            me.context.fill(area);
        }

        me.context.strokeStyle = config.lineColor || '#441d1d';
        me.context.lineWidth = config.lineWidth;
        if (me._path.stroke) {
            //IE support
            me._path.stroke(me.context);
        } else {
            me.context.stroke(me._path);
        }
    },
    getWidth: function(padding) {
        return (this.options.width || 400) - (padding ? 0 : 2 * (this.options.padding || 0));
    },
    getHeight: function(padding) {
        return (this.options.height || 300) - (padding ? 0 : 2 * (this.options.padding || 0));
    },
    getYPixel: function(y) {
        var me = this;
        if ((typeof y) != 'number') {
            //console.trace(); 
            throw 'Invalid Y';
        }
        var value = me.getHeight() * (1 - y / me.maxYValue) + (this.options.padding || 0);
        //JSConsole(['Y pixel', y, value]);
        return value;

    },
    getXPixel: function(x) {
        var me = this;
        if ((typeof x) != 'number') {
            //console.trace(); 
            throw 'Invalid X';
        }
        var value = (me.getWidth() / (me.maxXValue)) * x + (me.options.padding || 0);
        //JSConsole(['X pixel', x, value]);
        return value;
    },
    getXYPixels: function(xy) {
        var me = this;
        return [me.getXPixel(xy[0]), me.getYPixel(xy[1])];
    },

    drawLinearLine: function(from, to) {
        var me = this;

        me._path.lineTo(to[0], to[1]);

    },
    drawCurve: function(from, to, fx) {
        var me = this;

        //var count=Math.round((to[0]-from[0])/(options.step||1.0)); //pixel steps
        var step = 1.0;
        var c = from[0] + step;
        while (c < to[0]) {
            var v = fx(c);
            //JSConsole([c,v]);
            me._path.lineTo(c, v);
            c += step;
        }

        me._path.lineTo(to[0], to[1]);
    },

    /**
     * return {x:int, y:int};
     */
    dataPointAtXPixel: function(x) {
        var me = this;
        var index = Math.min(Math.floor(((x - (me.options.padding || 0)) / me.getWidth()) * me.maxXValue), me.data.length - 1);
        return me.data[index];
    },

    _overDataPoint: function(d, evt) {

        var me = this;
        if (!me._over) {
            me._over = Object.append({}, d);
            me.fireEvent('mouseover', [Object.append(evt, d)]);


        } else {

            if(!me._over.x){
                return;
            }

            if (me._over.x == d.x && me._over.y == d.y) {
                return;
            }

            me.fireEvent('mouseout', [Object.append({}, me._over)]);
            me._over = d;
            me.fireEvent('mouseover', [Object.append(evt, d)]);
        }



    },
    _click: function() {
        var me = this;
        if (me._over) {
            me.fireEvent('click', [Object.append({}, me._over)]);
        }

    },
    _out: function() {
        var me = this;
        if (me._over) {
            me.fireEvent('mouseout', [Object.append({}, me._over)]);
            me._over = false;
        }

    },


    addInteractionBehavior: function() {

        var me = this;
        me.canvas.addEvent('mousemove', function(evt) {

            var page = me.canvas.getPosition();
            var point = {
                x: evt.page.x - page.x,
                y: evt.page.y - page.y
            };

            me._overDataPoint(me.dataPointAtXPixel(point.x), evt);



        });

        me.canvas.addEvent('mouseout', function(evt) {
            me._out(evt);

        });

        me.canvas.addEvent('click', function(evt) {
            me._click(evt);

        });

        me.addEvent('mouseover', function(d) {
            me._highlight(d);

        });

        me.addEvent('mouseout', function(d) {
            me._unhighlight(d);
        });

    },

    /**
     * renders highlighted dataset, over top of current dataset without clearing.
     */
    _highlight: function(d) {

        var me = this;
        if (me.options.highlightTemplate) {

            me._render([d], {
                lineColor: me.options.highlightLineColor,
                shadowColor: 'rgba(0,0,0,0.5)',
                fillGradientArray: me.options.highlightFillGradientArray
            });


        }
    },
    /**
     * redraws the entire graph. could be optimized to clear and redraw only the highlighted area.
     */
    _unhighlight: function() {
        var me = this;
        if (me.options.highlightTemplate) {
            if (me.context) {
                me.context.clearRect(0, 0, me.canvas.width, me.canvas.height);
            }
            if (me.data && me.data.length) {
                me._render(me.data.slice(0));
            }
        }
    },


    checkResize:function(){} //overriden by default template.

});

UIGraph.DefaultGraphTemplate = function(element) {

var me = this;
//var height=me.options.height||250;
//var width=me.options.width||400;

if (me.options.width <= 100 && me.options.widthUnit == '%') {
    var w = me.options.width;
    me.options.width = element.getSize().x * (w / 100);
    var t = null;
    var checkResize = function() {
        if (t) {
            clearTimeout(t);
        }
        t = setTimeout(function() {
            t = null;
            me.options.width = element.getSize().x * (w / 100);
            me.canvas.setAttribute('width', me.options.width);
            if (me.context) {
                me.context.clearRect(0, 0, me.canvas.width, me.canvas.height);
            }
            if (me.data && me.data.length) {
                me._render(me.data.slice(0));
            }
        }, 250);
    }

    window.addEvent('resize', checkResize);
    window.addEvent('domready', function() {
        checkResize();
        setTimeout(checkResize, 2500);
    });


    me.checkResize=checkResize;
}


var canvas = new Element('canvas', {
    width: me.getWidth(true),
    height: me.getHeight(true)
});
canvas.innerHTML = '<p>your browser sucks.</p>';
me.canvas = canvas;
element.appendChild(canvas);
var context = canvas.getContext('2d');
me.context = context;


};




UIGraph.CubicSplineTemplate = function(data) {
var me = this;

var last = false;
var cSpline = UIGraph.CalculateNaturalCubicSpline.bind(me)(data);
Array.each(me.data, function(d, i) {
    if (i > 0) {
        var from = [me.getXPixel(last[0]), me.getYPixel(last[1])];
        var to = [me.getXPixel(d.x), me.getYPixel(d.y)];
        var j = i - 1;

        me.drawCurve(from, to, function(x) {


            var value = cSpline.a[j] + cSpline.b[j] * (x - me.getXPixel(j)) + cSpline.c[j] * Math.pow((x - me.getXPixel(j)), 2) + cSpline.d[j] * Math.pow((x - me.getXPixel(j)), 3);

            return value;
        });


    }
    last = [d.x, d.y];
});

};

UIGraph.LineTemplate = function() {
var me = this;

var last = false;

Array.each(me.data, function(d, i) {
    if (i > 1) {
        var from = [me.getXPixel(last[0]), me.getYPixel(last[1])];
        var to = [me.getXPixel(d.x), me.getYPixel(d.y)];
        me.drawLinearLine(from, to);


    }
    last = [d.x, d.y];
});
};

UIGraph.UnitStepTemplate = function() {
var me = this;

var last = false;

Array.each(me.data, function(d, i) {
    if (i > 1) {

        var yFrom = me.getYPixel(last[1]);
        var yTo = me.getYPixel(d.y);
        var xTo = me.getXPixel(d.x);
        var from = [me.getXPixel(last[0]), yFrom];
        var to = [xTo, yFrom];
        me.drawLinearLine(from, to);

        if (yFrom != yTo) {
            me.drawLinearLine(to, [xTo, yTo]);
        }



    }
    last = [d.x, d.y];
});


};


UIGraph.UnitStepBarsHighlighter = function() {
    //deprecated
};

UIGraph.UnitStepBarsTemplate = function(data) {

var me = this;
var last = [0, 0];
var y0 = me.getYPixel(0);

data.push({
    x: data[data.length - 1].x + 1,
    y: data[data.length - 1].y
});

Array.each(data, function(d) {
    //if(i>1){

    var yTo = me.getYPixel(d.y);
    var xTo = me.getXPixel(d.x);

    var yFrom = me.getYPixel(last[1]);

    var from = [me.getXPixel(last[0]), yFrom];
    var to = [xTo, yFrom];
    me.drawLinearLine(from, to);

    if (yTo != y0) {
        me.drawLinearLine(to, [xTo, y0]);
        me.drawLinearLine([xTo, y0], to);
    }

    if (yFrom != yTo) {
        me.drawLinearLine(to, [xTo, yTo]);
    }

    //}
    last = [d.x, d.y];
});
};




UIGraph.DefaultTitleTemplate = function(title) {
var me = this;
if (!me.titleEl) {
    me.titleEl = new Element('div', {
        'class': me.options.classNamePrefix + 'Title'
    });
    me.element.appendChild(me.titleEl);
}
me.titleEl.innerHTML = title;
};

UIGraph.DefaultLabels = function() {};

UIGraph.CalculateNaturalCubicSpline = function(data) {
//Algorithm 3.4 Numerical Analysis 8th Ed. 


var me = this;
var x = [];
var a = [];
var n = data.length - 1;
Array.each(data, function(d) {
    var xA = me.getXPixel(d.x);
    var yA = me.getYPixel(d.y);


    x.push(xA);  a.push(yA);


//assume object of [{x: number,y: number},...] values or indexed array of values (and x is arbitrary.) [{value: number, ...},{},...]
});

//step 1
var i = 0;
var h = [];
for (i = 0; i < n; i++) {
    h[i] = (x[i + 1] - x[i]);
}
//step 2
var alpha = [];
for (i = 1; i < n; i++) {
    alpha[i] = ((3.0 / h[i]) * (a[i + 1] - a[i]) - (3.0 / h[i - 1]) * (a[i] - a[i - 1]));
}

//step 3
var l = [1.0];
var u = [0.0];
var z = [0.0];

//step 4
for (i = 1; i < n; i++) {
    l[i] = 2.0 * (x[i + 1] - x[i - 1]) - h[i - 1] * u[i - 1];
    u[i] = h[i] / l[i];
    z[i] = (alpha[i] - h[i - 1] * z[i - 1]) / l[i];
}

//step 5
var b = [];
var c = [];
var d = [];

l[n] = 1.0;
c[n] = 0.0;
z[n] = 0.0;

//step 6
var j = n - 1;
for (j = n - 1; j > -1; j--) {
    c[j] = z[j] - u[j] * c[j + 1];
    b[j] = (a[j + 1] - a[j]) / h[j] - h[j] * (c[j + 1] + 2.0 * c[j]) / 3.0;
    d[j] = (c[j + 1] - c[j]) / (3.0 * h[j]);
}
//JSConsole(['spline',{returns:{a:a,b:b,c:c,d:d},other:{n:n,a:a,x:x,h:h,alpha:alpha,l:l,u:u,z:z}}]);
return {
    a: a,
    b: b,
    c: c,
    d: d
};
};