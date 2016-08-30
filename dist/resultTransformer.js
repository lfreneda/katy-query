(function() {
  var QueryConfiguration, ResultTransformer, _,
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  QueryConfiguration = require('./queryConfiguration');

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
      var column, id, index, j, k, key, len, len1, mappers, property, propertyPath, propertyValue, result, results, rootEntities, rootMapper, row, value;
      rootEntities = {};
      mappers = this._reduceMappers(config);
      for (index = j = 0, len = rows.length; j < len; index = ++j) {
        row = rows[index];
        id = row['this.id'];
        rootEntities[id] || (rootEntities[id] = {});
        for (column in row) {
          if (!hasProp.call(row, column)) continue;
          value = row[column];
          propertyPath = this._getPath(column, index);
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

    ResultTransformer._getPath = function(column, index) {
      var path;
      path = column.replace('this.', '');
      if (column.indexOf('[].' !== -1)) {
        path = path.replace('[]', "[" + index + "]");
      }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3VsdFRyYW5zZm9ybWVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsd0NBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7O0VBQ0osa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHNCQUFSOztFQUVmOzs7SUFFSixpQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLGVBQUQsRUFBa0IsTUFBbEI7QUFDUixVQUFBO01BQUEsT0FBQSxHQUFVLElBQUMsQ0FBQSxRQUFELENBQVUsZUFBVixFQUEyQixNQUEzQjtNQUNWLElBQWUsQ0FBSSxPQUFuQjtBQUFBLGVBQU8sS0FBUDs7QUFDQSxhQUFPLE9BQVEsQ0FBQSxDQUFBO0lBSFA7O0lBS1YsaUJBQUMsQ0FBQSxRQUFELEdBQVcsU0FBQyxlQUFELEVBQWtCLE1BQWxCO01BQ1QsSUFBdUQsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxlQUFWLENBQXZEO0FBQUEsZUFBTyxJQUFDLENBQUEsbUJBQUQsQ0FBcUIsZUFBckIsRUFBc0MsTUFBdEMsRUFBUDs7TUFDQSxJQUEyRCxDQUFDLENBQUMsUUFBRixDQUFXLGVBQVgsQ0FBM0Q7QUFBQSxlQUFPLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixDQUFFLGVBQUYsQ0FBckIsRUFBMEMsTUFBMUMsRUFBUDs7QUFDQSxhQUFPO0lBSEU7O0lBS1gsaUJBQUMsQ0FBQSxtQkFBRCxHQUFzQixTQUFDLElBQUQsRUFBTyxNQUFQO0FBRXBCLFVBQUE7TUFBQSxZQUFBLEdBQWU7TUFDZixPQUFBLEdBQVUsSUFBQyxDQUFBLGNBQUQsQ0FBZ0IsTUFBaEI7QUFFVixXQUFBLHNEQUFBOztRQUNFLEVBQUEsR0FBSyxHQUFJLENBQUEsU0FBQTtRQUNULFlBQWEsQ0FBQSxFQUFBLE1BQWIsWUFBYSxDQUFBLEVBQUEsSUFBUTtBQUNyQixhQUFBLGFBQUE7OztVQUNFLFlBQUEsR0FBZSxJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsRUFBa0IsS0FBbEI7VUFDZixhQUFBLEdBQWdCLElBQUMsQ0FBQSxTQUFELENBQVcsTUFBWCxFQUFtQixLQUFuQixFQUEwQixPQUExQjtVQUNoQixDQUFDLENBQUMsR0FBRixDQUFNLFlBQWEsQ0FBQSxFQUFBLENBQW5CLEVBQXdCLFlBQXhCLEVBQXNDLGFBQXRDO0FBSEY7QUFIRjtNQVFBLE9BQUE7O0FBQVc7YUFBQSxtQkFBQTs7d0JBQUE7QUFBQTs7O0FBQ1gsV0FBQSwyQ0FBQTs7QUFDRSxhQUFBLGtCQUFBOzs7Y0FBcUYsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxLQUFWO1lBQXJGLE1BQU8sQ0FBQSxRQUFBLENBQVAsR0FBb0IsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxLQUFULEVBQWdCLFNBQUMsQ0FBRDtxQkFBTztZQUFQLENBQWhCOztBQUFwQjtBQURGO01BR0EsSUFBRyxNQUFBLElBQVcsTUFBTSxDQUFDLE1BQWxCLElBQTZCLE9BQVEsQ0FBQSxNQUFNLENBQUMsTUFBUCxDQUF4QztRQUNFLFVBQUEsR0FBYSxPQUFRLENBQUEsTUFBTSxDQUFDLE1BQVA7UUFDckIsT0FBQTs7QUFBVztlQUFBLDJDQUFBOzswQkFBQSxVQUFBLENBQVcsTUFBWDtBQUFBOzthQUZiOzthQUlBO0lBckJvQjs7SUF1QnRCLGlCQUFDLENBQUEsUUFBRCxHQUFXLFNBQUMsTUFBRCxFQUFTLEtBQVQ7QUFDVCxVQUFBO01BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQWUsT0FBZixFQUF3QixFQUF4QjtNQUNQLElBQTBDLE1BQU0sQ0FBQyxPQUFQLENBQWUsS0FBQSxLQUFXLENBQUMsQ0FBM0IsQ0FBMUM7UUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLEdBQUEsR0FBSSxLQUFKLEdBQVUsR0FBN0IsRUFBUDs7YUFDQTtJQUhTOztJQUtYLGlCQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsS0FBRCxFQUFRLEtBQVIsRUFBZSxPQUFmO01BQ1YsSUFBZ0IsQ0FBSSxPQUFwQjtBQUFBLGVBQU8sTUFBUDs7TUFDQSxJQUFnQixDQUFJLE9BQVEsQ0FBQSxLQUFBLENBQTVCO0FBQUEsZUFBTyxNQUFQOztBQUNBLGFBQU8sT0FBUSxDQUFBLEtBQUEsQ0FBUixDQUFlLEtBQWY7SUFIRzs7SUFLWixpQkFBQyxDQUFBLGNBQUQsR0FBaUIsU0FBQyxNQUFEO0FBQ2YsVUFBQTtNQUFBLElBQWUsQ0FBSSxNQUFuQjtBQUFBLGVBQU8sS0FBUDs7TUFDQSxPQUFBLEdBQVU7TUFDVixJQUEwRCxNQUFNLENBQUMsTUFBakU7UUFBQSxPQUFRLENBQUEsTUFBTSxDQUFDLE1BQVAsQ0FBUixHQUF5QixNQUFNLENBQUMsT0FBUSxDQUFBLE1BQU0sQ0FBQyxNQUFQLEVBQXhDOztBQUNBO0FBQUEsV0FBQSxxQ0FBQTs7WUFBd0YsTUFBTSxDQUFDO1VBQS9GLE9BQVEsQ0FBQSxNQUFNLENBQUMsS0FBUCxDQUFSLEdBQXdCLE1BQU0sQ0FBQyxPQUFRLENBQUEsTUFBTSxDQUFDLE1BQVA7O0FBQXZDO01BQ0EsSUFBRyxNQUFNLENBQUMsU0FBVjtBQUNFO0FBQUEsYUFBQSxnQkFBQTs7O0FBQ0U7QUFBQSxlQUFBLHdDQUFBOztnQkFBMEMsTUFBTSxDQUFDO2NBQy9DLE9BQVEsQ0FBQSxNQUFNLENBQUMsS0FBUCxDQUFSLEdBQXdCLE1BQU0sQ0FBQyxPQUFRLENBQUEsTUFBTSxDQUFDLE1BQVA7O0FBRHpDO0FBREYsU0FERjs7YUFJQTtJQVRlOzs7Ozs7RUFXbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUEzRGpCIiwiZmlsZSI6InJlc3VsdFRyYW5zZm9ybWVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ2xvZGFzaCdcblF1ZXJ5Q29uZmlndXJhdGlvbiA9IHJlcXVpcmUgJy4vcXVlcnlDb25maWd1cmF0aW9uJ1xuXG5jbGFzcyBSZXN1bHRUcmFuc2Zvcm1lclxuXG4gIEB0b01vZGVsOiAocmVjb3JkU2V0UmVzdWx0LCBjb25maWcpIC0+XG4gICAgcmVzdWx0cyA9IEB0b01vZGVscyByZWNvcmRTZXRSZXN1bHQsIGNvbmZpZ1xuICAgIHJldHVybiBudWxsIGlmIG5vdCByZXN1bHRzXG4gICAgcmV0dXJuIHJlc3VsdHNbMF1cblxuICBAdG9Nb2RlbHM6IChyZWNvcmRTZXRSZXN1bHQsIGNvbmZpZykgLT5cbiAgICByZXR1cm4gQF9kaXN0aW5jdFJvb3RFbnRpdHkgcmVjb3JkU2V0UmVzdWx0LCBjb25maWcgaWYgXy5pc0FycmF5IHJlY29yZFNldFJlc3VsdFxuICAgIHJldHVybiBAX2Rpc3RpbmN0Um9vdEVudGl0eSBbIHJlY29yZFNldFJlc3VsdCBdLCBjb25maWcgaWYgXy5pc09iamVjdCByZWNvcmRTZXRSZXN1bHRcbiAgICByZXR1cm4gbnVsbFxuXG4gIEBfZGlzdGluY3RSb290RW50aXR5OiAocm93cywgY29uZmlnKSAtPlxuXG4gICAgcm9vdEVudGl0aWVzID0ge31cbiAgICBtYXBwZXJzID0gQF9yZWR1Y2VNYXBwZXJzIGNvbmZpZ1xuXG4gICAgZm9yIHJvdywgaW5kZXggaW4gcm93c1xuICAgICAgaWQgPSByb3dbJ3RoaXMuaWQnXVxuICAgICAgcm9vdEVudGl0aWVzW2lkXSBvcj0ge31cbiAgICAgIGZvciBvd24gY29sdW1uLCB2YWx1ZSBvZiByb3dcbiAgICAgICAgcHJvcGVydHlQYXRoID0gQF9nZXRQYXRoIGNvbHVtbiwgaW5kZXhcbiAgICAgICAgcHJvcGVydHlWYWx1ZSA9IEBfZ2V0VmFsdWUgY29sdW1uLCB2YWx1ZSwgbWFwcGVyc1xuICAgICAgICBfLnNldCByb290RW50aXRpZXNbaWRdLCBwcm9wZXJ0eVBhdGgsIHByb3BlcnR5VmFsdWVcblxuICAgIHJlc3VsdHMgPSAodmFsdWUgZm9yIGtleSwgdmFsdWUgb2Ygcm9vdEVudGl0aWVzKVxuICAgIGZvciByZXN1bHQgaW4gcmVzdWx0c1xuICAgICAgcmVzdWx0W3Byb3BlcnR5XSA9IChfLmZpbHRlciB2YWx1ZSwgKGkpIC0+IGkpIGZvciBvd24gcHJvcGVydHksIHZhbHVlIG9mIHJlc3VsdCB3aGVuIF8uaXNBcnJheSB2YWx1ZVxuXG4gICAgaWYgY29uZmlnIGFuZCBjb25maWcubWFwcGVyIGFuZCBtYXBwZXJzW2NvbmZpZy5tYXBwZXJdXG4gICAgICByb290TWFwcGVyID0gbWFwcGVyc1tjb25maWcubWFwcGVyXVxuICAgICAgcmVzdWx0cyA9IChyb290TWFwcGVyKHJlc3VsdCkgZm9yIHJlc3VsdCBpbiByZXN1bHRzKVxuXG4gICAgcmVzdWx0c1xuXG4gIEBfZ2V0UGF0aDogKGNvbHVtbiwgaW5kZXgpIC0+XG4gICAgcGF0aCA9IGNvbHVtbi5yZXBsYWNlICd0aGlzLicsICcnXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSAnW10nLCBcIlsje2luZGV4fV1cIiBpZiBjb2x1bW4uaW5kZXhPZiAnW10uJyBpc250IC0xXG4gICAgcGF0aFxuXG4gIEBfZ2V0VmFsdWU6IChhbGlhcywgdmFsdWUsIG1hcHBlcnMpIC0+XG4gICAgcmV0dXJuIHZhbHVlIGlmIG5vdCBtYXBwZXJzXG4gICAgcmV0dXJuIHZhbHVlIGlmIG5vdCBtYXBwZXJzW2FsaWFzXVxuICAgIHJldHVybiBtYXBwZXJzW2FsaWFzXSh2YWx1ZSlcblxuICBAX3JlZHVjZU1hcHBlcnM6IChjb25maWcpIC0+XG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ1xuICAgIG1hcHBlcnMgPSB7fVxuICAgIG1hcHBlcnNbY29uZmlnLm1hcHBlcl0gPSBjb25maWcubWFwcGVyc1tjb25maWcubWFwcGVyXSBpZiBjb25maWcubWFwcGVyXG4gICAgbWFwcGVyc1tjb2x1bW4uYWxpYXNdID0gY29uZmlnLm1hcHBlcnNbY29sdW1uLm1hcHBlcl0gZm9yIGNvbHVtbiBpbiBjb25maWcuY29sdW1ucyB3aGVuIGNvbHVtbi5tYXBwZXJcbiAgICBpZiBjb25maWcucmVsYXRpb25zXG4gICAgICBmb3Igb3duIHJlbGF0aW9uLCByZWxhdGlvbkNvbmZpZyBvZiBjb25maWcucmVsYXRpb25zXG4gICAgICAgIGZvciBjb2x1bW4gaW4gcmVsYXRpb25Db25maWcuY29sdW1ucyB3aGVuIGNvbHVtbi5tYXBwZXJcbiAgICAgICAgICBtYXBwZXJzW2NvbHVtbi5hbGlhc10gPSBjb25maWcubWFwcGVyc1tjb2x1bW4ubWFwcGVyXVxuICAgIG1hcHBlcnNcblxubW9kdWxlLmV4cG9ydHMgPSBSZXN1bHRUcmFuc2Zvcm1lciJdfQ==
