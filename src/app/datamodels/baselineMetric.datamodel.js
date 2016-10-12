(function() {
    'use strict';
    /**
    * @name BaselineMetricDataModel
    * @desc
    */
    function BaselineMetricDataModel(WidgetDataModel, MetricListService, TensorService) {
        var DataModel = function() {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function() {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + TensorService.getGuid();

            this.metric = MetricListService.getOrCreateBaselineMetric(this.name);

            this.updateScope(this.metric.data);
            this.widgetScope.$on('updateBaselineMetrics', function() {
                this.updateScope(this.metric.data);
            }.bind(this));
        };

        DataModel.prototype.destroy = function() {
            MetricListService.destroyBaselineMetric(this.name);

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('BaselineMetricDataModel', BaselineMetricDataModel);
})();
