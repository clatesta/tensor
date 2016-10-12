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
    * @name CumulativeUtilizationMetricDataModel
    * @desc
    */
    function CumulativeUtilizationMetricDataModel(WidgetDataModel, MetricListService, TensorService) {
        var DataModel = function() {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function() {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + TensorService.getGuid();

            var rawMetric = MetricListService.getOrCreateCumulativeMetric(this.name),
                derivedFunction;

            derivedFunction = function() {
                var returnValues = [],
                    lastValue;

                angular.forEach(rawMetric.data, function(instance) {
                    if (instance.values.length > 0) {
                        lastValue = _.last(instance.values);
                        returnValues.push({
                            key: instance.key,
                            val: {y: lastValue.y / 1000, x: lastValue.x}
                        });
                    }
                });

                return returnValues;
            };

            // create derived metric
            this.metric = MetricListService.getOrCreateDerivedMetric(this.name, derivedFunction);

            this.widgetScope.$on('updatePCPMetrics', function() {
                console.log('i did it.');
                this.updateScope(this.metric.data);
            }.bind(this));
            this.updateScope(this.metric.data);
        };

        DataModel.prototype.destroy = function() {
            // remove subscribers and delete derived metric
            MetricListService.destroyDerivedMetric(this.name);

            // remove subscribers and delete base metrics
            MetricListService.destroyMetric(this.name);

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('CumulativeUtilizationMetricDataModel', CumulativeUtilizationMetricDataModel);
 })();
