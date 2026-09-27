//! Shared test helpers: a fresh LiteSVM chain with the Keysfirst program,
//! a 6-decimal test token, and funded wallets for landlord, tenant and a stranger.
#![allow(dead_code)]

pub use {
    anchor_lang::{prelude::Pubkey, solana_program::instruction::Instruction},
    anchor_spl::token_2022::spl_token_2022,
    litesvm::types::TransactionResult,
    solana_keypair::Keypair,
    solana_signer::Signer,
};
use {
    anchor_lang::{
        prelude::Clock,
        solana_program::{system_instruction, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    anchor_spl::{
        associated_token::{self, get_associated_token_address_with_program_id, spl_associated_token_account},
        token_interface::TokenAccount,
    },
    keysfirst::{constants::DEAL_SEED, state::Deal},
    litesvm::LiteSVM,
    solana_message::{Message, VersionedMessage},
    solana_transaction::versioned::VersionedTransaction,
};

pub const T0: i64 = 1_800_000_000; // "now" at the start of every test (Jan 2027)
pub const DAY: i64 = 86_400;
pub const DECIMALS: u8 = 6;
pub const EUR: u64 = 1_000_000; // 1 test EUR in base units
pub const AMOUNT: u64 = 600 * EUR;
pub const START_BALANCE: u64 = 1_000 * EUR;
const MINT_LEN: usize = 82; // mint without extensions; same size for Token and Token-2022

#[derive(Clone, Copy, Debug)]
pub enum Who {
    Landlord,
    Tenant,
    Stranger,
}

pub struct Env {
    pub svm: LiteSVM,
    pub landlord: Keypair,
    pub tenant: Keypair,
    pub stranger: Keypair,
    pub mint_authority: Keypair,
    pub mint: Pubkey,
    pub token_program: Pubkey,
}

impl Env {
    pub fn key(&self, who: Who) -> &Keypair {
        match who {
            Who::Landlord => &self.landlord,
            Who::Tenant => &self.tenant,
            Who::Stranger => &self.stranger,
        }
    }

    /// Sends one instruction signed and paid for by `who`.
    pub fn run(&mut self, ix: Instruction, who: Who) -> TransactionResult {
        self.run_many(&[ix], who)
    }

    pub fn run_many(&mut self, ixs: &[Instruction], who: Who) -> TransactionResult {
        let Env { svm, landlord, tenant, stranger, .. } = self;
        let signer: &Keypair = match who {
            Who::Landlord => landlord,
            Who::Tenant => tenant,
            Who::Stranger => stranger,
        };
        send(svm, ixs, signer, &[signer])
    }
}

pub struct DealParams {
    pub deal_id: u64,
    pub amount: u64,
    pub move_in: i64,
    pub deadline: i64,
    pub title: String,
}

impl Default for DealParams {
    fn default() -> Self {
        Self {
            deal_id: 1,
            amount: AMOUNT,
            move_in: T0 + 10 * DAY,
            deadline: T0 + 13 * DAY,
            title: "Room in Vallendar".to_string(),
        }
    }
}

/// Token-2022 test token (like the devnet Test EUR).
pub fn setup() -> Env {
    setup_with(anchor_spl::token_2022::ID)
}

pub fn setup_with(token_program: Pubkey) -> Env {
    let mut svm = LiteSVM::new();
    let program = include_bytes!(concat!(env!("CARGO_TARGET_TMPDIR"), "/../deploy/keysfirst.so"));
    svm.add_program(keysfirst::id(), program).unwrap();
    set_time(&mut svm, T0);

    let mut env = Env {
        svm,
        landlord: Keypair::new(),
        tenant: Keypair::new(),
        stranger: Keypair::new(),
        mint_authority: Keypair::new(),
        mint: Pubkey::default(),
        token_program,
    };
    let wallets = [
        env.landlord.pubkey(),
        env.tenant.pubkey(),
        env.stranger.pubkey(),
        env.mint_authority.pubkey(),
    ];
    for wallet in wallets {
        env.svm.airdrop(&wallet, 10_000_000_000).unwrap();
    }
    env.mint = create_mint(&mut env);
    let (tenant, stranger) = (env.tenant.pubkey(), env.stranger.pubkey());
    mint_to(&mut env, &tenant, START_BALANCE);
    mint_to(&mut env, &stranger, START_BALANCE);
    env
}

pub fn set_time(svm: &mut LiteSVM, unix_timestamp: i64) {
    let mut clock: Clock = svm.get_sysvar();
    clock.unix_timestamp = unix_timestamp;
    svm.set_sysvar(&clock);
}

pub fn send(svm: &mut LiteSVM, ixs: &[Instruction], payer: &Keypair, signers: &[&Keypair]) -> TransactionResult {
    let msg = Message::new_with_blockhash(ixs, Some(&payer.pubkey()), &svm.latest_blockhash());
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap();
    let result = svm.send_transaction(tx);
    svm.expire_blockhash(); // lets an identical transaction through next time
    result
}

pub fn assert_ok(result: &TransactionResult) {
    if let Err(failed) = result {
        panic!("transaction failed: {:?}\n{}", failed.err, failed.meta.logs.join("\n"));
    }
}

/// Asserts the transaction failed with the given Anchor error name, e.g. "NotTenant".
pub fn assert_err(result: &TransactionResult, code: &str) {
    match result {
        Ok(_) => panic!("expected error {code}, but the transaction succeeded"),
        Err(failed) => assert!(
            failed.meta.logs.iter().any(|line| line.contains(&format!("Error Code: {code}"))),
            "expected error {code}, got {:?}\n{}",
            failed.err,
            failed.meta.logs.join("\n")
        ),
    }
}

pub fn create_mint(env: &mut Env) -> Pubkey {
    let mint = Keypair::new();
    let authority = env.mint_authority.pubkey();
    let rent = env.svm.minimum_balance_for_rent_exemption(MINT_LEN);
    let ixs = [
        system_instruction::create_account(&authority, &mint.pubkey(), rent, MINT_LEN as u64, &env.token_program),
        spl_token_2022::instruction::initialize_mint2(&env.token_program, &mint.pubkey(), &authority, None, DECIMALS)
            .unwrap(),
    ];
    let Env { svm, mint_authority, .. } = env;
    assert_ok(&send(svm, &ixs, mint_authority, &[&*mint_authority, &mint]));
    mint.pubkey()
}

/// Mints `amount` of `mint` to `owner`'s associated token account (created if missing).
pub fn mint_tokens(env: &mut Env, mint: Pubkey, owner: &Pubkey, amount: u64) -> Pubkey {
    let authority = env.mint_authority.pubkey();
    let account = get_associated_token_address_with_program_id(owner, &mint, &env.token_program);
    let ixs = [
        spl_associated_token_account::instruction::create_associated_token_account_idempotent(
            &authority,
            owner,
            &mint,
            &env.token_program,
        ),
        spl_token_2022::instruction::mint_to_checked(&env.token_program, &mint, &account, &authority, &[], amount, DECIMALS)
            .unwrap(),
    ];
    let Env { svm, mint_authority, .. } = env;
    assert_ok(&send(svm, &ixs, mint_authority, &[&*mint_authority]));
    account
}

pub fn mint_to(env: &mut Env, owner: &Pubkey, amount: u64) -> Pubkey {
    let mint = env.mint;
    mint_tokens(env, mint, owner, amount)
}

/// Associated token account of `owner` for the test token.
pub fn ata(env: &Env, owner: &Pubkey) -> Pubkey {
    ata_for(env, owner, &env.mint)
}

pub fn ata_for(env: &Env, owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    get_associated_token_address_with_program_id(owner, mint, &env.token_program)
}

/// Token balance; 0 if the account does not exist (e.g. a closed vault).
pub fn balance(env: &Env, token_account: Pubkey) -> u64 {
    match env.svm.get_account(&token_account) {
        Some(account) if account.lamports > 0 => {
            TokenAccount::try_deserialize(&mut account.data.as_slice()).unwrap().amount
        }
        _ => 0,
    }
}

pub fn exists(env: &Env, address: Pubkey) -> bool {
    env.svm.get_account(&address).is_some_and(|account| account.lamports > 0)
}

pub fn lamports(env: &Env, address: Pubkey) -> u64 {
    env.svm.get_account(&address).map_or(0, |account| account.lamports)
}

pub fn deal_pda(landlord: &Pubkey, deal_id: u64) -> Pubkey {
    Pubkey::find_program_address(&[DEAL_SEED, landlord.as_ref(), &deal_id.to_le_bytes()], &keysfirst::id()).0
}

pub fn get_deal(env: &Env, deal: Pubkey) -> Deal {
    let account = env.svm.get_account(&deal).expect("deal account missing");
    Deal::try_deserialize(&mut account.data.as_slice()).unwrap()
}

pub fn ix_create_deal(env: &Env, p: &DealParams) -> Instruction {
    let landlord = env.landlord.pubkey();
    let deal = deal_pda(&landlord, p.deal_id);
    Instruction::new_with_bytes(
        keysfirst::id(),
        &keysfirst::instruction::CreateDeal {
            deal_id: p.deal_id,
            amount: p.amount,
            move_in: p.move_in,
            deadline: p.deadline,
            title: p.title.clone(),
        }
        .data(),
        keysfirst::accounts::CreateDeal {
            landlord,
            deal,
            mint: env.mint,
            vault: ata(env, &deal),
            landlord_token: ata(env, &landlord),
            token_program: env.token_program,
            associated_token_program: associated_token::ID,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    )
}

/// Creates the deal as the landlord and returns its address.
pub fn create_deal(env: &mut Env, p: &DealParams) -> Pubkey {
    let ix = ix_create_deal(env, p);
    assert_ok(&env.run(ix, Who::Landlord));
    deal_pda(&env.landlord.pubkey(), p.deal_id)
}

pub fn ix_fund_custom(env: &Env, deal: Pubkey, funder: Pubkey, mint: Pubkey, tenant_token: Pubkey) -> Instruction {
    Instruction::new_with_bytes(
        keysfirst::id(),
        &keysfirst::instruction::Fund {}.data(),
        keysfirst::accounts::Fund {
            tenant: funder,
            deal,
            mint,
            tenant_token,
            vault: ata(env, &deal),
            token_program: env.token_program,
        }
        .to_account_metas(None),
    )
}

pub fn ix_fund(env: &Env, deal: Pubkey, funder: Pubkey) -> Instruction {
    ix_fund_custom(env, deal, funder, env.mint, ata(env, &funder))
}

/// Creates the deal and has the tenant fund it.
pub fn funded_deal(env: &mut Env, p: &DealParams) -> Pubkey {
    let deal = create_deal(env, p);
    let ix = ix_fund(env, deal, env.tenant.pubkey());
    assert_ok(&env.run(ix, Who::Tenant));
    deal
}

pub fn ix_confirm(env: &Env, deal: Pubkey, signer: Pubkey) -> Instruction {
    let landlord = env.landlord.pubkey();
    Instruction::new_with_bytes(
        keysfirst::id(),
        &keysfirst::instruction::ConfirmHandover {}.data(),
        keysfirst::accounts::ConfirmHandover {
            tenant: signer,
            deal,
            landlord,
            mint: env.mint,
            vault: ata(env, &deal),
            landlord_token: ata(env, &landlord),
            token_program: env.token_program,
            associated_token_program: associated_token::ID,
            system_program: system_program::ID,
        }
        .to_account_metas(None),
    )
}
