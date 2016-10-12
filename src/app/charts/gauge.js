/*global d3, nv, jquery, document*/

(function() {
    'use strict';
    nv.models.gauge = function() {

        //============================================================
        // Public Variables with Default Settings
        //------------------------------------------------------------

        var title = false,
            margin = {top: 30, right: 20, bottom: 50, left: 60},
            width = null,
            height = null,
            dispatch = d3.dispatch('chartClick', 'renderEnd'),
            data = null,
            noData = null,
            duration = 250,
            min = 0, max = 100,
            range = max - max,
            color = nv.utils.getColor(['#db4e4e', '#f78f20', '#88ac67']),
            zones = [0, 15, 20, 100];

        // Format function for the tooltip values column.
        var valueFormatter = function(d) {
            return d;
        };

        // Format function for the tooltip header value.
        var headerFormatter = function(d) {
            return d;
        };

        var keyFormatter = function(d) {
            return d;
        };

        //============================================================
        // chart function
        //------------------------------------------------------------

        var renderWatch = nv.utils.renderWatch(dispatch, duration);

        function chart(selection) {
            renderWatch.reset();

            selection.each(function(data) {
                var container = d3.select(this);
                nv.utils.initSVG(container);

                var availableWidth = nv.utils.availableWidth(width, container, margin),
                    availableHeight = nv.utils.availableHeight(height, container, margin),
                    size = Math.min(availableWidth, availableHeight),
                    fontSize = Math.round(size / 10),
                    radius = size / 2,
                    cx = availableWidth / 2,
                    cy = availableHeight / 2;
                chart.update = function() {
                    if (duration === 0) {
                        container.call(chart);
                    } else {
                        container.transition().duration(duration).call(chart);
                    }
                };
                chart.container = this;

                // Display noData message if there's nothing to show.
                if (!data || !data.length || !data.filter(function(d) { return d.values.length; }).length) {
                    nv.utils.noData(chart, container);
                    return chart;
                } else {
                    container.selectAll('.nv-noData').remove();
                }

                data = _.last(data[0].values);

                // Setup containers and skeleton of chart
                var wrap = container.selectAll('.nv-wrap.nv-gauge').data([data]);
                var wrapEnter = wrap.enter().append('g').attr('class','nvd3 nv-wrap nv-gauge');
                var g_bands = wrapEnter.append('g').attr('class', 'nv-gaugeBands');
                var g_title = wrapEnter.append('g').attr('class', 'nv-gaugeTitle');
                var g_needle = wrapEnter.append('g').attr('class', 'nv-gaugeNeedle');
                var g_label = wrapEnter.append('g').attr('class', 'nv-gaugeLabel');

                wrap.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

                // draw gauge bands
                for (var i=0; i < zones.length - 1; i++) {
                    drawBand(zones[i], zones[i + 1], color(i), min, max, radius, g_bands);
                }

                // draw needle
                var needlePath = buildNeedlePath(data.y, range, cx, cy, min, max, radius);
                var needleLine = d3.svg.line()
                    .x(function(d) { return d.x; })
                    .y(function(d) { return d.y; })
                    .interpolate("basis");

                g_needle.append("path")
                    .data([needlePath])
                    .attr("d", needleLine);

                g_needle.append('circle')
                    .attr('cx', 0)
                    .attr('cy', 0)
                    .attr('r', 0.115 * radius);

                wrap.selectAll('.nv-gaugeBands path')
                    .attr("transform", function() { return "translate(" + cx + ", " + cy + ") rotate(270)"; });

                wrap.select('.nv-gaugeNeedle')
                    .attr('transform', 'translate(' + cx + ',' + cy + ')');

                wrap.select('.nv-gaugeTitle')
                    .attr('transform', 'translate(' + cx + ',' + (cy + radius - fontSize) + ')');

                wrap.select('.nv-gaugeLabel')
                    .attr('transform', 'translate(' + cx + ',' + (cy + radius - fontSize * 2.2) + ')');

                // draw title
                if (title) {
                    g_title.append("text")
                        .attr("dy", fontSize / 2)
                        .attr("text-anchor", "middle")
                        .text(title)
                        .style("font-size", fontSize * 0.6 + "px");
                }

                // draw value
                g_label.append("text")
                    .data([data.y])
                    .attr("dy", fontSize / 2)
                    .attr("text-anchor", "middle")
                    .text(valueFormatter)
                    .style("font-size", fontSize * 0.9 + "px");

                // draws a gauge band
                function drawBand(start, end, color, min, max, radius, element) {
                    if (0 >= end - start) return;

                    element.append("path")
                        .style("fill", color)
                        .attr("d", d3.svg.arc()
                            .startAngle(valueToRadians(start, min, max))
                            .endAngle(valueToRadians(end, min, max))
                            .innerRadius(0.75 * radius)
                            .outerRadius(0.95 * radius))
                        .attr("transform", function() { return "translate(" + radius + ", " + radius + ") rotate(270)"; });
                }

                function buildNeedlePath(value, range, cx, cy, min, max, radius) {
                    var delta = range / 1;
                    var tailValue = value - (range * (1 / (270 / 360)) / 2);

                    var head = centerPoint(valueToPoint(value, 0.8, min, max, radius), cx, cy);
                    var head1 = centerPoint(valueToPoint(value - delta, 0.12, min, max, radius), cx, cy);
                    var head2 = centerPoint(valueToPoint(value + delta, 0.12, min, max, radius), cx, cy);

                    var tail = centerPoint(valueToPoint(tailValue, 0, min, max, radius), cx, cy);
                    var tail1 = centerPoint(valueToPoint(tailValue - delta, 0.12, min, max, radius), cx, cy);
                    var tail2 = centerPoint(valueToPoint(tailValue + delta, 0.12, min, max, radius), cx, cy);

                    function centerPoint(point, cx, cy) {
                        point.x -= cx;
                        point.y -= cy;
                        return point;
                    }

                    return [head, head1, tail2, tail, tail1, head2, head];
                }

                function valueToDegrees(value, min, max) {
                    range = max - min;
                    return value / range * 270 - (min / range * 270 + 45);
                }

                function valueToRadians(value, min, max) {
                    return valueToDegrees(value, min, max) * Math.PI / 180;
                }

                function valueToPoint(value, factor, min, max, radius) {
                    return {
                        x: cx - radius * factor * Math.cos(valueToRadians(value, min, max)),
                        y: cy - radius * factor * Math.sin(valueToRadians(value, min, max))
                    };
                }
            });

            renderWatch.renderEnd('gauge immediate');
            return chart;
        }

        //============================================================
        // Expose Public Variables
        //------------------------------------------------------------

        chart.dispatch = dispatch;
        chart.options = nv.utils.optionsFunc.bind(chart);

        chart._options = Object.create({}, {
            // simple options, just get/set the necessary values
            width: {get: function() {return width;}, set: function(_) {width=_;}},
            height: {get: function() {return height;}, set: function(_) {height=_;}},
            title: {get: function() {return title;}, set: function(_) {title=_;}},
            valueFormatter: {get: function() {return valueFormatter;}, set: function(_) {valueFormatter=_;}},
            headerFormatter: {get: function() {return headerFormatter;}, set: function(_) {headerFormatter=_;}},
            keyFormatter: {get: function() {return keyFormatter;}, set: function(_) {keyFormatter=_;}},
            noData: {get: function() {return noData;}, set: function(_) {noData=_;}},
            zones: {get: function() {return zones;}, set: function(_) {zones=_;}},

            // options that require extra logic in the setter
            duration: {get: function() {return duration;}, set: function(_) {
                duration = _;
                renderWatch.reset(duration);
            }},
            min: {get: function() {return min;}, set: function(_) {
                min = _;
                range = max - max;
            }},
            max: {get: function() {return max;}, set: function(_) {
                max = _;
                range = max - min;
            }},

            margin: {get: function() {return margin;}, set: function(_) {
                margin.top    = typeof _.top    != 'undefined' ? _.top    : margin.top;
                margin.right  = typeof _.right  != 'undefined' ? _.right  : margin.right;
                margin.bottom = typeof _.bottom != 'undefined' ? _.bottom : margin.bottom;
                margin.left   = typeof _.left   != 'undefined' ? _.left   : margin.left;
            }},

            color: {get: function() {return color;}, set: function(_) {
                color=nv.utils.getColor(_);
            }}
        });

        nv.utils.initOptions(chart);
        return chart;
    };
})();
