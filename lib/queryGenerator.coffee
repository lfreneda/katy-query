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
    sqlText = "SELECT #{@_toColumnSql(configuration, relations)} FROM #{configuration.table} "
    sqlText += configuration.relations[relation].sql for relation in relations if relations
    sqlText.trim()

  @_toColumnSql: (configuration, relations = []) ->
    columns = configuration.columns.map (column) -> "#{column.name} \"#{column.alias}\""
    for table in relations
      relationConfiguration = configuration.relations[table]
      for column in relationConfiguration.columns
        columns.push "#{relationConfiguration.table}.#{column.name} \"#{column.alias}\""
    columns.join ', '

module.exports = QueryGenerator