import { createSignal, onMount, Show } from 'solid-js';
import CoinManager from './CoinManager';
import { POCKET } from './PocketBase';

const App = () => {
  const [isLogged, setIsLogged] = createSignal(false);
  const [mail, setMail] = createSignal('');
  const [pass, setPass] = createSignal('');
  const [err, setErr] = createSignal('');
  const [uid, setUid] = createSignal(null);

  onMount(() => {
    const storedUid = localStorage.getItem('uid');
    if (storedUid) {
      setUid(storedUid);
      setIsLogged(true);
    }
  });

  const login = async () => {
    try {
      const authData = await POCKET.collection('users').authWithPassword(mail(), pass());
      setIsLogged(POCKET.authStore.isValid);
      setUid(authData.record.id); // Ensure this is being set correctly
      localStorage.setItem('uid', authData.record.id); // Save UID to localStorage
    } catch (error) {
      setErr('Login failed: ' + error.message);
    }
  };

  const logout = () => {
    setIsLogged(false);
    setUid(null);
    POCKET.authStore.clear();
    localStorage.removeItem('uid'); // Clear UID from localStorage
  };

  return (
    <div>
      <Show when={!isLogged()}>
        <div>
          <input placeholder="Your email" type="email" value={mail()} onChange={ev => setMail(ev.target.value)} />
          <input placeholder="Your password" type="password" value={pass()} onChange={ev => setPass(ev.target.value)} />
          <Show when={!!err()}>
            <p class="err">{err()}</p>
          </Show>
          <button class="btn" onClick={login}>Login</button>
        </div>
      </Show>
      <Show when={isLogged()}>
        <CoinManager user={uid} />
        <button class="btn" onClick={logout}>Logout</button>
      </Show>
    </div>
  );
};

export default App;
