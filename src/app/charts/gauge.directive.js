/**!
 *  Copyright 2015 Unified-Streaming, Inc.
 *
 */

/*global d3, nv*/

(function() {
    'use strict';
    function gauge($rootScope, $log, D3Service) {
        function link(scope) {
            scope.id = D3Service.getId();
            scope.flags = $rootScope.flags;
            scope.properties = $rootScope.properties;

            var zones = JSON.parse('[' + scope.zones + ']'),
                color = scope.color.split(',');

            var chart, d3Chart;
            nv.addGraph(function() {
                var height = 270;
                chart = nv.models.gauge().options({
                    duration: 0,
                    min: 0,
                    max: scope.max,
                    zones: zones,
                    color: color,
                    title: scope.title
                });

                chart.margin({'left': 0, 'right': 0, 'top': 0, 'bottom': 0});
                chart.height(height);
                chart.width($("#" + scope.id).parent().width());
                chart.valueFormatter(function(d) {
                        return d3.format('.02f')(d) + ' ' + scope.format;
                    }
                );

                nv.utils.windowResize(chart.update);

                d3Chart = d3.select('#' + scope.id + ' svg')
                    .datum(scope.$parent.widgetData);
                d3Chart.style('height', height + 'px')
                    .transition().duration(0)
                    .call(chart);

                return chart;
            });

            scope.$on(scope.updatetoggle, function() {
                var data = scope.$parent.widgetData;
                if (chart !== undefined && data.length) {
                    var new_val = _.last(data[0].values).y;
                    if (scope.type == 'throughput') {
                        if (12.5 < new_val && new_val < 125) {
                            chart.max(125);
                            chart.zones([0, 100, 110, 125]);
                            chart.title('Estimated 1Gbit/s Interface');
                        } else if (125 < new_val && new_val < 1250) {
                            chart.max(1250);
                            chart.zones([0, 1000, 1100, 1250]);
                            chart.title('Estimated 10Gbit/s Interface');
                        }
                    }
                    d3Chart.datum(scope.$parent.widgetData)
                        .transition().duration(0)
                        .call(chart);
                    chart.update();
                }
            });

            $(window).on("resize.doResize", _.throttle(function() {
                scope.$apply(function() {
                    if (chart !== undefined) {
                        chart.width($("#" + scope.id).width());
                        chart.update();
                    }
                });
            },100));

        }

        return {
            restrict: 'A',
            scope: {
                data: '=',
                percentage: '=',
                integer: '=',
                max: '=',
                title: '@',
                type: '@',
                zones: '@',
                color: '@',
                format: '@',
                templateurl: '@',
                updatetoggle: '@'
            },
            template: '<div ng-include="templateurl"></div>',
            link: link
        };
    }

    gauge.$inject = [
        '$rootScope',
        '$log',
        'D3Service'
    ];

    angular
        .module('app.charts')
        .directive('gauge', gauge);

})();
