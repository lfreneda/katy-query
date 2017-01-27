(function() {
  var ResultTransformer, ResultTransformerIndexHandler, _,
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  ResultTransformerIndexHandler = require('./resultTransformerIndexHandler');

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
      var column, id, index, j, k, key, len, len1, mappers, property, propertyPath, propertyValue, result, resultTransformerIndexHandler, results, rootEntities, rootMapper, row, value;
      rootEntities = {};
      resultTransformerIndexHandler = new ResultTransformerIndexHandler;
      mappers = this._reduceMappers(config);
      for (index = j = 0, len = rows.length; j < len; index = ++j) {
        row = rows[index];
        id = row['this.id'];
        rootEntities[id] || (rootEntities[id] = {});
        for (column in row) {
          if (!hasProp.call(row, column)) continue;
          value = row[column];
          propertyPath = this._getPath(column, value, resultTransformerIndexHandler);
          propertyValue = this._getValue(column, value, mappers);
          _.set(rootEntities[id], propertyPath, propertyValue);
        }
      }
      results = (function() {
        var results1;
        results1 = [];
        for (key in rootEntities) {
          value = rootEntities[key];
          results1.push(value);
        }
        return results1;
      })();
      for (k = 0, len1 = results.length; k < len1; k++) {
        result = results[k];
        for (property in result) {
          if (!hasProp.call(result, property)) continue;
          value = result[property];
          if (_.isArray(value)) {
            result[property] = _.filter(value, function(i) {
              return i;
            });
          }
        }
      }
      if (config && config.mapper && mappers[config.mapper]) {
        rootMapper = mappers[config.mapper];
        results = (function() {
          var l, len2, results1;
          results1 = [];
          for (l = 0, len2 = results.length; l < len2; l++) {
            result = results[l];
            results1.push(rootMapper(result));
          }
          return results1;
        })();
      }
      return results;
    };

    ResultTransformer._getPath = function(column, value, resultTransformerIndexHandler) {
      var path, result;
      path = column;
      resultTransformerIndexHandler.keep(column, value);
      if (column.indexOf('[]' !== -1)) {
        result = resultTransformerIndexHandler.splitColumns(column);
        if (result.items && result.items.length > 0) {
          result.items.forEach(function(item) {
            var idValue, index, replacePathWithValue;
            idValue = resultTransformerIndexHandler.getLastedValue(item.idPath);
            index = resultTransformerIndexHandler.getBy(item.idPath, idValue);
            replacePathWithValue = item.replacePath.replace('[]', "[" + index + "]");
            return path = path.replace(item.replacePath, replacePathWithValue);
          });
        }
      }
      path = path.replace('this.', '');
      return path;
    };

    ResultTransformer._getValue = function(alias, value, mappers) {
      if (!mappers) {
        return value;
      }
      if (!mappers[alias]) {
        return value;
      }
      return mappers[alias](value);
    };

    ResultTransformer._reduceMappers = function(config) {
      var column, j, k, len, len1, mappers, ref, ref1, ref2, relation, relationConfig;
      if (!config) {
        return null;
      }
      mappers = {};
      if (config.mapper) {
        mappers[config.mapper] = config.mappers[config.mapper];
      }
      ref = config.columns;
      for (j = 0, len = ref.length; j < len; j++) {
        column = ref[j];
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
          for (k = 0, len1 = ref2.length; k < len1; k++) {
            column = ref2[k];
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3VsdFRyYW5zZm9ybWVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsbURBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7O0VBQ0osNkJBQUEsR0FBZ0MsT0FBQSxDQUFRLGlDQUFSOztFQUUxQjs7O0lBRUosaUJBQUMsQ0FBQSxPQUFELEdBQVUsU0FBQyxlQUFELEVBQWtCLE1BQWxCO0FBQ1IsVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLGVBQVYsRUFBMkIsTUFBM0I7TUFDVixJQUFlLENBQUksT0FBbkI7QUFBQSxlQUFPLEtBQVA7O0FBQ0EsYUFBTyxPQUFRLENBQUEsQ0FBQTtJQUhQOztJQUtWLGlCQUFDLENBQUEsUUFBRCxHQUFXLFNBQUMsZUFBRCxFQUFrQixNQUFsQjtNQUNULElBQXVELENBQUMsQ0FBQyxPQUFGLENBQVUsZUFBVixDQUF2RDtBQUFBLGVBQU8sSUFBQyxDQUFBLG1CQUFELENBQXFCLGVBQXJCLEVBQXNDLE1BQXRDLEVBQVA7O01BQ0EsSUFBMkQsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxlQUFYLENBQTNEO0FBQUEsZUFBTyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsQ0FBRSxlQUFGLENBQXJCLEVBQTBDLE1BQTFDLEVBQVA7O0FBQ0EsYUFBTztJQUhFOztJQUtYLGlCQUFDLENBQUEsbUJBQUQsR0FBc0IsU0FBQyxJQUFELEVBQU8sTUFBUDtBQUVwQixVQUFBO01BQUEsWUFBQSxHQUFlO01BQ2YsNkJBQUEsR0FBZ0MsSUFBSTtNQUNwQyxPQUFBLEdBQVUsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEI7QUFFVixXQUFBLHNEQUFBOztRQUNFLEVBQUEsR0FBSyxHQUFJLENBQUEsU0FBQTtRQUNULFlBQWEsQ0FBQSxFQUFBLE1BQWIsWUFBYSxDQUFBLEVBQUEsSUFBUTtBQUNyQixhQUFBLGFBQUE7OztVQUNFLFlBQUEsR0FBZSxJQUFDLENBQUEsUUFB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QUFBLE1BQU0sQ0FBQyxNQUFQOztBQUF2QztNQUNBLElBQUcsTUFBTSxDQUFDLFNBQVY7QUFDRTtBQUFBLGFBQUEsZ0JBQUE7OztBQUNFO0FBQUEsZUFBQSx3Q0FBQTs7Z0JBQTBDLE1BQU0sQ0FBQztjQUMvQyxPQUFRLENBQUEsTUFBTSxDQUFDLEtBQVAsQ0FBUixHQUF3QixNQUFNLENBQUMsT0FBUSxDQUFBLE1BQU0sQ0FBQyxNQUFQOztBQUR6QztBQURGLFNBREY7O2FBSUE7SUFUZTs7Ozs7O0VBV25CLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBOUVqQiIsImZpbGUiOiJyZXN1bHRUcmFuc2Zvcm1lci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIl8gPSByZXF1aXJlICdsb2Rhc2gnXG5SZXN1bHRUcmFuc2Zvcm1lckluZGV4SGFuZGxlciA9IHJlcXVpcmUgJy4vcmVzdWx0VHJhbnNmb3JtZXJJbmRleEhhbmRsZXInXG5cbmNsYXNzIFJlc3VsdFRyYW5zZm9ybWVyXG5cbiAgQHRvTW9kZWw6IChyZWNvcmRTZXRSZXN1bHQsIGNvbmZpZykgLT5cbiAgICByZXN1bHRzID0gQHRvTW9kZWxzIHJlY29yZFNldFJlc3VsdCwgY29uZmlnXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IHJlc3VsdHNcbiAgICByZXR1cm4gcmVzdWx0c1swXVxuXG4gIEB0b01vZGVsczogKHJlY29yZFNldFJlc3VsdCwgY29uZmlnKSAtPlxuICAgIHJldHVybiBAX2Rpc3RpbmN0Um9vdEVudGl0eSByZWNvcmRTZXRSZXN1bHQsIGNvbmZpZyBpZiBfLmlzQXJyYXkgcmVjb3JkU2V0UmVzdWx0XG4gICAgcmV0dXJuIEBfZGlzdGluY3RSb290RW50aXR5IFsgcmVjb3JkU2V0UmVzdWx0IF0sIGNvbmZpZyBpZiBfLmlzT2JqZWN0IHJlY29yZFNldFJlc3VsdFxuICAgIHJldHVybiBudWxsXG5cbiAgQF9kaXN0aW5jdFJvb3RFbnRpdHk6IChyb3dzLCBjb25maWcpIC0+XG5cbiAgICByb290RW50aXRpZXMgPSB7fVxuICAgIHJlc3VsdFRyYW5zZm9ybWVySW5kZXhIYW5kbGVyID0gbmV3IFJlc3VsdFRyYW5zZm9ybWVySW5kZXhIYW5kbGVyXG4gICAgbWFwcGVycyA9IEBfcmVkdWNlTWFwcGVycyBjb25maWdcblxuICAgIGZvciByb3csIGluZGV4IGluIHJvd3NcbiAgICAgIGlkID0gcm93Wyd0aGlzLmlkJ11cbiAgICAgIHJvb3RFbnRpdGllc1tpZF0gb3I9IHt9XG4gICAgICBmb3Igb3duIGNvbHVtbiwgdmFsdWUgb2Ygcm93XG4gICAgICAgIHByb3BlcnR5UGF0aCA9IEBfZ2V0UGF0aCBjb2x1bW4sIHZhbHVlLCByZXN1bHRUcmFuc2Zvcm1lckluZGV4SGFuZGxlclxuICAgICAgICBwcm9wZXJ0eVZhbHVlID0gQF9nZXRWYWx1ZSBjb2x1bW4sIHZhbHVlLCBtYXBwZXJzXG4gICAgICAgICMgY29uc29sZS5sb2cgXCIje3Byb3BlcnR5UGF0aH0gPSAje3Byb3BlcnR5VmFsdWV9XCJcbiAgICAgICAgXy5zZXQgcm9vdEVudGl0aWVzW2lkXSwgcHJvcGVydHlQYXRoLCBwcm9wZXJ0eVZhbHVlXG5cbiAgICByZXN1bHRzID0gKHZhbHVlIGZvciBrZXksIHZhbHVlIG9mIHJvb3RFbnRpdGllcylcbiAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgIHJlc3VsdFtwcm9wZXJ0eV0gPSAoXy5maWx0ZXIgdmFsdWUsIChpKSAtPiBpKSBmb3Igb3duIHByb3BlcnR5LCB2YWx1ZSBvZiByZXN1bHQgd2hlbiBfLmlzQXJyYXkgdmFsdWVcblxuICAgIGlmIGNvbmZpZyBhbmQgY29uZmlnLm1hcHBlciBhbmQgbWFwcGVyc1tjb25maWcubWFwcGVyXVxuICAgICAgcm9vdE1hcHBlciA9IG1hcHBlcnNbY29uZmlnLm1hcHBlcl1cbiAgICAgIHJlc3VsdHMgPSAocm9vdE1hcHBlcihyZXN1bHQpIGZvciByZXN1bHQgaW4gcmVzdWx0cylcblxuICAgIHJlc3VsdHNcblxuICBAX2dldFBhdGg6IChjb2x1bW4sIHZhbHVlLCByZXN1bHRUcmFuc2Zvcm1lckluZGV4SGFuZGxlcikgLT5cblxuICAgIHBhdGggPSBjb2x1bW5cbiAgICByZXN1bHRUcmFuc2Zvcm1lckluZGV4SGFuZGxlci5rZWVwIGNvbHVtbiwgdmFsdWVcblxuICAgIGlmIGNvbHVtbi5pbmRleE9mICdbXScgaXNudCAtMVxuICAgICAgcmVzdWx0ID0gcmVzdWx0VHJhbnNmb3JtZXJJbmRleEhhbmRsZXIuc3BsaXRDb2x1bW5zIGNvbHVtblxuICAgICAgaWYgcmVzdWx0Lml0ZW1zIGFuZCByZXN1bHQuaXRlbXMubGVuZ3RoID4gMFxuICAgICAgICByZXN1bHQuaXRlbXMuZm9yRWFjaCAoaXRlbSkgLT5cbiAgICAgICAgICBpZFZhbHVlID0gcmVzdWx0VHJhbnNmb3JtZXJJbmRleEhhbmRsZXIuZ2V0TGFzdGVkVmFsdWUgaXRlbS5pZFBhdGhcbiAgICAgICAgICAjIGNvbnNvbGUubG9nICdpZFZhbHVlJywgaWRWYWx1ZVxuICAgICAgICAgIGluZGV4ID0gcmVzdWx0VHJhbnNmb3JtZXJJbmRleEhhbmRsZXIuZ2V0QnkgaXRlbS5pZFBhdGgsIGlkVmFsdWVcbiAgICAgICAgICAjIGNvbnNvbGUubG9nICdpbmRleCcsIGluZGV4XG4gICAgICAgICAgcmVwbGFjZVBhdGhXaXRoVmFsdWUgPSBpdGVtLnJlcGxhY2VQYXRoLnJlcGxhY2UgJ1tdJywgXCJbI3tpbmRleH1dXCJcbiAgICAgICAgICAjIGNvbnNvbGUubG9nICdyZXBsYWNlUGF0aFdpdGhWYWx1ZScsIHJlcGxhY2VQYXRoV2l0aFZhbHVlXG4gICAgICAgICAgIyBjb25zb2xlLmxvZyAnaXRlbS5yZXBsYWNlUGF0aCcsIGl0ZW0ucmVwbGFjZVBhdGhcbiAgICAgICAgICBwYXRoID0gcGF0aC5yZXBsYWNlIGl0ZW0ucmVwbGFjZVBhdGgsIHJlcGxhY2VQYXRoV2l0aFZhbHVlXG4gICAgICAgICAgIyBjb25zb2xlLmxvZyAncGF0aCcsIHBhdGhcblxuICAgIHBhdGggPSBwYXRoLnJlcGxhY2UgJ3RoaXMuJywgJydcbiAgICBwYXRoXG5cbiAgQF9nZXRWYWx1ZTogKGFsaWFzLCB2YWx1ZSwgbWFwcGVycykgLT5cbiAgICByZXR1cm4gdmFsdWUgaWYgbm90IG1hcHBlcnNcbiAgICByZXR1cm4gdmFsdWUgaWYgbm90IG1hcHBlcnNbYWxpYXNdXG4gICAgcmV0dXJuIG1hcHBlcnNbYWxpYXNdKHZhbHVlKVxuXG4gIEBfcmVkdWNlTWFwcGVyczogKGNvbmZpZykgLT5cbiAgICByZXR1cm4gbnVsbCBpZiBub3QgY29uZmlnXG4gICAgbWFwcGVycyA9IHt9XG4gICAgbWFwcGVyc1tjb25maWcubWFwcGVyXSA9IGNvbmZpZy5tYXBwZXJzW2NvbmZpZy5tYXBwZXJdIGlmIGNvbmZpZy5tYXBwZXJcbiAgICBtYXBwZXJzW2NvbHVtbi5hbGlhc10gPSBjb25maWcubWFwcGVyc1tjb2x1bW4ubWFwcGVyXSBmb3IgY29sdW1uIGluIGNvbmZpZy5jb2x1bW5zIHdoZW4gY29sdW1uLm1hcHBlclxuICAgIGlmIGNvbmZpZy5yZWxhdGlvbnNcbiAgICAgIGZvciBvd24gcmVsYXRpb24sIHJlbGF0aW9uQ29uZmlnIG9mIGNvbmZpZy5yZWxhdGlvbnNcbiAgICAgICAgZm9yIGNvbHVtbiBpbiByZWxhdGlvbkNvbmZpZy5jb2x1bW5zIHdoZW4gY29sdW1uLm1hcHBlclxuICAgICAgICAgIG1hcHBlcnNbY29sdW1uLmFsaWFzXSA9IGNvbmZpZy5tYXBwZXJzW2NvbHVtbi5tYXBwZXJdXG4gICAgbWFwcGVyc1xuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3VsdFRyYW5zZm9ybWVyIl19
