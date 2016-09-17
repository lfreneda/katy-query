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
          result.relations.push(searchConfig.relation);
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUJBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUDs7Ozs7Ozs7Ozs7Ozs7RUFhTTs7O0lBRUosY0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQsRUFBTyxNQUFQO0FBQ04sVUFBQTtNQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsT0FBRCxDQUFTLElBQUksQ0FBQyxLQUFkLEVBQXFCLE1BQXJCLEVBQTZCLElBQUksQ0FBQyxPQUFsQztNQUNkLFNBQUEsR0FBWSxDQUFDLENBQUMsSUFBRixDQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBdEIsQ0FBNkIsSUFBSSxDQUFDLFNBQUwsSUFBa0IsRUFBL0MsQ0FBUDtBQUVaLGFBQU87UUFDTCxRQUFBLEVBQVksQ0FBQyxJQUFDLENBQUEsYUFBRCxDQUFlLFNBQWYsRUFBMEIsTUFBMUIsQ0FBRCxDQUFBLEdBQW1DLEdBQW5DLEdBQXNDLFdBQVcsQ0FBQyxLQUR6RDtRQUVMLFNBQUEsRUFBYSxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsU0FBVixFQUFxQixNQUFyQixDQUFELENBQUEsR0FBOEIsR0FBOUIsR0FBaUMsV0FBVyxDQUFDLEtBQTdDLEdBQW1ELEdBQW5ELEdBQXFELENBQUMsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsT0FBaEIsRUFBeUIsTUFBekIsQ0FBRCxDQUY3RDtRQUdMLE1BQUEsRUFBUSxXQUFXLENBQUMsTUFIZjtRQUlMLFNBQUEsRUFBVyxTQUpOOztJQUpEOztJQVdSLGNBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsU0FBRCxFQUFpQixNQUFqQjtBQUNkLFVBQUE7O1FBRGUsWUFBWTs7TUFDM0IsT0FBQSxHQUFVLHdCQUFBLEdBQXlCLE1BQU0sQ0FBQyxLQUFoQyxHQUFzQyxnQkFB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LCJmaWxlIjoicXVlcnlHZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJfICAgID0gcmVxdWlyZSAnbG9kYXNoJ1xudXRpbCA9IHJlcXVpcmUgJ3V0aWwnXG5cbmBcbmlmICghU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCkge1xuU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCA9IGZ1bmN0aW9uKHNlYXJjaFN0cmluZywgcG9zaXRpb24pIHtcbnZhciBzdWJqZWN0U3RyaW5nID0gdGhpcy50b1N0cmluZygpO1xuaWYgKHR5cGVvZiBwb3NpdGlvbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHBvc2l0aW9uKSB8fCBNYXRoLmZsb29yKHBvc2l0aW9uKSAhPT0gcG9zaXRpb24gfHwgcG9zaXRpb24gPiBzdWJqZWN0U3RyaW5nLmxlbmd0aCkge1xucG9zaXRpb24gPSBzdWJqZWN0U3RyaW5nLmxlbmd0aDtcbn1cbnBvc2l0aW9uIC09IHNlYXJjaFN0cmluZy5sZW5ndGg7XG52YXIgbGFzdEluZGV4ID0gc3ViamVjdFN0cmluZy5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pO1xucmV0dXJuIGxhc3RJbmRleCAhPT0gLTEgJiYgbGFzdEluZGV4ID09PSBwb3NpdGlvbjtcbn07XG59XG5gXG5jbGFzcyBRdWVyeUdlbmVyYXRvclxuXG4gIEB0b1NxbDogKGFyZ3MsIGNvbmZpZykgLT5cbiAgICB3aGVyZVJlc3VsdCA9IEB0b1doZXJlKGFyZ3Mud2hlcmUsIGNvbmZpZywgYXJncy5vcHRpb25zKVxuICAgIHJlbGF0aW9ucyA9IF8udW5pcSh3aGVyZVJlc3VsdC5yZWxhdGlvbnMuY29uY2F0KGFyZ3MucmVsYXRpb25zIHx8IFtdKSlcblxuICAgIHJldHVybiB7XG4gICAgICBzcWxDb3VudDogXCIje0B0b1NlbGVjdENvdW50KHJlbGF0aW9ucywgY29uZmlnKX0gI3t3aGVyZVJlc3VsdC53aGVyZX1cIlxuICAgICAgc3FsU2VsZWN0OiBcIiN7QHRvU2VsZWN0KHJlbGF0aW9ucywgY29uZmlnKX0gI3t3aGVyZVJlc3VsdC53aGVyZX0gI3tAdG9PcHRpb25zKGFyZ3Mub3B0aW9ucywgY29uZmlnKX1cIlxuICAgICAgcGFyYW1zOiB3aGVyZVJlc3VsdC5wYXJhbXNcbiAgICAgIHJlbGF0aW9uczogcmVsYXRpb25zXG4gICAgfVxuXG4gIEB0b1NlbGVjdENvdW50OiAocmVsYXRpb25zID0gW10sIGNvbmZpZykgLT5cbiAgICBzcWxUZXh0ID0gXCJTRUxFQ1QgQ09VTlQoZGlzdGluY3QgI3tjb25maWcudGFibGV9LlxcXCJpZFxcXCIpXG4gICAgICAgICAgICAgICAgIEZST00gI3tjb25maWcudGFibGV9XG4gICAgICAgICAgICAgICAgICN7QF90b0pvaW5TcWwocmVsYXRpb25zLCBjb25maWcpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9TZWxlY3Q6IChyZWxhdGlvbnMgPSBbXSwgY29uZmlnKSAtPlxuICAgIHNxbFRleHQgPSBcIlNFTEVDVCAje0BfdG9Db2x1bW5TcWwocmVsYXRpb25zLCBjb25maWcpfVxuICAgICAgICAgICAgICAgRlJPTSAje2NvbmZpZy50YWJsZX1cbiAgICAgICAgICAgICAgICN7QF90b0pvaW5TcWwocmVsYXRpb25zLCBjb25maWcpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9PcHRpb25zOiAob3B0aW9ucywgY29uZmlnKSAtPlxuICAgIG9mZnNldCA9IG9wdGlvbnMub2Zmc2V0IG9yIDBcbiAgICBsaW1pdCA9IG9wdGlvbnMubGltaXQgb3IgMjVcblxuICAgIHNvcnQgPSBcIiN7Y29uZmlnLnRhYmxlfS5cXFwiaWRcXFwiIEFTQ1wiXG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBkaXJlY3Rpb24gPSBpZiBvcHRpb25zLnNvcnQuaW5kZXhPZignLScpIGlzIDAgdGhlbiAnREVTQycgZWxzZSAnQVNDJ1xuICAgICAgb3B0aW9ucy5zb3J0ID0gb3B0aW9ucy5zb3J0LnJlcGxhY2UoJy0nLCAnJylcbiAgICAgIHNvcnQgPSBcIiN7Y29uZmlnLnRhYmxlfS5cXFwiI3tvcHRpb25zLnNvcnR9XFxcIiAje2RpcmVjdGlvbn1cIlxuXG4gICAgc3FsVGV4dCA9IFwiT1JERVIgQlkgI3tzb3J0fSBPRkZTRVQgI3tvZmZzZXR9IExJTUlUICN7bGltaXR9XCJcbiAgICBzcWxUZXh0XG5cblxuICBAdG9XaGVyZTogKGNvbmRpdGlvbnMsIGNvbmZpZywgb3B0aW9ucykgLT5cbiAgICByZXR1cm4geyB3aGVyZTogJ1dIRVJFIDE9MScsIHBhcmFtczogW10sIHJlbGF0aW9uczogW10gfSBpZiBfLmlzRW1wdHkoY29uZGl0aW9ucykgYW5kIG5vdCBvcHRpb25zPy50ZW5hbnRcblxuICAgIHJlc3VsdCA9IHsgd2hlcmU6IFtdLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH1cblxuICAgIGlmIG9wdGlvbnM/LnRlbmFudFxuICAgICAgcmVzdWx0LnBhcmFtcy5wdXNoIG9wdGlvbnMudGVuYW50LnZhbHVlXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIigje2NvbmZpZy50YWJsZX0uXFxcIiN7b3B0aW9ucy50ZW5hbnQuY29sdW1ufVxcXCIgPSAkI3tyZXN1bHQucGFyYW1zLmxlbmd0aH0pXCJcblxuICAgIGZvciBvd24gZmllbGQsIHZhbHVlIG9mIGNvbmRpdGlvbnNcbiAgICAgIGlmIF8uaXNBcnJheSB2YWx1ZVxuICAgICAgICBAX3doZXJlQ2xhdXNlQXNBcnJheSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlnXG4gICAgICBlbHNlIGlmIHZhbHVlIGlzIG51bGwgb3IgdmFsdWUgaXMgJ251bGwnXG4gICAgICAgIEBfd2hlcmVOdWxsQ2xhdXNlIGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWdcbiAgICAgIGVsc2VcbiAgICAgICAgQF93aGVyZU9wZXJhdG9yQ2xhdXNlIGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWdcblxuICAgIHJlc3VsdC53aGVyZSA9IFwiV0hFUkUgI3tyZXN1bHQud2hlcmUuam9pbiAnIEFORCAnfVwiXG4gICAgcmVzdWx0LnJlbGF0aW9ucyA9IF8udW5pcShyZXN1bHQucmVsYXRpb25zKVxuICAgIHJlc3VsdFxuXG4gIEBfd2hlcmVPcGVyYXRvckNsYXVzZTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGZpZWxkT3BlcmF0b3IgPSBAX2dldFdoZXJlT3BlcmF0b3IgZmllbGRcbiAgICBmaWVsZCA9IGZpZWxkLnJlcGxhY2UgZmllbGRPcGVyYXRvci5vcGVyYXRvciwgJydcbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICByZXN1bHQucGFyYW1zLnB1c2ggZmllbGRDb25maWcubWFwcGVyKHZhbHVlKVxuICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiI3tmaWVsZENvbmZpZy50YWJsZX0uXFxcIiN7ZmllbGRDb25maWcuY29sdW1ufVxcXCIgI3tmaWVsZE9wZXJhdG9yLm9wZXJhdG9yfSAkI3tyZXN1bHQucGFyYW1zLmxlbmd0aH1cIlxuXG4gIEBfZ2V0V2hlcmVPcGVyYXRvcjogKGZpZWxkKSAtPlxuICAgIG9wZXJhdG9ycyA9IHtcbiAgICAgIGdyZWF0ZXJPckVxdWFsVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPj0nIH1cbiAgICAgIGdyZWF0ZXJUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc+JyB9XG4gICAgICBsZXNzT3JFcXVhbFRoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJzw9JyB9XG4gICAgICBsZXNzVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPCcgfVxuICAgICAgaUxpa2VPcGVyYXRvcjogeyBvcGVyYXRvcjogJ35+KicgfVxuICAgICAgZXF1YWxPcGVyYXRvcjogeyBvcGVyYXRvcjogJz0nIH1cbiAgICB9XG5cbiAgICBvcGVyYXRvckhhbmRsZXIgPSBzd2l0Y2hcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJz49JyB0aGVuIG9wZXJhdG9ycy5ncmVhdGVyT3JFcXVhbFRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPicgdGhlbiBvcGVyYXRvcnMuZ3JlYXRlclRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPD0nIHRoZW4gb3BlcmF0b3JzLmxlc3NPckVxdWFsVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc8JyB0aGVuIG9wZXJhdG9ycy5sZXNzVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICd+fionIHRoZW4gb3BlcmF0b3JzLmlMaWtlT3BlcmF0b3JcbiAgICAgIGVsc2Ugb3BlcmF0b3JzLmVxdWFsT3BlcmF0b3JcblxuICAgIG9wZXJhdG9ySGFuZGxlclxuXG4gIEBfd2hlcmVDbGF1c2VBc0FycmF5OiAoZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgYXJyVmFsdWVzID0gW11cbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICBmb3IgYXJyVmFsdWUgaW4gdmFsdWUgd2hlbiBhcnJWYWx1ZSBub3QgaW4gWydudWxsJywgbnVsbF1cbiAgICAgIHJlc3VsdC5wYXJhbXMucHVzaCBmaWVsZENvbmZpZy5tYXBwZXIoYXJyVmFsdWUpXG4gICAgICBhcnJWYWx1ZXMucHVzaCBcIiQje3Jlc3VsdC5wYXJhbXMubGVuZ3RofVwiXG4gICAgd2l0aE51bGwgPSAnbnVsbCcgaW4gdmFsdWUgb3IgbnVsbCBpbiB2YWx1ZVxuICAgIGlmIHdpdGhOdWxsXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIigje2ZpZWxkQ29uZmlnLnRhYmxlfS5cXFwiI3tmaWVsZENvbmZpZy5jb2x1bW59XFxcIiBpbiAoI3thcnJWYWx1ZXMuam9pbignLCAnKX0pIE9SICN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiIGlzIG51bGwpXCJcbiAgICBlbHNlXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiIGluICgje2FyclZhbHVlcy5qb2luKCcsICcpfSlcIlxuXG4gIEBfd2hlcmVOdWxsQ2xhdXNlOiAoZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgZmllbGRDb25maWcgPSBAX2dldEZpZWxkQ29uZmlndXJhdGlvbk9yRGVmYXVsdCBjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0XG4gICAgaWYgdmFsdWUgaXMgbnVsbCBvciB2YWx1ZSBpcyAnbnVsbCdcbiAgICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiI3tmaWVsZENvbmZpZy50YWJsZX0uXFxcIiN7ZmllbGRDb25maWcuY29sdW1ufVxcXCIgaXMgbnVsbFwiXG5cbiAgQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQ6IChjb25maWcsIGZpZWxkLCByZXN1bHQpIC0+ICMgVE9ETyBzaG91bGQgYmUgdGVzdGVkIHNlcGFyYXRlbHlcblxuICAgIGZpZWxkQ29uZmlndXJhdGlvbiA9XG4gICAgICB0YWJsZTogY29uZmlnLnRhYmxlXG4gICAgICBjb2x1bW46IGZpZWxkXG4gICAgICBtYXBwZXI6ICh2YWx1ZSkgLT4gdmFsdWVcblxuICAgIHNlYXJjaENvbmZpZyA9IGNvbmZpZy5zZWFyY2hbZmllbGRdXG4gICAgaWYgc2VhcmNoQ29uZmlnXG4gICAgICBmaWVsZENvbmZpZ3VyYXRpb24uY29sdW1uID0gc2VhcmNoQ29uZmlnLmNvbHVtbiBpZiBzZWFyY2hDb25maWcuY29sdW1uXG5cbiAgICAgIGlmIHNlYXJjaENvbmZpZy5tYXBwZXJcbiAgICAgICAgbWFwcGVyID0gY29uZmlnLm1hcHBlcnNbc2VhcmNoQ29uZmlnLm1hcHBlcl1cbiAgICAgICAgaWYgbWFwcGVyXG4gICAgICAgICAgZmllbGRDb25maWd1cmF0aW9uLm1hcHBlciA9IG1hcHBlclxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29uc29sZS5sb2cgXCIjIyMgV0FSTklORzogbWFwcGVyICN7c2VhcmNoQ29uZmlnLm1hcHBlcn0gbm90IGZvdW5kLCBpdCB3aWxsIGJlIGlnbm9yZWQuXCJcblxuICAgICAgaWYgc2VhcmNoQ29uZmlnLnJlbGF0aW9uIGFuZCBjb25maWcucmVsYXRpb25zW3NlYXJjaENvbmZpZy5yZWxhdGlvbl1cbiAgICAgICAgcmVzdWx0LnJlbGF0aW9ucy5wdXNoIHNlYXJjaENvbmZpZy5yZWxhdGlvblxuICAgICAgICBmaWVsZENvbmZpZ3VyYXRpb24udGFibGUgPSBjb25maWcucmVsYXRpb25zW3NlYXJjaENvbmZpZy5yZWxhdGlvbl0udGFibGVcblxuICAgIGZpZWxkQ29uZmlndXJhdGlvblxuXG4gIEBfdG9Db2x1bW5TcWw6IChyZWxhdGlvbnMgPSBbXSwgY29uZmlndXJhdGlvbikgLT5cbiAgICBjb2x1bW5zID0gY29uZmlndXJhdGlvbi5jb2x1bW5zLm1hcCAoY29sdW1uKSAtPiBcIiN7Y29sdW1uLnRhYmxlIHx8IGNvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje2NvbHVtbi5uYW1lfVxcXCIgXFxcIiN7Y29sdW1uLmFsaWFzfVxcXCJcIlxuXG4gICAgQF9nZXRSZWxhdGlvblJlcXVpcmVkQ2hhaW4gY29uZmlndXJhdGlvbiwgcmVsYXRpb25zLCAocmVsYXRpb24pIC0+XG4gICAgICBjb2x1bW5zLnB1c2ggXCIje2NvbHVtbi50YWJsZSB8fCByZWxhdGlvbi50YWJsZX0uXFxcIiN7Y29sdW1uLm5hbWV9XFxcIiBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiIGZvciBjb2x1bW4gaW4gcmVsYXRpb24uY29sdW1uc1xuXG4gICAgXy51bmlxKGNvbHVtbnMpLmpvaW4gJywgJ1xuXG4gIEBfdG9Kb2luU3FsOihyZWxhdGlvbnMgPSBbXSwgY29uZmlndXJhdGlvbikgLT5cbiAgICByZXR1cm4gJycgaWYgcmVsYXRpb25zLmxlbmd0aCA8PSAwXG4gICAgam9pbnMgPSBbXVxuICAgIEBfZ2V0UmVsYXRpb25SZXF1aXJlZENoYWluIGNvbmZpZ3VyYXRpb24sIHJlbGF0aW9ucywgKHJlbGF0aW9uKSAtPiBqb2lucy5wdXNoIHJlbGF0aW9uLnNxbFxuICAgIF8udW5pcShqb2lucykuam9pbiAnICdcblxuICBAX2dldFJlbGF0aW9uUmVxdWlyZWRDaGFpbjogKGNvbmZpZ3VyYXRpb24sIHJlbGF0aW9ucywgY2FsbGJhY2spIC0+XG4gICAgZm9yIHJlbGF0aW9uTmFtZSBpbiByZWxhdGlvbnNcbiAgICAgIHJlbGF0aW9uID0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25OYW1lXVxuICAgICAgaWYgcmVsYXRpb25cbiAgICAgICAgQF9nZXRSZWxhdGlvblJlcXVpcmVkQ2hhaW4oY29uZmlndXJhdGlvbiwgcmVsYXRpb24ucmVxdWlyZXMsIGNhbGxiYWNrKSBpZiByZWxhdGlvbi5yZXF1aXJlc1xuICAgICAgICBjYWxsYmFjayByZWxhdGlvblxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5R2VuZXJhdG9yXG4iXX0=
