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
      describe("constructor", async () => {
        it("init the lottery", async () => {
          const state = (await lottery.getLotteryState()).toString()
          assert.equal(state, 0)
          assert.equal(interval.toString(), networkConfig[chainId]["interval"])
        })
      })
      describe("buyTicket", async () => {
        it("reverts if you dont pay enough", async () => {
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
          const player = await lottery.getPlayers(0)
          assert.equal(player, deployer)
        })
        it("Emit events", async () => {
          await expect(lottery.buyTicket({ value: ticketFee })).to.emit(
            lottery,
            "EventLottery__TicketBuyed"
          )
        })
      })
      describe("checkUpkep", async () => {
        it()
      })
    })
