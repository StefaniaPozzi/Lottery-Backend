const { run } = require("hardhat")
const verify = async (paramAddress, paramArgs) => {
  try {
    await run("verify:verify", {
      address: paramAddress,
      constructorArguments: paramArgs,
    })
  } catch (e) {
    //already verified
    console.log(e)
  }
}

module.exports = { verify }
