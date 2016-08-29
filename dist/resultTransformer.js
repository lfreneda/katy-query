(function() {
  var QueryConfiguration, ResultTransformer, _,
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  QueryConfiguration = require('./queryConfiguration');

  ResultTransformer = (function() {
    function ResultTransformer() {}

    ResultTransformer.toModel = function(table, recordSetResult) {
      var results;
      results = this.toModels(table, recordSetResult);
      if (!results) {
        return null;
      }
      return results[0];
    };

    ResultTransformer.toModels = function(table, recordSetResult) {
      if (_.isArray(recordSetResult)) {
        return this._distinctRootEntity(table, recordSetResult);
      }
      if (_.isObject(recordSetResult)) {
        return this._distinctRootEntity(table, [recordSetResult]);
      }
      return null;
    };

    ResultTransformer._distinctRootEntity = function(table, rows) {
      var column, id, index, j, k, key, len, len1, mappers, property, result, results, rootEntities, row, value;
      mappers = this._createMappers(table);
      rootEntities = {};
      for (index = j = 0, len = rows.length; j < len; index = ++j) {
        row = rows[index];
        id = row['this.id'];
        rootEntities[id] || (rootEntities[id] = {});
        for (column in row) {
          if (!hasProp.call(row, column)) continue;
          value = row[column];
          _.set(rootEntities[id], this._getPath(column, index), this._getValue(mappers, column, value));
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

    ResultTransformer._getValue = function(mappers, column, value) {
      if (!mappers) {
        return value;
      }
      if (!mappers[column]) {
        return value;
      }
      return mappers[column](value);
    };

    ResultTransformer._createMappers = function(table) {
      var column, configuration, j, k, l, len, len1, len2, mapper, mappers, ref, ref1, ref2, relation;
      configuration = QueryConfiguration.getConfiguration(table);
      if (!configuration) {
        return null;
      }
      mappers = {};
      ref = configuration.columns;
      for (j = 0, len = ref.length; j < len; j++) {
        column = ref[j];
        if (!column.mapper) {
          continue;
        }
        mapper = QueryConfiguration.getMapper(column.mapper);
        if (mapper) {
          mappers[column.alias] = mapper;
        }
      }
      if (configuration.relations) {
        ref1 = configuration.relations;
        for (k = 0, len1 = ref1.length; k < len1; k++) {
          relation = ref1[k];
          ref2 = relation.columns;
          for (l = 0, len2 = ref2.length; l < len2; l++) {
            column = ref2[l];
            if (!column.mapper) {
              continue;
            }
            mapper = QueryConfiguration.getMapper(column.mapper);
            if (mapper) {
              mappers[column.alias] = mapper;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3VsdFRyYW5zZm9ybWVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsd0NBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7O0VBQ0osa0JBQUEsR0FBcUIsT0FBQSxDQUFRLHNCQUFSOztFQUVmOzs7SUFFSixpQkFBQyxDQUFBLE9BQUQsR0FBVSxTQUFDLEtBQUQsRUFBUSxlQUFSO0FBQ1IsVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsUUFBRCxDQUFVLEtBQVYsRUFBaUIsZUFBakI7TUFDVixJQUFlLENBQUksT0FBbkI7QUFBQSxlQUFPLEtBQVA7O0FBQ0EsYUFBTyxPQUFRLENBQUEsQ0FBQTtJQUhQOztJQUtWLGlCQUFDLENBQUEsUUFBRCxHQUFXLFNBQUMsS0FBRCxFQUFRLGVBQVI7TUFDVCxJQUFzRCxDQUFDLENBQUMsT0FBRixDQUFVLGVBQVYsQ0FBdEQ7QUFBQSxlQUFPLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixLQUFyQixFQUE0QixlQUE1QixFQUFQOztNQUNBLElBQTBELENBQUMsQ0FBQyxRQUFGLENBQVcsZUFBWCxDQUExRDtBQUFBLGVBQU8sSUFBQyxDQUFBLG1CQUFELENBQXFCLEtBQXJCLEVBQTRCLENBQUUsZUFBRixDQUE1QixFQUFQOztBQUNBLGFBQU87SUFIRTs7SUFLWCxpQkFBQyxDQUFBLG1CQUFELEdBQXNCLFNBQUMsS0FBRCxFQUFRLElBQVI7QUFDcEIsVUFBQTtNQUFBLE9BQUEsR0FBVSxJQUFDLENBQUEsY0FBRCxDQUFnQixLQUFoQjtNQUNWLFlBQUEsR0FBZTtBQUNmLFdBQUEsc0RBQUE7O1FBQ0UsRUFBQSxHQUFLLEdBQUksQ0FBQSxTQUFBO1FBQ1QsWUFBYSxDQUFBLEVBQUEsTUFBYixZQUFhLENBQUEsRUFBQSxJQUFRO0FBQ3JCLGFBQUEsYUFBQTs7O1VBQUEsQ0FBQyxDQUFDLEdBQUYsQ0FBTSxZQUFhLENBQUEsRUFBQSxDQUFuQixFQUF3QixJQUFDLENBQUEsUUFBRCxDQUFVLE1BQVYsRUFBa0IsS0FBbEIsQ0FBeEIsRUFBa0QsSUFBQyxDQUFBLFNBQUQsQ0FBVyxPQUFYLEVBQW9CLE1BQXBCLEVBQTRCLEtBQTVCLENBQWxEO0FBQUE7QUFIRjtNQUtBLE9BQUE7O0FBQVc7YUFBQSxtQkFBQTs7d0JBQUE7QUFBQTs7O0FBQ1gsV0FBQSwyQ0FBQTs7QUFDRSxhQUFBLGtCQUFBOzs7Y0FBcUYsQ0FBQyxDQUFDLE9BQUYsQ0FBVSxLQUFWO1lBQXJGLE1BQU8sQ0FBQSxRQUFBLENBQVAsR0FBb0IsQ0FBQyxDQUFDLE1BQUYsQ0FBUyxLQUFULEVBQWdCLFNBQUMsQ0FBRDtxQkFBTztZQUFQLENBQWhCOztBQUFwQjtBQURGO2FBRUE7SUFYb0I7O0lBYXRCLGlCQUFDLENBQUEsUUFBRCxHQUFXLFNBQUMsTUFBRCxFQUFTLEtBQVQ7QUFDVCxVQUFBO01BQUEsSUFBQSxHQUFPLE1BQU0sQ0FBQyxPQUFQLENBQWUsT0FBZixFQUF3QixFQUF4QjtNQUNQLElBQTBDLE1BQU0sQ0FBQyxPQUFQLENBQWUsS0FBQSxLQUFXLENBQUMsQ0FBM0IsQ0FBMUM7UUFBQSxJQUFBLEdBQU8sSUFBSSxDQUFDLE9BQUwsQ0FBYSxJQUFiLEVBQW1CLEdBQUEsR0FBSSxLQUFKLEdBQVUsR0FBN0IsRUFBUDs7YUFDQTtJQUhTOztJQUtYLGlCQUFDLENBQUEsU0FBRCxHQUFZLFNBQUMsT0FBRCxFQUFVLE1BQVYsRUFBa0IsS0FBbEI7TUFDVixJQUFnQixDQUFJLE9BQXBCO0FBQUEsZUFBTyxNQUFQOztNQUNBLElBQWdCLENBQUksT0FBUSxDQUFBLE1BQUEsQ0FBNUI7QUFBQSxlQUFPLE1BQVA7O0FBQ0EsYUFBTyxPQUFRLENBQUEsTUFBQSxDQUFSLENBQWdCLEtBQWhCO0lBSEc7O0lBS1osaUJBQUMsQ0FBQSxjQUFELEdBQWlCLFNBQUMsS0FBRDtBQUNmLFVBQUE7TUFBQSxhQUFBLEdBQWdCLGtCQUFrQixDQUFDLGdCQUFuQixDQUFvQyxLQUFwQztNQUNoQixJQUFlLENBQUksYUFBbkI7QUFBQSxlQUFPLEtBQVA7O01BQ0EsT0FBQSxHQUFVO0FBQ1Y7QUFBQSxXQUFBLHFDQUFBOzthQUF5QyxNQUFNLENBQUM7OztRQUM5QyxNQUFBLEdBQVMsa0JBQWtCLENBQUMsU0FBbkIsQ0FBNkIsTUFBTSxDQUFDLE1BQXBDO1FBQ1QsSUFBa0MsTUFBbEM7VUFBQSxPQUFRLENBQUEsTUFBTSxDQUFDLEtBQVAsQ0FBUixHQUF3QixPQUF4Qjs7QUFGRjtNQUdBLElBQUcsYUFBYSxDQUFDLFNBQWpCO0FBQ0U7QUFBQSxhQUFBLHdDQUFBOztBQUNFO0FBQUEsZUFBQSx3Q0FBQTs7aUJBQW9DLE1BQU0sQ0FBQzs7O1lBQ3pDLE1BQUEsR0FBUyxrQkFBa0IsQ0FBQyxTQUFuQixDQUE2QixNQUFNLENBQUMsTUFBcEM7WUFDVCxJQUFrQyxNQUFsQztjQUFBLE9BQVEsQ0FBQSxNQUFNLENBQUMsS0FBUCxDQUFSLEdBQXdCLE9BQXhCOztBQUZGO0FBREYsU0FERjs7YUFLQTtJQVplOzs7Ozs7RUFjbkIsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFwRGpCIiwiZmlsZSI6InJlc3VsdFRyYW5zZm9ybWVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ2xvZGFzaCdcblF1ZXJ5Q29uZmlndXJhdGlvbiA9IHJlcXVpcmUgJy4vcXVlcnlDb25maWd1cmF0aW9uJ1xuXG5jbGFzcyBSZXN1bHRUcmFuc2Zvcm1lclxuXG4gIEB0b01vZGVsOiAodGFibGUsIHJlY29yZFNldFJlc3VsdCkgLT5cbiAgICByZXN1bHRzID0gQHRvTW9kZWxzIHRhYmxlLCByZWNvcmRTZXRSZXN1bHRcbiAgICByZXR1cm4gbnVsbCBpZiBub3QgcmVzdWx0c1xuICAgIHJldHVybiByZXN1bHRzWzBdXG5cbiAgQHRvTW9kZWxzOiAodGFibGUsIHJlY29yZFNldFJlc3VsdCkgLT5cbiAgICByZXR1cm4gQF9kaXN0aW5jdFJvb3RFbnRpdHkgdGFibGUsIHJlY29yZFNldFJlc3VsdCBpZiBfLmlzQXJyYXkgcmVjb3JkU2V0UmVzdWx0XG4gICAgcmV0dXJuIEBfZGlzdGluY3RSb290RW50aXR5IHRhYmxlLCBbIHJlY29yZFNldFJlc3VsdCBdIGlmIF8uaXNPYmplY3QgcmVjb3JkU2V0UmVzdWx0XG4gICAgcmV0dXJuIG51bGxcblxuICBAX2Rpc3RpbmN0Um9vdEVudGl0eTogKHRhYmxlLCByb3dzKSAtPlxuICAgIG1hcHBlcnMgPSBAX2NyZWF0ZU1hcHBlcnMgdGFibGVcbiAgICByb290RW50aXRpZXMgPSB7fVxuICAgIGZvciByb3csIGluZGV4IGluIHJvd3NcbiAgICAgIGlkID0gcm93Wyd0aGlzLmlkJ11cbiAgICAgIHJvb3RFbnRpdGllc1tpZF0gb3I9IHt9XG4gICAgICBfLnNldCByb290RW50aXRpZXNbaWRdLCBAX2dldFBhdGgoY29sdW1uLCBpbmRleCksIEBfZ2V0VmFsdWUobWFwcGVycywgY29sdW1uLCB2YWx1ZSkgZm9yIG93biBjb2x1bW4sIHZhbHVlIG9mIHJvd1xuXG4gICAgcmVzdWx0cyA9ICh2YWx1ZSBmb3Iga2V5LCB2YWx1ZSBvZiByb290RW50aXRpZXMpXG4gICAgZm9yIHJlc3VsdCBpbiByZXN1bHRzXG4gICAgICByZXN1bHRbcHJvcGVydHldID0gKF8uZmlsdGVyIHZhbHVlLCAoaSkgLT4gaSkgZm9yIG93biBwcm9wZXJ0eSwgdmFsdWUgb2YgcmVzdWx0IHdoZW4gXy5pc0FycmF5IHZhbHVlXG4gICAgcmVzdWx0c1xuXG4gIEBfZ2V0UGF0aDogKGNvbHVtbiwgaW5kZXgpIC0+XG4gICAgcGF0aCA9IGNvbHVtbi5yZXBsYWNlICd0aGlzLicsICcnXG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSAnW10nLCBcIlsje2luZGV4fV1cIiBpZiBjb2x1bW4uaW5kZXhPZiAnW10uJyBpc250IC0xXG4gICAgcGF0aFxuXG4gIEBfZ2V0VmFsdWU6IChtYXBwZXJzLCBjb2x1bW4sIHZhbHVlKSAtPlxuICAgIHJldHVybiB2YWx1ZSBpZiBub3QgbWFwcGVyc1xuICAgIHJldHVybiB2YWx1ZSBpZiBub3QgbWFwcGVyc1tjb2x1bW5dXG4gICAgcmV0dXJuIG1hcHBlcnNbY29sdW1uXSh2YWx1ZSlcblxuICBAX2NyZWF0ZU1hcHBlcnM6ICh0YWJsZSkgLT5cbiAgICBjb25maWd1cmF0aW9uID0gUXVlcnlDb25maWd1cmF0aW9uLmdldENvbmZpZ3VyYXRpb24gdGFibGVcbiAgICByZXR1cm4gbnVsbCBpZiBub3QgY29uZmlndXJhdGlvblxuICAgIG1hcHBlcnMgPSB7fVxuICAgIGZvciBjb2x1bW4gaW4gY29uZmlndXJhdGlvbi5jb2x1bW5zIHdoZW4gY29sdW1uLm1hcHBlclxuICAgICAgbWFwcGVyID0gUXVlcnlDb25maWd1cmF0aW9uLmdldE1hcHBlciBjb2x1bW4ubWFwcGVyXG4gICAgICBtYXBwZXJzW2NvbHVtbi5hbGlhc10gPSBtYXBwZXIgaWYgbWFwcGVyXG4gICAgaWYgY29uZmlndXJhdGlvbi5yZWxhdGlvbnNcbiAgICAgIGZvciByZWxhdGlvbiBpbiBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1xuICAgICAgICBmb3IgY29sdW1uIGluIHJlbGF0aW9uLmNvbHVtbnMgd2hlbiBjb2x1bW4ubWFwcGVyXG4gICAgICAgICAgbWFwcGVyID0gUXVlcnlDb25maWd1cmF0aW9uLmdldE1hcHBlciBjb2x1bW4ubWFwcGVyXG4gICAgICAgICAgbWFwcGVyc1tjb2x1bW4uYWxpYXNdID0gbWFwcGVyIGlmIG1hcHBlclxuICAgIG1hcHBlcnNcblxubW9kdWxlLmV4cG9ydHMgPSBSZXN1bHRUcmFuc2Zvcm1lciJdfQ==
