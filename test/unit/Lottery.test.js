const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments } = require("hardhat")
const { devChains, networkConfig } = require("../../helper-hardhat-config")

!devChains.includes(network.name)
  ? describe.skip
  : describe("Lottery", () => {
      let lottery, vrfCoordinatorV2, ticketFee, deployer, interval
      const chainId = network.config.chainId

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        lottery = await ethers.getContract("Lottery", deployer)
        vrfCoordinatorV2 = await ethers.getContract(
          "VRFCoordinatorV2Mock",
          deployer
        )
        ticketFee = await lottery.getTicketPrice()
        interval = await lottery.getInterval()
      })
      describe("constructor", () => {
        it("init the lottery", async () => {
          const state = (await lottery.getLotteryState()).toString()
          assert.equal(state, 0)
          assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
      })
      describe("buyTicket", () => {
        it("reverts if user does not pay enough", async () => {
          await expect(lottery.buyTicket()).to.be.revertedWith(
            "ErrorLottery__InsufficientTicketAmount"
          )
        })
        it("deny buying ticket when state is calculating", async () => {
          await lottery.buyTicket({ value: ticketFee })
          await lottery.setState(1)
          await expect(
            lottery.buyTicket({ value: ticketFee })
          ).to.be.revertedWith("ErrorLottery__Busy")
        })
        it("Records players when they enter", async () => {
          await lottery.buyTicket({ value: ticketFee })
          const player = await lottery.getPlayer(0)
          assert.equal(player, deployer)
        })
        it("Emit events", async () => {
          await expect(lottery.buyTicket({ value: ticketFee })).to.emit(
            lottery,
            "EventLottery__TicketBuyed"
          )
        })
      })
      describe("checkUpkep", () => {
        it("upkeepNeeded is false if no participants are present", async () => {
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.send("evm_mine", [])
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
          assert(!upkeepNeeded)
        })
        it("method is fired", async () => {
          await lottery.buyTicket({ value: ticketFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.send("evm_mine", [])
          const { upkeepNeeded } = await lottery.callStatic.checkUpkeep([])
          assert(upkeepNeeded)
        })
      })
      describe("performupkeep", () => {
        it("fires if upkeepNeeded is true ", async () => {
          await lottery.buyTicket({ value: ticketFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.send("evm_mine", [])
          const tx = await lottery.performUpkeep([])
          assert(tx)
        })
        it("request random words gives the requestId", async () => {
          await lottery.buyTicket({ value: ticketFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.send("evm_mine", [])
          const txResponse = await lottery.performUpkeep([])
          const txReceipt = await txResponse.wait(1)
          const requestId = txReceipt.events[0].topics[1]
          assert(requestId > 0)
        })
      })
      describe("fulfillRandomWords", () => {
        beforeEach(async () => {
          await lottery.buyTicket({ value: ticketFee })
          await network.provider.send("evm_increaseTime", [
            interval.toNumber() + 1,
          ])
          await network.provider.send("evm_mine", [])
        })
        it("revert if requestId does not exists", async () => {
          // the args look different for coordinator mock and chainlink testnet coordinator contract
          // check VRFCoordinatorV2Mock.fulfillRandomWords params
          await expect(
            vrfCoordinatorV2.fulfillRandomWords(0, lottery.address)
          ).to.be.revertedWith("nonexistent request")
          await expect(
            vrfCoordinatorV2.fulfillRandomWords(1, lottery.address)
          ).to.be.revertedWith("nonexistent request")
        })
        it("Picks the winner ", async () => {
          const requestId = await lottery.callStatic.performUpkeep("0x")
          const startTimeStamp = await lottery.getLatestTimestamp()
          // waits for the event to be fired:
          // on testnet we never know when the tx will finish
          await new Promise(async (resolve, reject) => {
            //listener
            lottery.once("EventLottery__WinnerSelectedAndPaid", async () => {
              console.log("Event found!")
              try {
                const winner = await lottery.getRecentWinner()
                console.log(winner)
                const state = await lottery.getLotteryState()
                const endingTimeStamp = await lottery.getLatestTimestamp()
                const numPlayers = await lottery.getNumPlayers()
                assert.equal(numPlayers.toString(), "0")
                assert.equal(state.toString(), "0")
                assert(endingTimeStamp > startTimeStamp)
                resolve()
              } catch (e) {
                //if it takes too long (mocha hardhat.config)
                reject(e)
              }
            })
            //mock KEEPERS
            const tx = await lottery.performUpkeep([])
            const txReceipt = await tx.wait(1)
            //mock VRF
            await vrfCoordinatorV2.fulfillRandomWords(
              txReceipt.events[0].topics[1],
              lottery.address
            )
          })
        })
      })
    })
