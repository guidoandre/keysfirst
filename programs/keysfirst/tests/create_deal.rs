mod common;

use common::*;
use keysfirst::state::DealStatus;

fn try_create(env: &mut Env, p: DealParams) -> TransactionResult {
    let ix = ix_create_deal(env, &p);
    env.run(ix, Who::Landlord)
}

#[test]
fn creates_an_open_deal_with_an_empty_vault() {
    let mut env = setup();
    let p = DealParams::default();
    let deal = create_deal(&mut env, &p);

    let d = get_deal(&env, deal);
    assert_eq!(d.landlord, env.landlord.pubkey());
    assert_eq!(d.tenant, Pubkey::default());
    assert_eq!(d.mint, env.mint);
    assert_eq!(d.deal_id, 1);
    assert_eq!(d.amount, AMOUNT);
    assert_eq!(d.move_in, p.move_in);
    assert_eq!(d.deadline, p.deadline);
    assert_eq!(d.created_at, T0);
    assert_eq!(d.status, DealStatus::Open);
    assert_eq!(d.title, "Room in Vallendar");
    assert!(exists(&env, ata(&env, &deal)), "vault must exist");
    assert_eq!(balance(&env, ata(&env, &deal)), 0);
    assert!(exists(&env, ata(&env, &env.landlord.pubkey())), "landlord token account is prepared");
}

#[test]
fn rejects_a_zero_amount() {
    let mut env = setup();
    let res = try_create(&mut env, DealParams { amount: 0, ..Default::default() });
    assert_err(&res, "InvalidAmount");
}

#[test]
fn accepts_a_title_of_exactly_64_bytes() {
    let mut env = setup();
    assert_ok(&try_create(&mut env, DealParams { title: "x".repeat(64), ..Default::default() }));
}

#[test]
fn rejects_a_title_longer_than_64_bytes() {
    let mut env = setup();
    let res = try_create(&mut env, DealParams { title: "x".repeat(65), ..Default::default() });
    assert_err(&res, "TitleTooLong");
}

#[test]
fn rejects_a_deadline_that_is_not_after_move_in() {
    let mut env = setup();
    let res = try_create(&mut env, DealParams { deadline: T0 + 10 * DAY, ..Default::default() });
    assert_err(&res, "InvalidSchedule");
}

#[test]
fn rejects_a_handover_window_longer_than_14_days() {
    let mut env = setup();
    let move_in = T0 + 10 * DAY;
    let res = try_create(&mut env, DealParams { move_in, deadline: move_in + 14 * DAY + 1, ..Default::default() });
    assert_err(&res, "InvalidSchedule");
}

#[test]
fn rejects_a_deadline_in_the_past() {
    let mut env = setup();
    let res = try_create(&mut env, DealParams { move_in: T0 - 3 * DAY, deadline: T0 - DAY, ..Default::default() });
    assert_err(&res, "DeadlinePassed");
}

#[test]
fn a_vault_created_in_advance_does_not_block_the_deal() {
    use anchor_spl::associated_token::spl_associated_token_account::instruction::create_associated_token_account;
    let mut env = setup();
    let p = DealParams::default();
    let deal = deal_pda(&env.landlord.pubkey(), p.deal_id);
    let ix = create_associated_token_account(&env.stranger.pubkey(), &deal, &env.mint, &env.token_program);
    assert_ok(&env.run(ix, Who::Stranger));
    assert!(exists(&env, ata(&env, &deal)));

    create_deal(&mut env, &p);
    assert_eq!(get_deal(&env, deal).status, DealStatus::Open);
}
