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
    * @name MemoryUtilizationMetricDataModel
    * @desc
    */
    function MemoryUtilizationMetricDataModel(WidgetDataModel, MetricListService, TensorService) {
        var DataModel = function() {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function() {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + TensorService.getGuid();

            var conversionFunction = function(value) {
                    return value / 1024;
                },
                cachedMemMetric = MetricListService.getOrCreateConvertedMetric('mem.util.cached', conversionFunction),
                usedMemMetric = MetricListService.getOrCreateConvertedMetric('mem.util.used', conversionFunction),
                freeMemMetric = MetricListService.getOrCreateConvertedMetric('mem.util.free', conversionFunction),
                buffersMemMetric = MetricListService.getOrCreateConvertedMetric('mem.util.bufmem', conversionFunction),
                derivedFunction,
                derivedReloadFunction;

            derivedFunction = function() {
                var returnValues = [],
                    usedValue,
                    cachedValue,
                    freeValue,
                    buffersValue;


                usedValue = (function() {
                    if (usedMemMetric.data.length > 0) {
                        var instance = _.last(usedMemMetric.data);
                        if (instance.values.length > 0) {
                            return _.last(instance.values);
                        }
                    }
                }());

                cachedValue = (function() {
                    if (cachedMemMetric.data.length > 0) {
                        var instance = _.last(cachedMemMetric.data);
                        if (instance.values.length > 0) {
                            return _.last(instance.values);
                        }
                    }
                }());

                freeValue = (function() {
                    if (freeMemMetric.data.length > 0) {
                        var instance = _.last(freeMemMetric.data);
                        if (instance.values.length > 0) {
                            return _.last(instance.values);
                        }
                    }
                }());

                buffersValue = (function() {
                    if (buffersMemMetric.data.length > 0) {
                        var instance = _.last(buffersMemMetric.data);
                        if (instance.values.length > 0) {
                            return _.last(instance.values);
                        }
                    }
                }());

                if (angular.isDefined(usedValue) &&
                    angular.isDefined(cachedValue) &&
                    angular.isDefined(buffersValue)) {

                    returnValues.push({
                        key: 'application',
                        val: {x: usedValue.x, y:usedValue.y - cachedValue.y - buffersValue.y}
                    });
                }

                if (angular.isDefined(cachedValue) &&
                    angular.isDefined(buffersValue)) {

                    returnValues.push({
                        key: 'free (cache)',
                        val: {x: usedValue.x, y: cachedValue.y + buffersValue.y}
                    });
                }

                if (angular.isDefined(freeValue)) {

                    returnValues.push({
                        key: 'free (unused)',
                        val: {x: usedValue.x, y: freeValue.y}
                    });
                }

                return returnValues;
            };

            derivedReloadFunction = function() {
                var returnValues = [],
                    usedValues,
                    cachedValues,
                    freeValues,
                    buffersValues;


                usedValues = (function() {
                    if (usedMemMetric.data.length > 0) {
                        var instance = _.last(usedMemMetric.data);
                        if (instance.values.length > 0) {
                            return instance.values;
                        }
                    }
                }());

                cachedValues = (function() {
                    if (cachedMemMetric.data.length > 0) {
                        var instance = _.last(cachedMemMetric.data);
                        if (instance.values.length > 0) {
                            return instance.values;
                        }
                    }
                }());

                freeValues = (function() {
                    if (freeMemMetric.data.length > 0) {
                        var instance = _.last(freeMemMetric.data);
                        if (instance.values.length > 0) {
                            return instance.values;
                        }
                    }
                }());

                buffersValues = (function() {
                    if (buffersMemMetric.data.length > 0) {
                        var instance = _.last(buffersMemMetric.data);
                        if (instance.values.length > 0) {
                            return instance.values;
                        }
                    }
                }());

                if (angular.isDefined(usedValues) &&
                    angular.isDefined(cachedValues) &&
                    angular.isDefined(buffersValues)) {

                    returnValues.push({
                        key: 'used',
                        values: usedValues.map(function(val, i) {
                            return {x: val.x, y: val.y - cachedValues[i].y - buffersValues[i].y};
                        })
                    });
                }

                if (angular.isDefined(cachedValues) &&
                    angular.isDefined(buffersValues)) {

                    returnValues.push({
                        key: 'free (cache)',
                        values: usedValues.map(function(val, i) {
                            return {x: val.x, y: cachedValues[i].y + buffersValues[i].y};
                        })
                    });
                }

                if (angular.isDefined(freeValues)) {
                    returnValues.push({
                        key: 'free (unused)',
                        values: usedValues.map(function(val, i) {
                            return {x: val.x, y: freeValues[i].y};
                        })
                    });
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
            MetricListService.destroyMetric('mem.util.cached');
            MetricListService.destroyMetric('mem.util.used');
            MetricListService.destroyMetric('mem.util.free');
            MetricListService.destroyMetric('mem.util.bufmem');

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('MemoryUtilizationMetricDataModel', MemoryUtilizationMetricDataModel);
 })();
