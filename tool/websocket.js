"use server";

import { WebSocketServer } from 'ws';

let wss;

export function initWebSocketServer(req, res) {
  if (!wss) {
    wss = new WebSocketServer({ port: 3001 });

    wss.on('connection', (ws) => {
      console.log('Client connected');

      ws.on('message', (message) => {
        console.log('Received:', message);
        // Handle the message from the client here
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  return new Response('WebSocket server initialized');
}
