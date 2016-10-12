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
    * @name NetworkBytesMetricDataModel
    * @desc
    */
    function NetworkBytesMetricDataModel(WidgetDataModel, MetricListService, TensorService) {
        var DataModel = function() {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function() {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + TensorService.getGuid();

            // create create base metrics
            var inMetric = MetricListService.getOrCreateCumulativeMetric('network.interface.in.bytes'),
                outMetric = MetricListService.getOrCreateCumulativeMetric('network.interface.out.bytes'),
                derivedFunction, derivedReloadFunction;

            // create derived function
            derivedFunction = function() {
                var returnValues = [],
                    lastValue;

                angular.forEach(inMetric.data, function(instance) {
                    if (instance.values.length > 0) {
                        lastValue = _.last(instance.values);
                        returnValues.push({
                            key: instance.key + ' in',
                            val:{x: lastValue.x, y: lastValue.y / 1000 / 1000}
                        });
                    }
                });

                angular.forEach(outMetric.data, function(instance) {
                    if (instance.values.length > 0) {
                        lastValue = _.last(instance.values);
                        returnValues.push({
                            key: instance.key + ' out',
                            val:{x: lastValue.x, y: lastValue.y / 1000 / 1000}
                        });
                    }
                });

                return returnValues;
            };

            // create derived reload function
            derivedReloadFunction = function() {
                var returnValues = [],
                    lastValue;

                angular.forEach(inMetric.data, function(instance) {
                    if (instance.values.length > 0) {
                        returnValues.push({
                            key: instance.key + ' in',
                            values: instance.values.map(function(val) {
                                val.y = val.y / 1000 / 1000;
                                return val;
                            })
                        });
                    }
                });

                angular.forEach(outMetric.data, function(instance) {
                    if (instance.values.length > 0) {
                        returnValues.push({
                            key: instance.key + ' out',
                            values: instance.values.map(function(val) {
                                val.y = val.y / 1000 / 1000;
                                return val;
                            })
                        });
                    }
                });

                return returnValues;
            };

            // create derived metric
            this.metric = MetricListService.getOrCreateDerivedMetric(this.name, derivedFunction, derivedReloadFunction);

            this.widgetScope.$on('updatePCPMetrics', function() {
                this.updateScope(this.metric.data);
            }.bind(this));

            this.updateScope(this.metric.data);
        };

        DataModel.prototype.destroy = function() {
            // remove subscribers and delete derived metric
            MetricListService.destroyDerivedMetric(this.name);

            // remove subscribers and delete base metrics
            MetricListService.destroyMetric('network.interface.in.bytes');
            MetricListService.destroyMetric('network.interface.out.bytes');

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('NetworkBytesMetricDataModel', NetworkBytesMetricDataModel);
 })();
