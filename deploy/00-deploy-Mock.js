const { network } = require( "hardhat" )
const { devChains } = require("./helper.hardhat.config")

module.exports = async ({ getNamedAccounts, deployments }) => {
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  if (devChains.includes(network.name)){
    log("Deploying mocks")

  const mock = await deploy("mock", {})
  }
}
