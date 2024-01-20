import PocketBase from 'pocketbase';
export const POCKET = new PocketBase('https://my-coin-flip-backend.fly.dev');
POCKET.autoCancellation(false);