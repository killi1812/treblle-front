
/**
 * Defines the possible actions that can be sent to the lobby WebSocket server.
 */
export type LobbyAction = "refresh" | "update_interval"

/**
 * Represents the structure of a message sent to the lobby WebSocket server.
 */
export interface LobbyMessage {
  /** The action to be performed by the server. */
  action: LobbyAction
  interval?: number
}
