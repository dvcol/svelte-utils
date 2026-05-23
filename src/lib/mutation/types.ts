export interface MutationOptions extends MutationObserverInit {}

export interface UseMutation {
  /**
   * Attach a `MutationObserver` to a node.
   */
  observe: import('svelte/attachments').Attachment<Element>;
  /**
   * The most recent `MutationRecord` delivered to this consumer.
   */
  readonly current: MutationRecord | undefined;
  /**
   * The latest batch of `MutationRecord`s delivered to this consumer.
   */
  readonly records: MutationRecord[];
}
