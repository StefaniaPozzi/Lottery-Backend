const { network } = require("hardhat")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const BASE_FEE = ethers.utils.parseEther("0.25") //
  const GAS_PRICE_LINK = 1e9 // link per gas

  if (network.config.chainId == 31337) {
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
