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
        relations: whereResult.relations
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
      result.params.push(value);
      field = field.replace(fieldOperator.operator, '');
      field = this._getFieldConfigurationOrDefault(configuration, field, result);
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
      var arrValue, arrValues, i, len, withNull;
      arrValues = [];
      for (i = 0, len = value.length; i < len; i++) {
        arrValue = value[i];
        if (!(arrValue !== 'null' && arrValue !== null)) {
          continue;
        }
        result.params.push(arrValue);
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
      var fieldConfiguration, searchConfig;
      fieldConfiguration = {
        table: configuration.table,
        column: field
      };
      searchConfig = configuration.search[field];
      if (searchConfig) {
        if (searchConfig.column) {
          fieldConfiguration.column = searchConfig.column;
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
        return column.name + " \"" + column.alias + "\"";
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsMkNBQUE7SUFBQTs7O0VBQUEsQ0FBQSxHQUFPLE9BQUEsQ0FBUSxRQUFSOztFQUNQLElBQUEsR0FBTyxPQUFBLENBQVEsTUFBUjs7RUFDUCxrQkFBQSxHQUFxQixPQUFBLENBQVEsc0JBQVI7O0VBRXJCOzs7Ozs7Ozs7Ozs7OztFQWFNOzs7O0FBRUo7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7SUE2QkEsY0FBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLElBQUQ7QUFDTixVQUFBO01BQUEsV0FBQSxHQUFjLElBQUMsQ0FBQSxPQUFELENBQVMsSUFBSSxDQUFDLEtBQWQsRUFBcUIsSUFBSSxDQUFDLEtBQTFCLEVBQWlDLElBQUksQ0FBQyxPQUF0QztNQUNkLFNBQUEsR0FBWSxDQUFDLENBQUMsSUFBRixDQUFPLFdBQVcsQ0FBQyxTQUFTLENBQUMsTUFBdEIsQ0FBNkIsSUFBSSxDQUFDLFNBQUwsSUFBa0IsRUFBL0MsQ0FBUDtBQUVaLGFBQU87UUFDTCxRQUFBLEVBQVksQ0FBQyxJQUFDLENBQUEsYUFBRCxDQUFlLElBQUksQ0FBQyxLQUFwQixFQUEyQixTQUEzQixDQUFELENBQUEsR0FBdUMsR0FBdkMsR0FBMEMsV0FBVyxDQUFDLEtBRDdEO1FBRUwsU0FBQSxFQUFhLENBQUMsSUFBQyxDQUFBLFFBQUQsQ0FBVSxJQUFJLENBQUMsS0FBZixFQUFzQixTQUF0QixDQUFELENBQUEsR0FBa0MsR0FBbEMsR0FBcUMsV0FBVyxDQUFDLEtBQWpELEdBQXVELEdBQXZELEdBQXlELENBQUMsSUFBQyxDQUFBLFNBQUQsQ0FBVyxJQUFJLENBQUMsS0FBaEIsRUFBdUIsSUFBSSxDQUFDLE9BQTVCLENBQUQsQ0FGakU7UUFHTCxNQUFBLEVBQVEsV0FBVyxDQUFDLE1BSGY7UUFJTCxTQUFBLEVBQVcsV0FBVyxDQUFDLFNBSmxCOztJQUpEOztJQVdSLGNBQUMsQ0FB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QUFDLFNBQVUsQ0FBQSxRQUFBLENBQVMsQ0FBQztBQUNwRCxlQUFBLG1EQUFBOztZQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWdCLGFBQUQsR0FBZSxHQUFmLEdBQWtCLE1BQU0sQ0FBQyxJQUF6QixHQUE4QixLQUE5QixHQUFtQyxNQUFNLENBQUMsS0FBMUMsR0FBZ0QsSUFBL0Q7QUFBQSxXQUhGOztBQURGO2FBS0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFiO0lBUGE7O0lBU2YsY0FBQyxDQUFBLFVBQUQsR0FBWSxTQUFDLGFBQUQsRUFBZ0IsU0FBaEI7QUFDVixVQUFBOztRQUQwQixZQUFZOztNQUN0QyxXQUFBLEdBQWM7O0FBRWQ7Ozs7TUFLQSxJQUFrRixTQUFsRjtBQUFBLGFBQUEsMkNBQUE7O1VBQUEsV0FBQSxJQUFlLGFBQWEsQ0FBQyxTQUFVLENBQUEsUUFBQSxDQUFTLENBQUM7QUFBakQsU0FBQTs7YUFDQTtJQVRVOzs7Ozs7RUFXZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQW5NakIiLCJmaWxlIjoicXVlcnlHZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJfICAgID0gcmVxdWlyZSAnbG9kYXNoJ1xudXRpbCA9IHJlcXVpcmUgJ3V0aWwnXG5RdWVyeUNvbmZpZ3VyYXRpb24gPSByZXF1aXJlICcuL3F1ZXJ5Q29uZmlndXJhdGlvbidcblxuYFxuaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKSB7XG5TdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoID0gZnVuY3Rpb24oc2VhcmNoU3RyaW5nLCBwb3NpdGlvbikge1xudmFyIHN1YmplY3RTdHJpbmcgPSB0aGlzLnRvU3RyaW5nKCk7XG5pZiAodHlwZW9mIHBvc2l0aW9uICE9PSAnbnVtYmVyJyB8fCAhaXNGaW5pdGUocG9zaXRpb24pIHx8IE1hdGguZmxvb3IocG9zaXRpb24pICE9PSBwb3NpdGlvbiB8fCBwb3NpdGlvbiA+IHN1YmplY3RTdHJpbmcubGVuZ3RoKSB7XG5wb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xufVxucG9zaXRpb24gLT0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbnZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG5yZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xufTtcbn1cbmBcbmNsYXNzIFF1ZXJ5R2VuZXJhdG9yXG5cbiAgIyMjXG5cbiAge1xuICAgIHRhYmxlOiAndGFza3MnXG4gICAgc2VhcmNoOiB7XG4gICAgICBlbXBsb3llZV9uYW1lOiB7XG4gICAgICAgICByZWxhdGlvbjogJ2VtcGxveWVlJ1xuICAgICAgICAgY29sdW1uOiAnbmFtZSdcbiAgICAgIH1cbiAgICB9XG4gICAgY29sdW1uczogW1xuICAgICAgICB7IG5hbWU6ICdpZCcsIGFsaWFzOiAndGhpcy5pZCcgfVxuICAgICAgICB7IG5hbWU6ICdkZXNjcmlwdGlvbicsIGFsaWFzOiAndGhpcy5kZXNjcmlwdGlvbicgfVxuICAgICAgICB7IG5hbWU6ICdjcmVhdGVkX2F0JywgYWxpYXM6ICd0aGlzLmNyZWF0ZWRBdCcgfVxuICAgICAgICB7IG5hbWU6ICdlbXBsb3llZV9pZCcsIGFsaWFzOiAndGhpcy5lbXBsb3llZS5pZCcgfVxuICAgIF1cbiAgICByZWxhdGlvbnM6IHtcbiAgICAgIGVtcGxveWVlOiB7XG4gICAgICAgIHRhYmxlOiAnZW1wbG95ZWVzJ1xuICAgICAgICBzcWw6ICdMRUZUIEpPSU4gZW1wbG95ZWVzIE9OIHRhc2tzLmVtcGxveWVlX2lkID0gZW1wbG95ZWVzLmlkJ1xuICAgICAgICBjb2x1bW5zOiBbXG4gICAgICAgICAgeyBuYW1lOiAnbmFtZScsIGFsaWFzOiAndGhpcy5lbXBsb3llZS5uYW1lJyB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAjIyNcblxuICBAdG9TcWw6IChhcmdzKSAtPlxuICAgIHdoZXJlUmVzdWx0ID0gQHRvV2hlcmUoYXJncy50YWJsZSwgYXJncy53aGVyZSwgYXJncy5vcHRpb25zKVxuICAgIHJlbGF0aW9ucyA9IF8udW5pcSh3aGVyZVJlc3VsdC5yZWxhdGlvbnMuY29uY2F0KGFyZ3MucmVsYXRpb25zIHx8IFtdKSlcblxuICAgIHJldHVybiB7XG4gICAgICBzcWxDb3VudDogXCIje0B0b1NlbGVjdENvdW50KGFyZ3MudGFibGUsIHJlbGF0aW9ucyl9ICN7d2hlcmVSZXN1bHQud2hlcmV9XCJcbiAgICAgIHNxbFNlbGVjdDogXCIje0B0b1NlbGVjdChhcmdzLnRhYmxlLCByZWxhdGlvbnMpfSAje3doZXJlUmVzdWx0LndoZXJlfSAje0B0b09wdGlvbnMoYXJncy50YWJsZSwgYXJncy5vcHRpb25zKX1cIlxuICAgICAgcGFyYW1zOiB3aGVyZVJlc3VsdC5wYXJhbXNcbiAgICAgIHJlbGF0aW9uczogd2hlcmVSZXN1bHQucmVsYXRpb25zXG4gICAgfVxuXG4gIEB0b1NlbGVjdENvdW50OiAodGFibGUsIHJlbGF0aW9ucyA9IFtdKSAtPlxuICAgIGNvbmZpZ3VyYXRpb24gPSBRdWVyeUNvbmZpZ3VyYXRpb24uZ2V0Q29uZmlndXJhdGlvbiB0YWJsZVxuICAgIHJldHVybiBudWxsIGlmIG5vdCBjb25maWd1cmF0aW9uXG5cbiAgICBzcWxUZXh0ID0gXCJTRUxFQ1QgQ09VTlQoZGlzdGluY3QgI3tjb25maWd1cmF0aW9uLnRhYmxlfS5cXFwiaWRcXFwiKVxuICAgICAgICAgICAgICAgICBGUk9NICN7Y29uZmlndXJhdGlvbi50YWJsZX1cbiAgICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChjb25maWd1cmF0aW9uLCByZWxhdGlvbnMpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9TZWxlY3Q6ICh0YWJsZSwgcmVsYXRpb25zID0gW10pIC0+XG4gICAgY29uZmlndXJhdGlvbiA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ3VyYXRpb25cblxuICAgIHNxbFRleHQgPSBcIlNFTEVDVCAje0BfdG9Db2x1bW5TcWwoY29uZmlndXJhdGlvbiwgcmVsYXRpb25zKX1cbiAgICAgICAgICAgICAgIEZST00gI3tjb25maWd1cmF0aW9uLnRhYmxlfVxuICAgICAgICAgICAgICAgI3tAX3RvSm9pblNxbChjb25maWd1cmF0aW9uLCByZWxhdGlvbnMpfVwiXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAdG9PcHRpb25zOiAodGFibGUsIG9wdGlvbnMpIC0+XG4gICAgY29uZmlndXJhdGlvbiA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ3VyYXRpb25cblxuICAgIG9mZnNldCA9IG9wdGlvbnMub2Zmc2V0IG9yIDBcbiAgICBsaW1pdCA9IG9wdGlvbnMubGltaXQgb3IgMjVcblxuICAgIHNvcnQgPSBcIiN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcImlkXFxcIiBBU0NcIlxuICAgIGlmIG9wdGlvbnMuc29ydFxuICAgICAgZGlyZWN0aW9uID0gaWYgb3B0aW9ucy5zb3J0LmluZGV4T2YoJy0nKSBpcyAwIHRoZW4gJ0RFU0MnIGVsc2UgJ0FTQydcbiAgICAgIG9wdGlvbnMuc29ydCA9IG9wdGlvbnMuc29ydC5yZXBsYWNlKCctJywgJycpXG4gICAgICBzb3J0ID0gXCIje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje29wdGlvbnMuc29ydH1cXFwiICN7ZGlyZWN0aW9ufVwiXG5cbiAgICBzcWxUZXh0ID0gXCJPUkRFUiBCWSAje3NvcnR9IE9GRlNFVCAje29mZnNldH0gTElNSVQgI3tsaW1pdH1cIlxuICAgIHNxbFRleHRcblxuXG4gIEB0b1doZXJlOiAodGFibGUsIGNvbmRpdGlvbnMsIG9wdGlvbnMpIC0+XG4gICAgcmV0dXJuIHsgd2hlcmU6ICdXSEVSRSAxPTEnLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH0gaWYgXy5pc0VtcHR5KGNvbmRpdGlvbnMpIGFuZCBub3Qgb3B0aW9ucz8udGVuYW50XG4gICAgY29uZmlndXJhdGlvbiA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcmV0dXJuIG51bGwgaWYgbm90IGNvbmZpZ3VyYXRpb25cblxuICAgIHJlc3VsdCA9IHsgd2hlcmU6IFtdLCBwYXJhbXM6IFtdLCByZWxhdGlvbnM6IFtdIH1cblxuICAgIGlmIG9wdGlvbnM/LnRlbmFudFxuICAgICAgcmVzdWx0LnBhcmFtcy5wdXNoIG9wdGlvbnMudGVuYW50LnZhbHVlXG4gICAgICByZXN1bHQud2hlcmUucHVzaCBcIigje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje29wdGlvbnMudGVuYW50LmNvbHVtbn1cXFwiID0gJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9KVwiXG5cbiAgICBmb3Igb3duIGZpZWxkLCB2YWx1ZSBvZiBjb25kaXRpb25zXG4gICAgICBpZiBfLmlzQXJyYXkgdmFsdWVcbiAgICAgICAgQF93aGVyZUNsYXVzZUFzQXJyYXkgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb25cbiAgICAgIGVsc2UgaWYgdmFsdWUgaXMgbnVsbFxuICAgICAgICBAX3doZXJlTnVsbENsYXVzZSBmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvblxuICAgICAgZWxzZVxuICAgICAgICBAX3doZXJlT3BlcmF0b3JDbGF1c2UgZmllbGQsIHZhbHVlLCByZXN1bHQsIGNvbmZpZ3VyYXRpb25cblxuICAgIHJlc3VsdC53aGVyZSA9IFwiV0hFUkUgI3tyZXN1bHQud2hlcmUuam9pbiAnIEFORCAnfVwiXG4gICAgcmVzdWx0LnJlbGF0aW9ucyA9IF8udW5pcShyZXN1bHQucmVsYXRpb25zKVxuICAgIHJlc3VsdFxuXG4gIEBfd2hlcmVPcGVyYXRvckNsYXVzZTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGZpZWxkT3BlcmF0b3IgPSBAX2dldFdoZXJlT3BlcmF0b3IgZmllbGRcbiAgICByZXN1bHQucGFyYW1zLnB1c2ggdmFsdWVcbiAgICBmaWVsZCA9IGZpZWxkLnJlcGxhY2UgZmllbGRPcGVyYXRvci5vcGVyYXRvciwgJydcbiAgICBmaWVsZCA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGQudGFibGV9LlxcXCIje2ZpZWxkLmNvbHVtbn1cXFwiICN7ZmllbGRPcGVyYXRvci5vcGVyYXRvcn0gJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9XCJcblxuICBAX2dldFdoZXJlT3BlcmF0b3I6IChmaWVsZCkgLT5cbiAgICBvcGVyYXRvcnMgPSB7XG4gICAgICBncmVhdGVyT3JFcXVhbFRoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJz49JyB9XG4gICAgICBncmVhdGVyVGhhbk9wZXJhdG9yOiB7IG9wZXJhdG9yOiAnPicgfVxuICAgICAgbGVzc09yRXF1YWxUaGFuT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc8PScgfVxuICAgICAgbGVzc1RoYW5PcGVyYXRvcjogeyBvcGVyYXRvcjogJzwnIH1cbiAgICAgIGlMaWtlT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICd+fionIH1cbiAgICAgIGVxdWFsT3BlcmF0b3I6IHsgb3BlcmF0b3I6ICc9JyB9XG4gICAgfVxuXG4gICAgb3BlcmF0b3JIYW5kbGVyID0gc3dpdGNoXG4gICAgICB3aGVuIGZpZWxkLmVuZHNXaXRoICc+PScgdGhlbiBvcGVyYXRvcnMuZ3JlYXRlck9yRXF1YWxUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJz4nIHRoZW4gb3BlcmF0b3JzLmdyZWF0ZXJUaGFuT3BlcmF0b3JcbiAgICAgIHdoZW4gZmllbGQuZW5kc1dpdGggJzw9JyB0aGVuIG9wZXJhdG9ycy5sZXNzT3JFcXVhbFRoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnPCcgdGhlbiBvcGVyYXRvcnMubGVzc1RoYW5PcGVyYXRvclxuICAgICAgd2hlbiBmaWVsZC5lbmRzV2l0aCAnfn4qJyB0aGVuIG9wZXJhdG9ycy5pTGlrZU9wZXJhdG9yXG4gICAgICBlbHNlIG9wZXJhdG9ycy5lcXVhbE9wZXJhdG9yXG5cbiAgICBvcGVyYXRvckhhbmRsZXJcblxuICBAX3doZXJlQ2xhdXNlQXNBcnJheTogKGZpZWxkLCB2YWx1ZSwgcmVzdWx0LCBjb25maWd1cmF0aW9uKSAtPlxuICAgIGFyclZhbHVlcyA9IFtdXG4gICAgZm9yIGFyclZhbHVlIGluIHZhbHVlIHdoZW4gYXJyVmFsdWUgbm90IGluIFsnbnVsbCcsIG51bGxdXG4gICAgICByZXN1bHQucGFyYW1zLnB1c2ggYXJyVmFsdWVcbiAgICAgIGFyclZhbHVlcy5wdXNoIFwiJCN7cmVzdWx0LnBhcmFtcy5sZW5ndGh9XCJcbiAgICB3aXRoTnVsbCA9ICdudWxsJyBpbiB2YWx1ZSBvciBudWxsIGluIHZhbHVlXG4gICAgaWYgd2l0aE51bGxcbiAgICAgIHJlc3VsdC53aGVyZS5wdXNoIFwiKCN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7ZmllbGR9XFxcIiBpbiAoI3thcnJWYWx1ZXMuam9pbignLCAnKX0pIE9SICN7Y29uZmlndXJhdGlvbi50YWJsZX0uXFxcIiN7ZmllbGR9XFxcIiBpcyBudWxsKVwiXG4gICAgZWxzZVxuICAgICAgcmVzdWx0LndoZXJlLnB1c2ggXCIje2NvbmZpZ3VyYXRpb24udGFibGV9LlxcXCIje2ZpZWxkfVxcXCIgaW4gKCN7YXJyVmFsdWVzLmpvaW4oJywgJyl9KVwiXG5cbiAgQF93aGVyZU51bGxDbGF1c2U6IChmaWVsZCwgdmFsdWUsIHJlc3VsdCwgY29uZmlndXJhdGlvbikgLT5cbiAgICBmaWVsZENvbmZpZyA9IEBfZ2V0RmllbGRDb25maWd1cmF0aW9uT3JEZWZhdWx0IGNvbmZpZ3VyYXRpb24sIGZpZWxkLCByZXN1bHRcbiAgICByZXN1bHQud2hlcmUucHVzaCBcIiN7ZmllbGRDb25maWcudGFibGV9LlxcXCIje2ZpZWxkQ29uZmlnLmNvbHVtbn1cXFwiIGlzIG51bGxcIiBpZiB2YWx1ZSBpcyBudWxsXG5cbiAgQF9nZXRGaWVsZENvbmZpZ3VyYXRpb25PckRlZmF1bHQ6IChjb25maWd1cmF0aW9uLCBmaWVsZCwgcmVzdWx0KSAtPiAjIFRPRE8gc2hvdWxkIGJlIHRlc3RlZCBzZXBhcmF0ZWx5XG5cbiAgICBmaWVsZENvbmZpZ3VyYXRpb24gPVxuICAgICAgdGFibGU6IGNvbmZpZ3VyYXRpb24udGFibGVcbiAgICAgIGNvbHVtbjogZmllbGRcblxuICAgIHNlYXJjaENvbmZpZyA9IGNvbmZpZ3VyYXRpb24uc2VhcmNoW2ZpZWxkXVxuICAgIGlmIHNlYXJjaENvbmZpZ1xuICAgICAgZmllbGRDb25maWd1cmF0aW9uLmNvbHVtbiA9IHNlYXJjaENvbmZpZy5jb2x1bW4gaWYgc2VhcmNoQ29uZmlnLmNvbHVtblxuICAgICAgaWYgc2VhcmNoQ29uZmlnLnJlbGF0aW9uXG4gICAgICAgIGlmIGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3NlYXJjaENvbmZpZy5yZWxhdGlvbl1cbiAgICAgICAgICByZXN1bHQucmVsYXRpb25zLnB1c2ggc2VhcmNoQ29uZmlnLnJlbGF0aW9uXG4gICAgICAgICAgZmllbGRDb25maWd1cmF0aW9uLnRhYmxlID0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbc2VhcmNoQ29uZmlnLnJlbGF0aW9uXS50YWJsZVxuXG4gICAgZmllbGRDb25maWd1cmF0aW9uXG5cbiAgQF90b0NvbHVtblNxbDogKGNvbmZpZ3VyYXRpb24sIHJlbGF0aW9ucyA9IFtdKSAtPlxuICAgIGNvbHVtbnMgPSBjb25maWd1cmF0aW9uLmNvbHVtbnMubWFwIChjb2x1bW4pIC0+IFwiI3tjb2x1bW4ubmFtZX0gXFxcIiN7Y29sdW1uLmFsaWFzfVxcXCJcIlxuICAgIGZvciByZWxhdGlvbiBpbiByZWxhdGlvbnNcbiAgICAgIGlmIGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3JlbGF0aW9uXVxuICAgICAgICByZWxhdGlvblRhYmxlID0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dLnRhYmxlXG4gICAgICAgIHJlbGF0aW9uQ29sdW1ucyA9IGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3JlbGF0aW9uXS5jb2x1bW5zXG4gICAgICAgIGNvbHVtbnMucHVzaCBcIiN7cmVsYXRpb25UYWJsZX0uI3tjb2x1bW4ubmFtZX0gXFxcIiN7Y29sdW1uLmFsaWFzfVxcXCJcIiBmb3IgY29sdW1uIGluIHJlbGF0aW9uQ29sdW1uc1xuICAgIGNvbHVtbnMuam9pbiAnLCAnXG5cbiAgQF90b0pvaW5TcWw6KGNvbmZpZ3VyYXRpb24sIHJlbGF0aW9ucyA9IFtdKSAtPlxuICAgIGpvaW5TcWxUZXh0ID0gJydcblxuICAgICMjI1xuICAgICAgVE9ETzogaWYgY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dIGlzIHVuZGVmaW5lZFxuICAgICAgd2hlbiByZWxhdGlvbiB3YXMgbm90IGNvbmZpZ3VyZWQgOlNcbiAgICAjIyNcblxuICAgIGpvaW5TcWxUZXh0ICs9IGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3JlbGF0aW9uXS5zcWwgZm9yIHJlbGF0aW9uIGluIHJlbGF0aW9ucyBpZiByZWxhdGlvbnNcbiAgICBqb2luU3FsVGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5R2VuZXJhdG9yXG4iXX0=
