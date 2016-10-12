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
    * @name CumulativeMetric
    * @desc
    */
    function CumulativeMetric($rootScope, $log, SimpleMetric, MetricService) {

        var Metric = function(name) {
            this.base = SimpleMetric;
            this.base(name);
        };

        Metric.prototype = new SimpleMetric();

        Metric.prototype.pushValue = function(timestamp, iid, iname, value) {
            var self = this,
                instance,
                diffValue;

            instance = _.find(self.data, function(el) {
                return el.iid === iid;
            });

            if (angular.isUndefined(instance)) {
                instance = {
                    key: angular.isDefined(iname) ? iname : this.name,
                    iid: iid,
                    values: [],
                    previousValue: value,
                    previousTimestamp: timestamp
                };
                self.data.push(instance);
            } else {
                diffValue = ((value - instance.previousValue) / ((timestamp - instance.previousTimestamp) / 1000)); // sampling frequency
                instance.values.push({ x: timestamp, y: diffValue });
                instance.previousValue = value;
                instance.previousTimestamp = timestamp;
            }
        };

        Metric.prototype.pushValues = function(iid, timestamp, value) {
            var self = this,
                instance,
                diffValue;

            instance = _.find(self.data, function(el) {
                return el.iid === iid;
            });

            if (angular.isUndefined(instance)) {
                instance = {
                    key: 'Series ' + iid,
                    iid: iid,
                    values: [],
                    previousValue: value,
                    previousTimestamp: timestamp
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
            } else {
                diffValue = ((value - instance.previousValue) / ((timestamp - instance.previousTimestamp) / 1000)); // sampling frequency
                instance.values.push({ x: timestamp, y: diffValue });
                instance.previousValue = value;
                instance.previousTimestamp = timestamp;
            }
        };

        return Metric;
    }

    angular
        .module('app.metrics')
        .factory('CumulativeMetric', CumulativeMetric);
 })();
