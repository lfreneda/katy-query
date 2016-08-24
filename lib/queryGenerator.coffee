_ = require 'lodash'
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
    where: [
      { search: 'customer_name', column: 'customers."name"' }
    ]
    select: {
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
  }

  ###

  @toSql: (table, relations = []) ->
    configuration = configurations[table]
    return null if not configuration
    sqlText = "SELECT #{@_toColumnSql(configuration, relations)}
               FROM #{configuration.table}
               #{@_toJoinSql(configuration, relations)}"
    sqlText.trim()

  @toWhere: (conditions) ->
    return { where: 'WHERE 1=1', params: [] } if _.isEmpty conditions

    where = []
    params = []

    for own field, value of conditions
      if _.isArray value
        arrValues = []
        for arrValue in value when arrValue not in ['null', null]
          params.push arrValue
          arrValues.push "$#{params.length}"

        includesNull = 'null' in value or null in value
        if includesNull
          where.push "(#{field} in (#{arrValues.join(', ')}) OR #{field} is null)"
        else
          where.push "#{field} in (#{arrValues.join(', ')})"
      else

        # { 'field'   : 1 } is equal to
        # { 'field>=' : 1 } is greater or equal than
        # { 'field>'  : 1 } is greater than
        # { 'field<=' : 1 } is less or equal than
        # { 'field<'  : 1 } is less than

        if value
          if field.endsWith '>='
            params.push value
            where.push "#{field.replace('>=', '')} >= $#{params.length}"
          else if field.endsWith '>'
            params.push value
            where.push "#{field.replace('>', '')} > $#{params.length}"
          else if field.endsWith '<='
            params.push value
            where.push "#{field.replace('<=', '')} <= $#{params.length}"
          else if field.endsWith '<'
            params.push value
            where.push "#{field.replace('<', '')} < $#{params.length}"
          else
            params.push value
            where.push "#{field} = $#{params.length}"
        else
          where.push "#{field} is null" if value is null

    result =
      where: "WHERE #{where.join ' AND '}"
      params: params
    result

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
