(function() {
  var QueryGenerator, _, util,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('lodash');

  util = require('util');

  
if (!String.prototype.endsWith) {
String.prototype.endsWith = function(searchString, position) {
var subjectString = this.toString();
if (typeof position !== 'number' || !isFinite(position) || Math.floor(position) !== position || position > subjectString.length) {
position = subjectString.length;
}
position -= searchString.length;
var lastIndex = subjectString.indexOf(searchString, position);
return lastIndex !== -1 && lastIndex === position;
};
}
;

  QueryGenerator = (function() {
    function QueryGenerator() {}

    QueryGenerator.toSql = function(args, config) {
      var relations, whereResult;
      whereResult = this.toWhere(args.where, config, args.options);
      relations = _.uniq(whereResult.relations.concat(args.relations || []));
      return {
        sqlCount: (this.toSelectCount(relations, config)) + " " + whereResult.where,
        sqlSelect: (this.toSelect(relations, config)) + " " + whereResult.where + " " + (this.toOptions(args.options, config)),
        params: whereResult.params,
        relations: relations
      };
    };

    QueryGenerator.toSelectCount = function(relations, config) {
      var sqlText;
      if (relations == null) {
        relations = [];
      }
      sqlText = "SELECT COUNT(distinct " + config.table + ".\"id\") FROM " + config.table + " " + (this._toJoinSql(relations, config));
      return sqlText.trim();
    };

    QueryGenerator.toSelect = function(relations, config) {
      var sqlText;
      if (relations == null) {
        relations = [];
      }
      sqlText = "SELECT " + (this._toColumnSql(relations, config)) + " FROM " + config.table + " " + (this._toJoinSql(relations, config));
      return sqlText.trim();
    };

    QueryGenerator.toOptions = function(options, config) {
      var direction, limit, offset, sort, sqlText;
      offset = options.offset || 0;
      limit = options.limit || 25;
      sort = config.table + ".\"id\" ASC";
      if (options.sort) {
        direction = options.sort.indexOf('-') === 0 ? 'DESC' : 'ASC';
        options.sort = options.sort.replace('-', '');
        sort = config.table + ".\"" + options.sort + "\" " + direction;
      }
      sqlText = "ORDER BY " + sort + " OFFSET " + offset + " LIMIT " + limit;
      return sqlText;
    };

    QueryGenerator.toWhere = function(conditions, config, options) {
      var field, result, value;
      if (_.isEmpty(conditions) && !(options != null ? options.tenant : void 0)) {
        return {
          where: 'WHERE 1=1',
          params: [],
          relations: []
        };
      }
      result = {
        where: [],
        params: [],
        relations: []
      };
      if (options != null ? options.tenant : void 0) {
        result.params.push(options.tenant.value);
        result.where.push("(" + config.table + ".\"" + options.tenant.column + "\" = $" + result.params.length + ")");
      }
      for (field in conditions) {
        if (!hasProp.call(conditions, field)) continue;
        value = conditions[field];
        if (_.isArray(value)) {
          this._whereClauseAsArray(field, value, result, config);
        } else if (value === null) {
          this._whereNullClause(field, value, result, config);
        } else {
          this._whereOperatorClause(field, value, result, config);
        }
      }
      result.where = "WHERE " + (result.where.join(' AND '));
      result.relations = _.uniq(result.relations);
      return result;
    };

    QueryGenerator._whereOperatorClause = function(field, value, result, configuration) {
      var fieldConfig, fieldOperator;
      fieldOperator = this._getWhereOperator(field);
      field = field.replace(fieldOperator.operator, '');
      fieldConfig = this._getFieldConfigurationOrDefault(configuration, field, result);
      result.params.push(fieldConfig.mapper(value));
      return result.where.push(fieldConfig.table + ".\"" + fieldConfig.column + "\" " + fieldOperator.operator + " $" + result.params.length);
    };

    QueryGenerator._getWhereOperator = function(field) {
      var operatorHandler, operators;
      operators = {
        greaterOrEqualThanOperator: {
          operator: '>='
        },
        greaterThanOperator: {
          operator: '>'
        },
        lessOrEqualThanOperator: {
          operator: '<='
        },
        lessThanOperator: {
          operator: '<'
        },
        iLikeOperator: {
          operator: '~~*'
        },
        equalOperator: {
          operator: '='
        }
      };
      operatorHandler = (function() {
        switch (false) {
          case !field.endsWith('>='):
            return operators.greaterOrEqualThanOperator;
          case !field.endsWith('>'):
            return operators.greaterThanOperator;
          case !field.endsWith('<='):
            return operators.lessOrEqualThanOperator;
          case !field.endsWith('<'):
            return operators.lessThanOperator;
          case !field.endsWith('~~*'):
            return operators.iLikeOperator;
          default:
            return operators.equalOperator;
        }
      })();
      return operatorHandler;
    };

    QueryGenerator._whereClauseAsArray = function(field, value, result, configuration) {
      var arrValue, arrValues, fieldConfig, i, len, withNull;
      arrValues = [];
      fieldConfig = this._getFieldConfigurationOrDefault(configuration, field, result);
      for (i = 0, len = value.length; i < len; i++) {
        arrValue = value[i];
        if (!(arrValue !== 'null' && arrValue !== null)) {
          continue;
        }
        result.params.push(fieldConfig.mapper(arrValue));
        arrValues.push("$" + result.params.length);
      }
      withNull = indexOf.call(value, 'null') >= 0 || indexOf.call(value, null) >= 0;
      if (withNull) {
        return result.where.push("(" + configuration.table + ".\"" + field + "\" in (" + (arrValues.join(', ')) + ") OR " + configuration.table + ".\"" + field + "\" is null)");
      } else {
        return result.where.push(configuration.table + ".\"" + field + "\" in (" + (arrValues.join(', ')) + ")");
      }
    };

    QueryGenerator._whereNullClause = function(field, value, result, configuration) {
      var fieldConfig;
      fieldConfig = this._getFieldConfigurationOrDefault(configuration, field, result);
      if (value === null) {
        return result.where.push(fieldConfig.table + ".\"" + fieldConfig.column + "\" is null");
      }
    };

    QueryGenerator._getFieldConfigurationOrDefault = function(config, field, result) {
      var fieldConfiguration, mapper, searchConfig;
      fieldConfiguration = {
        table: config.table,
        column: field,
        mapper: function(value) {
          return value;
        }
      };
      searchConfig = config.search[field];
      if (searchConfig) {
        if (searchConfig.column) {
          fieldConfiguration.column = searchConfig.column;
        }
        if (searchConfig.mapper) {
          mapper = config.mappers[searchConfig.mapper];
          if (mapper) {
            fieldConfiguration.mapper = mapper;
          } else {
            console.log("### WARNING: mapper " + searchConfig.mapper + " not found, it will be ignored.");
          }
        }
        if (searchConfig.relation && config.relations[searchConfig.relation]) {
          result.relations.push(searchConfig.relation);
          fieldConfiguration.table = config.relations[searchConfig.relation].table;
        }
      }
      return fieldConfiguration;
    };

    QueryGenerator._toColumnSql = function(relations, configuration) {
      var column, columns, i, j, len, len1, relation, relationColumns, relationTable;
      if (relations == null) {
        relations = [];
      }
      columns = configuration.columns.map(function(column) {
        return configuration.table + ".\"" + column.name + "\" \"" + column.alias + "\"";
      });
      for (i = 0, len = relations.length; i < len; i++) {
        relation = relations[i];
        if (configuration.relations[relation]) {
          relationTable = configuration.relations[relation].table;
          relationColumns = configuration.relations[relation].columns;
          for (j = 0, len1 = relationColumns.length; j < len1; j++) {
            column = relationColumns[j];
            columns.push(relationTable + "." + column.name + " \"" + column.alias + "\"");
          }
        }
      }
      return columns.join(', ');
    };

    QueryGenerator._toJoinSql = function(relations, configuration) {
      var i, joinSqlText, len, relation;
      if (relations == null) {
        relations = [];
      }
      joinSqlText = '';

      /*
        TODO: if configuration.relations[relation] is undefined
        when relation was not configured :S
       */
      if (relations) {
        for (i = 0, len = relations.length; i < len; i++) {
          relation = relations[i];
          joinSqlText += configuration.relations[relation].sql;
        }
      }
      return joinSqlText;
    };

    return QueryGenerator;

  })();

  module.exports = QueryGenerator;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUJBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUDs7Ozs7Ozs7Ozs7Ozs7RUFhTTs7O0lBRUosY0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQsRUFBTyxNQUFQO0FBQ04sVUFBQTtNQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsT0FBRCxDQUFTLElBQUksQ0FBQyxLQUFkLEVBQXFCLE1BQXJCLEVBQTZCLElBQUksQ0FBQyxPQUFsQztNQUNkLFNBQUEsR0FBWSxDQUFDLENBQUMsSUFBRixDQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBdEIsQ0FBNkIsSUFBSSxDQUFDLFNBQUwsSUFBa0IsRUFBL0MsQ0FBUDtBQUVaLGFBQU87UUFDTCxRQUFBLEVBQVksQ0FBQyxJQUFDLENBQUEsYUFBRCxDQUFlLFNBQWYsRUFBMEIsTUFBMUIsQ0FBRCxDQUFBLEdBQW1DLEdBQW5DLEdBQXNDLFdBQVcsQ0FBQyxLQUR6RDtRQUVMLFNBQUEsRUFBYSxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsU0FBVixFQUFxQixNQUFyQixDQUFELENBQUEsR0FBOEIsR0FBOUIsR0FBaUMsV0FBVyxDQUFDLEtBQTdDLEdBQW1ELEdBQW5ELEdBQXFELENBQUMsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsT0FBaEIsRUFBeUIsTUFBekIsQ0FBRCxDQUY3RDtRQUdMLE1BQUEsRUFBUSxXQUFXLENBQUMsTUFIZjtRQUlMLFNBQUEsRUFBVyxTQUpOOztJQUpEOztJQVdSLGNBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsU0FBRCxFQUFpQixNQUFqQjtBQUNkLFVBQUE7O1FBRGUsWUFBWTs7TUFDM0IsT0FBQSxHQUFVLHdCQUFBLEdBQXlCLE1BQU0sQ0FBQyxLQUFoQyxHQUFzQyxnQkFB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QU8sQ0FBQyxJQUFSLENBQWdCLGFBQUQsR0FBZSxHQUFmLEdBQWtCLE1BQU0sQ0FBQyxJQUF6QixHQUE4QixLQUE5QixHQUFtQyxNQUFNLENBQUMsS0FBMUMsR0FBZ0QsSUFBL0Q7QUFBQSxXQUhGOztBQURGO2FBS0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFiO0lBUGE7O0lBU2YsY0FBQyxDQUFBLFVBQUQsR0FBWSxTQUFDLFNBQUQsRUFBaUIsYUFBakI7QUFDVixVQUFBOztRQURXLFlBQVk7O01BQ3ZCLFdBQUEsR0FBYzs7QUFFZDs7OztNQUtBLElBQWtGLFNBQWxGO0FBQUEsYUFBQSwyQ0FBQTs7VUFBQSxXQUFBLElBQWUsYUFBYSxDQUFDLFNBQVUsQ0FBQSxRQUFBLENBQVMsQ0FBQztBQUFqRCxTQUFBOzthQUNBO0lBVFU7Ozs7OztFQVdkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBbktqQiIsImZpbGUiOiJxdWVyeUdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIl8gICAgPSByZXF1aXJlICdsb2Rhc2gnXG51dGlsID0gcmVxdWlyZSAndXRpbCdcblxuYFxuaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKSB7XG5TdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xudmFyIHN1YmplY3RTdHJpbmcgPSB0aGlzLnRvU3RyaW5nKCk7XG5pZiAodHlwZW9mIHBvc2l0aW9uICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocG9zaXRpb24pIHx8IE1hdGguZmxvb3IocG9zaXRpb24pICE9PSBwb3NpdGlvbiB8fCBwb3NpdGlvbiA+IHN1YmplY3RTdHJpbmcubGVuZ3RoKSB7XG5wb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xufVxucG9zaXRpb24gLT0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbnZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG5yZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xufTtcbn1cbmBcbmNsYXNzIFF1ZXJ5R2VuZXJhdG9yXG5cbiAgQHRvU3FsOiAoYXJncywgY29uZmlnKSAtPlxuICAgIHdoZXJlUmVzdWx0ID0gQHRvV2hlcmUoYXJncy53aGVyZSwgY29uZmlnLCBhcmdzLm9wdGlvbnMpXG4gICAgcmVsYXRpb25zID0gXy51bmlxKHdoZXJlUmVzdWx0LnJlbGF0aW9ucy5jb25jYXQoYXJncy5yZWxhdGlvbnMgfHwgW10pKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNxbENvdW50OiBcIiN7QHRvU2VsZWN0Q291bnQocmVsYXRpb25zLCBjb25maWcpfSAje3doZXJlUmVzdWx0LndoZXJlfVwiXG4gICAgICBzcWxTZWxlY3Q6IFwiI3tAdG9TZWxlY3QocmVsYXRpb25zLCBjb25maWcpfSAje3doZXJlUmVzdWx0LndoZXJlfSAje0B0b09wdGlvbnMoYXJncy5vcHRpb25zLCBjb25maWcpfVwiXG4gICAgICBwYXJhbXM6IHdoZXJlUmVzdWx0LnBhcmFtc1xuICAgICAgcmVsYXRpb25zOiByZWxhdGlvbnNcbiAgICB9XG5cbiAgQHRvU2VsZWN0Q291bnQ6IChyZWxhdGlvbnMgPSBbXSwgY29uZmlnKSAtPlxuICAgIHNxbFRleHQgPSBcIlNFTEVDVCBDT1VOVChkaXN0aW5jdCAje2NvbmZpZy50YWJsZX0uXFxcImlkXFxcIilcbiAgICAgICAgICAgICAgICAgRlJPTSAje2NvbmZpZy50YWJsZX1cbiAgICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChyZWxhdGlvbnMsIGNvbmZpZyl9XCJcbiAgICBzcWxUZXh0LnRyaW0oKVxuXG4gIEB0b1NlbGVjdDogKHJlbGF0aW9ucyA9IFtdLCBjb25maWcpIC0+XG4gICAgc3FsVGV4dCA9IFwiU0VMRUNUICN7QF90b0NvbHVtblNxbChyZWxhdGlvbnMsIGNvbmZpZyl9XG4gICAgICAgICAgICAgICBGUk9NICN7Y29uZmlnLnRhYmxlfVxuICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChyZWxhdGlvbnMsIGNvbmZpZyl9XCJcbiAgICBzcWxUZXh0LnRyaW0oKVxuXG4gIEB0b09wdGlvbnM6IChvcHRpb25zLCBjb25maWcpIC0+XG4gICAgb2Zmc2V0ID0gb3B0aW9ucy5vZmZzZXQgb3IgMFxuICAgIGxpbWl0ID0gb3B0aW9ucy5saW1pdCBvciAyNVxuXG4gICAgc29ydCA9IFwiI3tjb25maWcudGFibGV9LlxcXCJpZFxcXCIgQVNDXCJcbiAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgIGRpcmVjdGlvbiA9IGlmIG9wdGlvbnMuc29ydC5pbmRleE9mKCctJykgaXMgMCB0aGVuICdERVNDJyBlbHNlICdBU0MnXG4gICAgICBvcHRpb25zLnNvcnQgPSBvcHRpb25zLnNvcnQucmVwbGFjZSgnLScsICcnKVxuICAgICAgc29ydCA9IFwiI3tjb25maWcudGFibGV9LlxcXCIje29wdGlvbnMuc29ydH1cXFwiICN7ZGlyZWN0aW9ufVwiXG5cbiAgICBzcWxUZXh0ID0gXCJPUkRFUiBCWSAje3NvcnR9IE9GRlNFVCAje29mZnNldH0gTElNSVQgI3tsaW1pdH1cIlxuICAgIHNxbFRleHRcblxuXG4gIEB0b1doZXJlOiAoY29uZGl0aW9ucywgY29uZmlnLCBvcHRpb25zKSAtPlxuICAgIHJldHVybiB7IHdoZXJlOiAnV0hFUkUgMT0xJywgcGFyYW1zOiBbXSwgcmVsYXRpb25zOiBbXSB9IGlmIF8uaXNFbXB0eShjb25kaXRpb25zKSBhbmQgbm90IG9wdGlvbnM/LnRlbmFudFxuXG4gICAgcmVzdWx0ID0geyB3aGVyZTogW10sIHBhcmFtczogW10sIHJlbGF0aW9uczogW10gfVxuXG4gICAgaWYgb3B0aW9ucz8udGVuYW50XG4gICAgICByZXN1bHQucGFyYW1zLnB1c2ggb3B0aW9ucy50ZW5hbnQudmFsdWVcbiAgICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiKCN7Y29uZmlnLnRhYmxlfS5cXFwiI3tvcHRpb25zLnRlbmFudC5jb2x1bW59XFxcIiA9ICQje3Jlc3VsdC5wYXJhbXMubGVuZ3RofSlcIlxuXG4gICAgZm9yIG93biBmaWVsZCwgdmFsdWUgb2YgY29uZGl0aW9uc1xuICAgICAgaWYgXy5pc0FycmF5IHZhbHVlXG4gICAgICAgIEBfd2hlcmVDbGF1c2VBc0FycmF5IGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWdcbiAgICAgIGVsc2UgaWYgdmFsdWUgaXMgbnVsbFxuICAgICAgICBAX3doZXJlTnVsbENsYXVzZSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlnXG4gICAgICBlbHNlXG4gICAgICAgIEBfd2hlcmVPcGVyYXRvckNsYXVzZSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlnXG5cbiAgICByZXN1bHQud2hlcmUgPSBcIldIRVJFICN7cmVzdWx0LndoZXJlLmpvaW4gJyBBTkQgJ31cIlxuICAgIHJlc3VsdC5yZWxhdGlvbnMgPSBfLnVuaXEocmVzdWx0LnJlbGF0aW9ucylcbiAgICByZXN1bHRcblxuICBAX3doZXJlT3BlcmF0b3JDbGF1c2U6IChmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvbikgLT5cbiAgICBmaWVsZE9wZXJhdG9yID0gQF9nZXRXaGVyZU9wZXJhdG9yIGZpZWxkXG4gICAgZmllbGQgPSBmaWVsZC5yZXBsYWNlIGZpZWxkT3BlcmF0b3Iub3BlcmF0b3IsICcnXG4gICAgZmllbGRDb25maWcgPSBAX2dldEZpZWxkQ29uZmlndXJhdGlvbk9yRGVmYXVsdCBjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0XG4gICAgcmVzdWx0LnBhcmFtcy5wdXNoIGZpZWxkQ29uZmlnLm1hcHBlcih2YWx1ZSlcbiAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiICN7ZmllbGRPcGVyYXRvci5vcGVyYXRvcn0gJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9XCJcblxuICBAX2dldFdoZXJlT3BlcmF0b3I6IChmaWVsZCkgLT5cbiAgICBvcGVyYXRvcnMgPSB7XG4gICAgICBncmVhdGVyT3JFcXVhbFRoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJz49JyB9XG4gICAgICBncmVhdGVyVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPicgfVxuICAgICAgbGVzc09yRXF1YWxUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc8PScgfVxuICAgICAgbGVzc1RoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJzwnIH1cbiAgICAgIGlMaWtlT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICd+fionIH1cbiAgICAgIGVxdWFsT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc9JyB9XG4gICAgfVxuXG4gICAgb3BlcmF0b3JIYW5kbGVyID0gc3dpdGNoXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc+PScgdGhlbiBvcGVyYXRvcnMuZ3JlYXRlck9yRXF1YWxUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJz4nIHRoZW4gb3BlcmF0b3JzLmdyZWF0ZXJUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJzw9JyB0aGVuIG9wZXJhdG9ycy5sZXNzT3JFcXVhbFRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPCcgdGhlbiBvcGVyYXRvcnMubGVzc1RoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnfn4qJyB0aGVuIG9wZXJhdG9ycy5pTGlrZU9wZXJhdG9yXG4gICAgICBlbHNlIG9wZXJhdG9ycy5lcXVhbE9wZXJhdG9yXG5cbiAgICBvcGVyYXRvckhhbmRsZXJcblxuICBAX3doZXJlQ2xhdXNlQXNBcnJheTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGFyclZhbHVlcyA9IFtdXG4gICAgZmllbGRDb25maWcgPSBAX2dldEZpZWxkQ29uZmlndXJhdGlvbk9yRGVmYXVsdCBjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0XG4gICAgZm9yIGFyclZhbHVlIGluIHZhbHVlIHdoZW4gYXJyVmFsdWUgbm90IGluIFsnbnVsbCcsIG51bGxdXG4gICAgICByZXN1bHQucGFyYW1zLnB1c2ggZmllbGRDb25maWcubWFwcGVyKGFyclZhbHVlKVxuICAgICAgYXJyVmFsdWVzLnB1c2ggXCIkI3tyZXN1bHQucGFyYW1zLmxlbmd0aH1cIlxuICAgIHdpdGhOdWxsID0gJ251bGwnIGluIHZhbHVlIG9yIG51bGwgaW4gdmFsdWVcbiAgICBpZiB3aXRoTnVsbFxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIoI3tjb25maWd1cmF0aW9uLnRhYmxlfS5cXFwiI3tmaWVsZH1cXFwiIGluICgje2FyclZhbHVlcy5qb2luKCcsICcpfSkgT1IgI3tjb25maWd1cmF0aW9uLnRhYmxlfS5cXFwiI3tmaWVsZH1cXFwiIGlzIG51bGwpXCJcbiAgICBlbHNlXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7ZmllbGR9XFxcIiBpbiAoI3thcnJWYWx1ZXMuam9pbignLCAnKX0pXCJcblxuICBAX3doZXJlTnVsbENsYXVzZTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGZpZWxkQ29uZmlnID0gQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQgY29uZmlndXJhdGlvbiwgZmllbGQsIHJlc3VsdFxuICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiI3tmaWVsZENvbmZpZy50YWJsZX0uXFxcIiN7ZmllbGRDb25maWcuY29sdW1ufVxcXCIgaXMgbnVsbFwiIGlmIHZhbHVlIGlzIG51bGxcblxuICBAX2dldEZpZWxkQ29uZmlndXJhdGlvbk9yRGVmYXVsdDogKGNvbmZpZywgZmllbGQsIHJlc3VsdCkgLT4gIyBUT0RPIHNob3VsZCBiZSB0ZXN0ZWQgc2VwYXJhdGVseVxuXG4gICAgZmllbGRDb25maWd1cmF0aW9uID1cbiAgICAgIHRhYmxlOiBjb25maWcudGFibGVcbiAgICAgIGNvbHVtbjogZmllbGRcbiAgICAgIG1hcHBlcjogKHZhbHVlKSAtPiB2YWx1ZVxuXG4gICAgc2VhcmNoQ29uZmlnID0gY29uZmlnLnNlYXJjaFtmaWVsZF1cbiAgICBpZiBzZWFyY2hDb25maWdcbiAgICAgIGZpZWxkQ29uZmlndXJhdGlvbi5jb2x1bW4gPSBzZWFyY2hDb25maWcuY29sdW1uIGlmIHNlYXJjaENvbmZpZy5jb2x1bW5cblxuICAgICAgaWYgc2VhcmNoQ29uZmlnLm1hcHBlclxuICAgICAgICBtYXBwZXIgPSBjb25maWcubWFwcGVyc1tzZWFyY2hDb25maWcubWFwcGVyXVxuICAgICAgICBpZiBtYXBwZXJcbiAgICAgICAgICBmaWVsZENvbmZpZ3VyYXRpb24ubWFwcGVyID0gbWFwcGVyXG4gICAgICAgIGVsc2VcbiAgICAgICAgICBjb25zb2xlLmxvZyBcIiMjIyBXQVJOSU5HOiBtYXBwZXIgI3tzZWFyY2hDb25maWcubWFwcGVyfSBub3QgZm91bmQsIGl0IHdpbGwgYmUgaWdub3JlZC5cIlxuXG4gICAgICBpZiBzZWFyY2hDb25maWcucmVsYXRpb24gYW5kIGNvbmZpZy5yZWxhdGlvbnNbc2VhcmNoQ29uZmlnLnJlbGF0aW9uXVxuICAgICAgICByZXN1bHQucmVsYXRpb25zLnB1c2ggc2VhcmNoQ29uZmlnLnJlbGF0aW9uXG4gICAgICAgIGZpZWxkQ29uZmlndXJhdGlvbi50YWJsZSA9IGNvbmZpZy5yZWxhdGlvbnNbc2VhcmNoQ29uZmlnLnJlbGF0aW9uXS50YWJsZVxuXG4gICAgZmllbGRDb25maWd1cmF0aW9uXG5cbiAgQF90b0NvbHVtblNxbDogKHJlbGF0aW9ucyA9IFtdLCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGNvbHVtbnMgPSBjb25maWd1cmF0aW9uLmNvbHVtbnMubWFwIChjb2x1bW4pIC0+IFwiI3tjb25maWd1cmF0aW9uLnRhYmxlfS5cXFwiI3tjb2x1bW4ubmFtZX1cXFwiIFxcXCIje2NvbHVtbi5hbGlhc31cXFwiXCJcbiAgICBmb3IgcmVsYXRpb24gaW4gcmVsYXRpb25zXG4gICAgICBpZiBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl1cbiAgICAgICAgcmVsYXRpb25UYWJsZSA9IGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3JlbGF0aW9uXS50YWJsZVxuICAgICAgICByZWxhdGlvbkNvbHVtbnMgPSBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl0uY29sdW1uc1xuICAgICAgICBjb2x1bW5zLnB1c2ggXCIje3JlbGF0aW9uVGFibGV9LiN7Y29sdW1uLm5hbWV9IFxcXCIje2NvbHVtbi5hbGlhc31cXFwiXCIgZm9yIGNvbHVtbiBpbiByZWxhdGlvbkNvbHVtbnNcbiAgICBjb2x1bW5zLmpvaW4gJywgJ1xuXG4gIEBfdG9Kb2luU3FsOihyZWxhdGlvbnMgPSBbXSwgY29uZmlndXJhdGlvbikgLT5cbiAgICBqb2luU3FsVGV4dCA9ICcnXG5cbiAgICAjIyNcbiAgICAgIFRPRE86IGlmIGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3JlbGF0aW9uXSBpcyB1bmRlZmluZWRcbiAgICAgIHdoZW4gcmVsYXRpb24gd2FzIG5vdCBjb25maWd1cmVkIDpTXG4gICAgIyMjXG5cbiAgICBqb2luU3FsVGV4dCArPSBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl0uc3FsIGZvciByZWxhdGlvbiBpbiByZWxhdGlvbnMgaWYgcmVsYXRpb25zXG4gICAgam9pblNxbFRleHRcblxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeUdlbmVyYXRvclxuIl19
