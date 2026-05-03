#![no_std]

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, panic_with_error, symbol_short, Address, Env, Symbol,
};

const ADMIN: Symbol = symbol_short!("ADMIN");
const REWARD_POOL: Symbol = symbol_short!("POOL");
const MAXCLAIM: Symbol = symbol_short!("MAXCLM");
const INITT: Symbol = symbol_short!("INITT");

#[contracttype]
#[derive(Clone)]
pub struct PlayerSnapshot {
    pub taps: u64,
    pub owned_nfts: u32,
    pub total_claimed_reward: i128,
    pub claim_count: u32,
    pub last_updated_ledger: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct RewardConfig {
    pub admin: Address,
    pub reward_pool: i128,
    pub max_claim_per_call: i128,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Player(Address),
}

#[contracterror]
#[derive(Copy, Clone, Eq, PartialEq)]
#[repr(u32)]
pub enum RewardsError {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    InvalidAmount = 3,
    ClaimAboveLimit = 4,
    RewardPoolUnderflow = 5,
    Unauthorized = 6,
}

#[contract]
pub struct EmiraRewardsContract;

#[contractimpl]
impl EmiraRewardsContract {
    pub fn init(env: Env, admin: Address, reward_pool: i128, max_claim_per_call: i128) {
        admin.require_auth();
        if env.storage().instance().has(&INITT) {
            panic_with_error!(&env, RewardsError::AlreadyInitialized);
        }
        if reward_pool < 0 || max_claim_per_call <= 0 {
            panic_with_error!(&env, RewardsError::InvalidAmount);
        }

        env.storage().instance().set(&ADMIN, &admin);
        env.storage().instance().set(&REWARD_POOL, &reward_pool);
        env.storage().instance().set(&MAXCLAIM, &max_claim_per_call);
        env.storage().instance().set(&INITT, &true);
        env.events().publish(
            (symbol_short!("reward"), symbol_short!("init")),
            (admin, reward_pool, max_claim_per_call),
        );
    }

    pub fn fund_pool(env: Env, admin: Address, amount: i128) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        if amount <= 0 {
            panic_with_error!(&env, RewardsError::InvalidAmount);
        }
        let next = Self::reward_pool(env.clone()) + amount;
        env.storage().instance().set(&REWARD_POOL, &next);
        env.events().publish((symbol_short!("reward"), symbol_short!("fund")), (admin, amount, next));
    }

    pub fn set_max_claim(env: Env, admin: Address, next_limit: i128) {
        admin.require_auth();
        Self::require_admin(&env, &admin);
        if next_limit <= 0 {
            panic_with_error!(&env, RewardsError::InvalidAmount);
        }
        env.storage().instance().set(&MAXCLAIM, &next_limit);
        env.events().publish((symbol_short!("reward"), symbol_short!("limit")), (admin, next_limit));
    }

    pub fn record_progress(env: Env, player: Address, taps: u64, owned_nfts: u32) {
        player.require_auth();
        Self::require_initialized(&env);

        let previous = Self::get_snapshot(env.clone(), player.clone());
        let snapshot = PlayerSnapshot {
            taps,
            owned_nfts,
            total_claimed_reward: previous.total_claimed_reward,
            claim_count: previous.claim_count,
            last_updated_ledger: env.ledger().sequence(),
        };
        env.storage().persistent().set(&DataKey::Player(player.clone()), &snapshot);
        env.events().publish((symbol_short!("reward"), symbol_short!("prog")), (player, taps, owned_nfts));
    }

    pub fn claim_reward(env: Env, admin: Address, player: Address, amount: i128) {
        admin.require_auth();
        player.require_auth();
        Self::require_admin(&env, &admin);
        Self::require_initialized(&env);
        if amount <= 0 {
            panic_with_error!(&env, RewardsError::InvalidAmount);
        }
        if amount > Self::max_claim_per_call(env.clone()) {
            panic_with_error!(&env, RewardsError::ClaimAboveLimit);
        }

        let current_pool = Self::reward_pool(env.clone());
        if current_pool < amount {
            panic_with_error!(&env, RewardsError::RewardPoolUnderflow);
        }

        let mut snapshot = Self::get_snapshot(env.clone(), player.clone());
        snapshot.total_claimed_reward += amount;
        snapshot.claim_count += 1;
        snapshot.last_updated_ledger = env.ledger().sequence();
        env.storage().persistent().set(&DataKey::Player(player.clone()), &snapshot);
        env.storage().instance().set(&REWARD_POOL, &(current_pool - amount));
        env.events().publish(
            (symbol_short!("reward"), symbol_short!("claim")),
            (admin, player, amount, current_pool - amount),
        );
    }

    pub fn get_player(env: Env, player: Address) -> PlayerSnapshot {
        Self::get_snapshot(env, player)
    }

    pub fn reward_pool(env: Env) -> i128 {
        Self::require_initialized(&env);
        env.storage()
            .instance()
            .get(&REWARD_POOL)
            .unwrap_or_else(|| panic_with_error!(&env, RewardsError::NotInitialized))
    }

    pub fn max_claim_per_call(env: Env) -> i128 {
        Self::require_initialized(&env);
        env.storage()
            .instance()
            .get(&MAXCLAIM)
            .unwrap_or_else(|| panic_with_error!(&env, RewardsError::NotInitialized))
    }

    pub fn get_config(env: Env) -> RewardConfig {
        Self::require_initialized(&env);
        RewardConfig {
            admin: Self::admin(env.clone()),
            reward_pool: Self::reward_pool(env.clone()),
            max_claim_per_call: Self::max_claim_per_call(env),
        }
    }

    fn admin(env: Env) -> Address {
        env.storage()
            .instance()
            .get(&ADMIN)
            .unwrap_or_else(|| panic_with_error!(&env, RewardsError::NotInitialized))
    }

    fn require_admin(env: &Env, admin: &Address) {
        if Self::admin(env.clone()) != *admin {
            panic_with_error!(env, RewardsError::Unauthorized);
        }
    }

    fn require_initialized(env: &Env) {
        if !env.storage().instance().has(&INITT) {
            panic_with_error!(env, RewardsError::NotInitialized);
        }
    }

    fn get_snapshot(env: Env, player: Address) -> PlayerSnapshot {
        env.storage().persistent().get(&DataKey::Player(player)).unwrap_or(PlayerSnapshot {
            taps: 0,
            owned_nfts: 0,
            total_claimed_reward: 0,
            claim_count: 0,
            last_updated_ledger: 0,
        })
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::testutils::Address as _;

    #[test]
    fn reward_flow_works() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register(EmiraRewardsContract, ());
        let client = EmiraRewardsContractClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        let player = Address::generate(&env);

        client.init(&admin, &5000, &500);
        client.record_progress(&player, &12, &3);
        client.claim_reward(&admin, &player, &250);

        let snapshot = client.get_player(&player);
        assert_eq!(snapshot.total_claimed_reward, 250);
        assert_eq!(client.reward_pool(), 4750);
    }
}
