(function() {
  var QueryConfiguration, QuerySearchParser, searchQuery,
    hasProp = {}.hasOwnProperty;

  QueryConfiguration = require('./queryConfiguration');

  searchQuery = require('search-query-parser');

  QuerySearchParser = (function() {
    function QuerySearchParser() {}

    QuerySearchParser.parse = function(syntaxSearch, config) {
      var parseResult;
      parseResult = searchQuery.parse(syntaxSearch, this._toOptions(config));
      delete parseResult.text;
      return parseResult;
    };

    QuerySearchParser._toOptions = function(config) {
      var key, options, value;
      options = {
        keywords: (function() {
          var ref, results;
          ref = config.search;
          results = [];
          for (key in ref) {
            if (!hasProp.call(ref, key)) continue;
            value = ref[key];
            results.push(key);
          }
          return results;
        })()
      };
      return options;
    };

    return QuerySearchParser;

  })();

  module.exports = QuerySearchParser;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5U2VhcmNoUGFyc2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0RBQUE7SUFBQTs7RUFBQSxrQkFBQSxHQUFxQixPQUFBLENBQVEsc0JBQVI7O0VBQ3JCLFdBQUEsR0FBYyxPQUFBLENBQVEscUJBQVI7O0VBRVI7OztJQUNKLGlCQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsWUFBRCxFQUFlLE1BQWY7QUFDTixVQUFBO01BQUEsV0FBQSxHQUFjLFdBQVcsQ0FBQyxLQUFaLENBQWtCLFlBQWxCLEVBQWdDLElBQUMsQ0FBQSxVQUFELENBQVksTUFBWixDQUFoQztNQUNkLE9BQU8sV0FBVyxDQUFDO2FBQ25CO0lBSE07O0lBS1IsaUJBQUMsQ0FBQSxVQUFELEdBQWEsU0FBQyxNQUFEO0FBQ1gsVUFBQTtNQUFBLE9BQUEsR0FBVTtRQUFFLFFBQUE7O0FBQVc7QUFBQTtlQUFBLFVBQUE7Ozt5QkFBQTtBQUFBOztZQUFiOzthQUNWO0lBRlc7Ozs7OztFQUlmLE1BQU0sQ0FBQyxPQUFQLEdBQWlCO0FBYmpCIiwiZmlsZSI6InF1ZXJ5U2VhcmNoUGFyc2VyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiUXVlcnlDb25maWd1cmF0aW9uID0gcmVxdWlyZSAnLi9xdWVyeUNvbmZpZ3VyYXRpb24nXG5zZWFyY2hRdWVyeSA9IHJlcXVpcmUgJ3NlYXJjaC1xdWVyeS1wYXJzZXInXG5cbmNsYXNzIFF1ZXJ5U2VhcmNoUGFyc2VyXG4gIEBwYXJzZTogKHN5bnRheFNlYXJjaCwgY29uZmlnKSAtPlxuICAgIHBhcnNlUmVzdWx0ID0gc2VhcmNoUXVlcnkucGFyc2Ugc3ludGF4U2VhcmNoLCBAX3RvT3B0aW9ucyhjb25maWcpXG4gICAgZGVsZXRlIHBhcnNlUmVzdWx0LnRleHQgIyBub3QgbWF0Y2hlZCB0ZXh0J2RcbiAgICBwYXJzZVJlc3VsdFxuXG4gIEBfdG9PcHRpb25zOiAoY29uZmlnKSAtPlxuICAgIG9wdGlvbnMgPSB7IGtleXdvcmRzOiAoa2V5IGZvciBvd24ga2V5LCB2YWx1ZSBvZiBjb25maWcuc2VhcmNoKSB9XG4gICAgb3B0aW9uc1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5U2VhcmNoUGFyc2VyIl19
