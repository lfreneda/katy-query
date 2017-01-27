expect = require('chai').expect
ResultTransfomerIndexHandler = require './../lib/resultTransformerIndexHandler'

describe 'ResultTransfomerIndexHandler', ->
  resultTransfomerIndexHandler = null
  beforeEach ->
    resultTransfomerIndexHandler = new ResultTransfomerIndexHandler()
    
  it 'given column name and id first time, should returns 0', ->
    index = resultTransfomerIndexHandler.getBy 'questions[].id', 'a'
    expect(index).to.equal 0

  it 'given column name and id already added, should returns previous index (0) as expected', ->
    index = resultTransfomerIndexHandler.getBy 'questions[].id', 'a'
    index = resultTransfomerIndexHandler.getBy 'questions[].id', 'a'
    expect(index).to.equal 0

   it 'given column name already added but differs on value, should increase lasted id as expected', ->
    resultTransfomerIndexHandler.getBy 'questions[].id', 'a'
    resultTransfomerIndexHandler.getBy 'questions[].id', 'a'
    index = resultTransfomerIndexHandler.getBy 'questions[].id', 'b'
    expect(index).to.equal 1

   it 'given column path should be able to split collections', ->
     result = resultTransfomerIndexHandler.splitColumns 'questions[].options[].name'
     expect(result.count).to.equal 2
     expect(result.items[0].replacePath).to.equal 'questions[]'
     expect(result.items[0].idPath).to.equal 'questions[].id'
     expect(result.items[1].replacePath).to.equal '.options[]'
     expect(result.items[1].idPath).to.equal 'questions[].options[].id'
     

