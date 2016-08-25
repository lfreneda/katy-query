expect = require('chai').expect
QueryConfiguration = require './../lib/queryConfiguration'

describe 'Configuration', ->
  it 'reset configuration should set configurations to null', ->
    QueryConfiguration.configure({ table: 'tasks' })
    QueryConfiguration.resetConfiguration()
    expect(QueryConfiguration.getConfigurations()).to.null

  it 'configure should add given configuration to configurations', ->
    QueryConfiguration.resetConfiguration()
    QueryConfiguration.configure({
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
    })
    expect(QueryConfiguration.getConfigurations()).to.not.null

  it.skip 'adding duplicated configuration, older should be override', -> #should pass
  it.skip 'adding invalid configuration, should throws exception or warning', ->