import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type SimpleVotingConfig = {};

export function simpleVotingConfigToCell(config: SimpleVotingConfig): Cell {
    return beginCell().storeUint(0, 32).storeUint(0, 32).storeRef(beginCell().endCell()).endCell();
}

export const Opcodes = {
    OP_VOTE: 0x933bbb7,
};

export class SimpleVoting implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new SimpleVoting(address);
    }

    static createFromConfig(config: SimpleVotingConfig, code: Cell, workchain = 0) {
        const data = simpleVotingConfigToCell(config);
        const init = { code, data };
        return new SimpleVoting(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async sendVote(provider: ContractProvider, via: Sender, value: bigint, vote: "for" | "against") {
        const voteType = vote === "for" ? 1 : 0;
        const msg_body = beginCell().storeUint(Opcodes.OP_VOTE, 32).storeUint(0, 64).storeUint(voteType, 1).endCell();
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: msg_body,
        });
    }

    async getVotingData(provider: ContractProvider) {
        const result = await provider.get('currentVotingData', []);
        return {
            voteFor: result.stack.readNumber(),
            voteAgainst: result.stack.readNumber(),
            voters: result.stack.readCell(),
        }
    }
}
