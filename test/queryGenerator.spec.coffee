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

  beforeEach ->
    QueryGenerator.configure({
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
            { name: 'id', alias: 'this.employee.id' }
            { name: 'name', alias: 'this.employee.name' }
          ]
        }
      }
    })

  describe 'Select sql generation', ->
    describe 'select count', ->
      it.skip 'should [return null or throw err] when configuration for given table was not defined', ->
      describe 'given simple query with no join', ->
      it 'sql should be as expected', ->
        expect(QueryGenerator.toSelectCount('tasks')).to.equal 'SELECT COUNT(distinct tasks."id") FROM tasks'

    describe 'given query with join', ->
      it.skip 'but relations requested was not configured, should be ignored', ->
      it 'sql should be as expected', ->
        expect(QueryGenerator.toSelectCount('tasks', ['employee'])).to.equal '
            SELECT COUNT(distinct tasks."id")
            FROM tasks
            LEFT JOIN employees ON tasks.employee_id = employees.id
        '

    describe 'select columns', ->
      it.skip 'should [return null or throw err] when configuration for given table was not defined', ->
      describe 'given simple query with no join', ->
        it 'sql should be as expected', ->
          expect(QueryGenerator.toSelect('tasks')).to.equal 'SELECT
                id "this.id",
                description "this.description",
                created_at "this.createdAt",
                employee_id "this.employee.id"
            FROM tasks
          '
      describe 'given query with join', ->
        it.skip 'but relations requested was not configured, should be ignored', ->
        it 'sql should be as expected', ->
          expect(QueryGenerator.toSelect('tasks', ['employee'])).to.equal 'SELECT
                  id "this.id",
                  description "this.description",
                  created_at "this.createdAt",
                  employee_id "this.employee.id",
                  employees.id "this.employee.id",
                  employees.name "this.employee.name"
              FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
          '

  describe 'Where sql clause generation', ->
    it.skip 'should [return null or throw err] when configuration for given table was not defined', ->
    it 'when conditions is null, result should be as expected', ->
      expect(QueryGenerator.toWhere(null)).to.deep.equal {
        where: 'WHERE 1=1'
        params: []
      }

    it 'when conditions is empty, result should be as expected', ->
      expect(QueryGenerator.toWhere({})).to.deep.equal {
        where: 'WHERE 1=1'
        params: []
      }

    describe 'basic comparison', ->
      it 'single equal condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: 1
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" = $1'
          params: [ 1 ]
        }

      it 'single equal column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_name: 'Luiz Freneda'
        })).to.deep.equal {
          where: 'WHERE employees."name" = $1'
          params: [
            'Luiz Freneda'
          ]
        }

      it 'single ilike column of an relation condition (when configured), result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_name~~*': 'Luiz Freneda'
        })).to.deep.equal {
          where: 'WHERE employees."name" ~~* $1'
          params: [
            'Luiz Freneda'
          ]
        }

      it 'single is null condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: null
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" is null'
          params: []
        }

      it 'single is null column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_name: null
        })).to.deep.equal {
          where: 'WHERE employees."name" is null'
          params: []
        }

      it 'single greater or equal than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_id>=': 15
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" >= $1'
          params: [ 15 ]
        }

      it 'single greater or equal than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_name>=': 15
        })).to.deep.equal {
          where: 'WHERE employees."name" >= $1'
          params: [ 15 ]
        }

      it 'single greater than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_id>': 15
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" > $1'
          params: [ 15 ]
        }

      it 'single greater than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_name>': 159
        })).to.deep.equal {
          where: 'WHERE employees."name" > $1'
          params: [ 159 ]
        }

      it 'single less than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_id<': 88
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" < $1'
          params: [ 88 ]
        }

      it 'single less than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_name<': 34
        })).to.deep.equal {
          where: 'WHERE employees."name" < $1'
          params: [ 34 ]
        }

      it 'single less or equal than condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_id<=': 5
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" <= $1'
          params: [ 5 ]
        }

      it 'single less than column of an relation condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          'employee_name<=': 36
        })).to.deep.equal {
          where: 'WHERE employees."name" <= $1'
          params: [ 36 ]
        }

      it 'multiples equal conditions, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: 1
          description: 'task description here'
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" = $1 AND tasks."description" = $2'
          params: [ 1, 'task description here' ]
        }

    describe 'array comparison', ->
      it 'single in condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: [1,3,2]
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3)'
          params: [ 1, 3, 2 ]
        }

      it 'single in conditions with null (as string) included, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: [1,3,2,'null']
        })).to.deep.equal {
          where: 'WHERE (tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null)'
          params: [ 1, 3, 2 ]
        }

      it 'single in conditions with null included, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: [1,3,2,null]
        })).to.deep.equal {
          where: 'WHERE (tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null)'
          params: [ 1, 3, 2 ]
        }

      it 'multiples in condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: [1,3,2]
          customer_id: [9,8,7]
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3) AND tasks."customer_id" in ($4, $5, $6)'
          params: [ 1, 3, 2, 9, 8, 7 ]
        }

      it 'multiples in condition with null included, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: [1,3,2, 'null']
          customer_id: [9,8,7]
        })).to.deep.equal {
          where: 'WHERE (tasks."employee_id" in ($1, $2, $3) OR tasks."employee_id" is null) AND tasks."customer_id" in ($4, $5, $6)'
          params: [ 1, 3, 2, 9, 8, 7 ]
        }

      it 'multiples in/equal condition, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
          employee_id: [1,3,2]
          customer_id: 9
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3) AND tasks."customer_id" = $4'
          params: [ 1, 3, 2, 9 ]
        }

    describe 'pattern matching', ->
      it.skip 'tbd', ->
    describe 'regex', ->
      it.skip 'tbd', ->

    describe 'complex conditions', ->
      it 'complex conditions, result should be as expected', ->
        expect(QueryGenerator.toWhere('tasks', {
           employee_id: [1,3,2]
           employee_name: 'Luiz Freneda'
           service_id: null
           customer_id: [15,'null']
          'created_at>': '2015-05-15'
          'updated_at<': '2017-05-15'
        })).to.deep.equal {
          where: 'WHERE tasks."employee_id" in ($1, $2, $3)
                    AND employees."name" = $4
                    AND tasks."service_id" is null
                    AND (tasks."customer_id" in ($5) OR tasks."customer_id" is null)
                    AND tasks."created_at" > $6
                    AND tasks."updated_at" < $7
          '
          params: [ 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15' ]
        }

  describe 'Options sql generation', ->
    describe 'All', ->
      it 'given options, sql result should be as expected', ->
        optionsSql = QueryGenerator.toOptions('tasks', { sort: '-name', offset: 0, limit: 10, })
        expect(optionsSql).to.equal 'ORDER BY tasks."name" DESC OFFSET 0 LIMIT 10'

    describe 'Paging', ->
      it 'when offset is not provided, should be offset 0', ->
        optionsSql = QueryGenerator.toOptions('tasks', { limit: 10, })
        expect(optionsSql).to.equal 'ORDER BY tasks."id" ASC OFFSET 0 LIMIT 10'

      it 'when limit is not provided, should be limit 25', ->
        optionsSql = QueryGenerator.toOptions('tasks', { offset: 5 })
        expect(optionsSql).to.equal 'ORDER BY tasks."id" ASC OFFSET 5 LIMIT 25'

    describe 'Sorting', ->
      it 'when sort is not provided, should be id asc', ->
        optionsSql = QueryGenerator.toOptions('tasks', { offset: 5 })
        expect(optionsSql).to.equal 'ORDER BY tasks."id" ASC OFFSET 5 LIMIT 25'

      it 'when sort is provided, should be name desc', ->
        optionsSql = QueryGenerator.toOptions('tasks', { sort: '-name' })
        expect(optionsSql).to.equal 'ORDER BY tasks."name" DESC OFFSET 0 LIMIT 25'

  describe 'Whole sql generation', ->
    it 'should generate a complete n executable sql text for the given input', ->
      result = QueryGenerator.toSql {
        table: 'tasks'
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
          limit: 28
        }
      }

      expect(result).to.deep.equal {
        sqlCount: '
            SELECT COUNT(distinct tasks."id")
            FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE
                  tasks."employee_id" in ($1, $2, $3)
              AND employees."name" = $4
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($5) OR tasks."customer_id" is null)
              AND tasks."created_at" > $6
              AND tasks."updated_at" < $7
        '
        sqlSelect: '
            SELECT
                id "this.id",
                description "this.description",
                created_at "this.createdAt",
                employee_id "this.employee.id",
                employees.id "this.employee.id",
                employees.name "this.employee.name"
            FROM tasks
              LEFT JOIN employees ON tasks.employee_id = employees.id
            WHERE
                  tasks."employee_id" in ($1, $2, $3)
              AND employees."name" = $4
              AND tasks."service_id" is null
              AND (tasks."customer_id" in ($5) OR tasks."customer_id" is null)
              AND tasks."created_at" > $6
              AND tasks."updated_at" < $7
            ORDER BY tasks."description" DESC OFFSET 15 LIMIT 28
        '
        params: [ 1, 3, 2, 'Luiz Freneda', 15, '2015-05-15', '2017-05-15' ]
      }
