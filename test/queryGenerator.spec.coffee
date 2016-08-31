expect = require('chai').expect
QueryGenerator = require './../lib/queryGenerator'
QueryConfiguration = require './../lib/queryConfiguration'

describe 'Query generator', ->
  config = null
  beforeEach ->
    config = {
      table: 'tasks'
      mappers: {
        'fromNameToOrdinalStatusMapper': (statusName) ->
          return 1 if statusName.trim().toLowerCase() == 'scheduled'
          return 2 if statusName.trim().toLowerCase() == 'inprogress'
          return 3 if statusName.trim().toLowerCase() == 'done'
      }
      search: {
        employee_name: {
          relation: 'employee'
          column: 'name'
        }
        status: {
          mapper: 'fromNameToOrdinalStatusMapper'
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

  describe 'Select sql generation', ->
    describe 'select count', ->
      it.skip 'should [return null or throw err] when configuration for given table was not defined', ->
      describe 'given simple query with no join', ->
      it 'sql should be as expected', ->
        expect(QueryGenerator.toSelectCount([], config)).to.equal 'SELECT COUNT(distinct tasks."id") FROM tasks'

    describe 'given query with join', ->
      it.skip 'but relations requested was not configured, should be ignored', ->
      it 'sql should be as expected', ->
        expect(QueryGenerator.toSelectCount(['employee'], config)).to.equal '
            SELECT COUNT(distinct tasks."id")
            FROM tasks
            LEFT JOIN employees ON tasks.employee_id = employees.id
        '

    describe 'select columns', ->
      it.skip 'should [return null or throw err] when configuration for given table was not defined', ->
      describe 'given simple query with no join', ->
        it 'sql should be as expected', ->
          expect(QueryGenerator.toSelect([], config)).to.equal 'SELECT
                tasks."id" "this.id",
                tasks."description" "this.description",
                tasks."created_at" "this.createdAt",
                tasks."employee_id" "this.employee.id"
            FROM tasks
          '
      describe 'given query with join', ->
        it.skip 'but relations requested was not configured, should be ignored', ->
        it 'sql should be as expected', ->
          expect(QueryGenerator.toSelect(['employee'], config)).to.equal 'SELECT
                  tasks."id" "this.id",
                  tasks."description" "this.description",
                  tasks."created_at" "this.createdAt",
                  tasks."employee_id" "this.employee.id",
                  employees."id" "this.employee.id",
                  employees."name" "this.employee.name"
              FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
          '

  describe 'Where sql clause generation', ->
    it.skip 'should [return null or throw err] when configuration for given table was not defined', ->
    it 'when conditions is null, result should be as expected', ->
      expect(QueryGenerator.toWhere(null, config)).to.deep.equal {
        where: 'WHERE 1=1'
        params: []
        relations: []
      }

    it 'when conditions is empty, result should be as expected', ->
      expect(QueryGenerator.toWhere({}, config)).to.deep.equal {
        where: 'WHERE 1=1'
        params: []
        relations: []
      }

    describe 'tenant config', ->
      it 'when empty conditions and options tenant is provided and, should be the first where clause', ->
        expect(QueryGenerator.toWhere({}, config, { tenant: { column: "account_id", value: 1 }})).to.deep.equal {
          where: 'WHERE (tasks."account_id" = $1)'
          params: [1]
          relations: []
        }

      it 'when conditions and options tenant is provided and, should be the first where clause', ->
        expect(QueryGenerator.toWhere({ employee_id: 2 }, config, { tenant: { column: "account_id", value: 1 }})).to.deep.equal {
          where: 'WHERE (tasks."account_id" = $1) AND tasks."employee_id" = $2'
          params: [1,2]
          relations: []
        }

    describe 'basic comparison', ->
      it 'single equal condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: 1
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" = $1'
          params: [ 1 ]
          relations: []
        }

      it 'single equal condition with mapper configured, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          status: 'done'
        }, config)).to.deep.equal {
          where: 'WHERE tasks."status" = $1'
          params: [3]
          relations: []
        }

      it 'single equal column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_name: 'Luiz Freneda'
        }, config)).to.deep.equal {
          where: 'WHERE employees."name" = $1'
          params: [
            'Luiz Freneda'
          ]
          relations: [ 'employee' ]
        }

      it 'single ilike column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_name~~*': 'Luiz Freneda'
        }, config)).to.deep.equal {
          where: 'WHERE employees."name" ~~* $1'
          params: [
            'Luiz Freneda'
          ]
          relations: [ 'employee' ]
        }

      it 'single is null condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: null
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" is null'
          params: []
          relations: []
        }

      it 'single is null column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_name: null
        }, config)).to.deep.equal {
          where: 'WHERE employees."name" is null'
          params: []
          relations: [ 'employee' ]
        }

      it 'single greater or equal than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_id>=': 15
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" >= $1'
          params: [ 15 ]
          relations: []
        }

      it 'single greater or equal than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_name>=': 15
        }, config)).to.deep.equal {
          where: 'WHERE employees."name" >= $1'
          params: [ 15 ]
          relations: [ 'employee' ]
        }

      it 'single greater than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_id>': 16
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" > $1'
          params: [ 16 ]
          relations: []
        }

      it 'single greater than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_name>': 159
        }, config)).to.deep.equal {
          where: 'WHERE employees."name" > $1'
          params: [ 159 ]
          relations: [ 'employee' ]
        }

      it 'single less than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_id<': 88
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" < $1'
          params: [ 88 ]
          relations: []
        }

      it 'single less than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_name<': 34
        }, config)).to.deep.equal {
          where: 'WHERE employees."name" < $1'
          params: [ 34 ]
          relations: [ 'employee' ]
        }

      it 'single less or equal than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_id<=': 5
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" <= $1'
          params: [ 5 ]
          relations: []
        }

      it 'single less than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          'employee_name<=': 36
        }, config)).to.deep.equal {
          where: 'WHERE employees."name" <= $1'
          params: [ 36 ]
          relations: [ 'employee' ]
        }

      it 'multiples equal conditions, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: 1
          description: 'task description here'
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" = $1 AND tasks."description" = $2'
          params: [ 1, 'task description here' ]
          relations: []
        }

    describe 'array comparison', ->
      it 'single in condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: [1,3,2]
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3)'
          params: [ 1, 3, 2 ]
          relations: []
        }

      it 'single in condition with mapper configured, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          status: ['scheduled','inprogress']
        }, config)).to.deep.equal {
          where: 'WHERE tasks."status" in ($1, $2)'
          params: [ 1, 2 ]
          relations: []
        }

      it 'single in conditions with null (as string) included, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: [1,3,2,'null']
        }, config)).to.deep.equal {
          where: 'WHERE (tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null)'
          params: [ 1, 3, 2 ]
          relations: []
        }

      it 'single in conditions with null included, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: [1,3,2,null]
        }, config)).to.deep.equal {
          where: 'WHERE (tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null)'
          params: [ 1, 3, 2 ]
          relations: []
        }

      it 'multiples in condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: [1,3,2]
          customer_id: [9,8,7]
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3) AND tasks."customer_id" in ($4, $5, $6)'
          params: [ 1, 3, 2, 9, 8, 7 ]
          relations: []
        }

      it 'multiples in condition with null included, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: [1,3,2, 'null']
          customer_id: [9,8,7]
        }, config)).to.deep.equal {
          where: 'WHERE (tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null) AND tasks."customer_id" in ($4, $5, $6)'
          params: [ 1, 3, 2, 9, 8, 7 ]
          relations: []
        }

      it 'multiples in/equal condition, result should be as expected', ->
        expect(QueryGenerator.toWhere({
          employee_id: [1,3,2]
          customer_id: 9
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3) AND tasks."customer_id" = $4'
          params: [ 1, 3, 2, 9 ]
          relations: []
        }

    describe 'pattern matching', ->
      it.skip 'tbd', ->
    describe 'regex', ->
      it.skip 'tbd', ->

    describe 'complex conditions', ->
      it 'complex conditions, result should be as expected', ->
        expect(QueryGenerator.toWhere({
           employee_id: [1,3,2]
           employee_name: 'Luiz Freneda'
           service_id: null
           customer_id: [15,'null']
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
        }, config)).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3)
                    AND employees."name" = $4
                    AND tasks."service_id" is null
                    AND (tasks."customer_id" in ($5) OR tasks."customer_id" is null)
                    AND tasks."created_at" > $6
                    AND tasks."updated_at" < $7
          '
          params: [ 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15' ]
          relations: [ 'employee' ]
        }

  describe 'Options sql generation', ->
    describe 'All', ->
      it 'given options, sql result should be as expected', ->
        optionsSql = QueryGenerator.toOptions({ sort: '-name', offset: 0, limit: 10, }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."name" DESC OFFSET 0 LIMIT 10'

    describe 'Paging', ->
      it 'when offset is not provided, should be offset 0', ->
        optionsSql = QueryGenerator.toOptions({ limit: 10, }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."id" ASC OFFSET 0 LIMIT 10'

      it 'when limit is not provided, should be limit 25', ->
        optionsSql = QueryGenerator.toOptions({ offset: 5 }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."id" ASC OFFSET 5 LIMIT 25'

    describe 'Sorting', ->
      it 'when sort is not provided, should be id asc', ->
        optionsSql = QueryGenerator.toOptions({ offset: 5 }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."id" ASC OFFSET 5 LIMIT 25'

      it 'when sort is provided, should be name desc', ->
        optionsSql = QueryGenerator.toOptions({ sort: '-name' }, config)
        expect(optionsSql).to.equal 'ORDER BY tasks."name" DESC OFFSET 0 LIMIT 25'

  describe 'Whole sql generation', ->
    it 'should generate a complete n executable sql text for the given input', ->

      result = QueryGenerator.toSql {
        relations: ['employee']
        where: {
          employee_id: [1,3,2]
          employee_name: 'Luiz Freneda'
          service_id: null
          customer_id: [15,'null']
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
        },
        options:  {
          sort: '-description',
          offset: 15,
          limit: 28,
          tenant: {
            column: 'account_id'
            value: 1505
          }
        }
      }, config

      expect(result).to.deep.equal {
        sqlCount: '
            SELECT COUNT(distinct tasks."id")
            FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
        '
        sqlSelect: '
            SELECT
                tasks."id" "this.id",
                tasks."description" "this.description",
                tasks."created_at" "this.createdAt",
                tasks."employee_id" "this.employee.id",
                employees."id" "this.employee.id",
                employees."name" "this.employee.name"
            FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE (tasks."account_id" = $1)
              AND tasks."employee_id" in ($2, $3, $4)
              AND employees."name" = $5
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($6) OR tasks."customer_id" is null)
              AND tasks."created_at" > $7
              AND tasks."updated_at" < $8
            ORDER BY tasks."description" DESC OFFSET 15 LIMIT 28
        '
        params: [ 1505, 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15' ]
        relations: [ 'employee' ]
      }
