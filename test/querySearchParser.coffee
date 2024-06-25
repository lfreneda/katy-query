expect = require('chai').expect
QuerySearchParser = require './../lib/querySearchParser'

describe 'Query Search Parser', ->

  config = null
  invalidConfig = null
  beforeEach ->
    config = {
      table: 'tasks'
      search: {
        employee_name: {
          relation: 'employee'
          column: 'name'
        },
        'employee_name~~*': {
          relation: 'employee'
          column: 'name'
        },
        'employee_name!~~*': {
          relation: 'employee'
          column: 'name'
        },
        'employee_id<>': {
          column: 'employee_id'
        },
        employee: {
          column: 'employee_id'
          pattern: /^\d+$/
        },
        scheduledDate: {
          column: 'date'
          pattern: /^\d{4}-\d{2}-\d{2}$/
        },
        'description~~*': {
        },
        employeeId: {
          column: 'employee_id'
          pattern: /^\d+$/
          orWhere: [
            {
              table: 'tasks_employees'
              column: 'employee_id'
            }
          ]
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
    invalidConfig = {
      table: 'tasks'
      search: {
        employee: {
          column: 'employee_id'
          pattern: /^\d+$/
          orWhere: 'ddasd'
        },
        scheduledDate: {
          column: 'date'
          pattern: /^\d{4}-\d{2}-\d{2}$/
          orWhere: [
            {
              table: 'tasks'
            }
          ]
        },
        scheduledTime: {
          column: 'date'
          orWhere: [
            {
              column: 'tasks'
            }
          ]
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

  describe 'Parse query syntax', ->
    whereObject = null
    beforeEach ->
      whereObject = QuerySearchParser.parse 'employee:1,2,null description~~*:"*Something here*" employee_name~~*:"Luiz*,*Vinícius*,Field,*Control,null" employee_name!~~*:"Katy*,*Query" employee_id<>:"7,8" service_id:1', config

    it 'not configured search terms should be ignored', ->
      expect(whereObject.service_id).to.be.undefined

    it 'should replace * char to %', ->
      expect(whereObject['description~~*']).to.equal '%Something here%'
      expect(whereObject['employee_name~~*']).to.deep.equal [ 'Luiz%', '%Vinícius%', 'Field', '%Control', 'null' ]
      expect(whereObject['employee_name!~~*']).to.deep.equal [ 'Katy%', '%Query' ]

    it 'result should be as expected (only configured terms)', ->
      expect(whereObject).to.deep.equal {
        'employee': [ '1', '2', 'null' ]
        'description~~*': '%Something here%',
        'employee_name~~*': [ 'Luiz%', '%Vinícius%', 'Field', '%Control', 'null' ]
        'employee_name!~~*': [ 'Katy%', '%Query' ],
        'employee_id<>': [ "7", "8" ],
      }

    it 'if "where" value has not been specified the "where" key should be undefined', ->
      whereObject = QuerySearchParser.parse 'employee_id<>: employee_name~~*:""', config
      expect(whereObject).to.deep.equal {}

    it 'if "where" array contains only empty values the "where" key should be undefined', ->
      whereObject = QuerySearchParser.parse 'employee_id<>:,,,,, employee_name~~*:",,,,,"', config
      expect(whereObject).to.deep.equal {}

    it 'if "where" array value contain a value that has not been specified the value should be ignored', ->
      whereObject = QuerySearchParser.parse 'employee_id<>:1,,2,null, employee_name~~*:",Luiz*,*Vinícius*,Field,*Control,,null"', config
      expect(whereObject).to.deep.equal {
        'employee_id<>': [ '1', '2', 'null' ]
        'employee_name~~*': [ 'Luiz%', '%Vinícius%', 'Field', '%Control', 'null' ]
      }

  describe 'Validate object', ->

    it 'given valid object expects to be valid', ->
      validateResult = QuerySearchParser.validate {
        scheduledDate: '1995-05-28'
      }, config
      expect(validateResult.isValid).to.equal true
      expect(validateResult.errors).to.deep.equal []

    it 'given valid object with many properties expects to be valid', ->
      validateResult = QuerySearchParser.validate {
        scheduledDate: '1995-05-28'
        employee: '1253'
      }, config
      expect(validateResult.isValid).to.equal true
      expect(validateResult.errors).to.deep.equal []

    it 'given invalid object expects to be invalid', ->
      validateResult = QuerySearchParser.validate {
        scheduledDate: 'Invalid date'
      }, config
      expect(validateResult.isValid).to.equal false
      expect(validateResult.errors).to.deep.equal [
        {
          message: 'must match /^\\d{4}-\\d{2}-\\d{2}$/'
          property: 'scheduledDate'
        }
      ]

    it 'given invalid object with many properties expects to be invalid', ->
      validateResult = QuerySearchParser.validate {
        scheduledDate: 'Invalid date'
        employee: 'abs'
      }, config
      expect(validateResult.isValid).to.equal false
      expect(validateResult.errors).to.deep.equal [
        {
          message: 'must match /^\\d{4}-\\d{2}-\\d{2}$/'
          property: 'scheduledDate'
        }
        {
          message: 'must match /^\\d+$/'
          property: 'employee'
        }
      ]

    it 'given valid object with invalid propertie expects to be valid ', ->
      validateResult = QuerySearchParser.validate {
        nome: 'Teste Nome'
      }, config
      expect(validateResult.isValid).to.equal true
      expect(validateResult.errors).to.deep.equal []

    it 'given invalid object with no config', ->
      validateResult = QuerySearchParser.validate { scheduledDate: 'Invalid date' }, {}
      expect(validateResult.isValid).to.equal true
      expect(validateResult.errors).to.deep.equal []

    it 'given invalid orWhere configuration should return a erro validation [1]', ->
      validateResult = QuerySearchParser.validate { employee: '1' }, invalidConfig
      expect(validateResult.isValid).to.equal false
      expect(validateResult.errors).to.deep.equal [
        {
          message: 'property orWhere must be an array'
          property: 'employee'
        }
      ]
    it 'given invalid orWhere configuration should return a erro validation [2]', ->
      validateResult = QuerySearchParser.validate { scheduledDate: '1999-01-01' }, invalidConfig
      expect(validateResult.isValid).to.equal false
      expect(validateResult.errors).to.deep.equal [
        {
          message: 'invalid orWhere configuration, must have table and column'
          property: {
            table: 'tasks'
          }
        }
      ]

    it 'given invalid orWhere configuration should return a erro validation [3]', ->
      validateResult = QuerySearchParser.validate { scheduledTime: '1999-01-01' }, invalidConfig
      expect(validateResult.isValid).to.equal false
      expect(validateResult.errors).to.deep.equal [
        {
          message: 'invalid orWhere configuration, must have table and column'
          property: {
            column: 'tasks'
          }
        }
      ]

    it 'given a valid orWhere configuration should return non error validation', ->
      validateResult = QuerySearchParser.validate { employeeId: '1' }, config
      expect(validateResult.isValid).to.equal true
      expect(validateResult.errors).to.deep.equal []
