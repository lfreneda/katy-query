(function() {
  var QueryConfiguration, configurations, mappers;

  configurations = {};

  mappers = {};

  QueryConfiguration = (function() {
    function QueryConfiguration() {}

    QueryConfiguration.resetConfiguration = function() {
      return configurations = {};
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

    QueryConfiguration.addMapper = function(name, map) {
      mappers || (mappers = {});
      return mappers[name] = map;
    };

    QueryConfiguration.getMapper = function(name) {
      return mappers[name];
    };

    return QueryConfiguration;

  })();

  module.exports = QueryConfiguration;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5Q29uZmlndXJhdGlvbi5jb2ZmZWUiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFBQSxNQUFBOztFQUFBLGNBQUEsR0FBaUI7O0VBQ2pCLE9BQUEsR0FBVTs7RUFFSjs7O0lBQ0osa0JBQUMsQ0FBQSxrQkFBRCxHQUFxQixTQUFBO2FBQ25CLGNBQUEsR0FBaUI7SUFERTs7SUFHckIsa0JBQUMsQ0FBQSxpQkFBRCxHQUFvQixTQUFBO2FBQ2xCO0lBRGtCOztJQUdwQixrQkFBQyxDQUFBLGdCQUFELEdBQW1CLFNBQUMsS0FBRDthQUNqQixjQUFlLENBQUEsS0FBQTtJQURFOztJQUduQixrQkFBQyxDQUFBLFNBQUQsR0FBWSxTQUFDLGFBQUQ7TUFDVixtQkFBQSxpQkFBbUI7YUFDbkIsY0FBZSxDQUFBLGFBQWEsQ0FBQyxLQUFkLENBQWYsR0FBc0M7SUFGNUI7O0lBSVosa0JBQUMsQ0FBQSxTQUFELEdBQVksU0FBQyxJQUFELEVBQU8sR0FBUDtNQUNWLFlBQUEsVUFBWTthQUNaLE9BQVEsQ0FBQSxJQUFBLENBQVIsR0FBZ0I7SUFGTjs7SUFJWixrQkFBQyxDQUFBLFNBQUQsR0FBWSxTQUFDLElBQUQ7YUFDVixPQUFRLENBQUEsSUFBQTtJQURFOzs7Ozs7RUFHZCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQXhCakIiLCJmaWxlIjoicXVlcnlDb25maWd1cmF0aW9uLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiY29uZmlndXJhdGlvbnMgPSB7fVxubWFwcGVycyA9IHt9XG5cbmNsYXNzIFF1ZXJ5Q29uZmlndXJhdGlvblxuICBAcmVzZXRDb25maWd1cmF0aW9uOiAtPlxuICAgIGNvbmZpZ3VyYXRpb25zID0ge31cblxuICBAZ2V0Q29uZmlndXJhdGlvbnM6IC0+XG4gICAgY29uZmlndXJhdGlvbnNcblxuICBAZ2V0Q29uZmlndXJhdGlvbjogKHRhYmxlKS0+XG4gICAgY29uZmlndXJhdGlvbnNbdGFibGVdXG5cbiAgQGNvbmZpZ3VyZTogKGNvbmZpZ3VyYXRpb24pIC0+XG4gICAgY29uZmlndXJhdGlvbnMgb3I9IHt9XG4gICAgY29uZmlndXJhdGlvbnNbY29uZmlndXJhdGlvbi50YWJsZV0gPSBjb25maWd1cmF0aW9uXG5cbiAgQGFkZE1hcHBlcjogKG5hbWUsIG1hcCkgLT5cbiAgICBtYXBwZXJzIG9yPSB7fVxuICAgIG1hcHBlcnNbbmFtZV0gPSBtYXBcblxuICBAZ2V0TWFwcGVyOiAobmFtZSkgLT5cbiAgICBtYXBwZXJzW25hbWVdXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlDb25maWd1cmF0aW9uIl19
