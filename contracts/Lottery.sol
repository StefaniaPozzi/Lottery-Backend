//SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

contract Lottery {
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

    function pickWinner() public {}

    //is not possible to automatise this? like lombok
    function getTicketPrice() public returns (uint256) {
        return i_ticketPrice;
    }

    function getPlayers(uint256 index) public returns (address payable) {
        return s_players[index];
    }
}
