const { network } = require("hardhat")
const { networkConfig, devChains } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")
const VRF_SUB_AMOUNT = ethers.utils.parseEther("10")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  let vrfCoordinatorV2Address, vrfCoordinatorV2Mock, subId

  if (devChains.includes(network.name)) {
    vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock")
    vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address
    //create subscription
    const txRs = await vrfCoordinatorV2Mock.createSubscription()
    const txReceipt = await txRs.wait(1)
    subId = txReceipt.events[0].args.subId
    //fund the subscription
    await vrfCoordinatorV2Mock.fundSubscription(subId, VRF_SUB_AMOUNT)
  } else {
    vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorAddress"]
    subId = networkConfig[chainId]["subId"]
  }
  const entranceFee = networkConfig[chainId]["entranceFee"]
  const gasLane = networkConfig[chainId]["gasLane"]
  const callbackGasLimit = networkConfig[chainId]["callbackGasLimit"]
  const interval = networkConfig[chainId]["interval"]
  const args = [
    vrfCoordinatorV2Address,
    entranceFee,
    gasLane,
    subId,
    callbackGasLimit,
    interval,
  ]

  const lottery = await deploy("Lottery", {
    from: deployer,
    args: args,
    log: true,
    waitConfirmations: network.config.blockConfirmations || 1,
  })
  if (devChains.includes(network.name)) {
    await vrfCoordinatorV2Mock.addConsumer(subId, lottery.address)
  }
  if (!devChains.includes(network.name) && process.env.VERIFY_ETHSCAN_API) {
    log("Verifying..")
    await verify(lottery.address, args)
  }
}

module.exports.tags = ["all", "lottery"]
