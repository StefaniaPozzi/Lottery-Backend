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

          const accounts = await lottery.getSigners()
          //setup the listener before everything, in case the bc moves fast
          await new Promise(async (resolve, reject) => {
            lottery.once("EventLottery__WinnerSelectedAndPaid", async () => {
              console.log("Winner picked")
              try {
                const winner = await lottery.getRecentWinner()
                const state = await lottery.getLotteryState()
                const winnerBalance = await accounts[0].getBalance()
                const endingTimeStamp = await lottery.getLatestTimestamp()
                assert
                resolve()
              } catch (e) {
                reject(e)
              }
            })
          })

          await lottery.buyTicket({
            value: ticketFee,
          })
          const winnerStartingBalance = await accounts[0].getBalance()

          //the following part will be execute after the promise has been resolved
        })
      })
    })
