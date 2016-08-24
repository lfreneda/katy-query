(function() {
  var ResultTransformer, _,
    hasProp = {}.hasOwnProperty;

  _ = require('lodash');

  ResultTransformer = (function() {
    function ResultTransformer() {}

    ResultTransformer.toModel = function(recordSetResult) {
      var results;
      results = this.toModels(recordSetResult);
      if (!results) {
        return null;
      }
      return results[0];
    };

    ResultTransformer.toModels = function(recordSetResult) {
      if (_.isArray(recordSetResult)) {
        return this._distinctRootEntity(recordSetResult);
      }
      if (_.isObject(recordSetResult)) {
        return this._distinctRootEntity([recordSetResult]);
      }
      return null;
    };

    ResultTransformer._distinctRootEntity = function(rows) {
      var column, id, index, j, k, key, len, len1, property, result, results, rootEntities, row, value;
      rootEntities = {};
      for (index = j = 0, len = rows.length; j < len; index = ++j) {
        row = rows[index];
        id = row['this.id'];
        rootEntities[id] || (rootEntities[id] = {});
        for (column in row) {
          if (!hasProp.call(row, column)) continue;
          value = row[column];
          _.set(rootEntities[id], this._getPath(column, index), value);
        }
      }
      results = (function() {
        var results1;
        results1 = [];
        for (key in rootEntities) {
          value = rootEntities[key];
          results1.push(value);
        }
        return results1;
      })();
      for (k = 0, len1 = results.length; k < len1; k++) {
        result = results[k];
        for (property in result) {
          if (!hasProp.call(result, property)) continue;
          value = result[property];
          if (_.isArray(value)) {
            result[property] = _.filter(value, function(i) {
              return i;
            });
          }
        }
      }
      return results;
    };

    ResultTransformer._getPath = function(column, index) {
      var path;
      path = column.replace('this.', '');
      if (column.indexOf('[].' !== -1)) {
        path = path.replace('[]', "[" + index + "]");
      }
      return path;
    };

    return ResultTransformer;

  })();

  module.exports = ResultTransformer;

}).call(this);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInJlc3VsdFRyYW5zZm9ybWVyLmNvZmZlZSJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUFBLE1BQUEsb0JBQUE7SUFBQTs7RUFBQSxDQUFBLEdBQUksT0FBQSxDQUFRLFFBQVI7O0VBRUU7OztJQUVKLGlCQUFDLENBQUEsT0FBRCxHQUFVLFNBQUMsZUFBRDtBQUNSLFVBQUE7TUFBQSxPQUFBLEdBQVUsSUFBQyxDQUFBLFFBQUQsQ0FBVSxlQUFWO01BQ1YsSUFBZSxDQUFJLE9BQW5CO0FBQUEsZUFBTyxLQUFQOztBQUNBLGFBQU8sT0FBUSxDQUFBLENBQUE7SUFIUDs7SUFLVixpQkFBQyxDQUFBLFFBQUQsR0FBVyxTQUFDLGVBQUQ7TUFDVCxJQUErQyxDQUFDLENBQUMsT0FBRixDQUFVLGVBQVYsQ0FBL0M7QUFBQSxlQUFPLElBQUMsQ0FBQSxtQkFBRCxDQUFxQixlQUFyQixFQUFQOztNQUNBLElBQW1ELENBQUMsQ0FBQyxRQUFGLENBQVcsZUFBWCxDQUFuRDtBQUFBLGVBQU8sSUFBQyxDQUFBLG1CQUFELENBQXFCLENBQUUsZUFBRixDQUFyQixFQUFQOztBQUNBLGFBQU87SUFIRTs7SUFLWCxpQkFBQyxDQUFBLG1CQUFELEdBQXNCLFNBQUMsSUFBRDtBQUVwQixVQUFBO01BQUEsWUFBQSxHQUFlO0FBRWYsV0FBQSxzREFBQTs7UUFDRSxFQUFBLEdBQUssR0FBSSxDQUFBLFNBQUE7UUFDVCxZQUFhLENBQUEsRUFBQSxNQUFiLFlBQWEsQ0FBQSxFQUFBLElBQVE7QUFDckIsYUFBQSxhQUFBOzs7VUFBQSxDQUFDLENBQUMsR0FBRixDQUFNLFlBQWEsQ0FBQSxFQUFBLENBQW5CLEVBQXdCLElBQUMsQ0FBQSxRQUFELENBQVUsTUFBVixFQUFrQixLQUFsQixDQUF4QixFQUFrRCxLQUFsRDtBQUFBO0FBSEY7TUFLQSxPQUFBOztBQUFXO2FBQUEsbUJBQUE7O3dCQUFBO0FBQUE7OztBQUNYLFdBQUEsMkNBQUE7O0FBQ0UsYUFBQSxrQkFBQTs7O2NBQXFGLENBQUMsQ0FBQyxPQUFGLENBQVUsS0FBVjtZQUFyRixNQUFPLENBQUEsUUFBQSxDQUFQLEdBQW9CLENBQUMsQ0FBQyxNQUFGLENBQVMsS0FBVCxFQUFnQixTQUFDLENBQUQ7cUJBQU87WUFBUCxDQUFoQjs7QUFBcEI7QUFERjthQUVBO0lBWm9COztJQWN0QixpQkFBQyxDQUFBLFFBQUQsR0FBVyxTQUFDLE1BQUQsRUFBUyxLQUFUO0FBQ1QsVUFBQTtNQUFBLElBQUEsR0FBTyxNQUFNLENBQUMsT0FBUCxDQUFlLE9BQWYsRUFBd0IsRUFBeEI7TUFDUCxJQUEwQyxNQUFNLENBQUMsT0FBUCxDQUFlLEtBQUEsS0FBVyxDQUFDLENBQTNCLENBQTFDO1FBQUEsSUFBQSxHQUFPLElBQUksQ0FBQyxPQUFMLENBQWEsSUFBYixFQUFtQixHQUFBLEdBQUksS0FBSixHQUFVLEdBQTdCLEVBQVA7O2FBQ0E7SUFIUzs7Ozs7O0VBS2IsTUFBTSxDQUFDLE9BQVAsR0FBaUI7QUFqQ2pCIiwiZmlsZSI6InJlc3VsdFRyYW5zZm9ybWVyLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiXyA9IHJlcXVpcmUgJ2xvZGFzaCdcblxuY2xhc3MgUmVzdWx0VHJhbnNmb3JtZXJcblxuICBAdG9Nb2RlbDogKHJlY29yZFNldFJlc3VsdCkgLT5cbiAgICByZXN1bHRzID0gQHRvTW9kZWxzIHJlY29yZFNldFJlc3VsdFxuICAgIHJldHVybiBudWxsIGlmIG5vdCByZXN1bHRzXG4gICAgcmV0dXJuIHJlc3VsdHNbMF1cblxuICBAdG9Nb2RlbHM6IChyZWNvcmRTZXRSZXN1bHQpIC0+XG4gICAgcmV0dXJuIEBfZGlzdGluY3RSb290RW50aXR5IHJlY29yZFNldFJlc3VsdCBpZiBfLmlzQXJyYXkgcmVjb3JkU2V0UmVzdWx0XG4gICAgcmV0dXJuIEBfZGlzdGluY3RSb290RW50aXR5IFsgcmVjb3JkU2V0UmVzdWx0IF0gaWYgXy5pc09iamVjdCByZWNvcmRTZXRSZXN1bHRcbiAgICByZXR1cm4gbnVsbFxuXG4gIEBfZGlzdGluY3RSb290RW50aXR5OiAocm93cykgLT5cblxuICAgIHJvb3RFbnRpdGllcyA9IHt9XG5cbiAgICBmb3Igcm93LCBpbmRleCBpbiByb3dzXG4gICAgICBpZCA9IHJvd1sndGhpcy5pZCddXG4gICAgICByb290RW50aXRpZXNbaWRdIG9yPSB7fVxuICAgICAgXy5zZXQgcm9vdEVudGl0aWVzW2lkXSwgQF9nZXRQYXRoKGNvbHVtbiwgaW5kZXgpLCB2YWx1ZSBmb3Igb3duIGNvbHVtbiwgdmFsdWUgb2Ygcm93XG5cbiAgICByZXN1bHRzID0gKHZhbHVlIGZvciBrZXksIHZhbHVlIG9mIHJvb3RFbnRpdGllcylcbiAgICBmb3IgcmVzdWx0IGluIHJlc3VsdHNcbiAgICAgIHJlc3VsdFtwcm9wZXJ0eV0gPSAoXy5maWx0ZXIgdmFsdWUsIChpKSAtPiBpKSBmb3Igb3duIHByb3BlcnR5LCB2YWx1ZSBvZiByZXN1bHQgd2hlbiBfLmlzQXJyYXkgdmFsdWVcbiAgICByZXN1bHRzXG5cbiAgQF9nZXRQYXRoOiAoY29sdW1uLCBpbmRleCkgLT5cbiAgICBwYXRoID0gY29sdW1uLnJlcGxhY2UgJ3RoaXMuJywgJydcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlICdbXScsIFwiWyN7aW5kZXh9XVwiIGlmIGNvbHVtbi5pbmRleE9mICdbXS4nIGlzbnQgLTFcbiAgICBwYXRoXG5cbm1vZHVsZS5leHBvcnRzID0gUmVzdWx0VHJhbnNmb3JtZXIiXX0=
