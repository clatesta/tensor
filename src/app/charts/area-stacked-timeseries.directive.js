/**!
 *
 *  Copyright 2015 Netflix, Inc.
 *
 *     Licensed under the Apache License, Version 2.0 (the "License");
 *     you may not use this file except in compliance with the License.
 *     You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 *     Unless required by applicable law or agreed to in writing, software
 *     distributed under the License is distributed on an "AS IS" BASIS,
 *     WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *     See the License for the specific language governing permissions and
 *     limitations under the License.
 *
 */

 /*global d3, nv*/

(function() {
    'use strict';

    function areaStackedTimeSeries($rootScope, $log, D3Service) {

        function link(scope) {
            scope.id = D3Service.getId();
            scope.flags = $rootScope.flags;
            scope.properties = $rootScope.properties;

            var chart, d3Chart;
            nv.addGraph(function() {
                var height = 250;

                chart = nv.models.stackedAreaWithFocusChart().options({
                    duration: 0,
                    useInteractiveGuideline: true,
                    interactive: false,
                    showLegend: true,
                    showXAxis: true,
                    showYAxis: true,
                    focusShowAxisY: true,
                    clipEdge: true,
                    showControls: false
                });
                chart.margin({left: 45, right: 30, top: 0, bottom: 3});
                chart.focusMargin({left: 45, right: 30, top: 0, bottom: 0});
                chart.focusHeight(60);
                chart.height(height);

                if (scope.forcey) {
                    chart.yDomain([0, scope.forcey]);
                    chart.focus.yDomain([0, scope.forcey]);
                }

                chart.x(D3Service.xFunction());
                chart.y(D3Service.yFunction());

                chart.xAxis.tickFormat(D3Service.xAxisTickFormat());
                chart.x2Axis.axisLabel(d3.time.format('%e %B %Y')(new Date()))
                                    .tickFormat(D3Service.xAxisTickFormat());

                if (scope.percentage) {
                    chart.yAxis.tickFormat(D3Service.yAxisPercentageTickFormat());
                } else if (scope.integer) {
                    chart.yAxis.tickFormat(D3Service.yAxisIntegerTickFormat());
                } else {
                    chart.yAxis.tickFormat(D3Service.yAxisTickFormat());
                }
                nv.utils.windowResize(chart.update);

                d3Chart = d3.select('#' + scope.id + ' svg')
                    .datum(scope.$parent.widgetData);
                d3Chart.style('height', height + 20 + 'px')
                    .transition().duration(0)
                    .call(chart);

                return chart;
            });

            scope.$on(scope.updatetoggle, function() {
                var data = scope.$parent.widgetData;
                if (chart !== undefined && data.length) {
                    var min = Math.max(_.last(data[0].values).x - scope.properties.window * 60000,
                                   _.first(data[0].values).x);
                    chart.brushExtent([min, _.last(data[0].values).x]);
                }

                d3Chart.datum(data)
                    .transition().duration(0)
                    .call(chart);
                chart.update();
            });

            $(window).on("resize.doResize", _.throttle(function() {
                scope.$apply(function() {
                    if (chart !== undefined) {
                        chart.update();
                    }
                });
            },100));

        }

        return {
            restrict: 'A',
            scope: {
                percentage: '=',
                integer: '=',
                forcey: '=',
                templateurl: '@templateurl',
                updatetoggle: '@updatetoggle'
            },
            template: '<div ng-include="templateurl"></div>',
            link: link
        };
    }

    areaStackedTimeSeries.$inject = [
        '$rootScope',
        '$log',
        'D3Service'
    ];

    angular
        .module('app.charts')
        .directive('areaStackedTimeSeries', areaStackedTimeSeries);
})();
