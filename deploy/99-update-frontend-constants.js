const { ethers } = require("hardhat")
const fs = require("fs")

const CONSTANTS_FILE_ADDRESS =
  "../lotteryfrontend/constants/contractAddress.json"
const CONSTANTS_FILE_ABI = "../lotteryfrontend/constants/contractABI.json"
module.exports = async () => {
  if (process.env.UPDATING_FRONTEND_CONSTANTS) {
    console.log("Updating frontend constants")
    updateContractInfo()
  }
}

async function updateContractInfo() {
  const contract = await ethers.getContract("Lottery")
  const chainId = network.config.chainId.toString()
  const oldAddresses = JSON.parse(
    fs.readFileSync(CONSTANTS_FILE_ADDRESS, "utf8")
  )
  if (chainId in oldAddresses) {
    if (!oldAddresses[chainId].includes(contract.address)) {
      oldAddresses[chainId].push(contract.address)
    }
  } else {
    oldAddresses[chainId] = [contract.address]
  }

  const jsonABI = contract.interface.format(ethers.utils.FormatTypes.json)

  fs.writeFileSync(CONSTANTS_FILE_ADDRESS, JSON.stringify(oldAddresses))
  fs.writeFileSync(CONSTANTS_FILE_ABI, jsonABI)
}

module.exports.tags = ["all", "frontend"]
