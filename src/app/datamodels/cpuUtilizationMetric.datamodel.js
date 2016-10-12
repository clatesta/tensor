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
    * @name CpuUtilizationMetricDataModel
    * @desc
    */
    function CpuUtilizationMetricDataModel(WidgetDataModel, MetricListService, TensorService) {
        var DataModel = function() {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function() {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + TensorService.getGuid();

            // create create base metrics
            var cpuSysMetric = MetricListService.getOrCreateCumulativeMetric('kernel.all.cpu.sys'),
                cpuUserMetric = MetricListService.getOrCreateCumulativeMetric('kernel.all.cpu.user'),
                ncpuMetric = MetricListService.getOrCreateMetric('hinv.ncpu'),
                derivedFunction,
                derivedReloadFunction;

            derivedFunction = function() {
                var returnValues = [],
                    cpuInstance,
                    cpuCount;

                if (ncpuMetric.data.length > 0) {
                    cpuInstance = _.last(ncpuMetric.data);

                    if (cpuInstance.values.length > 0) {
                        cpuCount = _.last(cpuInstance.values).y;

                        var pushReturnValues = function(instance, keyName) {
                            if (instance.values.length > 0) {
                                var lastValue = _.last(instance.values);
                                returnValues.push({
                                    key: keyName,
                                    val: {y:lastValue.y / (cpuCount * 1000), x:lastValue.x}
                                });
                            }
                        };

                        angular.forEach(cpuSysMetric.data, function(instance) {
                            pushReturnValues(instance, 'sys');
                        });

                        angular.forEach(cpuUserMetric.data, function(instance) {
                            pushReturnValues(instance, 'user');
                        });
                    }
                }

                return returnValues;
            };

            derivedReloadFunction = function() {
                var returnValues = [],
                    cpuInstance,
                    cpuCount;

                if (ncpuMetric.data.length > 0) {
                    cpuInstance = _.last(ncpuMetric.data);

                    if (cpuInstance.values.length > 0) {
                        cpuCount = _.last(cpuInstance.values).y;

                        var pushReturnValues = function(instance, keyName) {
                            if (instance.values.length > 0) {
                                returnValues.push({
                                    key: keyName,
                                    values: instance.values.map(function(val) {
                                        return {x:val.x, y: val.y / (cpuCount * 1000)};
                                    })
                                });
                            }
                        };

                        angular.forEach(cpuSysMetric.data, function(instance) {
                            pushReturnValues(instance, 'sys');
                        });

                        angular.forEach(cpuUserMetric.data, function(instance) {
                            pushReturnValues(instance, 'user');
                        });
                    }
                }
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
            MetricListService.destroyMetric('kernel.all.cpu.sys');
            MetricListService.destroyMetric('kernel.all.cpu.user');
            MetricListService.destroyMetric('hinv.ncpu');

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('CpuUtilizationMetricDataModel', CpuUtilizationMetricDataModel);
 })();
