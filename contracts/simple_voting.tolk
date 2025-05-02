
const OP_VOTE = 0x933bbb7;

global ctxFor: int;
global ctxAgainst: int;
global ctxVoters: cell;

fun loadData() {
    var ds = getContractData().beginParse();
    ctxFor = ds.loadUint(32);
    ctxAgainst = ds.loadUint(32);
    ctxVoters = ds.loadRef();
}

fun saveData() {
    setContractData(
        beginCell()
            .storeUint(ctxFor, 32)
            .storeUint(ctxAgainst, 32)
            .storeRef(ctxVoters)
            .endCell()
    );
}

fun onInternalMessage(myBalance: int, msgValue: int, msgFull: cell, msgBody: slice) {
    if (msgBody.isEndOfSlice()) { 
        return;
    }

    var cs: slice = msgFull.beginParse();
    val flags = cs.loadMessageFlags();
    if (isMessageBounced(flags)) { 
        return;
    }
    val sender = cs.loadAddress();

    loadData();

    val op = msgBody.loadUint(32);
    val queryID = msgBody.loadUint(64);

    if (op == OP_VOTE) {
        val vote = msgBody.loadUint(1); 

        if (hasVoted(sender)) {
            throw 0x5dddbc71;
        }

        if (vote == 1) {
            ctxFor += 1;
        } else {
            ctxAgainst += 1;
        }

        addVoter(sender);
        saveData();
        return;
    }

    throw 0xffff;
}

fun addVoter(addr: slice) {
    ctxVoters = beginCell()
        .storeSlice(addr)
        .storeRef(ctxVoters)
        .endCell();
}

fun hasVoted(addr: slice): bool {
    var cell = ctxVoters;

    while (true) {
        var s = cell.beginParse();

        if (s.isEndOfSlice()) {
            return false;
        }

        var a = s.loadAddress();

        if (isSliceBitsEqual(a, addr)) {
            return true;
        }

        cell = s.loadRef();
    }

    return false;
}

get currentVotingData(): (int, int, cell) {
    loadData();
    return (ctxFor, ctxAgainst, ctxVoters);
}
