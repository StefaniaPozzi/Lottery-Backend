const { assert, expect } = require("chai")
const { network, getNamedAccounts, deployments } = require("hardhat")
const { devChains, networkConfig } = require("../../helper-hardhat-config")

devChains.includes(network.name)
  ? describe.skip
  : describe("Lottery", () => {
      let lottery, vrfCoordinatorV2, ticketFee, deployer, interval
      const chainId = network.config.chainId

      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        lottery = await ethers.getContract("Lottery", deployer)
        ticketFee = await lottery.getTicketPrice()
      })

      describe("fulfillRandomWords", () => {
        it.only("picks a random winner", async () => {
          const startingTimeStamp = await lottery.getLatestTimestamp()
          const accounts = await ethers.getSigners()

          //setup the listener before everything, in case the bc moves fast
          await new Promise(async (resolve, reject) => {
            console.log("enters the promise")
            lottery.once("EventLottery__WinnerSelectedAndPaid", async () => {
              try {
                const winner = await lottery.getRecentWinner()
                console.log(`Winner picked ${winner}`)
                const state = await lottery.getLotteryState()
                const winnerBalance = await accounts[0].getBalance()
                const endingTimeStamp = await lottery.getLatestTimestamp()
                assert(endingTimeStamp > startingTimeStamp)
                resolve()
              } catch (e) {
                console.log(e)
                reject(e)
              }
            })
            console.log("buys the ticket")
            await lottery.buyTicket({
              value: ticketFee,
            })
            const winnerStartingBalance = await accounts[0].getBalance()
            console.log(`winnerStartingBalance ${winnerStartingBalance}`)
          })
        })
      })
    })
