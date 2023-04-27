//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";

contract Lottery  {
    uint256 private immutable i_ticketPrice;
    address payable[] private s_players; //when one address wins, we have to pay him
    error ErrorLottery__InsufficientTicketAmount();

    event EventLottery__TicketBuyed(address); //tracking state is cheaper with events than storing in a var

    constructor(uint256 ticketPrice) {
        i_ticketPrice = ticketPrice;
    }

    function buyTicket() public payable {
        if (msg.value < i_ticketPrice)
            revert ErrorLottery__InsufficientTicketAmount();
        s_players.push(payable(msg.sender));
        emit EventLottery__TicketBuyed(msg.sender);
    }

    /**
     * @dev This method is called by the keepers: we dont have to interact with it
     * Security feature / Escape the reentracy attack:
     * This is a 2 tx process (no simulation can be performed)
     * 1. request the random number
     * 2. number is returned from the chainlink and then we send money to the winner
     * @notice Fase 1: custom name
     */
    function pickWinner() external {
        //cheaper than public
        //
    }

    /**
     * @notice Fase 2: chainlink node gives the VRF to this method
     * */
    function fulfill() internal override {}

    /* Pure and View functions */
    //is not possible to automatise this? like lombok
    function getTicketPrice() public view returns (uint256) {
        return i_ticketPrice;
    }

    function getPlayers(uint256 index) public view returns (address payable) {
        return s_players[index];
    }
}
