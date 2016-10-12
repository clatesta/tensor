 (function() {
     'use strict';

    /**
    * @name MultipleMetricDataModel
    * @desc
    */
    function MultipleWRKMetricDataModel(WidgetDataModel, MetricListService, TensorService) {
        var DataModel = function() {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function() {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + TensorService.getGuid();

            this.metricDefinitions = this.dataModelOptions.metricDefinitions;

            var derivedFunction,
                derivedReloadFunction,
                metrics = {};

            angular.forEach(this.metricDefinitions, function(definition, key) {
                metrics[key] = MetricListService.getOrCreateWRKMetric(definition);
            });

            derivedFunction = function() {
                var returnValues = [],
                    lastValue;

                angular.forEach(metrics, function(metric, key) {
                    angular.forEach(metric.data, function(instance) {
                        if (instance.values.length > 0) {
                            lastValue = _.last(instance.values);
                            returnValues.push({
                                key: key.replace('{key}', instance.key),
                                val: {x: lastValue.x, y: lastValue.y, con: lastValue.con}
                            });
                        }
                    });
                });

                return returnValues;
            };

            derivedReloadFunction = function() {
                var returnValues = [];
                angular.forEach(metrics, function(metric, key) {
                    angular.forEach(metric.data, function(instance) {
                        if (instance.values.length > 0) {
                            returnValues.push({
                                key: key.replace('{key}', instance.key),
                                values: instance.values
                            });
                        }
                    });
                });
                return returnValues;
            };

            // create derived metric
            this.metric = MetricListService.getOrCreateDerivedMetric(this.name, derivedFunction, derivedReloadFunction);

            this.widgetScope.$on('updateWRKMetrics', function() {
                this.updateScope(this.metric.data);
            }.bind(this));

            this.updateScope(this.metric.data);
        };

        DataModel.prototype.destroy = function() {
            // remove subscribers and delete derived metric
            MetricListService.destroyDerivedMetric(this.name);

            // remove subscribers and delete base metrics
            angular.forEach(this.metricDefinitions, function(definition) {
                MetricListService.destroyWRKMetric(definition);
            });

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('MultipleWRKMetricDataModel', MultipleWRKMetricDataModel);
 })();
