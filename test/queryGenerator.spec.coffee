expect = require('chai').expect
QueryGenerator = require './../lib/queryGenerator'

describe 'Query generator', ->
  describe 'Configuration', ->
    it 'reset configuration should set configurations to null', ->
      QueryGenerator.configure({ foo: 'bar' })
      QueryGenerator.resetConfiguration()
      expect(QueryGenerator.getConfigurations()).to.null

    it 'configure should add given configuration to configurations', ->
      QueryGenerator.resetConfiguration()
      QueryGenerator.configure({
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
      expect(QueryGenerator.getConfigurations()).to.not.null

    it.skip 'adding duplicated configuration, older should be override', -> #should pass
    it.skip 'adding invalid configuration, should throws exception or warning', ->

  describe 'Sql generation', ->
    beforeEach ->
      QueryGenerator.configure({
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

    it.skip 'should [return null or throw err] when configuration for given table was not defined', ->
    describe 'given simple query with no join', ->
      it 'sql should be as expected', ->
        expect(QueryGenerator.toSql('tasks')).to.equal 'SELECT
              id "this.id",
              description "this.description",
              created_at "this.createdAt",
              employee_id "this.employee.id"
          FROM tasks
        '
    describe 'given query with join', ->
      it.skip 'but relations requested was not configured, should be ignored', ->
      it 'sql should be as expected', ->
        expect(QueryGenerator.toSql('tasks', ['employee'])).to.equal 'SELECT
                id "this.id",
                description "this.description",
                created_at "this.createdAt",
                employee_id "this.employee.id",
                employees.id "this.employee.id",
                employees.name "this.employee.name"
            FROM tasks
            LEFT JOIN employees ON tasks.employee_id = employees.id
          '