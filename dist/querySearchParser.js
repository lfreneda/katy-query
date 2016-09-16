(function() {
  var QuerySearchParser, _, searchQuery,
    hasProp = {}.hasOwnProperty;

  searchQuery = require('search-query-parser');

  _ = require('lodash');

  QuerySearchParser = (function() {
    function QuerySearchParser() {}

    QuerySearchParser.parse = function(syntaxSearch, config) {
      var key, parseResult, value;
      parseResult = searchQuery.parse(syntaxSearch, this._toOptions(config));
      delete parseResult.text;
      for (key in parseResult) {
        if (!hasProp.call(parseResult, key)) continue;
        value = parseResult[key];
        if (_.isString(value)) {
          parseResult[key] = value.replace('*', '%');
        }
      }
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInF1ZXJ5U2VhcmNoUGFyc2VyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsaUNBQUE7SUFBQTs7RUFBQSxXQUFBLEdBQWMsT0FBQSxDQUFRLHFCQUFSOztFQUNkLENBQUEsR0FBTyxPQUFBLENBQVEsUUFBUjs7RUFFRDs7O0lBQ0osaUJBQUMsQ0FBQSxLQUFELEdBQVEsU0FBQyxZQUFELEVBQWUsTUFBZjtBQUNOLFVBQUE7TUFBQSxXQUFBLEdBQWMsV0FBVyxDQUFDLEtBQVosQ0FBa0IsWUFBbEIsRUFBZ0MsSUFBQyxDQUFBLFVBQUQsQ0FBWSxNQUFaLENBQWhDO01BQ2QsT0FBTyxXQUFXLENBQUM7QUFDbkIsV0FBQSxrQkFBQTs7O1FBQ0UsSUFBNEMsQ0FBQyxDQUFDLFFBQUYsQ0FBVyxLQUFYLENBQTVDO1VBQUEsV0FBWSxDQUFBLEdBQUEsQ0FBWixHQUFtQixLQUFLLENBQUMsT0FBTixDQUFjLEdBQWQsRUFBa0IsR0FBbEIsRUFBbkI7O0FBREY7YUFFQTtJQUxNOztJQU9SLGlCQUFDLENBQUEsVUFBRCxHQUFhLFNBQUMsTUFBRDtBQUNYLFVBQUE7TUFBQSxPQUFBLEdBQVU7UUFBRSxRQUFBOztBQUFXO0FBQUE7ZUFBQSxVQUFBOzs7eUJBQUE7QUFBQTs7WUFBYjs7YUFDVjtJQUZXOzs7Ozs7RUFJZixNQUFNLENBQUMsT0FBUCxHQUFpQjtBQWZqQiIsImZpbGUiOiJxdWVyeVNlYXJjaFBhcnNlci5qcyIsInNvdXJjZVJvb3QiOiIvc291cmNlLyIsInNvdXJjZXNDb250ZW50IjpbInNlYXJjaFF1ZXJ5ID0gcmVxdWlyZSAnc2VhcmNoLXF1ZXJ5LXBhcnNlcidcbl8gICAgPSByZXF1aXJlICdsb2Rhc2gnXG5cbmNsYXNzIFF1ZXJ5U2VhcmNoUGFyc2VyXG4gIEBwYXJzZTogKHN5bnRheFNlYXJjaCwgY29uZmlnKSAtPlxuICAgIHBhcnNlUmVzdWx0ID0gc2VhcmNoUXVlcnkucGFyc2Ugc3ludGF4U2VhcmNoLCBAX3RvT3B0aW9ucyhjb25maWcpXG4gICAgZGVsZXRlIHBhcnNlUmVzdWx0LnRleHQgXG4gICAgZm9yIG93biBrZXksIHZhbHVlIG9mIHBhcnNlUmVzdWx0XG4gICAgICBwYXJzZVJlc3VsdFtrZXldID0gdmFsdWUucmVwbGFjZSAnKicsJyUnIGlmIF8uaXNTdHJpbmcgdmFsdWVcbiAgICBwYXJzZVJlc3VsdFxuXG4gIEBfdG9PcHRpb25zOiAoY29uZmlnKSAtPlxuICAgIG9wdGlvbnMgPSB7IGtleXdvcmRzOiAoa2V5IGZvciBvd24ga2V5LCB2YWx1ZSBvZiBjb25maWcuc2VhcmNoKSB9XG4gICAgb3B0aW9uc1xuXG5tb2R1bGUuZXhwb3J0cyA9IFF1ZXJ5U2VhcmNoUGFyc2VyIl19
