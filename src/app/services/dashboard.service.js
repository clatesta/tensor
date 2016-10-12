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
(function() {
     'use strict';

    /**
     * @name DashboardService
     * @desc
     */
    function DashboardService($rootScope, $http, $interval, $log, $location,
            PMAPIService, TensorAPIService, MetricListService, tensorConfig) {

        var loopErrors = 0;
        var intervalPromise;
        var intervalWRKPromise;

        function generateStyleDefs(svgDomElement) {
            if (svgDomElement.firstChild.tagName == 'DEFS') {
                $log.info('styles already calculated');
                return;
            }
            var styleDefs = "";
            var sheets = document.styleSheets;
            for (var i = 0; i < sheets.length; i++) {
                var rules = sheets[i].cssRules;
                for (var j = 0; j < rules.length; j++) {
                    var rule = rules[j];
                    if (rule.style) {
                        var selectorText = rule.selectorText;
                        var elems = [];
                        try {
                            elems = svgDomElement.querySelectorAll(selectorText);
                        } catch (err) {
                            console.warn('Invalid CSS selector "' + selectorText + '"', err);
                        }
                        if (elems.length) {
                          styleDefs += selectorText + " { " + rule.style.cssText + " }\n";
                        }
                    }
                }
            }

            var s = document.createElement('style');
            s.setAttribute('type', 'text/css');
            // s.innerHTML = "<![CDATA[\n" + styleDefs + "\n]]>";
            //somehow cdata section doesn't always work; you could use this instead:
            s.innerHTML = styleDefs;

            var defs = document.createElement('defs');
            defs.appendChild(s);
            svgDomElement.insertBefore(defs, svgDomElement.firstChild);
        }

        function parseValues(obj) {
            var split = obj.split(',');
            return {
                x: parseFloat(split[1]),
                y: parseFloat(split[2])
            };
        }

        function resetWrkDashboard() {
            $rootScope.properties.currentConnections = $rootScope.properties.connections.val[0];
            $rootScope.properties.currentConnectionStep = 0;
        }

        /**
        * @name cancelInterval
        * @desc
        */
        function cancelInterval() {
            if (intervalPromise) {
                $interval.cancel(intervalPromise);
                $log.info('Interval canceled.');
            }
        }

        /**
        * @name cancelInterval
        * @desc
        */
        function cancelWRKInterval() {
            if (intervalWRKPromise) {
                $interval.cancel(intervalWRKPromise);
                $log.info('Interval canceled.');
                $rootScope.addAlert(
                    'info',
                    'Load stopped.'
                );
            }
        }

        /**
        * @name updateMetricsCallback
        * @desc
        */
        function updateMetricsCallback(success) {
            if (!success) {
                loopErrors = loopErrors + 1;
            } else {
                loopErrors = 0;
            }
            if (loopErrors > 5) {
                cancelInterval(intervalPromise);
                loopErrors = 0;
                $rootScope.addAlert(
                    'danger',
                    'Consistently failed fetching metrics from host (>5). Aborting loop. Please make sure PCP is running correctly.'
                );
            }
        }

        /**
        * @name updateWRKMetricsCallback
        * @desc
        */
        function updateWRKMetricsCallback(success) {
            if (!success) {
                loopErrors = loopErrors + 1;
            } else {
                loopErrors = 0;
            }
            if (loopErrors > 5) {
                cancelWRKInterval(intervalWRKPromise);
                loopErrors = 0;
                $rootScope.addAlert(
                    'danger',
                    'Consistently failed fetching metrics from host (>5). Aborting loop. Please make sure your log replay file is consistent.'
                );
            }
        }

        /**
        * @name intervalFunction
        * @desc
        */
        function intervalFunction() {
            MetricListService.updateMetrics(updateMetricsCallback);
        }

        /**
        * @name intervalWRKFunction
        * @desc
        */
        function intervalWRKFunction() {
            MetricListService.updateWRKMetrics(updateWRKMetricsCallback);
            if ($rootScope.flags.wrkRunning && !($rootScope.flags.freezeConnections))
                advanceConnection();
        }

        /**
        * @name advanceConnection
        * @desc
        */
        function advanceConnection() {
            var steps, currentStep, range, freeze, currentCon;

            // Increase current ConnectionStep til ConnectionStep max.
            currentStep = $rootScope.properties.currentConnectionStep;
            currentCon = $rootScope.properties.currentConnections;
            steps = $rootScope.properties.connectionSteps.val;

            $rootScope.properties.currentConnectionStep = currentStep + 1;
            if ($rootScope.properties.currentConnectionStep >= steps) {
                $rootScope.properties.currentConnections = currentCon + 1;
                $rootScope.properties.currentConnectionStep = 0;
            }

            // Set connections to 0 if max is reached.
            range = $rootScope.properties.connections.val;

            if (currentCon > range[1]) {
                $rootScope.flags.wrkRunning = false;
                $rootScope.properties.currentConnections = range[0];
                $rootScope.properties.currentConnectionStep = 0;
            }
        }

        /**
        * @name updateInterval
        * @desc
        */
        function updateInterval() {
            cancelInterval(intervalPromise);

            if ($rootScope.properties.host) {
                if ($rootScope.properties.context &&
                    $rootScope.properties.context > 0) {
                    intervalPromise = $interval(intervalFunction, $rootScope.properties.interval * 1000);
                } else {
                    $rootScope.addAlert(
                        'info',
                        'Invalid context. Please update host to resume operation.'
                    );
                }
                $log.info('Interval updated.');
                $rootScope.addAlert(
                    'info',
                    'Interval updated.'
                );
            }
        }

        /**
        * @name updateWRKInterval
        * @desc
        */
        function updateWRKInterval() {
            cancelWRKInterval(intervalWRKPromise);

            if ($rootScope.properties.host) {
                intervalWRKPromise = $interval(intervalWRKFunction, $rootScope.properties.interval * 1000);
                $log.info('WRK interval updated.');
            }
        }

        /**
        * @name updateHostnameSuccessCallback
        * @desc
        */
        function updateHostnameSuccessCallback(data) {
            $rootScope.flags.pcpMetricsAvailable = true;
            $rootScope.properties.hostname = data.values[0].instances[0].value;
            $log.info('Hostname updated: ' + $rootScope.properties.hostname);
            $rootScope.addAlert(
                'success',
                'Hostname updated: ' + $rootScope.properties.hostname
            );
        }

        /**
        * @name updateHostnameErrorCallback
        * @desc
        */
        function updateHostnameErrorCallback() {
            $rootScope.flags.pcpMetricsAvailable = false;
            $rootScope.properties.hostname = 'Hostname not available.';
            $log.error('Error fetching hostname.');
        }

        /**
        * @name updateContextSuccessCallback
        * @desc
        */
        function updateContextSuccessCallback(data) {
            $rootScope.flags.contextAvailable = true;
            $rootScope.flags.pcpMetricsAvailable = true;
            $rootScope.properties.context = data;
            updateInterval();
        }

        /**
        * @name updateContextErrorCallback
        * @desc
        */
        function updateContextErrorCallback() {
            $rootScope.flags.contextAvailable = false;
            $rootScope.flags.pcpMetricsAvailable = false;

            $log.error('Error fetching context.');
        }

        /**
        * @name updateContext
        * @desc
        */
        function updateContext(host) {
            $log.info('Context updated.');

            var hostspec = $rootScope.properties.hostspec,
                hostMatch = null;

            if (host && host !== '') {
                $rootScope.properties.orig_host = host;
                hostMatch = host.match('(.*?:\/\/)');
                if (hostMatch === null) {
                    $rootScope.addAlert(
                        'danger',
                        'URL requires protocol specifier (http/https)'
                    );
                    return false;
                }

                $rootScope.flags.contextUpdating = true;
                $rootScope.flags.contextAvailable = false;
                hostMatch = host.match('.*?:\/\/(.*):([0-9]*)');

                if (hostMatch !== null) {
                    $rootScope.properties.host = hostMatch[1];
                    $rootScope.properties.port = hostMatch[2];
                    hostMatch = hostMatch[1].match('.*?:\/\/(.*?)\/');
                    if (hostMatch !== null) {
                        $rootScope.properties.host = hostMatch[1];
                    } else {
                        $rootScope.flags.wrkMetricsAvailable = false;
                        $rootScope.addAlert(
                            'danger',
                            'URL does not contain manifest.'
                         );
                        return false;
                    }
                } else {
                    $rootScope.properties.host = host;
                    hostMatch = host.match('.*?:\/\/(.*?)\/');
                    if (hostMatch !== null) {
                        $rootScope.properties.host = hostMatch[1];
                    } else {
                        $rootScope.flags.wrkMetricsAvailable = false;
                        $rootScope.addAlert(
                            'danger',
                            'URL does not contain manifest.'
                        );
                        return false;
                    }
                }

                TensorAPIService.setManifest()
                    .then(function(data) {
                        $rootScope.flags.manifestAvailable = data !== null;
                        if (data.bitrates !== null) {
                            $rootScope.properties.maxBitrate = Math.max.apply(Math, data.bitrates);

                            $rootScope.properties.bitRange.min = 0;
                            $rootScope.properties.bitRange.max = data.bitrates.length - 1;

                            $rootScope.properties.bitRange.options.stepsArray = data.bitrates;
                            $rootScope.properties.bitRange.options.translate = function(value) {
                                return (data.bitrates[value] / 1000).toFixed() + ' kbit';
                            };
                            $rootScope.$broadcast('rzSliderForceRender');
                        }
                    }, function errorHandler() {
                        $rootScope.flags.wrkMetricsAvailable = false;
                        $rootScope.addAlert(
                            'danger',
                            'Failed to set manifest with URL.'
                        );
                    });

                PMAPIService.getHostspecContext(hostspec, 600)
                    .then(function(data) {
                        $rootScope.flags.contextUpdating = false;
                        updateContextSuccessCallback(data);
                        PMAPIService.getMetrics(data, ['pmcd.hostname'])
                            .then(function(metrics) {
                                updateHostnameSuccessCallback(metrics);
                            }, function errorHandler() {
                                updateHostnameErrorCallback();
                            });
                    }, function errorHandler() {
                        $rootScope.addAlert(
                            'info',
                            'Failed fetching PCP context from host. Try updating the hostname.'
                        );
                        $rootScope.flags.contextUpdating = false;
                        $rootScope.flags.pcpMetricsAvailable = false;
                        updateContextErrorCallback();
                    });
                return true;
            } else {
                return false;
            }
        }

        /**
        * @name updateHost
        * @desc
        */
        function updateHost(host) {
            $log.info('Host updated.');

            $location.search('host', host);
            $location.search('hostspec', $rootScope.properties.hostspec);

            $rootScope.properties.context = -1;
            $rootScope.properties.hostname = null;
            $rootScope.properties.port = tensorConfig.port;

            MetricListService.clearMetricList();
            MetricListService.clearBaselineMetricList();
            MetricListService.clearDerivedMetricList();

            if (updateContext(host)) {
                MetricListService.updateBaselineMetrics();
            } else {
                $rootScope.flags.contextUpdating = false;
            }

            resetWrkDashboard();
            MetricListService.clearWRKMetricList();
            updateWRKInterval();
        }

        /**
        * @name updateWindow
        * @desc
        */
        function updateWindow() {
            $log.log('Window updated.');
        }

        /**
        * @name updateWindow
        * @desc
        */
        function updateConnections() {
            resetWrkDashboard();

            $log.log('Connections updated.');
            $rootScope.addAlert(
                'info',
                'Connections updated'
            );
        }

        /**
        * @name checkManifest
        * @desc checks if manifest file is present.
        */
        function checkManifest() {
            $log.log('Segment file checked.');
            if ($rootScope.flags.manifestAvailable) {
                return true;
            } else {
                $rootScope.addAlert(
                    'danger',
                    'No manifest file found'
                );
                return false;
            }

        }

        /**
        * @name filterManifest
        * @desc sends server update to filter Manifest.
        */
        function filterManifest(low, high) {
            var filter = {
                min: $rootScope.properties.bitRange.options.stepsArray[low],
                max: $rootScope.properties.bitRange.options.stepsArray[high]
            };
            TensorAPIService.setManifest(filter)
                .then(function(data) {

                }, function errorHandler() {
                    $rootScope.addAlert(
                        'danger',
                        'Failed to filter manifest'
                    );
                });
        }

        /**
        * @name toggleWRK
        * @desc Toggle wrk
        */
        function toggleWRK() {
            if ($rootScope.flags.wrkRunning) {
                $rootScope.flags.wrkRunning = false;
                $rootScope.alerts = [];
                $rootScope.addAlert(
                    'info',
                    'WRK stopped',
                    6000
                );
            } else if (checkManifest()) {
                $rootScope.flags.wrkRunning = true;
                $rootScope.alerts = [];
                resetWrkDashboard();
                MetricListService.clearWRKMetricList();
                $rootScope.addAlert(
                    'success',
                    'WRK started',
                    'stay'
                );
            }
        }


        /**
        * @name freeze
        * @desc freeze
        */
        function freeze() {
            $rootScope.flags.freezeConnections = !($rootScope.flags.freezeConnections);
            $rootScope.addAlert(
                'info',
                'Connections frozen at ' + $rootScope.properties.currentCon
            );
        }


        /**
        * @name dumpMetricData
        * @desc
        */
        function dumpMetricData() {
            var data = {};
            data.pcp = MetricListService.getPCPMetrics();
            data.wrk = MetricListService.getWRKMetrics();
            data.baseline = MetricListService.getBaselineMetrics();

            var csv = $.map(data, function(v, k) {
                return '#' + k + '\n' + $.grep($.map(v, function(val, key) {
                    if (val.length) {
                        return $.map(val, function(i) {
                            return key + ' ' + i.key + ' ' + i.iid + ' , x, y\n' + $.map(i.values, function(n) {
                                return ', ' + n.x + ', ' + n.y;
                                }).join('\n');
                            }).join('\n\n');
                    } else {
                        return '';
                    }
                }), Boolean).join('\n\n');
            }).join('\n\n');

            var anchor = document.createElement('a');
            anchor.download = 'data.csv';
            anchor.href = "data:text/csv," + encodeURIComponent(csv);
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
        }

        /**
        * @name loadMetricData
        * @desc
        */
        function loadMetricData() {
            // Cancel running Promises.
            cancelInterval();
            cancelWRKInterval();

            var metrics = $rootScope.properties.metricsFile,
                re, re2, m, m2, graphs, graph_key, line_key, iid, data = {};
            re = /(?:#(pcp)\n([\s\S]*)\n)(?:#(wrk)\n([\s\S]*)\n)(?:#(baseline)\n([\s\S]*))/g;
            re2 = /(.*)\n([\s\S]*)/;
            if ((m = re.exec(metrics)) !== null) {
                for (var i = 1; i < m.length; i += 2) {
                    data[m[i]] = {};
                    graphs = m[i + 1].split('\n\n');
                    for (var j = 0; j < graphs.length; j++) {
                        m2 = re2.exec(graphs[j]);
                        if (m2 === null || m2[1] === '') {
                            continue;
                        }
                        graph_key = m2[1].split(' ')[0];
                        line_key = m2[1].split(' ')[1];
                        iid = parseInt(m2[1].split(' ')[2]);

                        if (graph_key in data[m[i]]) {
                            data[m[i]][graph_key].push({
                                iid: iid,
                                key: line_key,
                                values: m2[2].split('\n').map(parseValues)
                            });
                        } else {
                            data[m[i]][graph_key] = [{
                                iid: iid,
                                key: line_key,
                                values: m2[2].split('\n').map(parseValues)
                            }];
                        }
                    }
                }
            }
            MetricListService.loadBaselineMetrics(data.baseline);
            MetricListService.loadWRKMetrics(data.wrk);
            MetricListService.loadPCPMetrics(data.pcp);

            MetricListService.reloadDerivedMetrics();

            $rootScope.$broadcast('updateBaselineMetrics');
            $rootScope.$broadcast('updateWRKMetrics');
            $rootScope.$broadcast('updatePCPMetrics');
        }

        /**
        * @name dumpGraph
        * @desc
        */
        function dumpGraph(svg) {
            // Insert styling into svg.
            generateStyleDefs(svg[0]);

            // Serialize SVG for canvg parsing.
            var serializer = new XMLSerializer();
            var svgString = serializer.serializeToString(svg[0]);

            var width = svg.width();
            var height = svg.height();

            // Create canvas.
            var canvas = document.createElement('canvas');
            $(canvas)
               .attr('width', width)
               .attr('height', height);

            /*
             * Convert the serialized svg to a canvas with a dpi of 300.
             */
            canvg(canvas, svgString);

            var img = canvas.toDataURL('image/png');
            return img;
        }

        /**
        * @name dumpGraphs
        * @desc
        */
        function dumpGraphs() {
            var zip = new JSZip();
            /*
             * Filter all svg's on the page with criteria of not having text
             * as it's first child. Only for SVG with no data.
             */
            $('svg').filter(function() {
                return !($($(this).children()[0]).is('text'));
            }).each(function(i) {
                var img = dumpGraph($(this));
                var title = $(this).closest("div.panel").find('span.widget-title').text();
                title = title.replace(/\s+/g, '_').toLowerCase() + '.png';

                zip.file(title, img.split(',')[1], {base64: true});
            });

            return 'data:application/zip;base64,' + zip.generate({type: "base64"});
        }

        /**
        * @name initializeProperties
        * @desc
        */
        function initializeProperties() {
            if ($rootScope.properties) {
                if (!$rootScope.properties.interval) {
                    $rootScope.properties.interval = tensorConfig.interval;
                }
                if (!$rootScope.properties.window) {
                    $rootScope.properties.window = tensorConfig.window;
                }
                if (!$rootScope.properties.orig_host) {
                    $rootScope.properties.orig_host = '';
                }
                if (!$rootScope.properties.host) {
                    $rootScope.properties.host = '';
                }
                if (!$rootScope.properties.hostspec) {
                    $rootScope.properties.hostspec = tensorConfig.hostspec;
                }
                if (!$rootScope.properties.port) {
                    $rootScope.properties.port = tensorConfig.port;
                }
                if (!$rootScope.properties.connections) {
                    $rootScope.properties.connections = tensorConfig.connections;
                }
                if (!$rootScope.properties.connectionSteps) {
                    $rootScope.properties.connectionSteps = tensorConfig.connectionSteps;
                }
                if (!$rootScope.properties.bitRange) {
                    $rootScope.properties.bitRange = tensorConfig.bitRange;
                    $rootScope.properties.bitRange.options.onEnd = function(id, low, high) {
                        filterManifest(low, high);
                    };
                }
                if (!$rootScope.properties.currentConnections) {
                    $rootScope.properties.currentConnections = tensorConfig.connections.val[0];
                }
                if (!$rootScope.properties.lastConnections) {
                    $rootScope.properties.lastConnections = rootScope.properties.currentConnections;
                }
                if (!$rootScope.properties.currentConnectionStep) {
                    $rootScope.properties.currentConnectionStep = 0;
                }
                if (!$rootScope.properties.manifest) {
                    $rootScope.properties.manifest = '';
                }
                if (!$rootScope.properties.maxBitrate) {
                    $rootScope.properties.maxBitrate = 0;
                }
                if (!$rootScope.properties.player) {
                    $rootScope.properties.player = dashjs.MediaPlayer().create();
                }
                if (!$rootScope.properties.metricsFile) {
                    $rootScope.properties.metricsFile = '';
                }
                if (!$rootScope.properties.context ||
                    $rootScope.properties.context < 0) {
                    updateContext();
                } else {
                    updateInterval();
                }
            } else {
                $rootScope.properties = {
                    orig_host: '',
                    host: '',
                    hostspec: tensorConfig.hostspec,
                    port: tensorConfig.port,
                    connections: tensorConfig.connections,
                    bitRange: tensorConfig.bitRange,
                    connectionSteps: tensorConfig.connectionSteps,
                    currentConnections: tensorConfig.connections.val[0],
                    lastConnections: tensorConfig.connections.val[0],
                    currentConnectionStep: 0,
                    manifest: '',
                    maxBitrate: 0,
                    player: dashjs.MediaPlayer().create(),
                    context: -1,
                    hostname: null,
                    window: tensorConfig.window,
                    interval: tensorConfig.interval,
                    metricsFile: ''
                };
                $rootScope.properties.bitRange.options.onEnd = function(id, low, high) {
                    filterManifest(low, high);
                };
            }

            $rootScope.flags = {
                contextAvailable: false,
                contextUpdating: false,
                wrkRunning: false,
                freezeConnections: false,
                baselineUpdating: false,
                baselineMetricsAvailable: true,
                pcpMetricsAvailable: true,
                wrkMetricsAvailable: true,
                manifestAvailable: false
            };
        }

        ///////

        return {
            updateContext: updateContext,
            cancelInterval: cancelInterval,
            updateInterval: updateInterval,
            updateHost: updateHost,
            updateWindow: updateWindow,
            updateConnections: updateConnections,
            checkManifest: checkManifest,
            toggleWRK: toggleWRK,
            freeze: freeze,
            initializeProperties: initializeProperties,
            dumpMetricData: dumpMetricData,
            loadMetricData: loadMetricData,
            dumpGraph: dumpGraph,
            dumpGraphs: dumpGraphs
        };
    }

    angular
        .module('app.services')
        .factory('DashboardService', DashboardService);

 })();
