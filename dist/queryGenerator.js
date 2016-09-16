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
      var columns;
      if (relations == null) {
        relations = [];
      }
      columns = configuration.columns.map(function(column) {
        return (column.table || configuration.table) + ".\"" + column.name + "\" \"" + column.alias + "\"";
      });
      this._getRelationRequiredChain(configuration, relations, function(relation) {
        var column, i, len, relationColumns, relationTable, results;
        relationTable = relation.table;
        relationColumns = relation.columns;
        results = [];
        for (i = 0, len = relationColumns.length; i < len; i++) {
          column = relationColumns[i];
          results.push(columns.push((column.table || relationTable) + ".\"" + column.name + "\" \"" + column.alias + "\""));
        }
        return results;
      });
      return columns.join(', ');
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
        if (relation.requires) {
          this._getRelationRequiredChain(configuration, relation.requires, callback);
        }
        if (relation) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsdUJBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFFUDs7Ozs7Ozs7Ozs7Ozs7RUFhTTs7O0lBRUosY0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQsRUFBTyxNQUFQO0FBQ04sVUFBQTtNQUFBLFdBQUEsR0FBYyxJQUFDLENBQUEsT0FBRCxDQUFTLElBQUksQ0FBQyxLQUFkLEVBQXFCLE1BQXJCLEVBQTZCLElBQUksQ0FBQyxPQUFsQztNQUNkLFNBQUEsR0FBWSxDQUFDLENBQUMsSUFBRixDQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBdEIsQ0FBNkIsSUFBSSxDQUFDLFNBQUwsSUFBa0IsRUFBL0MsQ0FBUDtBQUVaLGFBQU87UUFDTCxRQUFBLEVBQVksQ0FBQyxJQUFDLENBQUEsYUFBRCxDQUFlLFNBQWYsRUFBMEIsTUFBMUIsQ0FBRCxDQUFBLEdBQW1DLEdBQW5DLEdBQXNDLFdBQVcsQ0FBQyxLQUR6RDtRQUVMLFNBQUEsRUFBYSxDQUFDLElBQUMsQ0FBQSxRQUFELENBQVUsU0FBVixFQUFxQixNQUFyQixDQUFELENBQUEsR0FBOEIsR0FBOUIsR0FBaUMsV0FBVyxDQUFDLEtBQTdDLEdBQW1ELEdBQW5ELEdBQXFELENBQUMsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsT0FBaEIsRUFBeUIsTUFBekIsQ0FBRCxDQUY3RDtRQUdMLE1BQUEsRUFBUSxXQUFXLENBQUMsTUFIZjtRQUlMLFNBQUEsRUFBVyxTQUpOOztJQUpEOztJQVdSLGNBQUMsQ0FBQSxhQUFELEdBQWdCLFNBQUMsU0FBRCxFQUFpQixNQUFqQjtBQUNkLFVBQUE7O1FBRGUsWUFBWTs7TUFDM0IsT0FBQSxHQUFVLHdCQUFBLEdBQXlCLE1BQU0sQ0FBQyxLQUFoQyxHQUFzQyxnQkFB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c0NvbnRlbnQiOlsiXyAgICA9IHJlcXVpcmUgJ2xvZGFzaCdcbnV0aWwgPSByZXF1aXJlICd1dGlsJ1xuXG5gXG5pZiAoIVN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGgpIHtcblN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG52YXIgc3ViamVjdFN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbmlmICh0eXBlb2YgcG9zaXRpb24gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShwb3NpdGlvbikgfHwgTWF0aC5mbG9vcihwb3NpdGlvbikgIT09IHBvc2l0aW9uIHx8IHBvc2l0aW9uID4gc3ViamVjdFN0cmluZy5sZW5ndGgpIHtcbnBvc2l0aW9uID0gc3ViamVjdFN0cmluZy5sZW5ndGg7XG59XG5wb3NpdGlvbiAtPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xudmFyIGxhc3RJbmRleCA9IHN1YmplY3RTdHJpbmcuaW5kZXhPZihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKTtcbnJldHVybiBsYXN0SW5kZXggIT09IC0xICYmIGxhc3RJbmRleCA9PT0gcG9zaXRpb247XG59O1xufVxuYFxuY2xhc3MgUXVlcnlHZW5lcmF0b3JcblxuICBAdG9TcWw6IChhcmdzLCBjb25maWcpIC0+XG4gICAgd2hlcmVSZXN1bHQgPSBAdG9XaGVyZShhcmdzLndoZXJlLCBjb25maWcsIGFyZ3Mub3B0aW9ucylcbiAgICByZWxhdGlvbnMgPSBfLnVuaXEod2hlcmVSZXN1bHQucmVsYXRpb25zLmNvbmNhdChhcmdzLnJlbGF0aW9ucyB8fCBbXSkpXG5cbiAgICByZXR1cm4ge1xuICAgICAgc3FsQ291bnQ6IFwiI3tAdG9TZWxlY3RDb3VudChyZWxhdGlvbnMsIGNvbmZpZyl9ICN7d2hlcmVSZXN1bHQud2hlcmV9XCJcbiAgICAgIHNxbFNlbGVjdDogXCIje0B0b1NlbGVjdChyZWxhdGlvbnMsIGNvbmZpZyl9ICN7d2hlcmVSZXN1bHQud2hlcmV9ICN7QHRvT3B0aW9ucyhhcmdzLm9wdGlvbnMsIGNvbmZpZyl9XCJcbiAgICAgIHBhcmFtczogd2hlcmVSZXN1bHQucGFyYW1zXG4gICAgICByZWxhdGlvbnM6IHJlbGF0aW9uc1xuICAgIH1cblxuICBAdG9TZWxlY3RDb3VudDogKHJlbGF0aW9ucyA9IFtdLCBjb25maWcpIC0+XG4gICAgc3FsVGV4dCA9IFwiU0VMRUNUIENPVU5UKGRpc3RpbmN0ICN7Y29uZmlnLnRhYmxlfS5cXFwiaWRcXFwiKVxuICAgICAgICAgICAgICAgICBGUk9NICN7Y29uZmlnLnRhYmxlfVxuICAgICAgICAgICAgICAgICAje0BfdG9Kb2luU3FsKHJlbGF0aW9ucywgY29uZmlnKX1cIlxuICAgIHNxbFRleHQudHJpbSgpXG5cbiAgQHRvU2VsZWN0OiAocmVsYXRpb25zID0gW10sIGNvbmZpZykgLT5cbiAgICBzcWxUZXh0ID0gXCJTRUxFQ1QgI3tAX3RvQ29sdW1uU3FsKHJlbGF0aW9ucywgY29uZmlnKX1cbiAgICAgICAgICAgICAgIEZST00gI3tjb25maWcudGFibGV9XG4gICAgICAgICAgICAgICAje0BfdG9Kb2luU3FsKHJlbGF0aW9ucywgY29uZmlnKX1cIlxuICAgIHNxbFRleHQudHJpbSgpXG5cbiAgQHRvT3B0aW9uczogKG9wdGlvbnMsIGNvbmZpZykgLT5cbiAgICBvZmZzZXQgPSBvcHRpb25zLm9mZnNldCBvciAwXG4gICAgbGltaXQgPSBvcHRpb25zLmxpbWl0IG9yIDI1XG5cbiAgICBzb3J0ID0gXCIje2NvbmZpZy50YWJsZX0uXFxcImlkXFxcIiBBU0NcIlxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgZGlyZWN0aW9uID0gaWYgb3B0aW9ucy5zb3J0LmluZGV4T2YoJy0nKSBpcyAwIHRoZW4gJ0RFU0MnIGVsc2UgJ0FTQydcbiAgICAgIG9wdGlvbnMuc29ydCA9IG9wdGlvbnMuc29ydC5yZXBsYWNlKCctJywgJycpXG4gICAgICBzb3J0ID0gXCIje2NvbmZpZy50YWJsZX0uXFxcIiN7b3B0aW9ucy5zb3J0fVxcXCIgI3tkaXJlY3Rpb259XCJcblxuICAgIHNxbFRleHQgPSBcIk9SREVSIEJZICN7c29ydH0gT0ZGU0VUICN7b2Zmc2V0fSBMSU1JVCAje2xpbWl0fVwiXG4gICAgc3FsVGV4dFxuXG5cbiAgQHRvV2hlcmU6IChjb25kaXRpb25zLCBjb25maWcsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIHsgd2hlcmU6ICdXSEVSRSAxPTEnLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH0gaWYgXy5pc0VtcHR5KGNvbmRpdGlvbnMpIGFuZCBub3Qgb3B0aW9ucz8udGVuYW50XG5cbiAgICByZXN1bHQgPSB7IHdoZXJlOiBbXSwgcGFyYW1zOiBbXSwgcmVsYXRpb25zOiBbXSB9XG5cbiAgICBpZiBvcHRpb25zPy50ZW5hbnRcbiAgICAgIHJlc3VsdC5wYXJhbXMucHVzaCBvcHRpb25zLnRlbmFudC52YWx1ZVxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIoI3tjb25maWcudGFibGV9LlxcXCIje29wdGlvbnMudGVuYW50LmNvbHVtbn1cXFwiID0gJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9KVwiXG5cbiAgICBmb3Igb3duIGZpZWxkLCB2YWx1ZSBvZiBjb25kaXRpb25zXG4gICAgICBpZiBfLmlzQXJyYXkgdmFsdWVcbiAgICAgICAgQF93aGVyZUNsYXVzZUFzQXJyYXkgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ1xuICAgICAgZWxzZSBpZiB2YWx1ZSBpcyBudWxsXG4gICAgICAgIEBfd2hlcmVOdWxsQ2xhdXNlIGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWdcbiAgICAgIGVsc2VcbiAgICAgICAgQF93aGVyZU9wZXJhdG9yQ2xhdXNlIGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWdcblxuICAgIHJlc3VsdC53aGVyZSA9IFwiV0hFUkUgI3tyZXN1bHQud2hlcmUuam9pbiAnIEFORCAnfVwiXG4gICAgcmVzdWx0LnJlbGF0aW9ucyA9IF8udW5pcShyZXN1bHQucmVsYXRpb25zKVxuICAgIHJlc3VsdFxuXG4gIEBfd2hlcmVPcGVyYXRvckNsYXVzZTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGZpZWxkT3BlcmF0b3IgPSBAX2dldFdoZXJlT3BlcmF0b3IgZmllbGRcbiAgICBmaWVsZCA9IGZpZWxkLnJlcGxhY2UgZmllbGRPcGVyYXRvci5vcGVyYXRvciwgJydcbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICByZXN1bHQucGFyYW1zLnB1c2ggZmllbGRDb25maWcubWFwcGVyKHZhbHVlKVxuICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiI3tmaWVsZENvbmZpZy50YWJsZX0uXFxcIiN7ZmllbGRDb25maWcuY29sdW1ufVxcXCIgI3tmaWVsZE9wZXJhdG9yLm9wZXJhdG9yfSAkI3tyZXN1bHQucGFyYW1zLmxlbmd0aH1cIlxuXG4gIEBfZ2V0V2hlcmVPcGVyYXRvcjogKGZpZWxkKSAtPlxuICAgIG9wZXJhdG9ycyA9IHtcbiAgICAgIGdyZWF0ZXJPckVxdWFsVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPj0nIH1cbiAgICAgIGdyZWF0ZXJUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc+JyB9XG4gICAgICBsZXNzT3JFcXVhbFRoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJzw9JyB9XG4gICAgICBsZXNzVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPCcgfVxuICAgICAgaUxpa2VPcGVyYXRvcjogeyBvcGVyYXRvcjogJ35+KicgfVxuICAgICAgZXF1YWxPcGVyYXRvcjogeyBvcGVyYXRvcjogJz0nIH1cbiAgICB9XG5cbiAgICBvcGVyYXRvckhhbmRsZXIgPSBzd2l0Y2hcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJz49JyB0aGVuIG9wZXJhdG9ycy5ncmVhdGVyT3JFcXVhbFRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPicgdGhlbiBvcGVyYXRvcnMuZ3JlYXRlclRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPD0nIHRoZW4gb3BlcmF0b3JzLmxlc3NPckVxdWFsVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc8JyB0aGVuIG9wZXJhdG9ycy5sZXNzVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICd+fionIHRoZW4gb3BlcmF0b3JzLmlMaWtlT3BlcmF0b3JcbiAgICAgIGVsc2Ugb3BlcmF0b3JzLmVxdWFsT3BlcmF0b3JcblxuICAgIG9wZXJhdG9ySGFuZGxlclxuXG4gIEBfd2hlcmVDbGF1c2VBc0FycmF5OiAoZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgYXJyVmFsdWVzID0gW11cbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICBmb3IgYXJyVmFsdWUgaW4gdmFsdWUgd2hlbiBhcnJWYWx1ZSBub3QgaW4gWydudWxsJywgbnVsbF1cbiAgICAgIHJlc3VsdC5wYXJhbXMucHVzaCBmaWVsZENvbmZpZy5tYXBwZXIoYXJyVmFsdWUpXG4gICAgICBhcnJWYWx1ZXMucHVzaCBcIiQje3Jlc3VsdC5wYXJhbXMubGVuZ3RofVwiXG4gICAgd2l0aE51bGwgPSAnbnVsbCcgaW4gdmFsdWUgb3IgbnVsbCBpbiB2YWx1ZVxuICAgIGlmIHdpdGhOdWxsXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIigje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje2ZpZWxkfVxcXCIgaW4gKCN7YXJyVmFsdWVzLmpvaW4oJywgJyl9KSBPUiAje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje2ZpZWxkfVxcXCIgaXMgbnVsbClcIlxuICAgIGVsc2VcbiAgICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiI3tjb25maWd1cmF0aW9uLnRhYmxlfS5cXFwiI3tmaWVsZH1cXFwiIGluICgje2FyclZhbHVlcy5qb2luKCcsICcpfSlcIlxuXG4gIEBfd2hlcmVOdWxsQ2xhdXNlOiAoZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgZmllbGRDb25maWcgPSBAX2dldEZpZWxkQ29uZmlndXJhdGlvbk9yRGVmYXVsdCBjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0XG4gICAgcmVzdWx0LndoZXJlLnB1c2ggXCIje2ZpZWxkQ29uZmlnLnRhYmxlfS5cXFwiI3tmaWVsZENvbmZpZy5jb2x1bW59XFxcIiBpcyBudWxsXCIgaWYgdmFsdWUgaXMgbnVsbFxuXG4gIEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0OiAoY29uZmlnLCBmaWVsZCwgcmVzdWx0KSAtPiAjIFRPRE8gc2hvdWxkIGJlIHRlc3RlZCBzZXBhcmF0ZWx5XG5cbiAgICBmaWVsZENvbmZpZ3VyYXRpb24gPVxuICAgICAgdGFibGU6IGNvbmZpZy50YWJsZVxuICAgICAgY29sdW1uOiBmaWVsZFxuICAgICAgbWFwcGVyOiAodmFsdWUpIC0+IHZhbHVlXG5cbiAgICBzZWFyY2hDb25maWcgPSBjb25maWcuc2VhcmNoW2ZpZWxkXVxuICAgIGlmIHNlYXJjaENvbmZpZ1xuICAgICAgZmllbGRDb25maWd1cmF0aW9uLmNvbHVtbiA9IHNlYXJjaENvbmZpZy5jb2x1bW4gaWYgc2VhcmNoQ29uZmlnLmNvbHVtblxuXG4gICAgICBpZiBzZWFyY2hDb25maWcubWFwcGVyXG4gICAgICAgIG1hcHBlciA9IGNvbmZpZy5tYXBwZXJzW3NlYXJjaENvbmZpZy5tYXBwZXJdXG4gICAgICAgIGlmIG1hcHBlclxuICAgICAgICAgIGZpZWxkQ29uZmlndXJhdGlvbi5tYXBwZXIgPSBtYXBwZXJcbiAgICAgICAgZWxzZVxuICAgICAgICAgIGNvbnNvbGUubG9nIFwiIyMjIFdBUk5JTkc6IG1hcHBlciAje3NlYXJjaENvbmZpZy5tYXBwZXJ9IG5vdCBmb3VuZCwgaXQgd2lsbCBiZSBpZ25vcmVkLlwiXG5cbiAgICAgIGlmIHNlYXJjaENvbmZpZy5yZWxhdGlvbiBhbmQgY29uZmlnLnJlbGF0aW9uc1tzZWFyY2hDb25maWcucmVsYXRpb25dXG4gICAgICAgIHJlc3VsdC5yZWxhdGlvbnMucHVzaCBzZWFyY2hDb25maWcucmVsYXRpb25cbiAgICAgICAgZmllbGRDb25maWd1cmF0aW9uLnRhYmxlID0gY29uZmlnLnJlbGF0aW9uc1tzZWFyY2hDb25maWcucmVsYXRpb25dLnRhYmxlXG5cbiAgICBmaWVsZENvbmZpZ3VyYXRpb25cblxuICBAX3RvQ29sdW1uU3FsOiAocmVsYXRpb25zID0gW10sIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgY29sdW1ucyA9IGNvbmZpZ3VyYXRpb24uY29sdW1ucy5tYXAgKGNvbHVtbikgLT4gXCIje2NvbHVtbi50YWJsZSB8fCBjb25maWd1cmF0aW9uLnRhYmxlfS5cXFwiI3tjb2x1bW4ubmFtZX1cXFwiIFxcXCIje2NvbHVtbi5hbGlhc31cXFwiXCJcblxuICAgIEBfZ2V0UmVsYXRpb25SZXF1aXJlZENoYWluIGNvbmZpZ3VyYXRpb24sIHJlbGF0aW9ucywgKHJlbGF0aW9uKSAtPlxuICAgICAgcmVsYXRpb25UYWJsZSA9IHJlbGF0aW9uLnRhYmxlXG4gICAgICByZWxhdGlvbkNvbHVtbnMgPSByZWxhdGlvbi5jb2x1bW5zXG4gICAgICBjb2x1bW5zLnB1c2ggXCIje2NvbHVtbi50YWJsZSB8fCByZWxhdGlvblRhYmxlfS5cXFwiI3tjb2x1bW4ubmFtZX1cXFwiIFxcXCIje2NvbHVtbi5hbGlhc31cXFwiXCIgZm9yIGNvbHVtbiBpbiByZWxhdGlvbkNvbHVtbnNcblxuICAgIGNvbHVtbnMuam9pbiAnLCAnXG5cbiAgQF90b0pvaW5TcWw6KHJlbGF0aW9ucyA9IFtdLCBjb25maWd1cmF0aW9uKSAtPlxuICAgIHJldHVybiAnJyBpZiByZWxhdGlvbnMubGVuZ3RoIDw9IDBcbiAgICBqb2lucyA9IFtdXG4gICAgQF9nZXRSZWxhdGlvblJlcXVpcmVkQ2hhaW4gY29uZmlndXJhdGlvbiwgcmVsYXRpb25zLCAocmVsYXRpb24pIC0+IGpvaW5zLnB1c2ggcmVsYXRpb24uc3FsXG4gICAgXy51bmlxKGpvaW5zKS5qb2luICcgJ1xuXG4gIEBfZ2V0UmVsYXRpb25SZXF1aXJlZENoYWluOiAoY29uZmlndXJhdGlvbiwgcmVsYXRpb25zLCBjYWxsYmFjaykgLT5cbiAgICBmb3IgcmVsYXRpb25OYW1lIGluIHJlbGF0aW9uc1xuICAgICAgcmVsYXRpb24gPSBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbk5hbWVdXG4gICAgICBAX2dldFJlbGF0aW9uUmVxdWlyZWRDaGFpbihjb25maWd1cmF0aW9uLCByZWxhdGlvbi5yZXF1aXJlcywgY2FsbGJhY2spIGlmIHJlbGF0aW9uLnJlcXVpcmVzXG4gICAgICBjYWxsYmFjayByZWxhdGlvbiBpZiByZWxhdGlvblxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5R2VuZXJhdG9yXG4iXX0=
