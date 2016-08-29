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


    /*
    
    {
      table: 'tasks'
      search: {
        employee_name: {
           relation: 'employee'
           column: 'name'
        }
      }
      columns: [
          { name: 'id', alias: 'this.id' }
          { name: 'description', alias: 'this.description' }
          { name: 'created_at', alias: 'this.createdAt' }
          { name: 'employee_id', alias: 'this.employee.id' }
      ]
      relations: {
        employee: {
          table: 'employees'
          sql: 'LEFT JOIN employees ON tasks.employee_id = employees.id'
          columns: [
            { name: 'name', alias: 'this.employee.name' }
          ]
        }
      }
    }
     */

    QueryGenerator.toSql = function(args) {
      var relations, whereResult;
      whereResult = this.toWhere(args.table, args.where, args.options);
      relations = _.uniq(whereResult.relations.concat(args.relations || []));
      return {
        sqlCount: (this.toSelectCount(args.table, relations)) + " " + whereResult.where,
        sqlSelect: (this.toSelect(args.table, relations)) + " " + whereResult.where + " " + (this.toOptions(args.table, args.options)),
        params: whereResult.params,
        relations: relations
      };
    };

    QueryGenerator.toSelectCount = function(table, relations) {
      var configuration, sqlText;
      if (relations == null) {
        relations = [];
      }
      configuration = QueryConfiguration.getConfiguration(table);
      if (!configuration) {
        return null;
      }
      sqlText = "SELECT COUNT(distinct " + configuration.table + ".\"id\") FROM " + configuration.table + " " + (this._toJoinSql(configuration, relations));
      return sqlText.trim();
    };

    QueryGenerator.toSelect = function(table, relations) {
      var configuration, sqlText;
      if (relations == null) {
        relations = [];
      }
      configuration = QueryConfiguration.getConfiguration(table);
      if (!configuration) {
        return null;
      }
      sqlText = "SELECT " + (this._toColumnSql(configuration, relations)) + " FROM " + configuration.table + " " + (this._toJoinSql(configuration, relations));
      return sqlText.trim();
    };

    QueryGenerator.toOptions = function(table, options) {
      var configuration, direction, limit, offset, sort, sqlText;
      configuration = QueryConfiguration.getConfiguration(table);
      if (!configuration) {
        return null;
      }
      offset = options.offset || 0;
      limit = options.limit || 25;
      sort = configuration.table + ".\"id\" ASC";
      if (options.sort) {
        direction = options.sort.indexOf('-') === 0 ? 'DESC' : 'ASC';
        options.sort = options.sort.replace('-', '');
        sort = configuration.table + ".\"" + options.sort + "\" " + direction;
      }
      sqlText = "ORDER BY " + sort + " OFFSET " + offset + " LIMIT " + limit;
      return sqlText;
    };

    QueryGenerator.toWhere = function(table, conditions, options) {
      var configuration, field, result, value;
      if (_.isEmpty(conditions) && !(options != null ? options.tenant : void 0)) {
        return {
          where: 'WHERE 1=1',
          params: [],
          relations: []
        };
      }
      configuration = QueryConfiguration.getConfiguration(table);
      if (!configuration) {
        return null;
      }
      result = {
        where: [],
        params: [],
        relations: []
      };
      if (options != null ? options.tenant : void 0) {
        result.params.push(options.tenant.value);
        result.where.push("(" + configuration.table + ".\"" + options.tenant.column + "\" = $" + result.params.length + ")");
      }
      for (field in conditions) {
        if (!hasProp.call(conditions, field)) continue;
        value = conditions[field];
        if (_.isArray(value)) {
          this._whereClauseAsArray(field, value, result, configuration);
        } else if (value === null) {
          this._whereNullClause(field, value, result, configuration);
        } else {
          this._whereOperatorClause(field, value, result, configuration);
        }
      }
      result.where = "WHERE " + (result.where.join(' AND '));
      result.relations = _.uniq(result.relations);
      return result;
    };

    QueryGenerator._whereOperatorClause = function(field, value, result, configuration) {
      var fieldOperator;
      fieldOperator = this._getWhereOperator(field);
      field = field.replace(fieldOperator.operator, '');
      field = this._getFieldConfigurationOrDefault(configuration, field, result);
      if (field.mapper) {
        result.params.push(field.mapper(value));
      } else {
        result.params.push(value);
      }
      return result.where.push(field.table + ".\"" + field.column + "\" " + fieldOperator.operator + " $" + result.params.length);
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
        if (fieldConfig.mapper) {
          result.params.push(fieldConfig.mapper(arrValue));
        } else {
          result.params.push(arrValue);
        }
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

    QueryGenerator._getFieldConfigurationOrDefault = function(configuration, field, result) {
      var fieldConfiguration, mapper, searchConfig;
      fieldConfiguration = {
        table: configuration.table,
        column: field,
        mapper: null
      };
      searchConfig = configuration.search[field];
      if (searchConfig) {
        if (searchConfig.column) {
          fieldConfiguration.column = searchConfig.column;
        }
        if (searchConfig.mapper) {
          console.log(searchConfig.mapper);
          mapper = QueryConfiguration.getMapper(searchConfig.mapper);
          if (mapper) {
            fieldConfiguration.mapper = mapper;
          }
        }
        if (searchConfig.relation) {
          if (configuration.relations[searchConfig.relation]) {
            result.relations.push(searchConfig.relation);
            fieldConfiguration.table = configuration.relations[searchConfig.relation].table;
          }
        }
      }
      return fieldConfiguration;
    };

    QueryGenerator._toColumnSql = function(configuration, relations) {
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

    QueryGenerator._toJoinSql = function(configuration, relations) {
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkNBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxrQkFBQSxHQUFxQixPQUFBLENBQVEsc0JBQVI7O0VBRXJCOzs7Ozs7Ozs7Ozs7OztFQWFNOzs7O0FBRUo7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUE2QkEsY0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQ7QUFDTixVQUFBO01BQUEsV0FBQSxHQUFjLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBSSxDQUFDLEtBQWQsRUFBcUIsSUFBSSxDQUFDLEtBQTFCLEVBQWlDLElBQUksQ0FBQyxPQUF0QztNQUNkLFNBQUEsR0FBWSxDQUFDLENBQUMsSUFBRixDQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBdEIsQ0FBNkIsSUFBSSxDQUFDLFNBQUwsSUFBa0IsRUFBL0MsQ0FBUDtBQUVaLGFBQU87UUFDTCxRQUFBLEVBQVksQ0FBQyxJQUFDLENBQUEsYUFBRCxDQUFlLElBQUksQ0FBQyxLQUFwQixFQUEyQixTQUEzQixDQUFELENBQUEsR0FBdUMsR0FBdkMsR0FBMEMsV0FBVyxDQUFDLEtBRDdEO1FBRUwsU0FBQSxFQUFhLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFJLENBQUMsS0FBZixFQUFzQixTQUF0QixDQUFELENBQUEsR0FBa0MsR0FBbEMsR0FBcUMsV0FBVyxDQUFDLEtBQWpELEdBQXVELEdBQXZELEdBQXlELENBQUMsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsS0FBaEIsRUFBdUIsSUFBSSxDQUFDLE9BQTVCLENBQUQsQ0FGakU7UUFHTCxNQUFBLEVBQVEsV0FBVyxDQUFDLE1BSGY7UUFJTCxTQUFBLEVBQVcsU0FKTjs7SUFKRDs7SUFXUixjQUFDLENBQUEsYUFBRCxHQUFn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QVMsQ0FBQztBQUFqRCxTQUFBOzthQUNBO0lBVFU7Ozs7OztFQVdkLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBbE5qQiIsImZpbGUiOiJxdWVyeUdlbmVyYXRvci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIl8gICAgPSByZXF1aXJlICdsb2Rhc2gnXG51dGlsID0gcmVxdWlyZSAndXRpbCdcblF1ZXJ5Q29uZmlndXJhdGlvbiA9IHJlcXVpcmUgJy4vcXVlcnlDb25maWd1cmF0aW9uJ1xuXG5gXG5pZiAoIVN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGgpIHtcblN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG52YXIgc3ViamVjdFN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbmlmICh0eXBlb2YgcG9zaXRpb24gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShwb3NpdGlvbikgfHwgTWF0aC5mbG9vcihwb3NpdGlvbikgIT09IHBvc2l0aW9uIHx8IHBvc2l0aW9uID4gc3ViamVjdFN0cmluZy5sZW5ndGgpIHtcbnBvc2l0aW9uID0gc3ViamVjdFN0cmluZy5sZW5ndGg7XG59XG5wb3NpdGlvbiAtPSBzZWFyY2hTdHJpbmcubGVuZ3RoO1xudmFyIGxhc3RJbmRleCA9IHN1YmplY3RTdHJpbmcuaW5kZXhPZihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKTtcbnJldHVybiBsYXN0SW5kZXggIT09IC0xICYmIGxhc3RJbmRleCA9PT0gcG9zaXRpb247XG59O1xufVxuYFxuY2xhc3MgUXVlcnlHZW5lcmF0b3JcblxuICAjIyNcblxuICB7XG4gICAgdGFibGU6ICd0YXNrcydcbiAgICBzZWFyY2g6IHtcbiAgICAgIGVtcGxveWVlX25hbWU6IHtcbiAgICAgICAgIHJlbGF0aW9uOiAnZW1wbG95ZWUnXG4gICAgICAgICBjb2x1bW46ICduYW1lJ1xuICAgICAgfVxuICAgIH1cbiAgICBjb2x1bW5zOiBbXG4gICAgICAgIHsgbmFtZTogJ2lkJywgYWxpYXM6ICd0aGlzLmlkJyB9XG4gICAgICAgIHsgbmFtZTogJ2Rlc2NyaXB0aW9uJywgYWxpYXM6ICd0aGlzLmRlc2NyaXB0aW9uJyB9XG4gICAgICAgIHsgbmFtZTogJ2NyZWF0ZWRfYXQnLCBhbGlhczogJ3RoaXMuY3JlYXRlZEF0JyB9XG4gICAgICAgIHsgbmFtZTogJ2VtcGxveWVlX2lkJywgYWxpYXM6ICd0aGlzLmVtcGxveWVlLmlkJyB9XG4gICAgXVxuICAgIHJlbGF0aW9uczoge1xuICAgICAgZW1wbG95ZWU6IHtcbiAgICAgICAgdGFibGU6ICdlbXBsb3llZXMnXG4gICAgICAgIHNxbDogJ0xFRlQgSk9JTiBlbXBsb3llZXMgT04gdGFza3MuZW1wbG95ZWVfaWQgPSBlbXBsb3llZXMuaWQnXG4gICAgICAgIGNvbHVtbnM6IFtcbiAgICAgICAgICB7IG5hbWU6ICduYW1lJywgYWxpYXM6ICd0aGlzLmVtcGxveWVlLm5hbWUnIH1cbiAgICAgICAgXVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gICMjI1xuXG4gIEB0b1NxbDogKGFyZ3MpIC0+XG4gICAgd2hlcmVSZXN1bHQgPSBAdG9XaGVyZShhcmdzLnRhYmxlLCBhcmdzLndoZXJlLCBhcmdzLm9wdGlvbnMpXG4gICAgcmVsYXRpb25zID0gXy51bmlxKHdoZXJlUmVzdWx0LnJlbGF0aW9ucy5jb25jYXQoYXJncy5yZWxhdGlvbnMgfHwgW10pKVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHNxbENvdW50OiBcIiN7QHRvU2VsZWN0Q291bnQoYXJncy50YWJsZSwgcmVsYXRpb25zKX0gI3t3aGVyZVJlc3VsdC53aGVyZX1cIlxuICAgICAgc3FsU2VsZWN0OiBcIiN7QHRvU2VsZWN0KGFyZ3MudGFibGUsIHJlbGF0aW9ucyl9ICN7d2hlcmVSZXN1bHQud2hlcmV9ICN7QHRvT3B0aW9ucyhhcmdzLnRhYmxlLCBhcmdzLm9wdGlvbnMpfVwiXG4gICAgICBwYXJhbXM6IHdoZXJlUmVzdWx0LnBhcmFtc1xuICAgICAgcmVsYXRpb25zOiByZWxhdGlvbnNcbiAgICB9XG5cbiAgQHRvU2VsZWN0Q291bnQ6ICh0YWJsZSwgcmVsYXRpb25zID0gW10pIC0+XG4gICAgY29uZmlndXJhdGlvbiA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ3VyYXRpb25cbiAgICBcbiAgICBzcWxUZXh0ID0gXCJTRUxFQ1QgQ09VTlQoZGlzdGluY3QgI3tjb25maWd1cmF0aW9uLnRhYmxlfS5cXFwiaWRcXFwiKVxuICAgICAgICAgICAgICAgICBGUk9NICN7Y29uZmlndXJhdGlvbi50YWJsZX1cbiAgICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChjb25maWd1cmF0aW9uLCByZWxhdGlvbnMpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9TZWxlY3Q6ICh0YWJsZSwgcmVsYXRpb25zID0gW10pIC0+XG4gICAgY29uZmlndXJhdGlvbiA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ3VyYXRpb25cblxuICAgIHNxbFRleHQgPSBcIlNFTEVDVCAje0BfdG9Db2x1bW5TcWwoY29uZmlndXJhdGlvbiwgcmVsYXRpb25zKX1cbiAgICAgICAgICAgICAgIEZST00gI3tjb25maWd1cmF0aW9uLnRhYmxlfVxuICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChjb25maWd1cmF0aW9uLCByZWxhdGlvbnMpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9PcHRpb25zOiAodGFibGUsIG9wdGlvbnMpIC0+XG4gICAgY29uZmlndXJhdGlvbiA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ3VyYXRpb25cblxuICAgIG9mZnNldCA9IG9wdGlvbnMub2Zmc2V0IG9yIDBcbiAgICBsaW1pdCA9IG9wdGlvbnMubGltaXQgb3IgMjVcblxuICAgIHNvcnQgPSBcIiN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcImlkXFxcIiBBU0NcIlxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgZGlyZWN0aW9uID0gaWYgb3B0aW9ucy5zb3J0LmluZGV4T2YoJy0nKSBpcyAwIHRoZW4gJ0RFU0MnIGVsc2UgJ0FTQydcbiAgICAgIG9wdGlvbnMuc29ydCA9IG9wdGlvbnMuc29ydC5yZXBsYWNlKCctJywgJycpXG4gICAgICBzb3J0ID0gXCIje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje29wdGlvbnMuc29ydH1cXFwiICN7ZGlyZWN0aW9ufVwiXG5cbiAgICBzcWxUZXh0ID0gXCJPUkRFUiBCWSAje3NvcnR9IE9GRlNFVCAje29mZnNldH0gTElNSVQgI3tsaW1pdH1cIlxuICAgIHNxbFRleHRcblxuXG4gIEB0b1doZXJlOiAodGFibGUsIGNvbmRpdGlvbnMsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIHsgd2hlcmU6ICdXSEVSRSAxPTEnLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH0gaWYgXy5pc0VtcHR5KGNvbmRpdGlvbnMpIGFuZCBub3Qgb3B0aW9ucz8udGVuYW50XG4gICAgY29uZmlndXJhdGlvbiA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ3VyYXRpb25cblxuICAgIHJlc3VsdCA9IHsgd2hlcmU6IFtdLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH1cblxuICAgIGlmIG9wdGlvbnM/LnRlbmFudFxuICAgICAgcmVzdWx0LnBhcmFtcy5wdXNoIG9wdGlvbnMudGVuYW50LnZhbHVlXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIigje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje29wdGlvbnMudGVuYW50LmNvbHVtbn1cXFwiID0gJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9KVwiXG5cbiAgICBmb3Igb3duIGZpZWxkLCB2YWx1ZSBvZiBjb25kaXRpb25zXG4gICAgICBpZiBfLmlzQXJyYXkgdmFsdWVcbiAgICAgICAgQF93aGVyZUNsYXVzZUFzQXJyYXkgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb25cbiAgICAgIGVsc2UgaWYgdmFsdWUgaXMgbnVsbFxuICAgICAgICBAX3doZXJlTnVsbENsYXVzZSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvblxuICAgICAgZWxzZVxuICAgICAgICBAX3doZXJlT3BlcmF0b3JDbGF1c2UgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb25cblxuICAgIHJlc3VsdC53aGVyZSA9IFwiV0hFUkUgI3tyZXN1bHQud2hlcmUuam9pbiAnIEFORCAnfVwiXG4gICAgcmVzdWx0LnJlbGF0aW9ucyA9IF8udW5pcShyZXN1bHQucmVsYXRpb25zKVxuICAgIHJlc3VsdFxuXG4gIEBfd2hlcmVPcGVyYXRvckNsYXVzZTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGZpZWxkT3BlcmF0b3IgPSBAX2dldFdoZXJlT3BlcmF0b3IgZmllbGRcbiAgICBmaWVsZCA9IGZpZWxkLnJlcGxhY2UgZmllbGRPcGVyYXRvci5vcGVyYXRvciwgJydcbiAgICBmaWVsZCA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcblxuICAgIGlmIGZpZWxkLm1hcHBlclxuICAgICAgcmVzdWx0LnBhcmFtcy5wdXNoIGZpZWxkLm1hcHBlcih2YWx1ZSlcbiAgICBlbHNlXG4gICAgICByZXN1bHQucGFyYW1zLnB1c2ggdmFsdWVcblxuICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiI3tmaWVsZC50YWJsZX0uXFxcIiN7ZmllbGQuY29sdW1ufVxcXCIgI3tmaWVsZE9wZXJhdG9yLm9wZXJhdG9yfSAkI3tyZXN1bHQucGFyYW1zLmxlbmd0aH1cIlxuXG4gIEBfZ2V0V2hlcmVPcGVyYXRvcjogKGZpZWxkKSAtPlxuICAgIG9wZXJhdG9ycyA9IHtcbiAgICAgIGdyZWF0ZXJPckVxdWFsVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPj0nIH1cbiAgICAgIGdyZWF0ZXJUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc+JyB9XG4gICAgICBsZXNzT3JFcXVhbFRoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJzw9JyB9XG4gICAgICBsZXNzVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPCcgfVxuICAgICAgaUxpa2VPcGVyYXRvcjogeyBvcGVyYXRvcjogJ35+KicgfVxuICAgICAgZXF1YWxPcGVyYXRvcjogeyBvcGVyYXRvcjogJz0nIH1cbiAgICB9XG5cbiAgICBvcGVyYXRvckhhbmRsZXIgPSBzd2l0Y2hcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJz49JyB0aGVuIG9wZXJhdG9ycy5ncmVhdGVyT3JFcXVhbFRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPicgdGhlbiBvcGVyYXRvcnMuZ3JlYXRlclRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPD0nIHRoZW4gb3BlcmF0b3JzLmxlc3NPckVxdWFsVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc8JyB0aGVuIG9wZXJhdG9ycy5sZXNzVGhhbk9wZXJhdG9yXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICd+fionIHRoZW4gb3BlcmF0b3JzLmlMaWtlT3BlcmF0b3JcbiAgICAgIGVsc2Ugb3BlcmF0b3JzLmVxdWFsT3BlcmF0b3JcblxuICAgIG9wZXJhdG9ySGFuZGxlclxuXG4gIEBfd2hlcmVDbGF1c2VBc0FycmF5OiAoZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgYXJyVmFsdWVzID0gW11cbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICBmb3IgYXJyVmFsdWUgaW4gdmFsdWUgd2hlbiBhcnJWYWx1ZSBub3QgaW4gWydudWxsJywgbnVsbF1cbiAgICAgIGlmIGZpZWxkQ29uZmlnLm1hcHBlclxuICAgICAgICByZXN1bHQucGFyYW1zLnB1c2ggZmllbGRDb25maWcubWFwcGVyKGFyclZhbHVlKVxuICAgICAgZWxzZVxuICAgICAgICByZXN1bHQucGFyYW1zLnB1c2ggYXJyVmFsdWVcbiAgICAgIGFyclZhbHVlcy5wdXNoIFwiJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9XCJcbiAgICB3aXRoTnVsbCA9ICdudWxsJyBpbiB2YWx1ZSBvciBudWxsIGluIHZhbHVlXG4gICAgaWYgd2l0aE51bGxcbiAgICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiKCN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7ZmllbGR9XFxcIiBpbiAoI3thcnJWYWx1ZXMuam9pbignLCAnKX0pIE9SICN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7ZmllbGR9XFxcIiBpcyBudWxsKVwiXG4gICAgZWxzZVxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje2ZpZWxkfVxcXCIgaW4gKCN7YXJyVmFsdWVzLmpvaW4oJywgJyl9KVwiXG5cbiAgQF93aGVyZU51bGxDbGF1c2U6IChmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvbikgLT5cbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiIGlzIG51bGxcIiBpZiB2YWx1ZSBpcyBudWxsXG5cbiAgQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQ6IChjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0KSAtPiAjIFRPRE8gc2hvdWxkIGJlIHRlc3RlZCBzZXBhcmF0ZWx5XG5cbiAgICBmaWVsZENvbmZpZ3VyYXRpb24gPVxuICAgICAgdGFibGU6IGNvbmZpZ3VyYXRpb24udGFibGVcbiAgICAgIGNvbHVtbjogZmllbGRcbiAgICAgIG1hcHBlcjogbnVsbFxuXG5cbiAgICBzZWFyY2hDb25maWcgPSBjb25maWd1cmF0aW9uLnNlYXJjaFtmaWVsZF1cbiAgICBpZiBzZWFyY2hDb25maWdcbiAgICAgIGZpZWxkQ29uZmlndXJhdGlvbi5jb2x1bW4gPSBzZWFyY2hDb25maWcuY29sdW1uIGlmIHNlYXJjaENvbmZpZy5jb2x1bW5cbiAgICAgIGlmIHNlYXJjaENvbmZpZy5tYXBwZXJcbiAgICAgICAgY29uc29sZS5sb2cgc2VhcmNoQ29uZmlnLm1hcHBlclxuICAgICAgICBtYXBwZXIgPSBRdWVyeUNvbmZpZ3VyYXRpb24uZ2V0TWFwcGVyIHNlYXJjaENvbmZpZy5tYXBwZXJcbiAgICAgICAgZmllbGRDb25maWd1cmF0aW9uLm1hcHBlciA9IG1hcHBlciBpZiBtYXBwZXJcbiAgICAgIGlmIHNlYXJjaENvbmZpZy5yZWxhdGlvblxuICAgICAgICBpZiBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tzZWFyY2hDb25maWcucmVsYXRpb25dXG4gICAgICAgICAgcmVzdWx0LnJlbGF0aW9ucy5wdXNoIHNlYXJjaENvbmZpZy5yZWxhdGlvblxuICAgICAgICAgIGZpZWxkQ29uZmlndXJhdGlvbi50YWJsZSA9IGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3NlYXJjaENvbmZpZy5yZWxhdGlvbl0udGFibGVcblxuICAgIGZpZWxkQ29uZmlndXJhdGlvblxuXG4gIEBfdG9Db2x1bW5TcWw6IChjb25maWd1cmF0aW9uLCByZWxhdGlvbnMgPSBbXSkgLT5cbiAgICBjb2x1bW5zID0gY29uZmlndXJhdGlvbi5jb2x1bW5zLm1hcCAoY29sdW1uKSAtPiBcIiN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7Y29sdW1uLm5hbWV9XFxcIiBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiXG4gICAgZm9yIHJlbGF0aW9uIGluIHJlbGF0aW9uc1xuICAgICAgaWYgY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dXG4gICAgICAgIHJlbGF0aW9uVGFibGUgPSBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl0udGFibGVcbiAgICAgICAgcmVsYXRpb25Db2x1bW5zID0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dLmNvbHVtbnNcbiAgICAgICAgY29sdW1ucy5wdXNoIFwiI3tyZWxhdGlvblRhYmxlfS4je2NvbHVtbi5uYW1lfSBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiIGZvciBjb2x1bW4gaW4gcmVsYXRpb25Db2x1bW5zXG4gICAgY29sdW1ucy5qb2luICcsICdcblxuICBAX3RvSm9pblNxbDooY29uZmlndXJhdGlvbiwgcmVsYXRpb25zID0gW10pIC0+XG4gICAgam9pblNxbFRleHQgPSAnJ1xuXG4gICAgIyMjXG4gICAgICBUT0RPOiBpZiBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl0gaXMgdW5kZWZpbmVkXG4gICAgICB3aGVuIHJlbGF0aW9uIHdhcyBub3QgY29uZmlndXJlZCA6U1xuICAgICMjI1xuXG4gICAgam9pblNxbFRleHQgKz0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dLnNxbCBmb3IgcmVsYXRpb24gaW4gcmVsYXRpb25zIGlmIHJlbGF0aW9uc1xuICAgIGpvaW5TcWxUZXh0XG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlHZW5lcmF0b3JcbiJdfQ==
