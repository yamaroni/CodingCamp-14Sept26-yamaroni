/* ==========================================================================
   Expense & Budget Visualizer — app.js
   The one and only application script (Req 6.1).

   This file groups the application's logical modules into comment sections to
   honor the single-JS-file constraint. Subsequent tasks fill in each module in
   dependency order: State -> Storage -> Validation -> Calculation -> Render ->
   Controller. For now this is scaffolding only: init() is a no-op so the page
   loads and runs without error.
   ========================================================================== */

(function () {
  "use strict";

  /* ========================================================================
     SHARED CONSTANTS
     Values used across modules (storage key, schema version, limits).
     ======================================================================== */

  /** Local Storage key under which the entire dataset is persisted. */
  var STORAGE_KEY = "ebv.transactions";

  /** Current Local Storage schema version (see design: Local Storage Schema). */
  var STORAGE_VERSION = 1;

  /** The fixed, allowed Category values. */
  var CATEGORIES = ["Food", "Transport", "Fun"];

  /** Item_Name length bounds (after trim). */
  var NAME_MIN = 1;
  var NAME_MAX = 100;

  /** Amount value bounds (inclusive). */
  var AMOUNT_MIN = 0.01;
  var AMOUNT_MAX = 999999999.99;

  /* ========================================================================
     STATE MODULE
     Single source of truth: the in-memory transactions array.
     (Task 2)

     This module owns the canonical list of transactions for the running app.
     It exposes plain accessors/mutators and never touches the DOM or Local
     Storage — callers (the Controller) coordinate persistence and rendering.
     ======================================================================== */

  /**
   * A single recorded expense.
   *
   * @typedef {Object} Transaction
   * @property {string}  id        - Unique id (crypto.randomUUID, with fallback).
   * @property {string}  name      - Item_Name, 1-100 chars after trim.
   * @property {number}  amount    - Positive number in [0.01, 999999999.99].
   * @property {"Food"|"Transport"|"Fun"} category - Fixed category set.
   */

  /**
   * The single source of truth: the in-memory list of transactions.
   * Every view renders from this array; every add/delete mutates it.
   * @type {Transaction[]}
   */
  var transactions = [];

  /**
   * Generate a unique id for a Transaction.
   * Prefers the standard `crypto.randomUUID()`; falls back to a
   * timestamp + random string when it is unavailable (Requirement 2.4).
   * @returns {string} A unique identifier.
   */
  function generateId() {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
    // Fallback: timestamp plus random suffix — unique enough for a
    // single-user, client-side app when crypto.randomUUID is missing.
    return (
      Date.now().toString(36) +
      "-" +
      Math.random().toString(36).slice(2, 10)
    );
  }

  /**
   * Get the current transactions.
   * Returns a shallow copy so callers cannot mutate the internal array
   * by reference; the State module stays the single source of truth.
   * @returns {Transaction[]} A copy of the current transactions.
   */
  function getTransactions() {
    return transactions.slice();
  }

  /**
   * Replace the entire transactions list (used on load from storage).
   * @param {Transaction[]} list - The new list of transactions.
   */
  function setTransactions(list) {
    transactions = Array.isArray(list) ? list.slice() : [];
  }

  /**
   * Append a transaction to the list.
   * @param {Transaction} tx - The transaction to add.
   * @returns {Transaction} The added transaction.
   */
  function addTransaction(tx) {
    transactions.push(tx);
    return tx;
  }

  /**
   * Remove the transaction with the given id, if present.
   * @param {string} id - The id of the transaction to remove.
   */
  function removeTransaction(id) {
    transactions = transactions.filter(function (tx) {
      return tx.id !== id;
    });
  }

  /* ========================================================================
     VALIDATION MODULE
     Pure functions that validate raw form input before a Transaction is made.
     (Task 4)
     ======================================================================== */

  /* ========================================================================
     STORAGE MODULE
     Wraps Local Storage read/write with defensive parsing and error handling.
     (Task 3)

     This module is the only place that reads/writes Local Storage. It is
     DOM-free: it returns plain result objects and never renders. The stored
     document is a versioned envelope { version, transactions: [...] } under
     the STORAGE_KEY; see design "Local Storage Schema".
     ======================================================================== */

  /**
   * Validate that a single parsed value has the shape of a Transaction:
   * a string `id`, a string `name` that is 1-100 chars after trimming, a
   * finite `amount` in [AMOUNT_MIN, AMOUNT_MAX], and a `category` in the
   * fixed set. Defensive against non-object entries (null, arrays, etc.).
   * @param {*} entry - A candidate parsed from stored JSON.
   * @returns {boolean} True only if the entry is a well-formed Transaction.
   */
  function isValidStoredTransaction(entry) {
    if (entry === null || typeof entry !== "object" || Array.isArray(entry)) {
      return false;
    }

    // id: must be a string.
    if (typeof entry.id !== "string") {
      return false;
    }

    // name: must be a string 1-100 chars after trimming (per design).
    if (typeof entry.name !== "string") {
      return false;
    }
    var trimmedName = entry.name.trim();
    if (trimmedName.length < NAME_MIN || trimmedName.length > NAME_MAX) {
      return false;
    }

    // amount: must be a finite number within [AMOUNT_MIN, AMOUNT_MAX].
    if (typeof entry.amount !== "number" || !isFinite(entry.amount)) {
      return false;
    }
    if (entry.amount < AMOUNT_MIN || entry.amount > AMOUNT_MAX) {
      return false;
    }

    // category: must be one of the fixed set.
    if (CATEGORIES.indexOf(entry.category) === -1) {
      return false;
    }

    return true;
  }

  /**
   * Load the persisted transactions from Local Storage with defensive parsing.
   *
   * Behavior (Requirements 5.3, 5.4, 5.5):
   * - Absent key -> `{ transactions: [], error: null }` (a fresh, empty app).
   * - Present but unparseable JSON, or a document that fails the versioned
   *   schema (root object with a `transactions` array) or any per-entry
   *   validation -> `{ transactions: [], error: 'corrupt' }`. The stored value
   *   is left untouched so the user can recover it until the next save.
   * - Valid document -> `{ transactions: [...], error: null }`.
   *
   * DOM-free: only reads Local Storage and returns a result object.
   * @returns {{ transactions: Transaction[], error: (null|'corrupt') }}
   */
  function loadTransactions() {
    var raw;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch (e) {
      // Reading itself failed (e.g. storage disabled). Treat as unreadable.
      return { transactions: [], error: "corrupt" };
    }

    // Absent key -> empty set, no error (Requirement 5.4).
    if (raw === null || raw === undefined) {
      return { transactions: [], error: null };
    }

    var parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      // Parse failure -> corrupt, do not overwrite (Requirement 5.5).
      return { transactions: [], error: "corrupt" };
    }

    // Root must be a plain object carrying a `transactions` array. The
    // `version` field is required by the schema; unknown versions are treated
    // as corrupt rather than silently accepted.
    if (
      parsed === null ||
      typeof parsed !== "object" ||
      Array.isArray(parsed) ||
      typeof parsed.version !== "number" ||
      parsed.version !== STORAGE_VERSION ||
      !Array.isArray(parsed.transactions)
    ) {
      return { transactions: [], error: "corrupt" };
    }

    // Every entry must individually validate; a single bad entry makes the
    // whole dataset corrupt (a partially-trusted set cannot be repaired
    // without guessing user intent — see design).
    var list = parsed.transactions;
    for (var i = 0; i < list.length; i++) {
      if (!isValidStoredTransaction(list[i])) {
        return { transactions: [], error: "corrupt" };
      }
    }

    // All valid: return normalized copies limited to the known fields so no
    // unexpected properties leak into in-memory state.
    var clean = list.map(function (entry) {
      return {
        id: entry.id,
        name: entry.name,
        amount: entry.amount,
        category: entry.category,
      };
    });

    return { transactions: clean, error: null };
  }

  /**
   * Persist the given transactions to Local Storage as the versioned JSON
   * document `{ version, transactions }` under STORAGE_KEY. This is the write
   * counterpart to loadTransactions and uses the same key and schema so a
   * save/load round-trip is consistent (Requirements 5.1, 5.2).
   *
   * Failure handling (Requirement 5.6): the write is wrapped so no exception
   * escapes. If the browser reports the quota was exceeded, returns
   * `{ ok: false, error: 'quota' }`; any other write failure (e.g. storage
   * disabled, serialization error, security exception) returns
   * `{ ok: false, error: 'write' }`. On success returns `{ ok: true }`. The
   * caller (Controller) uses this to roll back the in-memory mutation and
   * surface a "changes could not be saved" message.
   *
   * DOM-free: only writes Local Storage and returns a result object.
   * @param {Transaction[]} list - The transactions to persist.
   * @returns {{ ok: boolean, error?: ('quota'|'write') }}
   */
  function saveTransactions(list) {
    // Normalize to the known fields only so no unexpected in-memory properties
    // leak into the stored document; mirrors the load-side normalization.
    var safeList = Array.isArray(list) ? list : [];
    var doc = {
      version: STORAGE_VERSION,
      transactions: safeList.map(function (tx) {
        return {
          id: tx.id,
          name: tx.name,
          amount: tx.amount,
          category: tx.category,
        };
      }),
    };

    var serialized;
    try {
      serialized = JSON.stringify(doc);
    } catch (e) {
      // Serialization failure (e.g. circular structure) is a write failure.
      return { ok: false, error: "write" };
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      // Distinguish an exceeded quota from other write errors. Browsers signal
      // quota differently (name "QuotaExceededError" or the legacy Firefox
      // "NS_ERROR_DOM_QUOTA_REACHED", plus legacy numeric codes 22 and 1014),
      // so check the recognizable markers rather than a single name.
      if (isQuotaExceededError(e)) {
        return { ok: false, error: "quota" };
      }
      return { ok: false, error: "write" };
    }

    return { ok: true };
  }

  /**
   * Detect whether a caught Local Storage write error represents an exceeded
   * storage quota, accounting for cross-browser differences.
   * @param {*} e - The caught exception.
   * @returns {boolean} True if the error indicates the quota was exceeded.
   */
  function isQuotaExceededError(e) {
    if (!e) {
      return false;
    }
    return (
      e.name === "QuotaExceededError" ||
      e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
      e.code === 22 ||
      e.code === 1014
    );
  }

  /* ========================================================================
     CALCULATION MODULE
     Pure functions for balance and category totals/percentages.
     (Task 5)
     ======================================================================== */

  /* ========================================================================
     RENDER MODULE
     Reads state and updates the DOM. Each renderer is idempotent.
     (Task 7)
     ======================================================================== */

  /* ========================================================================
     CONTROLLER MODULE
     Wires DOM events to state changes and orchestrates persist + render.
     (Task 8)
     ======================================================================== */

  /**
   * Application entry point.
   * No-op for now (scaffolding). Later tasks add feature detection, storage
   * load, event wiring, and the first render here.
   */
  function init() {
    // Intentionally empty during scaffolding (Task 1).
  }

  // Run init() once the DOM is ready.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
