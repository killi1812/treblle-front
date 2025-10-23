import type { RequestStatistics } from '@/dto/statisticsDto';
import type { LobbyMessage } from '@/models/server/LobbyMessage';
import { ref } from 'vue';

// Determine WebSocket protocol based on window location protocol
const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = `${protocol}//${window.location.host}/api/requests/statistics/ws`;

/**
 * Manages the WebSocket connection to the game lobby server.
 * It handles connecting, disconnecting, sending messages, and maintaining the real-time state of the lobby.
 * This service is implemented as a singleton to ensure only one WebSocket connection is active at a time.
 */
class ChartSocketService {
  /** The WebSocket instance. Null if not connected. */
  private socket: WebSocket | null = null;
  /** A reactive reference to the current state of the lobby, including players and spectators. */
  public stats = ref<RequestStatistics[]>();
  /** A reactive boolean indicating the current connection status of the WebSocket. */
  public isConnected = ref(false);


  /**
   * Establishes a WebSocket connection to the server and sets up event listeners
   * for open, message, close, and error events.
   */
  public connect() {
    // Avoid multiple connections
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('WebSocket is already connected.');
      return;
    }

    this.socket = new WebSocket(`${WS_URL}`);

    this.socket.onopen = () => {
      console.log('WebSocket connected to lobby');
      this.isConnected.value = true;
    };

    this.socket.onmessage = (event) => {
      try {
        const state: RequestStatistics = JSON.parse(event.data);
        this.stats.value?.push(state)
      } catch (error) {
        console.error('Error parsing lobby state:', error);
      }
    };

    this.socket.onclose = () => {
      console.log('WebSocket disconnected from lobby');
      this.isConnected.value = false;
      this.socket = null;
    };

    this.socket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  }

  /**
   * Sends a JSON message to the WebSocket server if the connection is open.
   * @param {LobbyMessage} message - The message object to send.
   */
  private sendMessage(message: LobbyMessage) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected.');
    }
  }

  public refresh() {
    this.sendMessage({ action: "refresh" })
  }

  /**
   * Closes the WebSocket connection if it is open.
   */
  public disconnect() {
    if (this.socket) {
      this.socket.close(1001);
    }
  }
}

// Export a singleton instance of the service to be used throughout the application.
export const chartSocketService = new ChartSocketService();


