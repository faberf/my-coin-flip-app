import { createSignal, onMount, For, createEffect } from 'solid-js';
import {POCKET} from './PocketBase';
import CoinFlip from './CoinFlip';


interface Coin {
  headsProbability: number;
  cooldownOnHeads: number;
  cooldownOnTails: number;
  name: string;
  id: string;
  onRemove: () => void;
}

interface CoinManagerProps {
  user: any;
}




const CoinManager = (props:CoinManagerProps) => {
  const user = props.user;
  console.log('User:', user);

  const [coins, setCoins] = createSignal<Coin[]>([]);
  const [newCoinSettings, setNewCoinSettings] = createSignal({
    headsProbability: 0.5,
    cooldownOnHeadsHours: 0, 
    cooldownOnTailsHours: 0,
    name: '',
  });
  

  const refreshCoins = async () => {
    try {
      // Assuming each coin has an 'owner' field with the user's ID
      const filter = `owner="${user()}"`;
      const coins = await POCKET.collection('coins').getFullList({
        filter: filter
      });
  
      setCoins(coins.map(coin => ({
        headsProbability: coin.heads_probability,
        cooldownOnHeads: coin.cooldown_on_heads_ms,
        cooldownOnTails: coin.cooldown_on_tails_ms,
        name: coin.name,
        id: coin.id,
        onRemove: () => refreshCoins(),
      })));
    } catch (error) {
      console.error('Failed to refresh coins:', error);
    }
  };
  
  createEffect((user) => {
    refreshCoins();
    }, user);

  onMount(() => {
    refreshCoins();
  });

  const addCoin = async () => {
    console.log('Adding coin:', newCoinSettings());
    try {
      await POCKET.collection('coins').create({
        heads_probability: newCoinSettings().headsProbability,
        cooldown_on_heads_ms: newCoinSettings().cooldownOnHeadsHours * 60 * 60 * 1000,
        cooldown_on_tails_ms: newCoinSettings().cooldownOnTailsHours * 60 * 60 * 1000,
        name: newCoinSettings().name,
        owner: user(),
      });
      refreshCoins();
    } catch (error) {
      console.error('Failed to add coin:', error);
    }
  };



  const handleNewCoinSettingChange = (field : string, value : any) => {
    setNewCoinSettings({ ...newCoinSettings(), [field]: value });
  };

  return (
    <div>
      <div class="carousel rounded-box">
        <For each={coins()}>

            {(coin, index) => (
                      <div class="carousel-item">
                      <CoinFlip {...coin} />
                      </div>
            )}
        </For>
        <div class="carousel-item w-64 flex justify-center items-center">

        <button class="btn" onClick={() => {
          const modal = document.getElementById('my_modal_1');
          if (modal) {
            const modal = document.getElementById('my_modal_1') as HTMLDialogElement;
            modal.showModal();
          }
        }}>New Coin</button>
        <dialog id="my_modal_1" class="modal">
          <div class="modal-box"><div class="overflow-x-auto">
        <table class="table">
          <tbody>
            <tr>
              <th>Name</th>
              <td><input
              type="text"
              class="input input-bordered w-full max-w-xs"
              value={newCoinSettings().name}
              onInput={(e) => handleNewCoinSettingChange('name', e.currentTarget.value)}></input></td>
            </tr>

          <tr>
              <th>Probability of Heads</th>
              <td><input
            type="number"
            min="0"
            max="1"
            step="0.01"
            class="input input-bordered w-full max-w-xs"
            value={newCoinSettings().headsProbability}
            onInput={(e) => handleNewCoinSettingChange('headsProbability', parseFloat(e.currentTarget.value))}
          /></td>
            </tr>
            <tr>
              <th>Cooldown on Heads</th>
              <td><input
            type="number"
            min="0"
            class="input input-bordered w-full max-w-xs"
            value={newCoinSettings().cooldownOnHeadsHours}
            onInput={(e) => handleNewCoinSettingChange('cooldownOnHeadsHours', parseFloat(e.currentTarget.value))}
          /></td>
            </tr>
            <tr>
              <th>Cooldown on Tails</th>
              <td>          <input
            type="number"
            min="0"
            class="input input-bordered w-full max-w-xs"
            value={newCoinSettings().cooldownOnTailsHours}
            onInput={(e) => handleNewCoinSettingChange('cooldownOnTailsHours', parseFloat(e.currentTarget.value))}
          /></td>
            </tr>
          </tbody>
        </table>
      </div>
            <div class="modal-action">
              <form method="dialog">
                <button class="btn" onClick={addCoin}>Add Coin</button>
              </form>
            </div>
          </div>
        </dialog>

        
        </div>
      </div>

    </div>
  );
};

export default CoinManager;
