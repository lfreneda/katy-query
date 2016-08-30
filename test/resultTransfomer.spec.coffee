expect = require('chai').expect
ResultTransfomer = require './../lib/resultTransformer'

recordSet =
  listResult:
    withNoJoinResult: require './.data/recordset-with-list-result-no-joins.json'
    withToOneJoinResult: require './.data/recordset-with-list-result-to-one-inner-join.json'
    withToManyJoinResult: require './.data/recordset-with-list-result-to-many-inner-join.json'
  singleResult:
    withNoJoinResultAsArray: require './.data/recordset-with-single-result-no-joins-as-array.json'
    withNoJoinResultAsObject: require './.data/recordset-with-single-result-no-joins-as-object.json'
    withToOneJoinResultAsArray: require './.data/recordset-with-single-result-to-one-inner-join-as-array.json'
    withToOneJoinResultAsObject: require './.data/recordset-with-single-result-to-one-inner-join-as-object.json'
    withToManyJoinResult: require './.data/recordset-with-single-result-to-many-inner-join.json'

describe 'Result Transformer', ->

  beforeEach ->
    QueryConfiguration.resetConfiguration()

  describe 'given a record set result in KatyQuery format', ->
    describe 'for single entity result', ->
      describe 'when mapper is configured', ->
        it 'value should be map as configured', ->

          class Task
            constructor: (@id, @name) ->

          config = {
            table: 'tasks'
            mapper: 'task_mapper'
            mappers: {
              'task_mapper': (model) ->
                task = new Task(model.id, model.name)
                task.employee = {
                  id: model.employee.id
                  name: model.employee.name
                }
                task
              'task_name_mapper': (name) ->
                name + ' mapped'
              'employee_name_mapper': (name) ->
                name + ' mapped [2]'
            }
            columns: [
              { name: 'id', alias: 'this.id' }
              { name: 'name', alias: 'this.name', mapper: 'task_name_mapper' }
            ],
            relations: {
              employee: {
                table: 'employees'
                sql: 'LEFT JOIN employees ON tasks.employee_id = employees.id'
                columns: [
                  { name: 'name', alias: 'this.employee.name', mapper: 'employee_name_mapper' }
                ]
              }
            }
          }

          model = ResultTransfomer.toModel recordSet.singleResult.withToOneJoinResultAsObject, config
          expect(model).to.deep.equal {
            id: 1,
            name: 'Task name mapped',
            employee: { id: 2, name: 'Luiz Freneda mapped [2]'}
          }
#          expect(model instanceof Task).to.be.true

      describe 'as array with no joins', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModel recordSet.singleResult.withNoJoinResultAsArray
          expect(model).to.deep.equal {
            id: 1
            name: 'Task name'
          }
  
      describe 'as object with no joins', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModel recordSet.singleResult.withNoJoinResultAsObject
          expect(model).to.deep.equal {
            id: 1
            name: 'Task name'
          }
  
      describe 'as array with a `to one` inner join', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModel recordSet.singleResult.withToOneJoinResultAsArray
          expect(model).to.deep.equal {
            id: 1
            name: 'Task name'
            employee:
              id: 2
              name: 'Luiz Freneda'
          }
  
      describe 'as object with a `to one` inner join', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModel recordSet.singleResult.withToOneJoinResultAsObject
          expect(model).to.deep.equal {
            id: 1
            name: 'Task name'
            employee:
              id: 2
              name: 'Luiz Freneda'
          }
  
      describe 'with a `to many` inner join', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModel recordSet.singleResult.withToManyJoinResult
          expect(model).to.deep.equal {
            id: 1
            name: 'Task name'
            employee:
              id: 2
              name: 'Luiz Freneda'
            tags: [
              { id: 3, name: 'katy' }
              { id: 4, name: 'query' }
            ]
          }
  
    describe 'for list entity result', ->
      describe 'with no joins', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModels recordSet.listResult.withNoJoinResult
          expect(model).to.deep.equal [
            { id: 1, name: 'Task name 1' }
            { id: 2, name: 'Task name 2' }
            { id: 3, name: 'Task name 3' }
          ]
  
      describe 'with a `to one` inner join', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModels recordSet.listResult.withToOneJoinResult
          expect(model).to.deep.equal [
            {
              id: 1
              name: 'Task name 1'
              employee:
                id: 3
                name: 'Luiz Freneda'
            }
            {
              id: 2
              name: 'Task name 2'
              employee:
                id: 4
                name: 'Nicola Zagari'
            }
          ]
  
  
      describe 'with a `to many` inner join', ->
        it 'should bind as expected', ->
          model = ResultTransfomer.toModels recordSet.listResult.withToManyJoinResult
          expect(model).to.deep.equal [
            {
              id: 1
              name: 'Task name 1'
              employee:
                id: 3
                name: 'Luiz Freneda'
              tags: [
                { id: 10, name: 'katy' }
                { id: 11, name: 'query' }
              ]
            }
            {
              id: 2
              name: 'Task name 2'
              employee:
                id: 4
                name: 'Nicola Zagari'
              tags: [
                { id: 11, name: 'query' }
                { id: 12, name: 'cto' }
              ]
            }
          ]
