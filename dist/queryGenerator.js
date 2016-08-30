(function() {
  var QueryConfiguration, QueryGenerator, _, util,
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require('lodash');

  util = require('util');

  QueryConfiguration = require('./queryConfiguration');

  
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkNBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxrQkFBQSxHQUFxQixPQUFBLENBQVEsc0JBQVI7O0VBRXJCOzs7Ozs7Ozs7Ozs7OztFQWFNOzs7SUFFSixjQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsSUFBRCxFQUFPLE1BQVA7QUFDTixVQUFBO01BQUEsV0FBQSxHQUFjLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBSSxDQUFDLEtBQWQsRUFBcUIsTUFBckIsRUFBNkIsSUFBSSxDQUFDLE9BQWxDO01BQ2QsU0FBQSxHQUFZLENBQUMsQ0FBQyxJQUFGLENBQU8sV0FBVyxDQUFDLFNBQVMsQ0FBQyxNQUF0QixDQUE2QixJQUFJLENBQUMsU0FBTCxJQUFrQixFQUEvQyxDQUFQO0FBRVosYUFBTztRQUNMLFFBQUEsRUFBWSxDQUFDLElBQUMsQ0FBQSxhQUFELENBQWUsU0FBZixFQUEwQixNQUExQixDQUFELENBQUEsR0FBbUMsR0FBbkMsR0FBc0MsV0FBVyxDQUFDLEtBRHpEO1FBRUwsU0FBQSxFQUFhLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxTQUFWLEVBQXFCLE1BQXJCLENBQUQsQ0FBQSxHQUE4QixHQUE5QixHQUFpQyxXQUFXLENBQUMsS0FBN0MsR0FBbUQsR0FBbkQsR0FBcUQsQ0FBQyxJQUFDLENBQUEsU0FBRCxDQUFXLElBQUksQ0FBQyxPQUFoQixFQUF5QixNQUF6QixDQUFELENBRjdEO1FBR0wsTUFBQSxFQUFRLFdBQVcsQ0FBQyxNQUhmO1FBSUwsU0FBQSxFQUFXLFNBSk47O0lBSkQ7O0lBV1IsY0FBQyxDQUFBLGFBQUQsR0FBZ0IsU0FBQyxTQUFELEVBQWlCLE1BQWpCO0FBQ2QsVUFBQTs7UUFEZSxZQUFZOztNQUMzQixPQUFBLEdBQVUsd0JB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Q0FBUyxDQUFDO0FBQ3BELGVBQUEsbURBQUE7O1lBQUEsT0FBTyxDQUFDLElBQVIsQ0FBZ0IsYUFBRCxHQUFlLEdBQWYsR0FBa0IsTUFBTSxDQUFDLElBQXpCLEdBQThCLEtBQTlCLEdBQW1DLE1BQU0sQ0FBQyxLQUExQyxHQUFnRCxJQUEvRDtBQUFBLFdBSEY7O0FBREY7YUFLQSxPQUFPLENBQUMsSUFBUixDQUFhLElBQWI7SUFQYTs7SUFTZixjQUFDLENBQUEsVUFBRCxHQUFZLFNBQUMsU0FBRCxFQUFpQixhQUFqQjtBQUNWLFVBQUE7O1FBRFcsWUFBWTs7TUFDdkIsV0FBQSxHQUFjOztBQUVkOzs7O01BS0EsSUFBa0YsU0FBbEY7QUFBQSxhQUFBLDJDQUFBOztVQUFBLFdBQUEsSUFBZSxhQUFhLENBQUMsU0FBVSxDQUFBLFFBQUEsQ0FBUyxDQUFDO0FBQWpELFNBQUE7O2FBQ0E7SUFUVTs7Ozs7O0VBV2QsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFwS2pCIiwiZmlsZSI6InF1ZXJ5R2VuZXJhdG9yLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiXyAgICA9IHJlcXVpcmUgJ2xvZGFzaCdcbnV0aWwgPSByZXF1aXJlICd1dGlsJ1xuUXVlcnlDb25maWd1cmF0aW9uID0gcmVxdWlyZSAnLi9xdWVyeUNvbmZpZ3VyYXRpb24nXG5cbmBcbmlmICghU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCkge1xuU3RyaW5nLnByb3RvdHlwZS5lbmRzV2l0aCA9IGZ1bmN0aW9uKHNlYXJjaFN0cmluZywgcG9zaXRpb24pIHtcbnZhciBzdWJqZWN0U3RyaW5nID0gdGhpcy50b1N0cmluZygpO1xuaWYgKHR5cGVvZiBwb3NpdGlvbiAhPT0gJ251bWJlcicgfHwgIWlzRmluaXRlKHBvc2l0aW9uKSB8fCBNYXRoLmZsb29yKHBvc2l0aW9uKSAhPT0gcG9zaXRpb24gfHwgcG9zaXRpb24gPiBzdWJqZWN0U3RyaW5nLmxlbmd0aCkge1xucG9zaXRpb24gPSBzdWJqZWN0U3RyaW5nLmxlbmd0aDtcbn1cbnBvc2l0aW9uIC09IHNlYXJjaFN0cmluZy5sZW5ndGg7XG52YXIgbGFzdEluZGV4ID0gc3ViamVjdFN0cmluZy5pbmRleE9mKHNlYXJjaFN0cmluZywgcG9zaXRpb24pO1xucmV0dXJuIGxhc3RJbmRleCAhPT0gLTEgJiYgbGFzdEluZGV4ID09PSBwb3NpdGlvbjtcbn07XG59XG5gXG5jbGFzcyBRdWVyeUdlbmVyYXRvclxuXG4gIEB0b1NxbDogKGFyZ3MsIGNvbmZpZykgLT5cbiAgICB3aGVyZVJlc3VsdCA9IEB0b1doZXJlKGFyZ3Mud2hlcmUsIGNvbmZpZywgYXJncy5vcHRpb25zKVxuICAgIHJlbGF0aW9ucyA9IF8udW5pcSh3aGVyZVJlc3VsdC5yZWxhdGlvbnMuY29uY2F0KGFyZ3MucmVsYXRpb25zIHx8IFtdKSlcblxuICAgIHJldHVybiB7XG4gICAgICBzcWxDb3VudDogXCIje0B0b1NlbGVjdENvdW50KHJlbGF0aW9ucywgY29uZmlnKX0gI3t3aGVyZVJlc3VsdC53aGVyZX1cIlxuICAgICAgc3FsU2VsZWN0OiBcIiN7QHRvU2VsZWN0KHJlbGF0aW9ucywgY29uZmlnKX0gI3t3aGVyZVJlc3VsdC53aGVyZX0gI3tAdG9PcHRpb25zKGFyZ3Mub3B0aW9ucywgY29uZmlnKX1cIlxuICAgICAgcGFyYW1zOiB3aGVyZVJlc3VsdC5wYXJhbXNcbiAgICAgIHJlbGF0aW9uczogcmVsYXRpb25zXG4gICAgfVxuXG4gIEB0b1NlbGVjdENvdW50OiAocmVsYXRpb25zID0gW10sIGNvbmZpZykgLT5cbiAgICBzcWxUZXh0ID0gXCJTRUxFQ1QgQ09VTlQoZGlzdGluY3QgI3tjb25maWcudGFibGV9LlxcXCJpZFxcXCIpXG4gICAgICAgICAgICAgICAgIEZST00gI3tjb25maWcudGFibGV9XG4gICAgICAgICAgICAgICAgICN7QF90b0pvaW5TcWwocmVsYXRpb25zLCBjb25maWcpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9TZWxlY3Q6IChyZWxhdGlvbnMgPSBbXSwgY29uZmlnKSAtPlxuICAgIHNxbFRleHQgPSBcIlNFTEVDVCAje0BfdG9Db2x1bW5TcWwocmVsYXRpb25zLCBjb25maWcpfVxuICAgICAgICAgICAgICAgRlJPTSAje2NvbmZpZy50YWJsZX1cbiAgICAgICAgICAgICAgICN7QF90b0pvaW5TcWwocmVsYXRpb25zLCBjb25maWcpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9PcHRpb25zOiAob3B0aW9ucywgY29uZmlnKSAtPlxuICAgIG9mZnNldCA9IG9wdGlvbnMub2Zmc2V0IG9yIDBcbiAgICBsaW1pdCA9IG9wdGlvbnMubGltaXQgb3IgMjVcblxuICAgIHNvcnQgPSBcIiN7Y29uZmlnLnRhYmxlfS5cXFwiaWRcXFwiIEFTQ1wiXG4gICAgaWYgb3B0aW9ucy5zb3J0XG4gICAgICBkaXJlY3Rpb24gPSBpZiBvcHRpb25zLnNvcnQuaW5kZXhPZignLScpIGlzIDAgdGhlbiAnREVTQycgZWxzZSAnQVNDJ1xuICAgICAgb3B0aW9ucy5zb3J0ID0gb3B0aW9ucy5zb3J0LnJlcGxhY2UoJy0nLCAnJylcbiAgICAgIHNvcnQgPSBcIiN7Y29uZmlnLnRhYmxlfS5cXFwiI3tvcHRpb25zLnNvcnR9XFxcIiAje2RpcmVjdGlvbn1cIlxuXG4gICAgc3FsVGV4dCA9IFwiT1JERVIgQlkgI3tzb3J0fSBPRkZTRVQgI3tvZmZzZXR9IExJTUlUICN7bGltaXR9XCJcbiAgICBzcWxUZXh0XG5cblxuICBAdG9XaGVyZTogKGNvbmRpdGlvbnMsIGNvbmZpZywgb3B0aW9ucykgLT5cbiAgICByZXR1cm4geyB3aGVyZTogJ1dIRVJFIDE9MScsIHBhcmFtczogW10sIHJlbGF0aW9uczogW10gfSBpZiBfLmlzRW1wdHkoY29uZGl0aW9ucykgYW5kIG5vdCBvcHRpb25zPy50ZW5hbnRcblxuICAgIHJlc3VsdCA9IHsgd2hlcmU6IFtdLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH1cblxuICAgIGlmIG9wdGlvbnM/LnRlbmFudFxuICAgICAgcmVzdWx0LnBhcmFtcy5wdXNoIG9wdGlvbnMudGVuYW50LnZhbHVlXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIigje2NvbmZpZy50YWJsZX0uXFxcIiN7b3B0aW9ucy50ZW5hbnQuY29sdW1ufVxcXCIgPSAkI3tyZXN1bHQucGFyYW1zLmxlbmd0aH0pXCJcblxuICAgIGZvciBvd24gZmllbGQsIHZhbHVlIG9mIGNvbmRpdGlvbnNcbiAgICAgIGlmIF8uaXNBcnJheSB2YWx1ZVxuICAgICAgICBAX3doZXJlQ2xhdXNlQXNBcnJheSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlnXG4gICAgICBlbHNlIGlmIHZhbHVlIGlzIG51bGxcbiAgICAgICAgQF93aGVyZU51bGxDbGF1c2UgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ1xuICAgICAgZWxzZVxuICAgICAgICBAX3doZXJlT3BlcmF0b3JDbGF1c2UgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ1xuXG4gICAgcmVzdWx0LndoZXJlID0gXCJXSEVSRSAje3Jlc3VsdC53aGVyZS5qb2luICcgQU5EICd9XCJcbiAgICByZXN1bHQucmVsYXRpb25zID0gXy51bmlxKHJlc3VsdC5yZWxhdGlvbnMpXG4gICAgcmVzdWx0XG5cbiAgQF93aGVyZU9wZXJhdG9yQ2xhdXNlOiAoZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgZmllbGRPcGVyYXRvciA9IEBfZ2V0V2hlcmVPcGVyYXRvciBmaWVsZFxuICAgIGZpZWxkID0gZmllbGQucmVwbGFjZSBmaWVsZE9wZXJhdG9yLm9wZXJhdG9yLCAnJ1xuICAgIGZpZWxkQ29uZmlnID0gQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQgY29uZmlndXJhdGlvbiwgZmllbGQsIHJlc3VsdFxuICAgIHJlc3VsdC5wYXJhbXMucHVzaCBmaWVsZENvbmZpZy5tYXBwZXIodmFsdWUpXG4gICAgcmVzdWx0LndoZXJlLnB1c2ggXCIje2ZpZWxkQ29uZmlnLnRhYmxlfS5cXFwiI3tmaWVsZENvbmZpZy5jb2x1bW59XFxcIiAje2ZpZWxkT3BlcmF0b3Iub3BlcmF0b3J9ICQje3Jlc3VsdC5wYXJhbXMubGVuZ3RofVwiXG5cbiAgQF9nZXRXaGVyZU9wZXJhdG9yOiAoZmllbGQpIC0+XG4gICAgb3BlcmF0b3JzID0ge1xuICAgICAgZ3JlYXRlck9yRXF1YWxUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc+PScgfVxuICAgICAgZ3JlYXRlclRoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJz4nIH1cbiAgICAgIGxlc3NPckVxdWFsVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPD0nIH1cbiAgICAgIGxlc3NUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc8JyB9XG4gICAgICBpTGlrZU9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnfn4qJyB9XG4gICAgICBlcXVhbE9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPScgfVxuICAgIH1cblxuICAgIG9wZXJhdG9ySGFuZGxlciA9IHN3aXRjaFxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPj0nIHRoZW4gb3BlcmF0b3JzLmdyZWF0ZXJPckVxdWFsVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc+JyB0aGVuIG9wZXJhdG9ycy5ncmVhdGVyVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc8PScgdGhlbiBvcGVyYXRvcnMubGVzc09yRXF1YWxUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJzwnIHRoZW4gb3BlcmF0b3JzLmxlc3NUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJ35+KicgdGhlbiBvcGVyYXRvcnMuaUxpa2VPcGVyYXRvclxuICAgICAgZWxzZSBvcGVyYXRvcnMuZXF1YWxPcGVyYXRvclxuXG4gICAgb3BlcmF0b3JIYW5kbGVyXG5cbiAgQF93aGVyZUNsYXVzZUFzQXJyYXk6IChmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvbikgLT5cbiAgICBhcnJWYWx1ZXMgPSBbXVxuICAgIGZpZWxkQ29uZmlnID0gQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQgY29uZmlndXJhdGlvbiwgZmllbGQsIHJlc3VsdFxuICAgIGZvciBhcnJWYWx1ZSBpbiB2YWx1ZSB3aGVuIGFyclZhbHVlIG5vdCBpbiBbJ251bGwnLCBudWxsXVxuICAgICAgcmVzdWx0LnBhcmFtcy5wdXNoIGZpZWxkQ29uZmlnLm1hcHBlcihhcnJWYWx1ZSlcbiAgICAgIGFyclZhbHVlcy5wdXNoIFwiJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9XCJcbiAgICB3aXRoTnVsbCA9ICdudWxsJyBpbiB2YWx1ZSBvciBudWxsIGluIHZhbHVlXG4gICAgaWYgd2l0aE51bGxcbiAgICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiKCN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7ZmllbGR9XFxcIiBpbiAoI3thcnJWYWx1ZXMuam9pbignLCAnKX0pIE9SICN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7ZmllbGR9XFxcIiBpcyBudWxsKVwiXG4gICAgZWxzZVxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje2ZpZWxkfVxcXCIgaW4gKCN7YXJyVmFsdWVzLmpvaW4oJywgJyl9KVwiXG5cbiAgQF93aGVyZU51bGxDbGF1c2U6IChmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvbikgLT5cbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiIGlzIG51bGxcIiBpZiB2YWx1ZSBpcyBudWxsXG5cbiAgQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQ6IChjb25maWcsIGZpZWxkLCByZXN1bHQpIC0+ICMgVE9ETyBzaG91bGQgYmUgdGVzdGVkIHNlcGFyYXRlbHlcblxuICAgIGZpZWxkQ29uZmlndXJhdGlvbiA9XG4gICAgICB0YWJsZTogY29uZmlnLnRhYmxlXG4gICAgICBjb2x1bW46IGZpZWxkXG4gICAgICBtYXBwZXI6ICh2YWx1ZSkgLT4gdmFsdWVcblxuICAgIHNlYXJjaENvbmZpZyA9IGNvbmZpZy5zZWFyY2hbZmllbGRdXG4gICAgaWYgc2VhcmNoQ29uZmlnXG4gICAgICBmaWVsZENvbmZpZ3VyYXRpb24uY29sdW1uID0gc2VhcmNoQ29uZmlnLmNvbHVtbiBpZiBzZWFyY2hDb25maWcuY29sdW1uXG5cbiAgICAgIGlmIHNlYXJjaENvbmZpZy5tYXBwZXJcbiAgICAgICAgbWFwcGVyID0gY29uZmlnLm1hcHBlcnNbc2VhcmNoQ29uZmlnLm1hcHBlcl1cbiAgICAgICAgaWYgbWFwcGVyXG4gICAgICAgICAgZmllbGRDb25maWd1cmF0aW9uLm1hcHBlciA9IG1hcHBlclxuICAgICAgICBlbHNlXG4gICAgICAgICAgY29uc29sZS5sb2cgXCIjIyMgV0FSTklORzogbWFwcGVyICN7c2VhcmNoQ29uZmlnLm1hcHBlcn0gbm90IGZvdW5kLCBpdCB3aWxsIGJlIGlnbm9yZWQuXCJcblxuICAgICAgaWYgc2VhcmNoQ29uZmlnLnJlbGF0aW9uIGFuZCBjb25maWcucmVsYXRpb25zW3NlYXJjaENvbmZpZy5yZWxhdGlvbl1cbiAgICAgICAgcmVzdWx0LnJlbGF0aW9ucy5wdXNoIHNlYXJjaENvbmZpZy5yZWxhdGlvblxuICAgICAgICBmaWVsZENvbmZpZ3VyYXRpb24udGFibGUgPSBjb25maWcucmVsYXRpb25zW3NlYXJjaENvbmZpZy5yZWxhdGlvbl0udGFibGVcblxuICAgIGZpZWxkQ29uZmlndXJhdGlvblxuXG4gIEBfdG9Db2x1bW5TcWw6IChyZWxhdGlvbnMgPSBbXSwgY29uZmlndXJhdGlvbikgLT5cbiAgICBjb2x1bW5zID0gY29uZmlndXJhdGlvbi5jb2x1bW5zLm1hcCAoY29sdW1uKSAtPiBcIiN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7Y29sdW1uLm5hbWV9XFxcIiBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiXG4gICAgZm9yIHJlbGF0aW9uIGluIHJlbGF0aW9uc1xuICAgICAgaWYgY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dXG4gICAgICAgIHJlbGF0aW9uVGFibGUgPSBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl0udGFibGVcbiAgICAgICAgcmVsYXRpb25Db2x1bW5zID0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dLmNvbHVtbnNcbiAgICAgICAgY29sdW1ucy5wdXNoIFwiI3tyZWxhdGlvblRhYmxlfS4je2NvbHVtbi5uYW1lfSBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiIGZvciBjb2x1bW4gaW4gcmVsYXRpb25Db2x1bW5zXG4gICAgY29sdW1ucy5qb2luICcsICdcblxuICBAX3RvSm9pblNxbDoocmVsYXRpb25zID0gW10sIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgam9pblNxbFRleHQgPSAnJ1xuXG4gICAgIyMjXG4gICAgICBUT0RPOiBpZiBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl0gaXMgdW5kZWZpbmVkXG4gICAgICB3aGVuIHJlbGF0aW9uIHdhcyBub3QgY29uZmlndXJlZCA6U1xuICAgICMjI1xuXG4gICAgam9pblNxbFRleHQgKz0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dLnNxbCBmb3IgcmVsYXRpb24gaW4gcmVsYXRpb25zIGlmIHJlbGF0aW9uc1xuICAgIGpvaW5TcWxUZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlHZW5lcmF0b3JcbiJdfQ==
