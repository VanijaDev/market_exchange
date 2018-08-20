const MRC_UserEscrow = artifacts.require("MRC_UserEscrow");
const BigNumber = require("bignumber.js");
const Reverter = require("./helpers/reverter");
const Asserts = require("./helpers/asserts");


contract("MRC_UserEscrow", (accounts) => {
  let signatory_0 = accounts[9];
  let signatory_1 = accounts[8];
  let signatory_2 = accounts[7];
  let signatory_fake = accounts[4];
  let user = accounts[6];
  let recipient = accounts[5];

  let escrow;
  let asserts = Asserts(assert);

  before("setup", async () => {
    escrow = await MRC_UserEscrow.deployed();
    await Reverter.snapshot();
  });

  afterEach("revert", async () => {
    await Reverter.revert();
  });

  it("should validate signatories are being set correct", async () => {
    assert.equal(await escrow.signatories.call(0), signatory_0, "wrong signatory_0");
    assert.equal(await escrow.signatories.call(1), signatory_1, "wrong signatory_1");
    assert.equal(await escrow.signatories.call(2), signatory_2, "wrong signatory_2");
  });

  it("should fail because of wrong signator", async () => {
    await asserts.throws(MRC_UserEscrow.new([0, accounts[9], accounts[8]]), "each signatory address should be valid");
  });

  it("should transfer funds only after all signatories would approve", async () => {
    let deposit = web3.toWei(10, "ether");

    //  user sends funds to escrow
    await escrow.sendTransaction({
      from: user,
      value: deposit
    });
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "wrong escrow funds after user transaction");

    //  test signatures
    let recipientBalanceBefore = new BigNumber(await web3.eth.getBalance(recipient));

    //  signatory_0
    await escrow.transferFundsTo(recipient, {
      from: signatory_0
    });
    assert.equal(recipientBalanceBefore.toNumber(), new BigNumber(await web3.eth.getBalance(recipient)).toNumber(), "recipient Balance should not be changed after signatory_0");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "escrow funds should not be moved after signatory_0");

    //  signatory_1
    await escrow.transferFundsTo(recipient, {
      from: signatory_1
    });
    assert.equal(recipientBalanceBefore.toNumber(), new BigNumber(await web3.eth.getBalance(recipient)).toNumber(), "recipient Balance should not be changed after signatory_1");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "escrow funds should not be moved after signatory_1");

    //  signatory_fake
    await asserts.throws(escrow.transferFundsTo(recipient, {
      from: signatory_fake
    }));
    assert.equal(recipientBalanceBefore.toNumber(), new BigNumber(await web3.eth.getBalance(recipient)).toNumber(), "recipient Balance should not be changed after signatory_1");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), deposit, "escrow funds should not be moved after signatory_1");

    //  signatory_2
    await escrow.transferFundsTo(recipient, {
      from: signatory_2
    });
    assert.equal(new BigNumber(await web3.eth.getBalance(recipient).minus(recipientBalanceBefore)).toNumber(), deposit, "recipient Balance should include deposit after signatory_2");
    assert.equal(new BigNumber(await web3.eth.getBalance(escrow.address)).toNumber(), 0, "escrow funds should be moved after signatory_2");
  });

  it("should throw if fake signator", async () => {
    let deposit = web3.toWei(10, "ether");

    //  user sends funds to escrow
    await escrow.sendTransaction({
      from: user,
      value: deposit
    });

    //  signatory_fake
    await asserts.throws(escrow.transferFundsTo(recipient, {
      from: signatory_fake
    }), "should throw if fake signator tries to sign");
  });

  describe("Events", () => {
    it("should emit UserEscrowDeposited when deposited by user", async () => {
      let deposit = web3.toWei(10, "ether");

      let tx = await escrow.sendTransaction({
        from: user,
        value: deposit
      });

      assert.equal(tx.logs.length, 1, "should be single log on user deposit");
      assert.equal(tx.logs[0].event, "UserEscrowDeposited", "wrong event name");
      assert.equal(tx.logs[0].args._user, user, "wrong user address");
      assert.equal(tx.logs[0].args._wei.toNumber(), deposit, "wrong wei amount");

    });

    it("should emit UserEscrowTransferred when funds moved to exchange deposit", async () => {
      let deposit = web3.toWei(10, "ether");

      await escrow.sendTransaction({
        from: user,
        value: deposit
      });

      //  signatory_0
      await escrow.transferFundsTo(recipient, {
        from: signatory_0
      });

      //  signatory_1
      await escrow.transferFundsTo(recipient, {
        from: signatory_1
      });

      //  signatory_2
      let tx_to_exchange = await escrow.transferFundsTo(recipient, {
        from: signatory_2
      });

      assert.equal(tx_to_exchange.logs.length, 1, "should be single log on user deposit");
      assert.equal(tx_to_exchange.logs[0].event, "UserEscrowTransferred", "wrong event name");
      assert.equal(tx_to_exchange.logs[0].args._user, user, "wrong user address");
      assert.equal(tx_to_exchange.logs[0].args._wei.toNumber(), deposit, "wrong wei amount");
      assert.equal(tx_to_exchange.logs[0].args._escrow, recipient, "wrong escrow address");
    });
  });
});