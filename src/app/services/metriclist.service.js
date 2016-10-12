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

 /*global _*/

 (function() {
    'use strict';


    /**
    * @name MetricListService
    * @desc
    */
    function MetricListService($rootScope, $http, $log, $q, PMAPIService,
            TensorAPIService, SimpleMetric, CumulativeMetric, ConvertedMetric,
            CumulativeConvertedMetric, DerivedMetric) {
        var simpleMetrics = [],
            derivedMetrics = [],
            baselineMetrics = [],
            wrkMetrics = [];

        /**
        * @name getOrCreateMetric
        * @desc
        */
        function getOrCreateMetric(name) {
            var metric = _.find(simpleMetrics, function(el) {
                return el.name === name;
            });

            if (angular.isUndefined(metric)) {
                metric = new SimpleMetric(name);
                simpleMetrics.push(metric);
            } else {
                metric.subscribers++;
            }
            return metric;
        }

        /**
        * @name getOrCreateWRKMetric
        * @desc
        */
        function getOrCreateWRKMetric(name) {
            var metric = _.find(wrkMetrics, function(el) {
                return el.name === name;
            });

            if (angular.isUndefined(metric)) {
                metric = new SimpleMetric(name);
                wrkMetrics.push(metric);
            } else {
                metric.subscribers++;
            }
            return metric;
        }

        /**
        * @name getOrCreateBaselineMetric
        * @desc
        */
        function getOrCreateBaselineMetric(name) {
            var metric = _.find(baselineMetrics, function(el) {
                return el.name === name;
            });

            if (angular.isUndefined(metric)) {
                metric = new SimpleMetric(name);
                baselineMetrics.push(metric);
            } else {
                metric.subscribers++;
            }
            return metric;
        }

        /**
        * @name getOrCreateCumulativeMetric
        * @desc
        */
        function getOrCreateCumulativeMetric(name) {
            var metric = _.find(simpleMetrics, function(el) {
                return el.name === name;
            });

            if (angular.isUndefined(metric)) {
                metric = new CumulativeMetric(name);
                simpleMetrics.push(metric);
            } else {
                metric.subscribers++;
            }
            return metric;
        }

        /**
        * @name getOrCreateConvertedMetric
        * @desc
        */
        function getOrCreateConvertedMetric(name, conversionFunction) {
            var metric = _.find(simpleMetrics, function(el) {
                return el.name === name;
            });

            if (angular.isUndefined(metric)) {
                metric = new ConvertedMetric(name, conversionFunction);
                simpleMetrics.push(metric);
            } else {
                metric.subscribers++;
            }
            return metric;
        }

        /**
        * @name getOrCreateCumulativeConvertedMetric
        * @desc
        */
        function getOrCreateCumulativeConvertedMetric(name, conversionFunction) {
            var metric = _.find(simpleMetrics, function(el) {
                return el.name === name;
            });

            if (angular.isUndefined(metric)) {
                metric = new CumulativeConvertedMetric(name, conversionFunction);
                simpleMetrics.push(metric);
            } else {
                metric.subscribers++;
            }
            return metric;
        }

        /**
        * @name getOrCreateDerivedMetric
        * @desc
        */
        function getOrCreateDerivedMetric(name, derivedFunction, derivedReloadFunction) {
            var metric = _.find(derivedMetrics, function(metric) {
                return metric.name === name;
            });

            if (angular.isUndefined(metric)) {
                metric = new DerivedMetric(name, derivedFunction, derivedReloadFunction);
                derivedMetrics.push(metric);
            } else {
                metric.subscribers++;
            }
            return metric;
        }

        /**
        * @name destroyMetric
        * @desc
        */
        function destroyMetric(name) {
            var index,
                metric = _.find(simpleMetrics, function(el) {
                    return el.name === name;
                });

            metric.subscribers--;

            if (metric.subscribers < 1) {
                index = simpleMetrics.indexOf(metric);
                if (index > -1) {
                    simpleMetrics.splice(index, 1);
                }
            }
        }

        /**
        * @name destroyBaselineMetric
        * @desc
        */
        function destroyBaselineMetric(name) {
            var index,
                metric = _.find(baselineMetrics, function(el) {
                    return el.name === name;
                });

            metric.subscribers--;

            if (metric.subscribers < 1) {
                index = baselineMetrics.indexOf(metric);
                if (index > -1) {
                    baselineMetrics.splice(index, 1);
                }
            }
        }

        /**
        * @name destroyẀRKMetric
        * @desc
        */
        function destroyWRKMetric(name) {
            var index,
                metric = _.find(wrkMetrics, function(el) {
                    return el.name === name;
                });

            metric.subscribers--;

            if (metric.subscribers < 1) {
                index = wrkMetrics.indexOf(metric);
                if (index > -1) {
                    wrkMetrics.splice(index, 1);
                }
            }
        }

        /**
        * @name destroyDerivedMetric
        * @desc
        */
        function destroyDerivedMetric(name) {
            var index,
                metric = _.find(derivedMetrics, function(el) {
                    return el.name === name;
                });

            metric.subscribers--;

            if (metric.subscribers < 1) {
                index = derivedMetrics.indexOf(metric);
                if (index > -1) {
                    derivedMetrics.splice(index, 1);
                }
            }
        }

        /**
        * @name clearMetricList
        * @desc
        */
        function clearMetricList() {
            angular.forEach(simpleMetrics, function(metric) {
                metric.clearData();
            });
        }

        /**
        * @name clearBaselineMetricList
        * @desc
        */
        function clearBaselineMetricList() {
            angular.forEach(baselineMetrics, function(metric) {
                metric.clearData();
            });
        }

        /**
        * @name clearMetricList
        * @desc
        */
        function clearWRKMetricList() {
            angular.forEach(wrkMetrics, function(metric) {
                metric.clearData();
            });
        }

        /**
        * @name clearDerivedMetricList
        * @desc
        */
        function clearDerivedMetricList() {
            angular.forEach(derivedMetrics, function(metric) {
                metric.clearData();
            });
        }

        /**
        * @name updateMetrics
        * @desc
        */
        function updateMetrics(callback) {
            var metricArr = [],
                url,
                host = $rootScope.properties.host,
                port = $rootScope.properties.port,
                context = $rootScope.properties.context;

            if (context && context > 0 && simpleMetrics.length) {
                angular.forEach(simpleMetrics, function(value) {
                    metricArr.push(value.name);
                });

                url = 'http://' + host + ':' + port + '/pmapi/' + context + '/_fetch?names=' + metricArr.join(',');

                PMAPIService.getMetrics(context, metricArr)
                    .then(function(metrics) {
                        angular.forEach(metrics.values, function(value) {
                            var name = value.name;
                            angular.forEach(value.instances, function(instance) {
                                var iid = angular.isUndefined(instance.instance) ? 1 : instance.instance;
                                var iname = metrics.inames[name].inames[iid];

                                var metricInstance = _.find(simpleMetrics, function(el) {
                                    return el.name === name;
                                });
                                if (angular.isDefined(metricInstance) && metricInstance !== null) {
                                    metricInstance.pushValue(metrics.timestamp, iid, iname, instance.value);
                                }
                            });
                        });
                    }).then(function() {
                        callback(true);
                        updateDerivedMetrics();
                        $rootScope.$broadcast('updatePCPMetrics');
                    },
                        function() {
                            $rootScope.addAlert(
                                'danger',
                                'Failed fetching pcp metrics.'
                            );
                            // Check if context is wrong and update it if needed
                            // PMWEBAPI error, code -12376: Attempt to use an illegal context
                            callback(false);
                    });

            }
        }

        /**
        * @name updateWRKMetrics
        * @desc
        */
        function updateWRKMetrics(callback) {
            var wrkRunning = $rootScope.flags.wrkRunning,
                wrkHasManifest = $rootScope.flags.manifestAvailable;
            if (wrkRunning && wrkHasManifest && wrkMetrics.length) {
                TensorAPIService.getWRKMetrics()
                    .then(function(metrics) {
                        angular.forEach(metrics.data, function(entry) {
                            var name = entry.name;
                            var metricInstance = _.find(wrkMetrics, function(el) {
                                return el.name === name;
                            });
                            if (angular.isDefined(metricInstance) && metricInstance !== null) {
                                metricInstance.pushValue(metrics.timestamp, -1, entry.iname, entry.data, metrics.connections);

                                if (metricInstance.name == 'network.wrk.throughput.step') {
                                    var maxInstance = _.find(wrkMetrics, function(el) {
                                        return el.name === 'network.wrk.throughput.max';
                                    });
                                    maxInstance.pushValue(metrics.timestamp, -1, entry.iname,
                                        Math.max.apply(null,$.map(metricInstance.data[0].values, function(obj) {
                                            return obj.y;
                                        })), metrics.connections
                                    );
                                }
                            }
                        });
                        $rootScope.properties.lastConnections = metrics.connections;
                    }).then(function() {
                        callback(true);
                        updateDerivedMetrics();
                        $rootScope.$broadcast('updateWRKMetrics');
                    }, function() {
                        $rootScope.addAlert(
                            'danger',
                            'Failed fetching wrk metrics.'
                        );
                        // Check if context is wrong and update it if needed
                        // PMWEBAPI error, code -12376: Attempt to use an illegal context
                        callback(false);
                    });
            }
        }

        /**
        * @name updateDerivedMetrics
        * @desc
        */
        function updateBaselineMetrics() {
            $rootScope.flags.baselineUpdating = true;
            TensorAPIService.getBaselineMetrics()
                .then(function(metrics) {
                    angular.forEach(metrics.data, function(entry) {
                        var name = entry.name;
                        var metricInstance = _.find(baselineMetrics, function(el) {
                            return el.name === name;
                        });
                        if (angular.isDefined(metricInstance) && metricInstance !== null) {
                            metricInstance.pushValue(metrics.timestamp, -1, entry.iname, entry.data);
                        }
                    });
                }).then(function() {
                    $rootScope.flags.baselineUpdating = false;
                }).then(function() {
                    $rootScope.flags.baselineMetricsAvailable = true;
                    $rootScope.$broadcast('updateBaselineMetrics');
                }, function() {
                    $rootScope.flags.baselineMetricsAvailable = false;
                    $rootScope.addAlert(
                        'danger',
                        'Failed fetching baseline metrics.'
                    );
                });
        }

        /**
        * @name updateDerivedMetrics
        * @desc
        */
        function updateDerivedMetrics() {
            if (derivedMetrics.length > 0) {
                angular.forEach(derivedMetrics, function(metric) {
                    metric.updateValues();
                });
            }
        }

        /**
        * @name reloadDerivedMetrics
        * @desc
        */
        function reloadDerivedMetrics() {
            if (derivedMetrics.length > 0) {
                angular.forEach(derivedMetrics, function(metric) {
                    metric.reloadValues();
                });
            }
        }

        /**
        * @name getPCPMetrics
        * @desc
        */
        function getPCPMetrics() {
            var data = {};
            angular.forEach(simpleMetrics, function(metric) {
                data[metric.name] = metric.dumpData();
            });
            return data;
        }

        /**
        * @name getBaselineMetrics
        * @desc
        */
        function getBaselineMetrics() {
            var data = {};
            angular.forEach(baselineMetrics, function(metric) {
                data[metric.name] = metric.dumpData();
            });
            return data;
        }

        /**
        * @name getWRKMetrics
        * @desc
        */
        function getWRKMetrics() {
            var data = {};
            angular.forEach(wrkMetrics, function(metric) {
                data[metric.name] = metric.dumpData();
            });
            return data;
        }

        /**
        * @name loadPCPMetrics
        * @desc
        */
        function loadPCPMetrics(data) {
            angular.forEach(data, function(graph, key) {
                var metricInstance = _.find(simpleMetrics, function(el) {
                    return el.name === key;
                });
                if (angular.isDefined(metricInstance) && metricInstance !== null) {
                    metricInstance.clearData();
                    metricInstance.loadData(graph);
                }
            });
        }

        /**
        * @name loadBaselineMetrics
        * @desc
        */
        function loadBaselineMetrics(data) {
            angular.forEach(data, function(graph, key) {
                var metricInstance = _.find(baselineMetrics, function(el) {
                    return el.name === key;
                });
                if (angular.isDefined(metricInstance) && metricInstance !== null) {
                    metricInstance.clearData();
                    metricInstance.loadData(graph);
                }
            });
        }

        /**
        * @name loadWRKMetrics
        * @desc
        */
        function loadWRKMetrics(data) {
            angular.forEach(data, function(graph, key) {
                var metricInstance = _.find(wrkMetrics, function(el) {
                    return el.name === key;
                });
                if (angular.isDefined(metricInstance) && metricInstance !== null) {
                    metricInstance.clearData();
                    metricInstance.loadData(graph);
                }
            });
        }


        ///////////

        return {
            getOrCreateMetric: getOrCreateMetric,
            getOrCreateBaselineMetric: getOrCreateBaselineMetric,
            getOrCreateWRKMetric: getOrCreateWRKMetric,
            getOrCreateCumulativeMetric: getOrCreateCumulativeMetric,
            getOrCreateConvertedMetric: getOrCreateConvertedMetric,
            getOrCreateCumulativeConvertedMetric: getOrCreateCumulativeConvertedMetric,
            getOrCreateDerivedMetric: getOrCreateDerivedMetric,
            destroyMetric: destroyMetric,
            destroyBaselineMetric: destroyBaselineMetric,
            destroyWRKMetric: destroyWRKMetric,
            destroyDerivedMetric: destroyDerivedMetric,
            clearMetricList: clearMetricList,
            clearBaselineMetricList: clearBaselineMetricList,
            clearWRKMetricList: clearWRKMetricList,
            clearDerivedMetricList: clearDerivedMetricList,
            updateMetrics: updateMetrics,
            updateWRKMetrics: updateWRKMetrics,
            updateBaselineMetrics: updateBaselineMetrics,
            updateDerivedMetrics: updateDerivedMetrics,
            reloadDerivedMetrics: reloadDerivedMetrics,
            getPCPMetrics: getPCPMetrics,
            getBaselineMetrics: getBaselineMetrics,
            getWRKMetrics: getWRKMetrics,
            loadPCPMetrics: loadPCPMetrics,
            loadBaselineMetrics: loadBaselineMetrics,
            loadWRKMetrics: loadWRKMetrics
        };
    }

    angular
        .module('app.services')
        .factory('MetricListService', MetricListService);

 })();
