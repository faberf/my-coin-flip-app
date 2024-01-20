import { createSignal, createEffect, onMount, Show } from 'solid-js';

import PocketBase from 'pocketbase';
import { POCKET } from './PocketBase';

interface CoinProps {
    headsProbability: number;
    cooldownOnHeads: number;
    cooldownOnTails: number;
    name: string;
    id: string;
    onRemove: () => void;
}

const CoinFlip = (props: CoinProps) => {
    const { headsProbability, cooldownOnHeads, cooldownOnTails, name, id, onRemove } = props;
    const [coinSide, setCoinSide] = createSignal('');
    const [lastFlipTime, setLastFlipTime] = createSignal<Date | null>(null);
    const [canFlip, setCanFlip] = createSignal(true);
    const [cooldownTimer, setCooldownTimer] = createSignal('');
    const [flipHistory, setFlipHistory] = createSignal<Array<{ side: string, time: Date }>>([]);
    const [timeoutMoment, setTimeoutMoment] = createSignal<Date | null>(null);

    const removeCoin = async () => {
      try {
        // Fetch all 'flip' records where the coin field is set to the coin being deleted
        const flipsToDelete = await POCKET.collection('flips').getFullList({
          filter: `coin="${id}"`, // assuming 'coin' is the field name and 'id' is the coin ID
        });
    
        // Delete each 'flip' record
        for (const flip of flipsToDelete) {
          await POCKET.collection('flips').delete(flip.id);
        }
    
        // Delete the coin after all associated 'flips' have been deleted
        await POCKET.collection('coins').delete(id);
        onRemove();
      } catch (error) {
        console.error('Failed to remove coin and its associated flips:', error);
      }
    };
    

    const refreshFlipHistory = async () => {
      const history = await POCKET.collection('flips').getFullList({
        filter: "coin = '" + id + "'",
        order_by: 'flip_time',
        order: 'desc',
        limit: 1,
      });
      // to list of flip history entries with side and time
      setFlipHistory(history.map(entry => ({
        side: entry.heads ? 'Heads' : 'Tails',
        time: new Date(entry.flip_time),
      })));

      
      if (history.length > 0) {
        setLastFlipTime(new Date(history[0].flip_time));
        setTimeoutMoment(new Date(history[0].timeout_moment));
        setCanFlip(new Date(history[0].timeout_moment) < new Date());
        if(history[0].is_heads) {
          setCoinSide('Heads');
        }
        else {
          setCoinSide('Tails');
        }
      }


    }

    const flipCoin = async () => {
      if (!canFlip()) return;

      const now = new Date();
      const result = Math.random() < headsProbability ? 'Heads' : 'Tails';
      setCoinSide(result);
      setLastFlipTime(now);
      setFlipHistory(prevHistory => [...prevHistory, { side: result, time: now }]);

      const cooldownMs = result === 'Heads' ? cooldownOnHeads  : cooldownOnTails;

      if (cooldownMs > 0) {
        setCanFlip(false);
        setTimeoutMoment(new Date(now.getTime() + cooldownMs));
        setTimeout(() => {
          setCanFlip(true);
        }, cooldownMs);
      } else {
        setTimeoutMoment(now);
      }

      await POCKET.collection('flips').create({
        heads: result === 'Heads',
        flip_time: lastFlipTime(),
        coin: props.id,
        timeout_moment: timeoutMoment(),
      });

      //refreshFlipHistory();
    };

    // Update the cooldown timer display
    createEffect(() => {
      const interval = setInterval(() => {
        const tm = timeoutMoment();
        if (tm) {
          const now = new Date();
          const remainingTime = Math.max(0, tm.getTime() - now.getTime());
          const hours = Math.floor(remainingTime / 3600000);
          const minutes = Math.floor((remainingTime % 3600000) / 60000);
          const seconds = Math.floor((remainingTime % 60000) / 1000);
          setCooldownTimer(`${hours}h ${minutes}m ${seconds}s`);
        } else {
          setCooldownTimer('');
        }
        if (lastFlipTime() && tm) {
          setCanFlip(new Date(tm.getTime()) < new Date());
        }
      }, 1000);

      return () => clearInterval(interval);
    });

    onMount(() => {
      refreshFlipHistory();
    });
    return (
      <div>
        <h2 class="card-title">{name}</h2>


        <div class="overflow-x-auto">
        <table class="table">
          <tbody>
        <tr>
              <th>Current Value</th>
              <td>{coinSide()}</td>
            </tr>
            <tr>
              <th>Remaining Time</th>
              <td>{cooldownTimer()}</td>
            </tr>
          <tr>
              <th>Probability of Heads</th>
              <td>{headsProbability}</td>
            </tr>
            <tr>
              <th>Cooldown on Heads</th>
              <td>{cooldownOnHeads/1000/60/60} Hours</td>
            </tr>
            <tr>
              <th>Cooldown on Tails</th>
              <td>{cooldownOnTails/1000/60/60} Hours</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="flex">
        <div class="flex-1"> </div>

  <button class="btn" onClick={flipCoin} disabled={!canFlip}>Flip</button>
        <div class="flex-1"> </div>

  <button class="btn" onClick={removeCoin}>Remove</button>
        <div class="flex-1"> </div>
      </div>
        {/* <div>
          <ul>
            {flipHistory().map((entry, index) => (
              <li key={index}>
                {entry.side} at {entry.time.toLocaleString()}
              </li>
            ))}
          </ul>
        </div> */}
      </div>
    );
};

export default CoinFlip;
