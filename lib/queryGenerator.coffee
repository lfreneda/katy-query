configurations = null

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

  ###

  @toSql: (table, relations = []) ->
    configuration = configurations[table]
    return null if not configuration

    sqlText = "SELECT #{@_toColumnSql(configuration, relations)}
               FROM #{configuration.table}
               #{@_toJoinSql(configuration, relations)}"

    sqlText.trim()

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
