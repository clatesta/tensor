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

/*jslint node: true*/
/*global angular*/
/*jslint browser: true*/
/*jslint nomen: true */

(function() {
    'use strict';

    /**
    * @name DashboardCtrl
    * @desc Main dashboard Controller
    */
    function DashboardCtrl($document, $rootScope, $log, $route, $routeParams,
            widgetDefinitions, baselinewidgets, pcpwidgets, wrkwidgets,
            DashboardService) {
        var vm = this;
        var path = $route.current.$$route.originalPath;

        $rootScope.alerts = [];

        $rootScope.addAlert = function(type, msg, timeout) {
            if (typeof timeout == 'undefined') {
                timeout = 4000;
            } else if (timeout == 'stay') {
                timeout = undefined;
            }
            $rootScope.alerts.push({type: type, msg: msg, timeout: timeout});
        };

        $rootScope.closeAlert = function(index) {
            $rootScope.alerts.splice(index, 1);
        };

        /**
        * @name activate
        * @desc Initiliazes DashboardController
        */
        function activate() {
            DashboardService.initializeProperties();

            if ($routeParams.host) {
                vm.inputHost = $routeParams.host;
                $log.info('Host: ' + $routeParams.host);
                if ($routeParams.hostspec) {
                    $rootScope.properties.hostspec = $routeParams.hostspec;
                    $log.info('Hostspec: ' + $routeParams.hostspec);
                }
                DashboardService.updateHost(vm.inputHost);
            }
            $log.info('Dashboard controller initialized with ' + path + ' view.');

            $rootScope.$on('$locationChangeStart', function(event) {
                if (vm.inputhost) {
                    var answer = confirm("Are you sure you want to leave this page?\nall data will be lost?");
                    if (!answer) {
                        event.preventDefault();
                    }
                }
            });
        }

        vm.layoutOptions = {
            widgetDefinitions: widgetDefinitions,
            lockDefaultLayouts: true,
            defaultLayouts: [
            {
                title: 'Baseline',
                link: 'http://docs.internal.unified-streaming.com/design/performance/tensor.html#baseline',
                visibility: function() {
                    return $rootScope.flags.baselineMetricsAvailable;
                },
                player: true,
                active: true,
                widgetWidth: 'col-lg-6',
                defaultWidgets: baselinewidgets
            },
            {
                title: 'Load test metrics',
                link: 'http://docs.internal.unified-streaming.com/design/performance/tensor.html#tensor',
                visibility: function() {
                    return $rootScope.flags.wrkMetricsAvailable;
                },
                titleAddition: true,
                active: true,
                widgetWidth: 'col-lg-4',
                defaultWidgets: wrkwidgets
            },
            {
                title: 'Host metrics',
                link: 'http://docs.internal.unified-streaming.com/design/performance/tensor.html#pcp',
                visibility: function() {
                    return $rootScope.flags.pcpMetricsAvailable;
                },
                active: true,
                widgetWidth: 'col-lg-4',
                defaultWidgets: pcpwidgets
            }]
        };

        vm.widgetOptions = {
            widgetButtons: false,
            hideWidgetName: true,
            hideWidgetSettings: true,
            hideWidgetClose: true,
            hideToolbar: true
        };

        // Export controller public functions
        vm.updateInterval = DashboardService.updateInterval;
        vm.updateHost = function() {
            DashboardService.updateHost(vm.inputHost);
        };
        vm.updateWindow = DashboardService.updateWindow;
        vm.updateConnections = DashboardService.updateConnections;

        vm.toggleWRK = DashboardService.toggleWRK;
        vm.freeze = DashboardService.freeze;

        vm.dumpMetricData = DashboardService.dumpMetricData;
        vm.dumpGraph = function(widget) {
            var img = DashboardService.dumpGraph($('#' + widget.dataModel.widgetScope.$$childHead.id + ' > svg'));

            // Create a temporary anchor to serve the image to the client.
            var anchor = document.createElement('a');
            anchor.download = widget.title.replace(/\s+/g, '_').toLowerCase() + '.png';
            anchor.href = img;

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        };

        vm.dumpGraphs = function() {
            var zip = DashboardService.dumpGraphs();

            // Create a temporary anchor to serve the image to the client.
            var anchor = document.createElement('a');
            anchor.download = 'graphs.zip';
            anchor.href = zip;

            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        };

        vm.isHostnameExpanded = false;
        vm.inputHost = '';

        vm.populatePlayer = function() {
            if ($rootScope.flags.manifestAvailable && $rootScope.properties.player.isReady()) {
                return true;
            } else if ($rootScope.flags.manifestAvailable) {
                $rootScope.properties.player.initialize(document.querySelector("#videoPlayer"), $rootScope.properties.orig_host, false);
                $rootScope.properties.player.getDebug().setLogToBrowserConsole(false);
                return false;
            }
            return false;
        };

        activate();
    }

    DashboardCtrl.$inject = [
        '$document',
        '$rootScope',
        '$log',
        '$route',
        '$routeParams',
        'widgetDefinitions',
        'baselinewidgets',
        'pcpwidgets',
        'wrkwidgets',
        'DashboardService'
    ];

    angular
        .module('app.controllers', [])
        .controller('DashboardController', DashboardCtrl);

    function DashboardFile(DashboardService) {
        return {
            scope: {
                fileread: "="
            },
            link: function(scope, element, attributes) {
                element.bind("change", function(changeEvent) {
                    var reader = new FileReader();
                    reader.onload = function(loadEvent) {
                        scope.$apply(function() {
                            scope.fileread = loadEvent.target.result;
                        });
                        DashboardService.loadMetricData();
                    };
                    reader.readAsText(changeEvent.target.files[0]);
                });
            }
        };
    }

    DashboardFile.$inject = [
        'DashboardService'
    ];

    angular
        .module('app.directives')
        .directive("fileread", DashboardFile);

})();
