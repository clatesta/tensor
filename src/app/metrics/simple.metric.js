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
    * @name SimpleMetric
    * @desc
    */
    function SimpleMetric($rootScope, $log, MetricService) {

        var Metric = function(name) {
            this.name = name || null;
            this.data = [];
            this.subscribers = 1;
        };

        Metric.prototype.toString = function() {
            return this.name;
        };

        Metric.prototype.pushValue = function(timestamp, iid, iname, value, con) {
            var self = this,
                instance;

            instance = _.find(self.data, function(el) {
                return el.iid === iid;
            });

            if (angular.isDefined(instance) && instance !== null) {
                instance.values.push({ x: timestamp, y: value });
            } else {
                instance = {
                    key: angular.isDefined(iname) ? iname : this.name,
                    iid: iid,
                    values: [{x: timestamp, y: value}]
                };
                self.data.push(instance);
            }
            if (angular.isDefined(con) && con !== null) {
                _.last(self.data[0].values).con = con;
            }
        };

        Metric.prototype.pushValues = function(iid, timestamp, value) {
            var self = this,
                instance;

            instance = _.find(self.data, function(el) {
                return el.iid === iid;
            });

            if (angular.isDefined(instance) && instance !== null) {
                instance.values.push({ x: timestamp, y: value });
            } else {
                instance = {
                    key: 'Series ' + iid,
                    iid: iid,
                    values: [{x: timestamp, y: value}]
                };
                self.data.push(instance);
                MetricService.getInames(self.name, iid)
                    .then(function(response) {
                        angular.forEach(response.data.instances, function(value) {
                            if (value.instance === iid) {
                                instance.key = value.name;
                            }
                        });
                    });
            }
        };

        Metric.prototype.dumpData = function() {
            return this.data;
        };

        Metric.prototype.loadData = function(data) {
            this.data = data;
        };

        Metric.prototype.clearData = function() {
            this.data.length = 0;
        };

        return Metric;
    }

    angular
        .module('app.metrics')
        .factory('SimpleMetric', SimpleMetric);
 })();
