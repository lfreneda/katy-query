_ = require 'lodash'
util = require 'util'
configurations = null

`
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
`

class QueryGenerator

  @resetConfiguration: ->
    configurations = null

  @getConfigurations: ->
    configurations

  @configure: (configuration) ->
    configurations or= {}
    configurations[configuration.table] = configuration

  ###

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

  ###

  @toSelect: (table, relations = []) ->
    configuration = configurations[table]
    return null if not configuration
    sqlText = "SELECT #{@_toColumnSql(configuration, relations)}
               FROM #{configuration.table}
               #{@_toJoinSql(configuration, relations)}"
    sqlText.trim()

  @toWhere: (table, conditions) ->
    return { where: 'WHERE 1=1', params: [] } if _.isEmpty conditions
    configuration = configurations[table]
    return null if not configuration

    result = { where: [], params: [] }

    for own field, value of conditions
      if _.isArray value
        @_whereClauseAsArray field, value, result, configuration
      else if value is null
        @_whereNullClause field, value, result, configuration
      else
        @_whereOperatorClause field, value, result, configuration

    result.where = "WHERE #{result.where.join ' AND '}"
    result

  @_whereOperatorClause: (field, value, result, configuration) ->
    operatorHandler = @_getWhereOperatorHandler field
    result.params.push value
    field = field.replace(operatorHandler.operator, '')
    field = @_getFieldConfigurationOrDefault(configuration, field)
    result.where.push "#{field.table}.\"#{field.column}\" #{operatorHandler.operator} $#{result.params.length}"

  @_getWhereOperatorHandler: (field) ->
    operators = {
      greaterOrEqualThanOperator: { operator: '>=' }
      greaterThanOperator: { operator: '>' }
      lessOrEqualThanOperator: { operator: '<=' }
      lessThanOperator: { operator: '<' }
      iLikeOperator: { operator: '~~*' }
      equalOperator: { operator: '=' }
    }

    operatorHandler = switch
      when field.endsWith '>=' then operators.greaterOrEqualThanOperator
      when field.endsWith '>' then operators.greaterThanOperator
      when field.endsWith '<=' then operators.lessOrEqualThanOperator
      when field.endsWith '<' then operators.lessThanOperator
      when field.endsWith '~~*' then operators.iLikeOperator
      else operators.equalOperator

    operatorHandler

  @_whereClauseAsArray: (field, value, result, configuration) ->
    arrValues = []
    for arrValue in value when arrValue not in ['null', null]
      result.params.push arrValue
      arrValues.push "$#{result.params.length}"
    withNull = 'null' in value or null in value
    if withNull
      result.where.push "(#{configuration.table}.\"#{field}\" in (#{arrValues.join(', ')}) OR #{configuration.table}.\"#{field}\" is null)"
    else
      result.where.push "#{configuration.table}.\"#{field}\" in (#{arrValues.join(', ')})"

  @_whereNullClause: (field, value, result, configuration) ->
    fieldConfig = @_getFieldConfigurationOrDefault(configuration, field)
    result.where.push "#{fieldConfig.table}.\"#{fieldConfig.column}\" is null" if value is null

  @_getFieldConfigurationOrDefault: (configuration, field) ->
    if configuration.search[field]
      relationName = configuration.search[field].relation
      return {
        table: configuration.relations[relationName].table
        column: configuration.search[field].column
      }
    return {
      table: configuration.table
      column: field
    }

  @_toColumnSql: (configuration, relations = []) ->
    columns = configuration.columns.map (column) -> "#{column.name} \"#{column.alias}\""
    for relation in relations
      if configuration.relations[relation]
        relationTable = configuration.relations[relation].table
        relationColumns = configuration.relations[relation].columns
        columns.push "#{relationTable}.#{column.name} \"#{column.alias}\"" for column in relationColumns
    columns.join ', '

  @_toJoinSql:(configuration, relations = []) ->
    joinSqlText = ''
    joinSqlText += configuration.relations[relation].sql for relation in relations if relations
    joinSqlText

module.exports = QueryGenerator
