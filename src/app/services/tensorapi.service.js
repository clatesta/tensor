/*
 * Abe Wiersma(10433120)
 */

 /*global _*/
(function() {
    'use strict';
    /**
     * @name TensorAPIService
     * @desc
     */
    function TensorAPIService($http, $log, $rootScope, $q) {

        function getWRKValues() {
            var settings = {};
            settings.method = 'POST';
            settings.url = '/internal/api/bench/get/';
            settings.data = {'duration': $rootScope.properties.interval,
                             'connections': $rootScope.properties.currentConnections,
                             'host': $rootScope.properties.orig_host};

            return $http(settings)
                .then(function(response) {
                    if (angular.isUndefined(response)) {
                        return $q.reject('Bench response is empty');
                    }
                    return response;
                });
        }

        function getBaselineValues() {
            var settings = {};
            settings.method = 'POST';
            settings.url = '/internal/api/baseline/';
            settings.data = {'host': $rootScope.properties.host};

            return $http(settings)
                .then(function(response) {
                    if (angular.isUndefined(response)) {
                        return $q.reject('Baseline response is empty');
                    }
                    return response;
                });
        }

        function getWRKMetrics() {
            return getWRKValues()
                .then(convertTimestampToMillis)
                .then(bindWRKValuesToNames);
        }

        function getBaselineMetrics() {
            return getBaselineValues()
                .then(convertTimestampToMillis)
                .then(bindBaselineValuesToNames);
        }

        function setManifest(filter) {
            var settings = {};
            settings.method = 'POST';
            settings.url = '/internal/api/manifest/';
            settings.data = {'host': $rootScope.properties.orig_host};
            if (filter !== null) {
                settings.data.filter = filter;
            }

            return $http(settings)
                .then(function(response) {
                    if (angular.isUndefined(response)) {
                        return $q.reject('Response is empty');
                    }
                    return response.data;
                });
        }

        function getManifest() {
            var settings = {};
            settings.method = 'GET';
            settings.url = $rootScope.properties.orig_host;
            settings.transformResponse = function(data) {
                var x2js = new X2JS();
                var json = x2js.xml_str2json(data);
                if (!(json) || angular.isDefined(json.parsererror)) {
                    return data;
                } else {
                    return json;
                }
            };

            return $http(settings)
                .then(function(response) {
                    if (angular.isUndefined(response)) {
                        return $q.reject('Response is empty');
                    }
                    return response.data;
                });
        }

        function convertTimestampToMillis(response) {
            var timestamp = (response.data.timestamp * 1000);
            var data = response.data;

            return {
                timestamp: timestamp,
                data: data
            };
        }

        function bindBaselineValuesToNames(response) {
            var throughput = {
                name: 'network.gauge.throughput',
                data: (response.data.throughput.bytes_sec / 1000.0) / 1000.0,
                iname: 'throughput'
            };

            var latency = {
                name: 'network.gauge.ping',
                data: (response.data.ping.avg / 1.0),
                iname: 'ping'
            };

            return {
                timestamp: response.timestamp,
                data: [throughput, latency]
            };
        }

        function bindWRKValuesToNames(response) {
            // timestamp, iid, iname, value
            var throughput = {
                name: 'network.wrk.throughput.step',
                data: (response.data.bytes_sec / 1000.0) / 1000.0,
                iname: ''
            };

            var segments = {
                name: 'network.wrk.segments.segments',
                data: response.data.requests_sec,
                iname: ''
            };

            var errors = {
                name: 'network.wrk.segments.error',
                data: response.data.errors_sec,
                iname: ''
            };

            var latencyMean = {
                name: 'network.wrk.latency.mean',
                data: response.data.latency.mean / 1000,
                iname: ''
            };

            // Fix for bug in which crazy latency was reported when a connection isn't finished within wrk runtime.
            var latencyMin = {
                name: 'network.wrk.latency.min',
                data: 0,
                iname: ''
            };

            var latencyMax = {
                name: 'network.wrk.latency.max',
                data: response.data.latency.max / 1000,
                iname: ''
            };

            var latencyStdev = {
                name: 'network.wrk.latency.stdev',
                data: response.data.latency.stdev / 1000,
                iname: ''
            };

            return {
                timestamp: response.timestamp,
                connections: response.data.connections,
                data: [throughput, segments, errors,
                       latencyMean, latencyMin, latencyMax, latencyStdev]
            };
        }

        return {
            getWRKMetrics: getWRKMetrics,
            getBaselineMetrics: getBaselineMetrics,
            getManifest: getManifest,
            setManifest: setManifest
        };
    }

    TensorAPIService.$inject = [
        '$http',
        '$log',
        '$rootScope',
        '$q'
    ];

    angular
        .module('app.services')
        .factory('TensorAPIService', TensorAPIService);
})();
