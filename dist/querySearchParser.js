(function() {
  var QuerySearchParser, searchQuery,
    hasProp = {}.hasOwnProperty;

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5U2VhcmNoUGFyc2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsOEJBQUE7SUFBQTs7RUFBQSxXQUFBLEdBQWMsT0FBQSxDQUFRLHFCQUFSOztFQUVSOzs7SUFDSixpQkFBQyxDQUFBLEtBQUQsR0FBUSxTQUFDLFlBQUQsRUFBZSxNQUFmO0FBQ04sVUFBQTtNQUFBLFdBQUEsR0FBYyxXQUFXLENBQUMsS0FBWixDQUFrQixZQUFsQixFQUFnQyxJQUFDLENBQUEsVUFBRCxDQUFZLE1BQVosQ0FBaEM7TUFDZCxPQUFPLFdBQVcsQ0FBQzthQUNuQjtJQUhNOztJQUtSLGlCQUFDLENBQUEsVUFBRCxHQUFhLFNBQUMsTUFBRDtBQUNYLFVBQUE7TUFBQSxPQUFBLEdBQVU7UUFBRSxRQUFBOztBQUFXO0FBQUE7ZUFBQSxVQUFBOzs7eUJBQUE7QUFBQTs7WUFBYjs7YUFDVjtJQUZXOzs7Ozs7RUFJZixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQVpqQiIsImZpbGUiOiJxdWVyeVNlYXJjaFBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbInNlYXJjaFF1ZXJ5ID0gcmVxdWlyZSAnc2VhcmNoLXF1ZXJ5LXBhcnNlcidcblxuY2xhc3MgUXVlcnlTZWFyY2hQYXJzZXJcbiAgQHBhcnNlOiAoc3ludGF4U2VhcmNoLCBjb25maWcpIC0+XG4gICAgcGFyc2VSZXN1bHQgPSBzZWFyY2hRdWVyeS5wYXJzZSBzeW50YXhTZWFyY2gsIEBfdG9PcHRpb25zKGNvbmZpZylcbiAgICBkZWxldGUgcGFyc2VSZXN1bHQudGV4dCAjIG5vdCBtYXRjaGVkIHRleHQnZFxuICAgIHBhcnNlUmVzdWx0XG5cbiAgQF90b09wdGlvbnM6IChjb25maWcpIC0+XG4gICAgb3B0aW9ucyA9IHsga2V5d29yZHM6IChrZXkgZm9yIG93biBrZXksIHZhbHVlIG9mIGNvbmZpZy5zZWFyY2gpIH1cbiAgICBvcHRpb25zXG5cbm1vZHVsZS5leHBvcnRzID0gUXVlcnlTZWFyY2hQYXJzZXIiXX0=
