#![no_std]

use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Address, Env, Symbol};

const ADMIN: Symbol = symbol_short!("ADMIN");
const REWARD_POOL: Symbol = symbol_short!("POOL");
#[contracttype]
#[derive(Clone)]
pub struct PlayerSnapshot {
    pub taps: u64,
    pub owned_nfts: u32,
    pub last_claimed_reward: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Player(Address),
}

#[contract]
pub struct EmiraRewardsContract;

#[contractimpl]
impl EmiraRewardsContract {
    pub fn init(env: Env, admin: Address, reward_pool: i128) {
        admin.require_auth();
        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&REWARD_POOL, &reward_pool);
    }

    pub fn record_progress(env: Env, player: Address, taps: u64, owned_nfts: u32) {
        player.require_auth();
        let snapshot = PlayerSnapshot {
            taps,
            owned_nfts,
            last_claimed_reward: Self::get_snapshot(env.clone(), player.clone()).last_claimed_reward,
        };
        env.storage().persistent().set(&DataKey::Player(player), &snapshot);
    }

    pub fn claim_reward(env: Env, player: Address, amount: i128) {
        player.require_auth();
        let mut snapshot = Self::get_snapshot(env.clone(), player.clone());
        snapshot.last_claimed_reward += amount;
        env.storage().persistent().set(&DataKey::Player(player), &snapshot);

        let current_pool = env.storage().instance().get::<_, i128>(&REWARD_POOL).unwrap_or(0);
        env.storage().instance().set(&REWARD_POOL, &(current_pool - amount));
    }

    pub fn get_player(env: Env, player: Address) -> PlayerSnapshot {
        Self::get_snapshot(env, player)
    }

    pub fn reward_pool(env: Env) -> i128 {
        env.storage().instance().get(&REWARD_POOL).unwrap_or(0)
    }
    fn get_snapshot(env: Env, player: Address) -> PlayerSnapshot {
        env.storage().persistent().get(&DataKey::Player(player)).unwrap_or(PlayerSnapshot {
            taps: 0,
            owned_nfts: 0,
            last_claimed_reward: 0,
        })
    }
}
