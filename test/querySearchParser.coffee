expect = require('chai').expect
QuerySearchParser = require './../lib/querySearchParser'

describe 'Query Search Parser', ->

  config = null
  beforeEach ->
    config = {
      table: 'tasks'
      search: {
        employee_name: {
          relation: 'employee'
          column: 'name'
        },
        employee: {
          column: 'employee_id'
        },
        'description~~*': {
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
            { name: 'id', alias: 'this.employee.id' }
            { name: 'name', alias: 'this.employee.name' }
          ]
        }
      }
    }

  describe 'given query syntax', ->

    whereObject = null
    beforeEach ->
      whereObject = QuerySearchParser.parse 'employee:1,2,null description~~*:"*Something here*" service_id:1', config

    it 'not configured search terms should be ignored', ->
      expect(whereObject.service_id).to.be.undefined

    it 'should replace * char to %', ->
      expect(whereObject['description~~*']).to.equal '%Something here%'

    it 'result should be as expected (only configured terms)', ->
      expect(whereObject).to.deep.equal {
        'employee': [ '1', '2', 'null' ]
        'description~~*': '%Something here%'
      }