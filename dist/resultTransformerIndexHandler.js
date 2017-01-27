(function() {
  var ResultTransformerIndexHandler, _;

  _ = require('lodash');

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
    };

  ResultTransformerIndexHandler = (function() {
    var columnsIndexes;

    function ResultTransformerIndexHandler() {}

    columnsIndexes = {};

    ResultTransformerIndexHandler.prototype.splitColumns = function(path) {
      var i, len, part, propertyPath, result, splitResult;
      result = {};
      result.count = (path.match(/\[]/g) || []).length;
      if (result.count > 0) {
        result.items = [];
        splitResult = path.split('[]');
        propertyPath = '';
        for (i = 0, len = splitResult.length; i < len; i++) {
          part = splitResult[i];
          propertyPath += part + "[]";
          result.items.push({
            replacePath: part + "[]",
            idPath: propertyPath + ".id"
          });
        }
        result.items.pop();
      }
      return result;
    };

    ResultTransformerIndexHandler.prototype.keep = function(path, value) {
      if (path.endsWith('id')) {
        if (columnsIndexes[path] !== void 0) {
          if (columnsIndexes[path][value] === void 0) {
            columnsIndexes[path][value] = columnsIndexes[path]['next'];
            columnsIndexes[path]['current'] = columnsIndexes[path]['next'];
            columnsIndexes[path]['lastValue'] = value;
            return columnsIndexes[path]['next'] = columnsIndexes[path]['next'] + 1;
          }
        } else {
          columnsIndexes[path] = {};
          columnsIndexes[path][value] = 0;
          columnsIndexes[path]['lastValue'] = value;
          columnsIndexes[path]['current'] = 0;
          return columnsIndexes[path]['next'] = 1;
        }
      }
    };

    ResultTransformerIndexHandler.prototype.getLastedValue = function(path) {
      if (columnsIndexes[path] !== void 0) {
        if (columnsIndexes[path]['lastValue'] !== void 0) {
          return columnsIndexes[path]['lastValue'];
        } else {
          return null;
        }
      }
    };

    ResultTransformerIndexHandler.prototype.getCurrent = function(path) {
      if (columnsIndexes[path] !== void 0) {
        if (columnsIndexes[path]['current'] !== void 0) {
          return columnsIndexes[path]['current'];
        } else {
          return 0;
        }
      }
    };

    ResultTransformerIndexHandler.prototype.getBy = function(path, value) {
      if (columnsIndexes[path] !== void 0) {
        if (columnsIndexes[path][value] !== void 0) {
          return columnsIndexes[path][value];
        } else {
          columnsIndexes[path][value] = columnsIndexes[path]['next'];
          columnsIndexes[path]['next'] = columnsIndexes[path]['next'] + 1;
          return columnsIndexes[path][value];
        }
      } else {
        columnsIndexes[path] = {};
        columnsIndexes[path][value] = 0;
        columnsIndexes[path]['next'] = 1;
        return columnsIndexes[path][value];
      }
    };

    return ResultTransformerIndexHandler;

  })();

  module.exports = ResultTransformerIndexHandler;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3VsdFRyYW5zZm9ybWVySW5kZXhIYW5kbGVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUE7O0VBQUEsQ0FBQSxHQUFJLE9BQUEsQ0FBUSxRQUFSOztFQUVKOzs7Ozs7Ozs7Ozs7RUFZTTtBQUVKLFFBQUE7Ozs7SUFBQSxjQUFBLEdBQWlCOzs0Q0FFakIsWUFBQSxHQUFjLFNBQUMsSUFBRDtBQUNaLFVBQUE7TUFBQSxNQUFBLEdBQVM7TUFDVCxNQUFNLENBQUMsS0FBUCxHQUFlLENBQUMsSUFBSSxDQUFDLEtBQUwsQ0FBVyxNQUFYLENBQUEsSUFBc0IsRUFBdkIsQ0FBMEIsQ0FBQztNQUMxQyxJQUFHLE1BQU0sQ0FBQyxLQUFQLEdBQWUsQ0FBbEI7UUFDRSxNQUFNLENBQUMsS0FBUCxHQUFlO1FBQ2YsV0FBQSxHQUFjLElBQUksQ0FBQyxLQUFMLENBQVcsSUFBWDtRQUNkLFlBQUEsR0FBZTtBQUNmLGFBQUEsNkNBQUE7O1VBQ0UsWUFBQSxJQUFtQixJQUFELEdBQU07VUFDeEIsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFiLENBQWtCO1lBQ2hCLFdBQUEsRUFBZ0IsSUFBRCxHQUFNLElBREw7WUFFaEIsTUFBQSxFQUFXLFlBQUQsR0FBYyxLQUZSO1dBQWxCO0FBRkY7UUFNQSxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQWIsQ0FBQSxFQVZGOzthQVdBO0lBZFk7OzRDQWdCZCxJQUFBLEdBQU0sU0FBQyxJQUFELEVBQU8sS0FBUDtNQUNKLElBQUcsSUFBSSxDQUFDLFFBQUwsQ0FBYyxJQUFkLENBQUg7UUFDRSxJQUFHLGNBQWUsQ0FBQSxJQUFBLENBQWYsS0FBMEIsTUFBN0I7VUFDRSxJQUFHLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxLQUFBLENBQXJCLEtBQStCLE1BQWxDO1lBQ0UsY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLEtBQUEsQ0FBckIsR0FBOEIsY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLE1BQUE7WUFDbkQsY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLFNBQUEsQ0FBckIsR0FBa0MsY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLE1BQUE7WUFDdkQsY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLFdBQUEsQ0FBckIsR0FBb0M7bUJBQ3BDLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxNQUFBLENBQXJCLEdBQStCLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxNQUFBLENBQXJCLEdBQStCLEVBSmhFO1dBREY7U0FBQSxNQUFBO1VBT0UsY0FBZSxDQUFBLElBQUEsQ0FBZixHQUF1QjtVQUN2QixjQUFlLENBQUEsSUFBQSxDQUFNLENBQUEsS0FBQSxDQUFyQixHQUE4QjtVQUM5QixjQUFlLENBQUEsSUFBQSxDQUFNLENBQUEsV0FBQSxDQUFyQixHQUFvQztVQUNwQyxjQUFlLENBQUEsSUFBQSxDQUFNLENBQUEsU0FBQSxDQUFyQixHQUFrQztpQkFDbEMsY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLE1BQUEsQ0FBckIsR0FBK0IsRUFYakM7U0FERjs7SUFESTs7NENBZU4sY0FBQSxHQUFnQixTQUFDLElBQUQ7TUFDZCxJQUFHLGNBQWUsQ0FBQSxJQUFBLENBQWYsS0FBMEIsTUFBN0I7UUFDRSxJQUFHLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxXQUFBLENBQXJCLEtBQXVDLE1BQTFDO0FBQ0UsaUJBQU8sY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLFdBQUEsRUFEOUI7U0FBQSxNQUFBO0FBR0UsaUJBQU8sS0FIVDtTQURGOztJQURjOzs0Q0FPaEIsVUFBQSxHQUFZLFNBQUMsSUFBRDtNQUNWLElBQUcsY0FBZSxDQUFBLElBQUEsQ0FBZixLQUEwQixNQUE3QjtRQUNFLElBQUcsY0FBZSxDQUFBLElBQUEsQ0FBTSxDQUFBLFNBQUEsQ0FBckIsS0FBcUMsTUFBeEM7QUFDRSxpQkFBTyxjQUFlLENBQUEsSUFBQSxDQUFNLENBQUEsU0FBQSxFQUQ5QjtTQUFBLE1BQUE7QUFHRSxpQkFBTyxFQUhUO1NBREY7O0lBRFU7OzRDQU9aLEtBQUEsR0FBTyxTQUFDLElBQUQsRUFBTyxLQUFQO01BQ0wsSUFBRyxjQUFlLENBQUEsSUFBQSxDQUFmLEtBQTBCLE1BQTdCO1FBQ0UsSUFBRyxjQUFlLENBQUEsSUFBQSxDQUFNLENBQUEsS0FBQSxDQUFyQixLQUFpQyxNQUFwQztBQUNFLGlCQUFPLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxLQUFBLEVBRDlCO1NBQUEsTUFBQTtVQUdFLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxLQUFBLENBQXJCLEdBQThCLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxNQUFBO1VBQ25ELGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxNQUFBLENBQXJCLEdBQStCLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxNQUFBLENBQXJCLEdBQStCO0FBQzlELGlCQUFPLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxLQUFBLEVBTDlCO1NBREY7T0FBQSxNQUFBO1FBUUUsY0FBZSxDQUFBLElBQUEsQ0FBZixHQUF1QjtRQUN2QixjQUFlLENBQUEsSUFBQSxDQUFNLENBQUEsS0FBQSxDQUFyQixHQUE4QjtRQUM5QixjQUFlLENBQUEsSUFBQSxDQUFNLENBQUEsTUFBQSxDQUFyQixHQUErQjtBQUMvQixlQUFPLGNBQWUsQ0FBQSxJQUFBLENBQU0sQ0FBQSxLQUFBLEVBWDlCOztJQURLOzs7Ozs7RUFjVCxNQUFNLENBQUMsT0FBUCxHQUFpQjtBQTdFakIiLCJmaWxlIjoicmVzdWx0VHJhbnNmb3JtZXJJbmRleEhhbmRsZXIuanMiLCJzb3VyY2VSb290IjoiL3NvdXJjZS8iLCJzb3VyY2VzQ29udGVudCI6WyJfID0gcmVxdWlyZSAnbG9kYXNoJ1xuXG5gaWYgKCFTdHJpbmcucHJvdG90eXBlLmVuZHNXaXRoKSB7XG4gICAgICAgIFN0cmluZy5wcm90b3R5cGUuZW5kc1dpdGggPSBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIHBvc2l0aW9uKSB7XG4gICAgICAgICAgICB2YXIgc3ViamVjdFN0cmluZyA9IHRoaXMudG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcG9zaXRpb24gIT09ICdudW1iZXInIHx8ICFpc0Zpbml0ZShwb3NpdGlvbikgfHwgTWF0aC5mbG9vcihwb3NpdGlvbikgIT09IHBvc2l0aW9uIHx8IHBvc2l0aW9uID4gc3ViamVjdFN0cmluZy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBwb3NpdGlvbiA9IHN1YmplY3RTdHJpbmcubGVuZ3RoO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcG9zaXRpb24gLT0gc2VhcmNoU3RyaW5nLmxlbmd0aDtcbiAgICAgICAgICAgIHZhciBsYXN0SW5kZXggPSBzdWJqZWN0U3RyaW5nLmluZGV4T2Yoc2VhcmNoU3RyaW5nLCBwb3NpdGlvbik7XG4gICAgICAgICAgICByZXR1cm4gbGFzdEluZGV4ICE9PSAtMSAmJiBsYXN0SW5kZXggPT09IHBvc2l0aW9uO1xuICAgICAgICB9O1xuICAgIH1gXG5cbmNsYXNzIFJlc3VsdFRyYW5zZm9ybWVySW5kZXhIYW5kbGVyXG5cbiAgY29sdW1uc0luZGV4ZXMgPSB7fVxuXG4gIHNwbGl0Q29sdW1uczogKHBhdGgpIC0+XG4gICAgcmVzdWx0ID0ge31cbiAgICByZXN1bHQuY291bnQgPSAocGF0aC5tYXRjaCgvXFxbXS9nKSB8fCBbXSkubGVuZ3RoXG4gICAgaWYgcmVzdWx0LmNvdW50ID4gMFxuICAgICAgcmVzdWx0Lml0ZW1zID0gW11cbiAgICAgIHNwbGl0UmVzdWx0ID0gcGF0aC5zcGxpdCgnW10nKVxuICAgICAgcHJvcGVydHlQYXRoID0gJydcbiAgICAgIGZvciBwYXJ0IGluIHNwbGl0UmVzdWx0XG4gICAgICAgIHByb3BlcnR5UGF0aCArPSBcIiN7cGFydH1bXVwiXG4gICAgICAgIHJlc3VsdC5pdGVtcy5wdXNoIHtcbiAgICAgICAgICByZXBsYWNlUGF0aDogXCIje3BhcnR9W11cIlxuICAgICAgICAgIGlkUGF0aDogXCIje3Byb3BlcnR5UGF0aH0uaWRcIlxuICAgICAgICB9XG4gICAgICByZXN1bHQuaXRlbXMucG9wKClcbiAgICByZXN1bHRcblxuICBrZWVwOiAocGF0aCwgdmFsdWUpIC0+XG4gICAgaWYgcGF0aC5lbmRzV2l0aCAnaWQnXG4gICAgICBpZiBjb2x1bW5zSW5kZXhlc1twYXRoXSBpc250IHVuZGVmaW5lZFxuICAgICAgICBpZiBjb2x1bW5zSW5kZXhlc1twYXRoXVt2YWx1ZV0gaXMgdW5kZWZpbmVkXG4gICAgICAgICAgY29sdW1uc0luZGV4ZXNbcGF0aF1bdmFsdWVdID0gY29sdW1uc0luZGV4ZXNbcGF0aF1bJ25leHQnXVxuICAgICAgICAgIGNvbHVtbnNJbmRleGVzW3BhdGhdWydjdXJyZW50J10gPSBjb2x1bW5zSW5kZXhlc1twYXRoXVsnbmV4dCddXG4gICAgICAgICAgY29sdW1uc0luZGV4ZXNbcGF0aF1bJ2xhc3RWYWx1ZSddID0gdmFsdWVcbiAgICAgICAgICBjb2x1bW5zSW5kZXhlc1twYXRoXVsnbmV4dCddID0gY29sdW1uc0luZGV4ZXNbcGF0aF1bJ25leHQnXSArIDFcbiAgICAgIGVsc2VcbiAgICAgICAgY29sdW1uc0luZGV4ZXNbcGF0aF0gPSB7fTtcbiAgICAgICAgY29sdW1uc0luZGV4ZXNbcGF0aF1bdmFsdWVdID0gMFxuICAgICAgICBjb2x1bW5zSW5kZXhlc1twYXRoXVsnbGFzdFZhbHVlJ10gPSB2YWx1ZVxuICAgICAgICBjb2x1bW5zSW5kZXhlc1twYXRoXVsnY3VycmVudCddID0gMFxuICAgICAgICBjb2x1bW5zSW5kZXhlc1twYXRoXVsnbmV4dCddID0gMVxuXG4gIGdldExhc3RlZFZhbHVlOiAocGF0aCkgLT5cbiAgICBpZiBjb2x1bW5zSW5kZXhlc1twYXRoXSBpc250IHVuZGVmaW5lZFxuICAgICAgaWYgY29sdW1uc0luZGV4ZXNbcGF0aF1bJ2xhc3RWYWx1ZSddIGlzbnQgdW5kZWZpbmVkXG4gICAgICAgIHJldHVybiBjb2x1bW5zSW5kZXhlc1twYXRoXVsnbGFzdFZhbHVlJ11cbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIG51bGxcblxuICBnZXRDdXJyZW50OiAocGF0aCkgLT5cbiAgICBpZiBjb2x1bW5zSW5kZXhlc1twYXRoXSBpc250IHVuZGVmaW5lZFxuICAgICAgaWYgY29sdW1uc0luZGV4ZXNbcGF0aF1bJ2N1cnJlbnQnXSBpc250IHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gY29sdW1uc0luZGV4ZXNbcGF0aF1bJ2N1cnJlbnQnXVxuICAgICAgZWxzZVxuICAgICAgICByZXR1cm4gMFxuXG4gIGdldEJ5OiAocGF0aCwgdmFsdWUpIC0+XG4gICAgaWYgY29sdW1uc0luZGV4ZXNbcGF0aF0gaXNudCB1bmRlZmluZWRcbiAgICAgIGlmIGNvbHVtbnNJbmRleGVzW3BhdGhdW3ZhbHVlXSBpc250IHVuZGVmaW5lZFxuICAgICAgICByZXR1cm4gY29sdW1uc0luZGV4ZXNbcGF0aF1bdmFsdWVdXG4gICAgICBlbHNlXG4gICAgICAgIGNvbHVtbnNJbmRleGVzW3BhdGhdW3ZhbHVlXSA9IGNvbHVtbnNJbmRleGVzW3BhdGhdWyduZXh0J11cbiAgICAgICAgY29sdW1uc0luZGV4ZXNbcGF0aF1bJ25leHQnXSA9IGNvbHVtbnNJbmRleGVzW3BhdGhdWyduZXh0J10gKyAxXG4gICAgICAgIHJldHVybiBjb2x1bW5zSW5kZXhlc1twYXRoXVt2YWx1ZV1cbiAgICBlbHNlXG4gICAgICBjb2x1bW5zSW5kZXhlc1twYXRoXSA9IHt9O1xuICAgICAgY29sdW1uc0luZGV4ZXNbcGF0aF1bdmFsdWVdID0gMDtcbiAgICAgIGNvbHVtbnNJbmRleGVzW3BhdGhdWyduZXh0J10gPSAxO1xuICAgICAgcmV0dXJuIGNvbHVtbnNJbmRleGVzW3BhdGhdW3ZhbHVlXVxuXG5tb2R1bGUuZXhwb3J0cyA9IFJlc3VsdFRyYW5zZm9ybWVySW5kZXhIYW5kbGVyIl19
