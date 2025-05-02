import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, Dictionary, toNano } from '@ton/core';
import { SimpleVoting } from '../wrappers/SimpleVoting';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

// npx blueprint test SimpleVoting

describe('SimpleVoting', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('SimpleVoting');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let voter_1: SandboxContract<TreasuryContract>;
    let voter_2: SandboxContract<TreasuryContract>;
    let voter_3: SandboxContract<TreasuryContract>;
    let simpleVoting: SandboxContract<SimpleVoting>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        simpleVoting = blockchain.openContract(SimpleVoting.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await simpleVoting.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: simpleVoting.address,
            deploy: true,
            success: true,
        });
    });

    it('should vote for and against', async () => {
        voter_1 = await blockchain.treasury('voter_1');
        voter_2 = await blockchain.treasury('voter_2');
        voter_3 = await blockchain.treasury('voter_3');

        const voteForResult = await simpleVoting.sendVote(voter_1.getSender(), toNano('0.05'), 'for');
        const voteForResultOther = await simpleVoting.sendVote(voter_2.getSender(), toNano('0.05'), 'for');
        const voteAgainstResult = await simpleVoting.sendVote(voter_3.getSender(), toNano('0.05'), 'against');

        expect(voteForResult.transactions).toHaveTransaction({
            from: voter_1.address,
            to: simpleVoting.address,
            success: true,
            op: 0x933bbb7,
        });

        expect(voteForResultOther.transactions).toHaveTransaction({
            from: voter_2.address,
            to: simpleVoting.address,
            success: true,
            op: 0x933bbb7,
        });

        expect(voteAgainstResult.transactions).toHaveTransaction({
            from: voter_3.address,
            to: simpleVoting.address,
            success: true,
            op: 0x933bbb7,
        });

        const voteForResultAgain = await simpleVoting.sendVote(voter_1.getSender(), toNano('0.05'), 'for');

        expect(voteForResultAgain.transactions).toHaveTransaction({
            from: voter_1.address,
            to: simpleVoting.address,
            success: false,
        });

        const { voteFor, voteAgainst, voters } = await simpleVoting.getVotingData();

        expect(voteFor).toBe(2);
        expect(voteAgainst).toBe(1);

        let cell: Cell | null = voters;
        let index = 0;

        while (cell) {
            const slice = cell.beginParse();
        
            if (slice.remainingBits >= 267) {
                const address = slice.loadAddress();
                console.log(`📬 Voter ${index}:`, address.toString());
                index++;
            } else {
                break;
            }
        
            if (slice.remainingRefs > 0) {
                cell = slice.loadRef();
            } else {
                break;
            }
        }

    });
});
