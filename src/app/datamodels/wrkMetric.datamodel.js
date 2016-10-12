(function() {
    'use strict';

    /**
    * @name WRKMetricDataModel
    * @desc
    */
    function WRKMetricDataModel(WidgetDataModel, MetricListService, TensorService) {
        var DataModel = function() {
            return this;
        };

        DataModel.prototype = Object.create(WidgetDataModel.prototype);

        DataModel.prototype.init = function() {
            WidgetDataModel.prototype.init.call(this);

            this.name = this.dataModelOptions ? this.dataModelOptions.name : 'metric_' + TensorService.getGuid();

            this.metric = MetricListService.getOrCreateWRKMetric(this.name);

            this.updateScope(this.metric.data);

        };

        DataModel.prototype.destroy = function() {
            MetricListService.destroyWRKMetric(this.name);

            WidgetDataModel.prototype.destroy.call(this);
        };

        return DataModel;
    }

    angular
        .module('app.datamodels')
        .factory('WRKMetricDataModel', WRKMetricDataModel);
})();
