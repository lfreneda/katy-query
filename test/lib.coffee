expect = require('chai').expect
KatyQuery = require './../lib/'
recordSetWithNoJoinResult = require './queries/recordset-result-no-joins.json'
recordSetWithToOneJoinResult = require './queries/recordset-result-to-one-inner-join.json'
recordSetWithToManyJoinResult = require './queries/recordset-result-to-many-inner-join.json'

describe 'given a record set result in KatyQuery format', ->
  
  describe 'with no joins', ->
    it 'should bind as expected', ->
      model = KatyQuery.toObject recordSetWithNoJoinResult
      expect(model).to.deep.equal {
          id: 1
          name: 'Task name'
      } 

  describe 'with a `to one` inner join', ->
    it 'should bind as expected', ->
      model = KatyQuery.toObject recordSetWithToOneJoinResult
      expect(model).to.deep.equal {
          id: 1
          name: 'Task name'
          employee: 
              id: 2
              name: 'Luiz Freneda'
      } 

  describe 'with a `to many` inner join', ->
    it 'should bind as expected', ->
      model = KatyQuery.toObject recordSetWithToManyJoinResult
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
