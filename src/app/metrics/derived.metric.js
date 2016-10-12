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
    * @name DerivedMetric
    * @desc
    */
    function DerivedMetric($rootScope) {

        var Metric = function(name, derivedFunction, derivedReloadFunction) {
            this.name = name;
            this.data = [];
            this.subscribers = 1;
            this.derivedFunction = derivedFunction;
            this.derivedReloadFunction = derivedReloadFunction;
        };

        Metric.prototype.updateValues = function() {
            var self = this,
                values;

            values = self.derivedFunction(); // timestamp, key, data

            if (values.length !== self.data.length) {
                self.data.length = 0;
            }

            angular.forEach(values, function(data) {
                var instance = _.find(self.data, function(el) {
                        return el.key === data.key;
                    });

                if (angular.isUndefined(instance)) {
                    instance = {
                        key: data.key,
                        values: [data.val]
                    };
                    self.data.push(instance);
                } else {
                    instance.values.push(data.val);
                }
            });
        };

        Metric.prototype.reloadValues = function() {
            if (angular.isUndefined(this.derivedReloadFunction)) {
                return;
            }

            this.data = this.derivedReloadFunction(); // timestamp, key, data
        };


        Metric.prototype.dumpData = function() {
            return this.data;
        };

        Metric.prototype.clearData = function() {
            this.data.length = 0;
        };

        return Metric;
    }

    angular
        .module('app.metrics')
        .factory('DerivedMetric', DerivedMetric);
 })();
