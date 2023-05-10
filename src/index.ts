import { initializeKeypair } from './initializeKeypair'
import * as web3 from '@solana/web3.js'
import * as token from '@solana/spl-token'

// -------------- Create token mint --------------------
async function createNewMint(
    connection: web3.Connection,
    payer: web3.Keypair,
    mintAuthority: web3.PublicKey,
    freezeAuthority: web3.PublicKey,
    decimals: number
): Promise<web3.PublicKey> {

    const tokenMint = await token.createMint(
        connection,
        payer,
        mintAuthority,
        freezeAuthority,
        decimals
    );

    console.log(`Token Mint: https://explorer.solana.com/address/${tokenMint}?cluster=devnet`)

    return tokenMint
}
// -----------------------------------------------------

// -------------- Create token account -----------------
async function createTokenAccount(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    owner: web3.PublicKey
) {
    const tokenAccount = await token.getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        mint,
        owner
    )

    console.log(
        `Token Account: https://explorer.solana.com/address/${tokenAccount.address}?cluster=devnet`
    )

    return tokenAccount
}
// -----------------------------------------------------

// -------------- Now that we have a token mint and a token account, lets mint tokens to the token account. ------------------------
async function mintTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    mint: web3.PublicKey,
    destination: web3.PublicKey,
    authority: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.mintTo(
        connection,
        payer,
        mint,
        destination,
        authority,
        amount
    )

    console.log(
        `Mint Token Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}
// ---------------------------------------------------------------------------------------------------------------------------------

// -------------- Approve Delegate - Now that we have a token mint and a token account, lets authorize a delegate to transfer tokens on our behalf -----------------
async function approveDelegate(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    delegate: web3.PublicKey,
    owner: web3.Signer | web3.PublicKey,
    amount: number
) {
    const transactionSignature = await token.approve(
        connection,
        payer,
        account,
        delegate,
        owner,
        amount
    )

    console.log(
        `Approve Delegate Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}
// -----------------------------------------------------------------------------------------------------------------------------------

// ----------- Transfer Tokens - Next, lets transfer some of the tokens we just minted using the spl-token library's transfer function. -----------------
async function transferTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    source: web3.PublicKey,
    destination: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.transfer(
        connection,
        payer,
        source,
        destination,
        owner,
        amount
    )

    console.log(
        `Transfer Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}
// ------------------------------------------------------------------------------------------------------------------------------------------------------

// ----------------- Revoke Delegate - Now that we've finished transferring tokens, lets revoke the delegate using the spl-token library's revoke function -----------------
async function revokeDelegate(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    owner: web3.Signer | web3.PublicKey,
) {
    const transactionSignature = await token.revoke(
        connection,
        payer,
        account,
        owner,
    )

    console.log(
        `Revote Delegate Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}
// -------------------------------------------------------------------------------------------------------------------------------------------------------------------------

// ----------------- Burn Tokens - Finally, lets burn the remaining tokens using the spl-token library's burn function -------------------------
async function burnTokens(
    connection: web3.Connection,
    payer: web3.Keypair,
    account: web3.PublicKey,
    mint: web3.PublicKey,
    owner: web3.Keypair,
    amount: number
) {
    const transactionSignature = await token.burn(
        connection,
        payer,
        account,
        mint,
        owner,
        amount
    )

    console.log(
        `Burn Transaction: https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}
// -------------------------------------------------------------------------------------------------------------------------------------------- 

async function main() {
    const connection = new web3.Connection(web3.clusterApiUrl('devnet'))
    const user = await initializeKeypair(connection)
    console.log('user:', user)

    // -------------- Create token mint -----------------
    const mint = await createNewMint(
        connection,
        user,
        user.publicKey,
        user.publicKey,
        2
    )
    console.log('mint:', mint)
    const mintInfo = await token.getMint(connection, mint)
    // --------------------------------------------------

    // -------------- Create token account -----------------
    const tokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        user.publicKey
    )
    // --------------------------------------------------

    // -------------- Now that we have a token mint and a token account, lets mint tokens to the token account. ------------------------
    await mintTokens(
        connection,
        user,
        mint,
        tokenAccount.address,
        user,
        100 * 10 ** mintInfo.decimals
    )

    // ---------------------------------------------------------------------------------------------------------------------------------

    // -------------- Approve Delegate - Now that we have a token mint and a token account, lets authorize a delegate to transfer tokens on our behalf -----------------
    const delegate = web3.Keypair.generate();

    await approveDelegate(
        connection,
        user,
        tokenAccount.address,
        delegate.publicKey,
        user.publicKey,
        50 * 10 ** mintInfo.decimals
    )
    // -----------------------------------------------------------------------------------------------------------------------------------------------------------------

    // ----------- Transfer Tokens - Next, lets transfer some of the tokens we just minted using the spl-token library's transfer function. -----------------
    const receiver = web3.Keypair.generate().publicKey
    const receiverTokenAccount = await createTokenAccount(
        connection,
        user,
        mint,
        receiver
    )

    await transferTokens(
        connection,
        user,
        tokenAccount.address,
        receiverTokenAccount.address,
        delegate,
        50 * 10 ** mintInfo.decimals
    )
    // ------------------------------------------------------------------------------------------------------------------------------------------------------

    // ----------------- Revoke Delegate - Now that we've finished transferring tokens, lets revoke the delegate using the spl-token library's revoke function -----------------
    await revokeDelegate(
        connection,
        user,
        tokenAccount.address,
        user.publicKey,
    )
    // -------------------------------------------------------------------------------------------------------------------------------------------------------------------------

    // ----------------- Burn Tokens - Finally, lets burn the remaining tokens using the spl-token library's burn function -------------------------
    await burnTokens(
        connection,
        user,
        tokenAccount.address,
        mint, user,
        25 * 10 ** mintInfo.decimals
    )
    // ---------------------------------------------------------------------------------------------------------------------------------------------
}



main().then(() => {
    console.log('Finished successfully')
    process.exit(0)
}).catch(error => {
    console.log(error)
    process.exit(1)
})