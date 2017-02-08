(function() {
  var ResultTransformer, _, collapse,
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  collapse = require('./util/collapse');

  ResultTransformer = (function() {
    function ResultTransformer() {}

    ResultTransformer.toModel = function(recordSetResult, config) {
      var results;
      results = this.toModels(recordSetResult, config);
      if (!results) {
        return null;
      }
      return results[0];
    };

    ResultTransformer.toModels = function(recordSetResult, config) {
      if (_.isArray(recordSetResult)) {
        return this._distinctRootEntity(recordSetResult, config);
      }
      if (_.isObject(recordSetResult)) {
        return this._distinctRootEntity([recordSetResult], config);
      }
      return null;
    };

    ResultTransformer._distinctRootEntity = function(rows, config) {
      rows = this._applyMappers(rows, config);
      config = config || {};
      config.collapse = config.collapse || {};
      rows = collapse('this', 'id', config.collapse.options || {}, rows);
      return rows;
    };

    ResultTransformer._applyMappers = function(rows, config) {
      var alias, i, len, mappers, row, value;
      mappers = this._reduceMappers(config);
      if (mappers) {
        for (i = 0, len = rows.length; i < len; i++) {
          row = rows[i];
          for (alias in row) {
            value = row[alias];
            if (mappers[alias]) {
              row[alias] = mappers[alias](value);
            } else {
              row[alias] = value;
            }
          }
        }
      }
      return rows;
    };

    ResultTransformer._reduceMappers = function(config) {
      var column, i, j, len, len1, mappers, ref, ref1, ref2, relation, relationConfig;
      if (!config) {
        return null;
      }
      mappers = {};
      if (config.mapper) {
        mappers[config.mapper] = config.mappers[config.mapper];
      }
      ref = config.columns;
      for (i = 0, len = ref.length; i < len; i++) {
        column = ref[i];
        if (column.mapper) {
          mappers[column.alias] = config.mappers[column.mapper];
        }
      }
      if (config.relations) {
        ref1 = config.relations;
        for (relation in ref1) {
          if (!hasProp.call(ref1, relation)) continue;
          relationConfig = ref1[relation];
          ref2 = relationConfig.columns;
          for (j = 0, len1 = ref2.length; j < len1; j++) {
            column = ref2[j];
            if (column.mapper) {
              mappers[column.alias] = config.mappers[column.mapper];
            }
          }
        }
      }
      return mappers;
    };

    return ResultTransformer;

  })();

  module.exports = ResultTransformer;

}).call(this);