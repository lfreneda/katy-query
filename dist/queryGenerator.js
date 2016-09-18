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
      var direction, field, fieldConfig, limit, offset, sort, sqlText;
      sort = config.table + ".\"id\" ASC";
      if (options.sort) {
        direction = options.sort.indexOf('-') === 0 ? 'DESC' : 'ASC';
        field = options.sort.replace('-', '');
        fieldConfig = this._getFieldConfigurationOrDefault(config, field);
        sort = fieldConfig.table + ".\"" + fieldConfig.column + "\" " + direction;
      }
      sqlText = "ORDER BY " + sort + " ";
      offset = options.offset || 0;
      sqlText += "OFFSET " + offset + " ";
      limit = options.limit || 25;
      sqlText += "LIMIT " + limit;
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
        } else if (value === null || value === 'null') {
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
        return result.where.push("(" + fieldConfig.table + ".\"" + fieldConfig.column + "\" in (" + (arrValues.join(', ')) + ") OR " + fieldConfig.table + ".\"" + fieldConfig.column + "\" is null)");
      } else {
        return result.where.push(fieldConfig.table + ".\"" + fieldConfig.column + "\" in (" + (arrValues.join(', ')) + ")");
      }
    };

    QueryGenerator._whereNullClause = function(field, value, result, configuration) {
      var fieldConfig;
      fieldConfig = this._getFieldConfigurationOrDefault(configuration, field, result);
      if (value === null || value === 'null') {
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
          if (result) {
            result.relations.push(searchConfig.relation);
          }
          fieldConfiguration.table = config.relations[searchConfig.relation].table;
        }
      }
      return fieldConfiguration;
    };

    QueryGenerator._toColumnSql = function(relations, configuration) {
      var columns;
      if (relations == null) {
        relations = [];
      }
      columns = configuration.columns.map(function(column) {
        return (column.table || configuration.table) + ".\"" + column.name + "\" \"" + column.alias + "\"";
      });
      this._getRelationRequiredChain(configuration, relations, function(relation) {
        var column, i, len, ref, results;
        ref = relation.columns;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          column = ref[i];
          results.push(columns.push((column.table || relation.table) + ".\"" + column.name + "\" \"" + column.alias + "\""));
        }
        return results;
      });
      return _.uniq(columns).join(', ');
    };

    QueryGenerator._toJoinSql = function(relations, configuration) {
      var joins;
      if (relations == null) {
        relations = [];
      }
      if (relations.length <= 0) {
        return '';
      }
      joins = [];
      this._getRelationRequiredChain(configuration, relations, function(relation) {
        return joins.push(relation.sql);
      });
      return _.uniq(joins).join(' ');
    };

    QueryGenerator._getRelationRequiredChain = function(configuration, relations, callback) {
      var i, len, relation, relationName, results;
      results = [];
      for (i = 0, len = relations.length; i < len; i++) {
        relationName = relations[i];
        relation = configuration.relations[relationName];
        if (relation) {
          if (relation.requires) {
            this._getRelationRequiredChain(configuration, relation.requires, callback);
          }
          results.push(callback(relation));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return QueryGenerator;

  })();

  module.exports = QueryGenerator;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUJBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUDs7Ozs7Ozs7Ozs7Ozs7RUFhTTs7O0lBRUosY0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQsRUFBTyxNQUFQO0FBQ04sVUFBQTtNQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsT0FBRCxDQUFTLElBQUksQ0FBQyxLQUFkLEVBQXFCLE1BQXJCLEVBQTZCLElBQUksQ0FBQyxPQUFsQztNQUNkLFNBQUEsR0FBWSxDQUFDLENBQUMsSUFBRixDQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBdEIsQ0FBNkIsSUFBSSxDQUFDLFNBQUwsSUFBa0IsRUFBL0MsQ0FBUDtBQUVaLGFBQU87UUFDTCxRQUFBLEVBQVksQ0FBQyxJQUFDLENBQUEsYUFBRCxDQUFlLFNBQWYsRUFBMEIsTUFBMUIsQ0FBRCxDQUFBLEdBQW1DLEdBQW5DLEdBQXNDLFdBQVcsQ0FBQyxLQUR6RDtRQUVMLFNBQUEsRUFBYSxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsU0FBVixFQUFxQixNQUFyQixDQUFELENBQUEsR0FBOEIsR0FBOUIsR0FBaUMsV0FBVyxDQUFDLEtBQTdDLEdBQW1ELEdBQW5ELEdBQXFELENBQUMsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsT0FBaEIsRUFBeUIsTUFBekIsQ0FBRCxDQUY3RDtRQUdMLE1BQUEsRUFBUSxXQUFXLENBQUMsTUFIZjtRQUlMLFNBQUEsRUFBVyxTQUpOOztJQUpEOztJQVdSLGNBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsU0FBRCxFQUFpQixNQUFqQjtBQUNkLFVBQUE7O1FBRGUsWUFBWTs7TUFDM0IsT0FBQSxHQUFVLHdCQUFBLEdBQXlCLE1BQU0sQ0FBQyxLQUFoQyxHQUFzQyxnQkFB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QUE7O3VCQUNBLFFBQUEsQ0FBUyxRQUFULEdBRkY7U0FBQSxNQUFBOytCQUFBOztBQUZGOztJQUQwQjs7Ozs7O0VBTzlCLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBektqQiIsImZpbGUiOiJxdWVyeUdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIl8gICAgPSByZXF1aXJlICdsb2Rhc2gnXG51dGlsID0gcmVxdWlyZSAndXRpbCdcblxuYFxuaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKSB7XG5TdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xudmFyIHN1YmplY3RTdHJpbmcgPSB0aGlzLnRvU3RyaW5nKCk7XG5pZiAodHlwZW9mIHBvc2l0aW9uICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocG9zaXRpb24pIHx8IE1hdGguZmxvb3IocG9zaXRpb24pICE9PSBwb3NpdGlvbiB8fCBwb3NpdGlvbiA+IHN1YmplY3RTdHJpbmcubGVuZ3RoKSB7XG5wb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xufVxucG9zaXRpb24gLT0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbnZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG5yZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xufTtcbn1cbmBcbmNsYXNzIFF1ZXJ5R2VuZXJhdG9yXG5cbiAgQHRvU3FsOiAoYXJncywgY29uZmlnKSAtPlxuICAgIHdoZXJlUmVzdWx0ID0gQHRvV2hlcmUoYXJncy53aGVyZSwgY29uZmlnLCBhcmdzLm9wdGlvbnMpXG4gICAgcmVsYXRpb25zID0gXy51bmlxKHdoZXJlUmVzdWx0LnJlbGF0aW9ucy5jb25jYXQoYXJncy5yZWxhdGlvbnMgfHwgW10pKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNxbENvdW50OiBcIiN7QHRvU2VsZWN0Q291bnQocmVsYXRpb25zLCBjb25maWcpfSAje3doZXJlUmVzdWx0LndoZXJlfVwiXG4gICAgICBzcWxTZWxlY3Q6IFwiI3tAdG9TZWxlY3QocmVsYXRpb25zLCBjb25maWcpfSAje3doZXJlUmVzdWx0LndoZXJlfSAje0B0b09wdGlvbnMoYXJncy5vcHRpb25zLCBjb25maWcpfVwiXG4gICAgICBwYXJhbXM6IHdoZXJlUmVzdWx0LnBhcmFtc1xuICAgICAgcmVsYXRpb25zOiByZWxhdGlvbnNcbiAgICB9XG5cbiAgQHRvU2VsZWN0Q291bnQ6IChyZWxhdGlvbnMgPSBbXSwgY29uZmlnKSAtPlxuICAgIHNxbFRleHQgPSBcIlNFTEVDVCBDT1VOVChkaXN0aW5jdCAje2NvbmZpZy50YWJsZX0uXFxcImlkXFxcIilcbiAgICAgICAgICAgICAgICAgRlJPTSAje2NvbmZpZy50YWJsZX1cbiAgICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChyZWxhdGlvbnMsIGNvbmZpZyl9XCJcbiAgICBzcWxUZXh0LnRyaW0oKVxuXG4gIEB0b1NlbGVjdDogKHJlbGF0aW9ucyA9IFtdLCBjb25maWcpIC0+XG4gICAgc3FsVGV4dCA9IFwiU0VMRUNUICN7QF90b0NvbHVtblNxbChyZWxhdGlvbnMsIGNvbmZpZyl9XG4gICAgICAgICAgICAgICBGUk9NICN7Y29uZmlnLnRhYmxlfVxuICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChyZWxhdGlvbnMsIGNvbmZpZyl9XCJcbiAgICBzcWxUZXh0LnRyaW0oKVxuXG4gIEB0b09wdGlvbnM6IChvcHRpb25zLCBjb25maWcpIC0+XG4gICAgc29ydCA9IFwiI3tjb25maWcudGFibGV9LlxcXCJpZFxcXCIgQVNDXCJcbiAgICBpZiBvcHRpb25zLnNvcnRcbiAgICAgIGRpcmVjdGlvbiA9IGlmIG9wdGlvbnMuc29ydC5pbmRleE9mKCctJykgaXMgMCB0aGVuICdERVNDJyBlbHNlICdBU0MnXG4gICAgICBmaWVsZCA9IG9wdGlvbnMuc29ydC5yZXBsYWNlKCctJywgJycpXG4gICAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZywgZmllbGRcbiAgICAgIHNvcnQgPSBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiICN7ZGlyZWN0aW9ufVwiXG5cbiAgICBzcWxUZXh0ID0gXCJPUkRFUiBCWSAje3NvcnR9IFwiXG5cbiAgICBvZmZzZXQgPSBvcHRpb25zLm9mZnNldCBvciAwXG4gICAgc3FsVGV4dCArPSBcIk9GRlNFVCAje29mZnNldH0gXCJcblxuICAgIGxpbWl0ID0gb3B0aW9ucy5saW1pdCBvciAyNVxuICAgIHNxbFRleHQgKz0gXCJMSU1JVCAje2xpbWl0fVwiXG4gICAgc3FsVGV4dFxuXG5cbiAgQHRvV2hlcmU6IChjb25kaXRpb25zLCBjb25maWcsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIHsgd2hlcmU6ICdXSEVSRSAxPTEnLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH0gaWYgXy5pc0VtcHR5KGNvbmRpdGlvbnMpIGFuZCBub3Qgb3B0aW9ucz8udGVuYW50XG5cbiAgICByZXN1bHQgPSB7IHdoZXJlOiBbXSwgcGFyYW1zOiBbXSwgcmVsYXRpb25zOiBbXSB9XG5cbiAgICBpZiBvcHRpb25zPy50ZW5hbnRcbiAgICAgIHJlc3VsdC5wYXJhbXMucHVzaCBvcHRpb25zLnRlbmFudC52YWx1ZVxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIoI3tjb25maWcudGFibGV9LlxcXCIje29wdGlvbnMudGVuYW50LmNvbHVtbn1cXFwiID0gJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9KVwiXG5cbiAgICBmb3Igb3duIGZpZWxkLCB2YWx1ZSBvZiBjb25kaXRpb25zXG4gICAgICBpZiBfLmlzQXJyYXkgdmFsdWVcbiAgICAgICAgQF93aGVyZUNsYXVzZUFzQXJyYXkgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ1xuICAgICAgZWxzZSBpZiB2YWx1ZSBpcyBudWxsIG9yIHZhbHVlIGlzICdudWxsJ1xuICAgICAgICBAX3doZXJlTnVsbENsYXVzZSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlnXG4gICAgICBlbHNlXG4gICAgICAgIEBfd2hlcmVPcGVyYXRvckNsYXVzZSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlnXG5cbiAgICByZXN1bHQud2hlcmUgPSBcIldIRVJFICN7cmVzdWx0LndoZXJlLmpvaW4gJyBBTkQgJ31cIlxuICAgIHJlc3VsdC5yZWxhdGlvbnMgPSBfLnVuaXEocmVzdWx0LnJlbGF0aW9ucylcbiAgICByZXN1bHRcblxuICBAX3doZXJlT3BlcmF0b3JDbGF1c2U6IChmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvbikgLT5cbiAgICBmaWVsZE9wZXJhdG9yID0gQF9nZXRXaGVyZU9wZXJhdG9yIGZpZWxkXG4gICAgZmllbGQgPSBmaWVsZC5yZXBsYWNlIGZpZWxkT3BlcmF0b3Iub3BlcmF0b3IsICcnXG4gICAgZmllbGRDb25maWcgPSBAX2dldEZpZWxkQ29uZmlndXJhdGlvbk9yRGVmYXVsdCBjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0XG4gICAgcmVzdWx0LnBhcmFtcy5wdXNoIGZpZWxkQ29uZmlnLm1hcHBlcih2YWx1ZSlcbiAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiICN7ZmllbGRPcGVyYXRvci5vcGVyYXRvcn0gJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9XCJcblxuICBAX2dldFdoZXJlT3BlcmF0b3I6IChmaWVsZCkgLT5cbiAgICBvcGVyYXRvcnMgPSB7XG4gICAgICBncmVhdGVyT3JFcXVhbFRoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJz49JyB9XG4gICAgICBncmVhdGVyVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPicgfVxuICAgICAgbGVzc09yRXF1YWxUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc8PScgfVxuICAgICAgbGVzc1RoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJzwnIH1cbiAgICAgIGlMaWtlT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICd+fionIH1cbiAgICAgIGVxdWFsT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc9JyB9XG4gICAgfVxuXG4gICAgb3BlcmF0b3JIYW5kbGVyID0gc3dpdGNoXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc+PScgdGhlbiBvcGVyYXRvcnMuZ3JlYXRlck9yRXF1YWxUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJz4nIHRoZW4gb3BlcmF0b3JzLmdyZWF0ZXJUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJzw9JyB0aGVuIG9wZXJhdG9ycy5sZXNzT3JFcXVhbFRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPCcgdGhlbiBvcGVyYXRvcnMubGVzc1RoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnfn4qJyB0aGVuIG9wZXJhdG9ycy5pTGlrZU9wZXJhdG9yXG4gICAgICBlbHNlIG9wZXJhdG9ycy5lcXVhbE9wZXJhdG9yXG5cbiAgICBvcGVyYXRvckhhbmRsZXJcblxuICBAX3doZXJlQ2xhdXNlQXNBcnJheTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGFyclZhbHVlcyA9IFtdXG4gICAgZmllbGRDb25maWcgPSBAX2dldEZpZWxkQ29uZmlndXJhdGlvbk9yRGVmYXVsdCBjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0XG4gICAgZm9yIGFyclZhbHVlIGluIHZhbHVlIHdoZW4gYXJyVmFsdWUgbm90IGluIFsnbnVsbCcsIG51bGxdXG4gICAgICByZXN1bHQucGFyYW1zLnB1c2ggZmllbGRDb25maWcubWFwcGVyKGFyclZhbHVlKVxuICAgICAgYXJyVmFsdWVzLnB1c2ggXCIkI3tyZXN1bHQucGFyYW1zLmxlbmd0aH1cIlxuICAgIHdpdGhOdWxsID0gJ251bGwnIGluIHZhbHVlIG9yIG51bGwgaW4gdmFsdWVcbiAgICBpZiB3aXRoTnVsbFxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIoI3tmaWVsZENvbmZpZy50YWJsZX0uXFxcIiN7ZmllbGRDb25maWcuY29sdW1ufVxcXCIgaW4gKCN7YXJyVmFsdWVzLmpvaW4oJywgJyl9KSBPUiAje2ZpZWxkQ29uZmlnLnRhYmxlfS5cXFwiI3tmaWVsZENvbmZpZy5jb2x1bW59XFxcIiBpcyBudWxsKVwiXG4gICAgZWxzZVxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIje2ZpZWxkQ29uZmlnLnRhYmxlfS5cXFwiI3tmaWVsZENvbmZpZy5jb2x1bW59XFxcIiBpbiAoI3thcnJWYWx1ZXMuam9pbignLCAnKX0pXCJcblxuICBAX3doZXJlTnVsbENsYXVzZTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGZpZWxkQ29uZmlnID0gQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQgY29uZmlndXJhdGlvbiwgZmllbGQsIHJlc3VsdFxuICAgIGlmIHZhbHVlIGlzIG51bGwgb3IgdmFsdWUgaXMgJ251bGwnXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiIGlzIG51bGxcIlxuXG4gIEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0OiAoY29uZmlnLCBmaWVsZCwgcmVzdWx0KSAtPiAjIFRPRE8gc2hvdWxkIGJlIHRlc3RlZCBzZXBhcmF0ZWx5XG5cbiAgICBmaWVsZENvbmZpZ3VyYXRpb24gPVxuICAgICAgdGFibGU6IGNvbmZpZy50YWJsZVxuICAgICAgY29sdW1uOiBmaWVsZFxuICAgICAgbWFwcGVyOiAodmFsdWUpIC0+IHZhbHVlXG5cbiAgICBzZWFyY2hDb25maWcgPSBjb25maWcuc2VhcmNoW2ZpZWxkXVxuICAgIGlmIHNlYXJjaENvbmZpZ1xuICAgICAgZmllbGRDb25maWd1cmF0aW9uLmNvbHVtbiA9IHNlYXJjaENvbmZpZy5jb2x1bW4gaWYgc2VhcmNoQ29uZmlnLmNvbHVtblxuXG4gICAgICBpZiBzZWFyY2hDb25maWcubWFwcGVyXG4gICAgICAgIG1hcHBlciA9IGNvbmZpZy5tYXBwZXJzW3NlYXJjaENvbmZpZy5tYXBwZXJdXG4gICAgICAgIGlmIG1hcHBlclxuICAgICAgICAgIGZpZWxkQ29uZmlndXJhdGlvbi5tYXBwZXIgPSBtYXBwZXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiIyMjIFdBUk5JTkc6IG1hcHBlciAje3NlYXJjaENvbmZpZy5tYXBwZXJ9IG5vdCBmb3VuZCwgaXQgd2lsbCBiZSBpZ25vcmVkLlwiXG5cbiAgICAgIGlmIHNlYXJjaENvbmZpZy5yZWxhdGlvbiBhbmQgY29uZmlnLnJlbGF0aW9uc1tzZWFyY2hDb25maWcucmVsYXRpb25dXG4gICAgICAgIHJlc3VsdC5yZWxhdGlvbnMucHVzaCBzZWFyY2hDb25maWcucmVsYXRpb24gaWYgcmVzdWx0XG4gICAgICAgIGZpZWxkQ29uZmlndXJhdGlvbi50YWJsZSA9IGNvbmZpZy5yZWxhdGlvbnNbc2VhcmNoQ29uZmlnLnJlbGF0aW9uXS50YWJsZVxuXG4gICAgZmllbGRDb25maWd1cmF0aW9uXG5cbiAgQF90b0NvbHVtblNxbDogKHJlbGF0aW9ucyA9IFtdLCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGNvbHVtbnMgPSBjb25maWd1cmF0aW9uLmNvbHVtbnMubWFwIChjb2x1bW4pIC0+IFwiI3tjb2x1bW4udGFibGUgfHwgY29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7Y29sdW1uLm5hbWV9XFxcIiBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiXG5cbiAgICBAX2dldFJlbGF0aW9uUmVxdWlyZWRDaGFpbiBjb25maWd1cmF0aW9uLCByZWxhdGlvbnMsIChyZWxhdGlvbikgLT5cbiAgICAgIGNvbHVtbnMucHVzaCBcIiN7Y29sdW1uLnRhYmxlIHx8IHJlbGF0aW9uLnRhYmxlfS5cXFwiI3tjb2x1bW4ubmFtZX1cXFwiIFxcXCIje2NvbHVtbi5hbGlhc31cXFwiXCIgZm9yIGNvbHVtbiBpbiByZWxhdGlvbi5jb2x1bW5zXG5cbiAgICBfLnVuaXEoY29sdW1ucykuam9pbiAnLCAnXG5cbiAgQF90b0pvaW5TcWw6KHJlbGF0aW9ucyA9IFtdLCBjb25maWd1cmF0aW9uKSAtPlxuICAgIHJldHVybiAnJyBpZiByZWxhdGlvbnMubGVuZ3RoIDw9IDBcbiAgICBqb2lucyA9IFtdXG4gICAgQF9nZXRSZWxhdGlvblJlcXVpcmVkQ2hhaW4gY29uZmlndXJhdGlvbiwgcmVsYXRpb25zLCAocmVsYXRpb24pIC0+IGpvaW5zLnB1c2ggcmVsYXRpb24uc3FsXG4gICAgXy51bmlxKGpvaW5zKS5qb2luICcgJ1xuXG4gIEBfZ2V0UmVsYXRpb25SZXF1aXJlZENoYWluOiAoY29uZmlndXJhdGlvbiwgcmVsYXRpb25zLCBjYWxsYmFjaykgLT5cbiAgICBmb3IgcmVsYXRpb25OYW1lIGluIHJlbGF0aW9uc1xuICAgICAgcmVsYXRpb24gPSBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbk5hbWVdXG4gICAgICBpZiByZWxhdGlvblxuICAgICAgICBAX2dldFJlbGF0aW9uUmVxdWlyZWRDaGFpbihjb25maWd1cmF0aW9uLCByZWxhdGlvbi5yZXF1aXJlcywgY2FsbGJhY2spIGlmIHJlbGF0aW9uLnJlcXVpcmVzXG4gICAgICAgIGNhbGxiYWNrIHJlbGF0aW9uXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlHZW5lcmF0b3JcbiJdfQ==
