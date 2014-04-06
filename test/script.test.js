var Script = require('../')
var binConv = require('binstring')
var _ = require('underscore')

require('terst')

describe('Script', function() {
  describe(' - fromChunks()', function() {
    it(' > generates a Script object from chunks', function() {
      var script = new Script('76a914652c453e3f8768d6d6e1f2985cb8939db91a4e0588ac')
      var tmp = script.clone()
      var scriptFromChunks = Script.fromChunks(tmp.chunks)

      // check buffers are the same
      T(script.buffer.length === scriptFromChunks.buffer.length)
      for (var i in scriptFromChunks.buffer) {
        T(script.buffer[i] === scriptFromChunks.buffer[i])
      }

      // check chunks are the same
      T(script.chunks.length === scriptFromChunks.chunks.length)
      for (var i in scriptFromChunks.chunks) {
        // chunks contain nested arrays
        if (!Array.isArray(scriptFromChunks.chunks[i])) {
          T(script.chunks[i] === scriptFromChunks.chunks[i])
        } else {
          T(script.chunks[i].length === scriptFromChunks.chunks[i].length)
          var scriptFromChunkArray = scriptFromChunks.chunks[i]
          var scriptArray = script.chunks[i]
          for (var y in scriptFromChunkArray[y]) {
            T(scriptArray[i] === scriptFromChunkArray[i])
          }
        }
      }
    })
  })

  describe(' - Script.createOutputScript()', function() {
    it(' > Supports pubkeyhash addresses', function() {
      // hash160 : 0000000000000000000000000000000000000000
      var pubkeyScript = Script.createOutputScript('1111111111111111111114oLvT2')
      EQ(pubkeyScript.chunks[2].length, 20)
      for (var i in pubkeyScript.chunks[2]) {
        EQ(pubkeyScript.chunks[2][i], 0)
      }
      EQ(pubkeyScript.getOutType(), 'pubkeyhash')
    })

    it(' > Supports scripthash addresses', function() {
      // hash160 : 0000000000000000000000000000000000000000
      var scripthashScript = Script.createOutputScript('31h1vYVSYuKP6AhS86fbRdMw9XHieotbST')
      EQ(scripthashScript.chunks[1].length, 20)
      for (var i in scripthashScript.chunks[1]) {
        EQ(scripthashScript.chunks[1][i], 0)
      }
      EQ(scripthashScript.getOutType(), 'scripthash')
    })
  })

  describe('- Script.getOutType()', function() {
    it(' > Supports Pubkeyhash', function() {
      // https://helloblock.io/transactions/dc55d9c6ec03ceccf0db43d29e7d626a8b107f41066e3917f30398bb01dda2b5
      var outHex = '76a9140c79f15f08b0f94a2cba8de036272dee3ecb096188ac'
      var pubkeyhashScript = new Script(outHex)
      EQ(pubkeyhashScript.getOutType(), 'pubkeyhash')
    })

    it(' > Supports Pubkey', function() {
      // https://helloblock.io/transactions/0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098
      var outHex = '410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac'
      var pubkeyScript = new Script(outHex)
      EQ(pubkeyScript.getOutType(), 'pubkey')
    })

    it(' > Supports Scripthash', function() {
      // https://helloblock.io/transactions/64ebe48e0c9fb8da32160809848a464d303b1e24026d2359597889c3f46f2e21
      var outHex = 'a914f9659d50ec62945a9c8a6c07f117ef63a4f2fcc487'
      var scripthashScript = new Script(outHex)
      EQ(scripthashScript.getOutType(), 'scripthash')
    })

    it(' > Supports Multisig', function() {
      // https://helloblock.io/transactions/09dd94f2c85262173da87a745a459007bb1eed6eeb6bfa238a0cd91a16cf7790
      var outHex = '5121032487c2a32f7c8d57d2a93906a6457afd00697925b0e6e145d89af6d3bca330162102308673d16987eaa010e540901cc6fe3695e758c19f46ce604e174dac315e685a52ae'
      var multisigScript = new Script(outHex)
      EQ(multisigScript.getOutType(), 'multisig')
    })

    it(' > Supports null_data (OP_RETURN)', function() {
      var outHex = '6a4c105768792068656c6c6f2074686572652e'
      var nulldataScript = new Script(outHex)
      EQ(nulldataScript.getOutType(), 'nulldata')
    })

    it(' > Supports null_data (OP_RETURN)', function() {
      // https://helloblock.io/transactions/5e9be7fb36ee49ce84bee4c8ef38ad0efc0608b78dae1c2c99075297ef527890
      // op_return
      var outHex = '6a2606deadbeef03f895a2ad89fb6d696497af486cb7c644a27aa568c7a18dd06113401115185474'
      var opreturnScript = new Script(outHex)
      EQ(opreturnScript.getOutType(), 'nulldata')
    })

    it(' > nonstandard (zero byte as hash160 in pubkeyhash)', function() {
      // http://testnet.helloblock.io/transactions/a347b4ef02173b74deb096921d8306ff7c379c254e9febaa040024b220a348ed
      var nonstandardpubkeyhash = new Script('76a90088ac')
      EQ(nonstandardpubkeyhash.getOutType(), 'nonstandard')
    })

    it(' > nonstandard (zero byte as hash160 in scripthash)', function() {
      var nonstandardpubkeyhash = new Script('a90087')
      EQ(nonstandardpubkeyhash.getOutType(), 'nonstandard')
    })
  })

  describe('- Script.toAddress()', function() {
    it(' > returns address for pubkeyScript', function() {
      // https://helloblock.io/transactions/0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098
      var outHex = '410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac'
      var pubkeyScript = new Script(outHex)
      EQ(pubkeyScript.getOutType(), 'pubkey')

      var addr = pubkeyScript.toAddress()
      EQ(binConv(addr.hash, { in : 'bytes',
        out: 'hex'
      }), '119b098e2e980a229e139a9ed01a469e518e6f26')
    })
  })

  describe(' - Setting defaultNetwork', function() {
    it(' > defaults to mainnet and supports testnet', function() {
      // hash160: 0000000000000000000000000000000000000000
      Script.defaultNetwork = 'testnet'
      var pubkeyhashScript = Script.createOutputScript('mfWxJ45yp2SFn7UciZyNpvDKrzbhyfKrY8')
      EQ(pubkeyhashScript.chunks[2].length, 20)
      for (var i in pubkeyhashScript.chunks[2]) {
        EQ(pubkeyhashScript.chunks[2][i], 0)
      }
      EQ(pubkeyhashScript.getOutType(), 'pubkeyhash')
    })
  })

  describe(' - Script(hex, isCoinbase)', function() {
    it(' > optional second field to indicate coinbase and does not interpret coinbase script', function() {
      // reference:
      // https://github.com/cryptocoinjs/btc-script/issues/8
      // BIP34: https: //github.com/bitcoin/bips/blob/master/bip-0034.mediawiki
      // Stackoverflow: http: //bitcoin.stackexchange.com/questions/20721/what-is-the-format-of-coinbase-transaction

      // optional second field
      var coinbaseScript = new Script('03d891000450a8eb0b4ed20100', true)
      T(_.isEqual(coinbaseScript.buffer, coinbaseScript.buffer))
    })

    it(' > getBlockHeight() is able to parse blockheight', function() {
      // http://blockexplorer.com/testnet/tx/eaff2bbc220caa80f1ee52b2ed3fb586b26e253d2dee039fd6c54ec8493aa1d8
      var coinbaseScript = new Script('03d891000450a8eb0b4ed20100', true)
      EQ(coinbaseScript.getBlockHeight(), 37336)
    })
  })
})