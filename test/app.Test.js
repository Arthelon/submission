var chai = require('chai')
require("dotenv").config()

var assert = chai.assert

describe('app', function() {
    
    it("should load config variables into environment", function() {
        assert.isNotNull(process.env.DATABASE_URL)
        assert.isNotNull(process.env.CLIENT_ID)
    })
})