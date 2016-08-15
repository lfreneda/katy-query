expect = require('chai').expect
KatyQuery = require './../lib/'
recordSetWithNoJoinResultAsArray = require './queries/recordset-result-no-joins-as-array.json'
recordSetWithNoJoinResultAsObject = require './queries/recordset-result-no-joins-as-object.json'
recordSetWithToOneJoinResultAsArray = require './queries/recordset-result-to-one-inner-join-as-array.json'
recordSetWithToOneJoinResultAsObject = require './queries/recordset-result-to-one-inner-join-as-object.json'
recordSetWithToManyJoinResult = require './queries/recordset-result-to-many-inner-join.json'

describe 'given a record set result in KatyQuery format', ->
  
  describe 'as array with no joins', ->
    it 'should bind as expected', ->
      model = KatyQuery.toObject recordSetWithNoJoinResultAsArray
      expect(model).to.deep.equal {
          id: 1
          name: 'Task name'
      } 

  describe 'as object with no joins', ->
    it 'should bind as expected', ->
      model = KatyQuery.toObject recordSetWithNoJoinResultAsObject
      expect(model).to.deep.equal {
          id: 1
          name: 'Task name'
      } 

  describe 'as array with a `to one` inner join', ->
    it 'should bind as expected', ->
      model = KatyQuery.toObject recordSetWithToOneJoinResultAsArray
      expect(model).to.deep.equal {
          id: 1
          name: 'Task name'
          employee: 
              id: 2
              name: 'Luiz Freneda'
      } 

  describe 'as object with a `to one` inner join', ->
    it 'should bind as expected', ->
      model = KatyQuery.toObject recordSetWithToOneJoinResultAsObject
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
