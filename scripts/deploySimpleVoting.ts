import { toNano } from '@ton/core';
import { SimpleVoting } from '../wrappers/SimpleVoting';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const simpleVoting = provider.open(SimpleVoting.createFromConfig({}, await compile('SimpleVoting')));

    await simpleVoting.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(simpleVoting.address);

    // run methods on `simpleVoting`
}
