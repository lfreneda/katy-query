(function() {
  var QueryConfiguration, configurations;

  configurations = null;

  QueryConfiguration = (function() {
    function QueryConfiguration() {}

    QueryConfiguration.resetConfiguration = function() {
      return configurations = null;
    };

    QueryConfiguration.getConfigurations = function() {
      return configurations;
    };

    QueryConfiguration.getConfiguration = function(table) {
      return configurations[table];
    };

    QueryConfiguration.configure = function(configuration) {
      configurations || (configurations = {});
      return configurations[configuration.table] = configuration;
    };

    return QueryConfiguration;

  })();

  module.exports = QueryConfiguration;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5Q29uZmlndXJhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGNBQUEsR0FBaUI7O0VBRVg7OztJQUNKLGtCQUFDLENBQUEsa0JBQUQsR0FBcUIsU0FBQTthQUNuQixjQUFBLEdBQWlCO0lBREU7O0lBR3JCLGtCQUFDLENBQUEsaUJBQUQsR0FBb0IsU0FBQTthQUNsQjtJQURrQjs7SUFHcEIsa0JBQUMsQ0FBQSxnQkFBRCxHQUFtQixTQUFDLEtBQUQ7YUFDakIsY0FBZSxDQUFBLEtBQUE7SUFERTs7SUFHbkIsa0JBQUMsQ0FBQSxTQUFELEdBQVksU0FBQyxhQUFEO01BQ1YsbUJBQUEsaUJBQW1CO2FBQ25CLGNBQWUsQ0FBQSxhQUFhLENBQUMsS0FBZCxDQUFmLEdBQXNDO0lBRjVCOzs7Ozs7RUFJZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQWhCakIiLCJmaWxlIjoicXVlcnlDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiY29uZmlndXJhdGlvbnMgPSBudWxsXG5cbmNsYXNzIFF1ZXJ5Q29uZmlndXJhdGlvblxuICBAcmVzZXRDb25maWd1cmF0aW9uOiAtPlxuICAgIGNvbmZpZ3VyYXRpb25zID0gbnVsbFxuXG4gIEBnZXRDb25maWd1cmF0aW9uczogLT5cbiAgICBjb25maWd1cmF0aW9uc1xuXG4gIEBnZXRDb25maWd1cmF0aW9uOiAodGFibGUpLT5cbiAgICBjb25maWd1cmF0aW9uc1t0YWJsZV1cblxuICBAY29uZmlndXJlOiAoY29uZmlndXJhdGlvbikgLT5cbiAgICBjb25maWd1cmF0aW9ucyBvcj0ge31cbiAgICBjb25maWd1cmF0aW9uc1tjb25maWd1cmF0aW9uLnRhYmxlXSA9IGNvbmZpZ3VyYXRpb25cblxubW9kdWxlLmV4cG9ydHMgPSBRdWVyeUNvbmZpZ3VyYXRpb24iXX0=
