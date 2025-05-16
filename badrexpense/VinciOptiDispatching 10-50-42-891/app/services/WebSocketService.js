import { useState, useEffect, useRef } from 'react';

export const useWebSocketService = (url, onMessageReceived) => {
  const [connected, setConnected] = useState(false);
  const ws = useRef(null);

  useEffect(() => {
    connectWebSocket();
    return () => ws.current?.close();
  }, [url]);

  const connectWebSocket = () => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setConnected(true);
        // Request initial technician status
        ws.current.send(JSON.stringify({ type: 'status_request' }));
      };

      ws.current.onmessage = (e) => {
        console.log('📨 Raw WebSocket Data:', e.data);
        
        try {
          const data = JSON.parse(e.data);
          console.log('📦 Parsed data:', JSON.stringify(data, null, 2));
          console.log('📊 Status field:', data.status);
          
          // Pass data to the callback
          if (onMessageReceived) {
            onMessageReceived(data);
          }
        } catch (error) {
          console.error('❌ Parsing error:', error);
        }
      };

      ws.current.onerror = (e) => {
        console.error('❌ WebSocket error:', e.message);
        setConnected(false);
      };

      ws.current.onclose = () => {
        console.log('❌ WebSocket closed');
        setConnected(false);
        setTimeout(connectWebSocket, 5000);
      };

    } catch (error) {
      console.error('❌ WS setup error:', error);
      setTimeout(connectWebSocket, 5000);
    }
  };

  return {
    connected,
    sendMessage: (message) => {
      if (ws.current?.readyState === WebSocket.OPEN) {
        ws.current.send(JSON.stringify(message));
      }
    }
  };
};