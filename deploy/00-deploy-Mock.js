const { network } = require("hardhat")
const { devChains } = require("./helper.hardhat.config")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId
  const BASE_FEE = ethers.utils.parseEther("0.25") //
  const GAS_PRICE_LINK = 1e9 // link per gas

  if (devChains.includes(network.name)) {
    log("Deploying mocks")

    await deploy("VRFCoordinatorV2Mock", {
      from: deployer,
      log: true,
      args: [BASE_FEE, GAS_PRICE_LINK],
    })

    log("Mocks deployed")
  }
}

module.exports.tags = ["all", "mocks"]
