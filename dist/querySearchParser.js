(function() {
  var QueryConfiguration, QuerySearchParser, searchQuery,
    hasProp = {}.hasOwnProperty;

  QueryConfiguration = require('./queryConfiguration');

  searchQuery = require('search-query-parser');

  QuerySearchParser = (function() {
    function QuerySearchParser() {}

    QuerySearchParser.parse = function(table, syntaxSearch) {
      var parseResult, searchConfig;
      searchConfig = QueryConfiguration.getConfiguration(table);
      parseResult = searchQuery.parse(syntaxSearch, this._toOptions(searchConfig));
      delete parseResult.text;
      return parseResult;
    };

    QuerySearchParser._toOptions = function(searchConfig) {
      var key, options, value;
      options = {
        keywords: (function() {
          var ref, results;
          ref = searchConfig.search;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5U2VhcmNoUGFyc2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsa0RBQUE7SUFBQTs7RUFBQSxrQkFBQSxHQUFxQixPQUFBLENBQVEsc0JBQVI7O0VBQ3JCLFdBQUEsR0FBYyxPQUFBLENBQVEscUJBQVI7O0VBRVI7OztJQUNKLGlCQUFDLENBQUEsS0FBRCxHQUFRLFNBQUMsS0FBRCxFQUFRLFlBQVI7QUFDTixVQUFBO01BQUEsWUFBQSxHQUFlLGtCQUFrQixDQUFDLGdCQUFuQixDQUFvQyxLQUFwQztNQUNmLFdBQUEsR0FBYyxXQUFXLENBQUMsS0FBWixDQUFrQixZQUFsQixFQUFnQyxJQUFDLENBQUEsVUFBRCxDQUFZLFlBQVosQ0FBaEM7TUFDZCxPQUFPLFdBQVcsQ0FBQzthQUNuQjtJQUpNOztJQU1SLGlCQUFDLENBQUEsVUFBRCxHQUFhLFNBQUMsWUFBRDtBQUNYLFVBQUE7TUFBQSxPQUFBLEdBQVU7UUFBRSxRQUFBOztBQUFXO0FBQUE7ZUFBQSxVQUFBOzs7eUJBQUE7QUFBQTs7WUFBYjs7YUFDVjtJQUZXOzs7Ozs7RUFJZixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQWRqQiIsImZpbGUiOiJxdWVyeVNlYXJjaFBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbIlF1ZXJ5Q29uZmlndXJhdGlvbiA9IHJlcXVpcmUgJy4vcXVlcnlDb25maWd1cmF0aW9uJ1xuc2VhcmNoUXVlcnkgPSByZXF1aXJlICdzZWFyY2gtcXVlcnktcGFyc2VyJ1xuXG5jbGFzcyBRdWVyeVNlYXJjaFBhcnNlclxuICBAcGFyc2U6ICh0YWJsZSwgc3ludGF4U2VhcmNoKSAtPlxuICAgIHNlYXJjaENvbmZpZyA9IFF1ZXJ5Q29uZmlndXJhdGlvbi5nZXRDb25maWd1cmF0aW9uIHRhYmxlXG4gICAgcGFyc2VSZXN1bHQgPSBzZWFyY2hRdWVyeS5wYXJzZSBzeW50YXhTZWFyY2gsIEBfdG9PcHRpb25zKHNlYXJjaENvbmZpZylcbiAgICBkZWxldGUgcGFyc2VSZXN1bHQudGV4dCAjIG5vdCBtYXRjaGVkIHRleHQnZFxuICAgIHBhcnNlUmVzdWx0XG5cbiAgQF90b09wdGlvbnM6IChzZWFyY2hDb25maWcpIC0+XG4gICAgb3B0aW9ucyA9IHsga2V5d29yZHM6IChrZXkgZm9yIG93biBrZXksIHZhbHVlIG9mIHNlYXJjaENvbmZpZy5zZWFyY2gpIH1cbiAgICBvcHRpb25zXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlTZWFyY2hQYXJzZXIiXX0=
