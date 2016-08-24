(function() {
  var QueryGenerator, configurations;

  configurations = null;

  QueryGenerator = (function() {
    function QueryGenerator() {}

    QueryGenerator.resetConfiguration = function() {
      return configurations = null;
    };

    QueryGenerator.getConfigurations = function() {
      return configurations;
    };

    QueryGenerator.configure = function(configuration) {
      configurations || (configurations = {});
      return configurations[configuration.table] = configuration;
    };


    /*
    
    {
      table: 'tasks'
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
            { name: 'id', alias: 'this.employee.id' }
            { name: 'name', alias: 'this.employee.name' }
          ]
        }
      }
    }
     */

    QueryGenerator.toSql = function(table, relations) {
      var configuration, sqlText;
      if (relations == null) {
        relations = [];
      }
      configuration = configurations[table];
      if (!configuration) {
        return null;
      }
      sqlText = "SELECT " + (this._toColumnSql(configuration, relations)) + " FROM " + configuration.table + " " + (this._toJoinSql(configuration, relations));
      return sqlText.trim();
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5R2VuZXJhdG9yLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsY0FBQSxHQUFpQjs7RUFFWDs7O0lBRUosY0FBQyxDQUFBLGtCQUFELEdBQXFCLFNBQUE7YUFDbkIsY0FBQSxHQUFpQjtJQURFOztJQUdyQixjQUFDLENBQUEsaUJBQUQsR0FBb0IsU0FBQTthQUNsQjtJQURrQjs7SUFHcEIsY0FBQyxDQUFBLFNBQUQsR0FBWSxTQUFDLGFBQUQ7TUFDVixtQkFBQSxpQkFBbUI7YUFDbkIsY0FBZSxDQUFBLGFBQWEsQ0FBQyxLQUFkLENBQWYsR0FBc0M7SUFGNUI7OztBQUlaOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztJQXdCQSxjQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsS0FBRCxFQUFRLFNBQVI7QUFDTixVQUFBOztRQURjLFlBQVk7O01BQzFCLGFBQUEsR0FBZ0IsY0FBZSxDQUFBLEtBQUE7TUFDL0IsSUFBZSxDQUFJLGFBQW5CO0FBQUEsZUFBTyxLQUFQOztNQUVBLE9BQUEsR0FBVSxTQUFBLEdBQVMsQ0FBQyxJQUFDLENBQUEsWUFBRCxDQUFjLGFBQWQsRUFBNkIsU0FBN0IsQ0FBRCxDQUFULEdBQWtELFFBQWxELEdBQ1EsYUFBYSxDQUFDLEtBRHRCLEdBQzRCLEdBRDVCLEdBRUUsQ0FBQyxJQUFDLENBQUEsVUFBRCxDQUFZLGFBQVosRUFBMkIsU0FBM0IsQ0FBRDthQUVaLE9BQU8sQ0FBQyxJQUFSLENBQUE7SUFSTTs7SUFVUixjQUFDLENBQUEsWUFBRCxHQUFlLFNBQUMsYUFBRCxFQUFnQixTQUFoQjtBQUNiLFVBQUE7O1FBRDZCLFlBQVk7O01BQ3pDLE9BQUEsR0FBVSxhQUFhLENBQUMsT0FBTyxDQUFDLEdBQXRCLENBQTBCLFNBQUMsTUFBRDtlQUFlLE1BQU0sQ0FBQyxJQUFSLEdBQWEsS0FBYixHQUFrQixNQUFNLENBQUMsS0FBekIsR0FBK0I7TUFBN0MsQ0FBMUI7QUFDVixXQUFBLDJDQUFBOztRQUNFLElBQUcsYUFBYSxDQUFDLFNBQVUsQ0FBQSxRQUFBLENBQTNCO1VBQ0UsYUFBQSxHQUFnQixhQUFhLENBQUMsU0FBVSxDQUFBLFFBQUEsQ0FBUyxDQUFDO1VBQ2xELGVBQUEsR0FBa0IsYUFBYSxDQUFDLFNBQVUsQ0FBQSxRQUFBLENBQVMsQ0FBQztBQUNwRCxlQUFBLG1EQUFBOztZQUFBLE9BQU8sQ0FBQyxJQUFSLENBQWdCLGFBQUQsR0FBZSxHQUFmLEdBQWtCLE1BQU0sQ0FBQyxJQUF6QixHQUE4QixLQUE5QixHQUFtQyxNQUFNLENBQUMsS0FBMUMsR0FBZ0QsSUFBL0Q7QUFBQSxXQUhGOztBQURGO2FBS0EsT0FBTyxDQUFDLElBQVIsQ0FBYSxJQUFiO0lBUGE7O0lBU2YsY0FBQyxDQUFBLFVBQUQsR0FBWSxTQUFDLGFBQUQsRUFBZ0IsU0FBaEI7QUFDVixVQUFBOztRQUQwQixZQUFZOztNQUN0QyxXQUFBLEdBQWM7TUFDZCxJQUFrRixTQUFsRjtBQUFBLGFBQUEsMkNBQUE7O1VBQUEsV0FBQSxJQUFlLGFBQWEsQ0FBQyxTQUFVLENBQUEsUUFBQSxDQUFTLENBQUM7QUFBakQsU0FBQTs7YUFDQTtJQUhVOzs7Ozs7RUFLZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTlEakIiLCJmaWxlIjoicXVlcnlHZW5lcmF0b3IuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJjb25maWd1cmF0aW9ucyA9IG51bGxcblxuY2xhc3MgUXVlcnlHZW5lcmF0b3JcblxuICBAcmVzZXRDb25maWd1cmF0aW9uOiAtPlxuICAgIGNvbmZpZ3VyYXRpb25zID0gbnVsbFxuXG4gIEBnZXRDb25maWd1cmF0aW9uczogLT5cbiAgICBjb25maWd1cmF0aW9uc1xuXG4gIEBjb25maWd1cmU6IChjb25maWd1cmF0aW9uKSAtPlxuICAgIGNvbmZpZ3VyYXRpb25zIG9yPSB7fVxuICAgIGNvbmZpZ3VyYXRpb25zW2NvbmZpZ3VyYXRpb24udGFibGVdID0gY29uZmlndXJhdGlvblxuXG4gICMjI1xuXG4gIHtcbiAgICB0YWJsZTogJ3Rhc2tzJ1xuICAgIGNvbHVtbnM6IFtcbiAgICAgICAgeyBuYW1lOiAnaWQnLCBhbGlhczogJ3RoaXMuaWQnIH1cbiAgICAgICAgeyBuYW1lOiAnZGVzY3JpcHRpb24nLCBhbGlhczogJ3RoaXMuZGVzY3JpcHRpb24nIH1cbiAgICAgICAgeyBuYW1lOiAnY3JlYXRlZF9hdCcsIGFsaWFzOiAndGhpcy5jcmVhdGVkQXQnIH1cbiAgICAgICAgeyBuYW1lOiAnZW1wbG95ZWVfaWQnLCBhbGlhczogJ3RoaXMuZW1wbG95ZWUuaWQnIH1cbiAgICBdXG4gICAgcmVsYXRpb25zOiB7XG4gICAgICBlbXBsb3llZToge1xuICAgICAgICB0YWJsZTogJ2VtcGxveWVlcydcbiAgICAgICAgc3FsOiAnTEVGVCBKT0lOIGVtcGxveWVlcyBPTiB0YXNrcy5lbXBsb3llZV9pZCA9IGVtcGxveWVlcy5pZCdcbiAgICAgICAgY29sdW1uczogW1xuICAgICAgICAgIHsgbmFtZTogJ2lkJywgYWxpYXM6ICd0aGlzLmVtcGxveWVlLmlkJyB9XG4gICAgICAgICAgeyBuYW1lOiAnbmFtZScsIGFsaWFzOiAndGhpcy5lbXBsb3llZS5uYW1lJyB9XG4gICAgICAgIF1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAjIyNcblxuICBAdG9TcWw6ICh0YWJsZSwgcmVsYXRpb25zID0gW10pIC0+XG4gICAgY29uZmlndXJhdGlvbiA9IGNvbmZpZ3VyYXRpb25zW3RhYmxlXVxuICAgIHJldHVybiBudWxsIGlmIG5vdCBjb25maWd1cmF0aW9uXG5cbiAgICBzcWxUZXh0ID0gXCJTRUxFQ1QgI3tAX3RvQ29sdW1uU3FsKGNvbmZpZ3VyYXRpb24sIHJlbGF0aW9ucyl9XG4gICAgICAgICAgICAgICBGUk9NICN7Y29uZmlndXJhdGlvbi50YWJsZX1cbiAgICAgICAgICAgICAgICN7QF90b0pvaW5TcWwoY29uZmlndXJhdGlvbiwgcmVsYXRpb25zKX1cIlxuXG4gICAgc3FsVGV4dC50cmltKClcblxuICBAX3RvQ29sdW1uU3FsOiAoY29uZmlndXJhdGlvbiwgcmVsYXRpb25zID0gW10pIC0+XG4gICAgY29sdW1ucyA9IGNvbmZpZ3VyYXRpb24uY29sdW1ucy5tYXAgKGNvbHVtbikgLT4gXCIje2NvbHVtbi5uYW1lfSBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiXG4gICAgZm9yIHJlbGF0aW9uIGluIHJlbGF0aW9uc1xuICAgICAgaWYgY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dXG4gICAgICAgIHJlbGF0aW9uVGFibGUgPSBjb25maWd1cmF0aW9uLnJlbGF0aW9uc1tyZWxhdGlvbl0udGFibGVcbiAgICAgICAgcmVsYXRpb25Db2x1bW5zID0gY29uZmlndXJhdGlvbi5yZWxhdGlvbnNbcmVsYXRpb25dLmNvbHVtbnNcbiAgICAgICAgY29sdW1ucy5wdXNoIFwiI3tyZWxhdGlvblRhYmxlfS4je2NvbHVtbi5uYW1lfSBcXFwiI3tjb2x1bW4uYWxpYXN9XFxcIlwiIGZvciBjb2x1bW4gaW4gcmVsYXRpb25Db2x1bW5zXG4gICAgY29sdW1ucy5qb2luICcsICdcblxuICBAX3RvSm9pblNxbDooY29uZmlndXJhdGlvbiwgcmVsYXRpb25zID0gW10pIC0+XG4gICAgam9pblNxbFRleHQgPSAnJ1xuICAgIGpvaW5TcWxUZXh0ICs9IGNvbmZpZ3VyYXRpb24ucmVsYXRpb25zW3JlbGF0aW9uXS5zcWwgZm9yIHJlbGF0aW9uIGluIHJlbGF0aW9ucyBpZiByZWxhdGlvbnNcbiAgICBqb2luU3FsVGV4dFxuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5R2VuZXJhdG9yXG4iXX0=
