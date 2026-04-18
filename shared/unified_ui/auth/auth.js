/* ============================================================
   NouRion — server/auth.js  (Phase 4 — Auth & Hardening)
   ------------------------------------------------------------
   Pure Node.js authentication module:
     - scrypt password hashing (salted, timing-safe verify)
     - opaque session tokens (random, server-side store)
     - CSRF tokens bound to session
     - constant-time token compare
     - in-memory session store with TTL eviction
       (swappable for redis/file-backed in Phase 5)

   No external dependencies. No frameworks.
   ============================================================ */

'use strict';

var crypto = require('crypto');

// ==========================================================
// CONFIG
// ==========================================================
var SCRYPT_KEYLEN  = 64;
var SCRYPT_COST    = 16384;   // 2^14, ~50ms on modern hardware
var SCRYPT_BLOCK   = 8;
var SCRYPT_PARALL  = 1;
var SALT_BYTES     = 16;
var SESSION_BYTES  = 32;       // 256 bits
var CSRF_BYTES     = 32;
var DEFAULT_TTL_MS = 1000 * 60 * 60 * 8;  // 8 hours

// ==========================================================
// 1. Password hashing (scrypt + salt)
// Format: scrypt$<costHex>$<saltHex>$<keyHex>
// ==========================================================
function hashPassword(plain) {
  return new Promise(function (resolve, reject) {
    if (typeof plain !== 'string' || plain.length < 1) {
      return reject(new Error('password must be a non-empty string'));
    }
    var salt = crypto.randomBytes(SALT_BYTES);
    crypto.scrypt(plain, salt, SCRYPT_KEYLEN, {
      N: SCRYPT_COST, r: SCRYPT_BLOCK, p: SCRYPT_PARALL
    }, function (err, key) {
      if (err) return reject(err);
      resolve('scrypt$' + SCRYPT_COST.toString(16) + '$' +
              salt.toString('hex') + '$' + key.toString('hex'));
    });
  });
}

function verifyPassword(plain, stored) {
  return new Promise(function (resolve) {
    if (typeof plain !== 'string' || typeof stored !== 'string') {
      return resolve(false);
    }
    var parts = stored.split('$');
    if (parts.length !== 4 || parts[0] !== 'scrypt') return resolve(false);
    var cost = parseInt(parts[1], 16);
    if (!Number.isFinite(cost) || cost < 2 || (cost & (cost - 1)) !== 0) {
      return resolve(false); // must be power of 2
    }
    var salt, key;
    try {
      salt = Buffer.from(parts[2], 'hex');
      key  = Buffer.from(parts[3], 'hex');
    } catch (e) { return resolve(false); }
    if (!salt.length || !key.length) return resolve(false);

    var task;
    try {
      task = crypto.scrypt(plain, salt, key.length, {
        N: cost, r: SCRYPT_BLOCK, p: SCRYPT_PARALL
      }, function (err, derived) {
      if (err) return resolve(false);
      if (derived.length !== key.length) return resolve(false);
      try {
        resolve(crypto.timingSafeEqual(derived, key));
      } catch (e) {
        resolve(false);
      }
    });
    } catch (e) { return resolve(false); }
  });
}

// ==========================================================
// 2. Constant-time token compare
// ==========================================================
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  var ba = Buffer.from(a);
  var bb = Buffer.from(b);
  if (ba.length !== bb.length) {
    // Still do a compare to avoid early-return timing
    crypto.timingSafeEqual(ba, ba);
    return false;
  }
  return crypto.timingSafeEqual(ba, bb);
}

// ==========================================================
// 3. Random opaque tokens (URL-safe base64)
// ==========================================================
function randomToken(bytes) {
  return crypto.randomBytes(bytes || SESSION_BYTES)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ==========================================================
// 4. SessionStore — in-memory, TTL-evicted
//    Each session: { user, csrf, createdAt, expiresAt, ip }
// ==========================================================
function SessionStore(opts) {
  opts = opts || {};
  this.ttl = opts.ttl || DEFAULT_TTL_MS;
  this._map = new Map();
  // Sweep expired sessions every 5 minutes
  if (opts.sweepInterval !== false) {
    var self = this;
    this._sweep = setInterval(function () { self.purgeExpired(); }, 5 * 60 * 1000);
    if (this._sweep.unref) this._sweep.unref();
  }
}

SessionStore.prototype.create = function (user, ctx) {
  var token = randomToken(SESSION_BYTES);
  var csrf  = randomToken(CSRF_BYTES);
  var now = Date.now();
  this._map.set(token, {
    user: user,
    csrf: csrf,
    createdAt: now,
    expiresAt: now + this.ttl,
    ip: (ctx && ctx.ip) || null,
    ua: (ctx && ctx.ua) || null
  });
  return { token: token, csrf: csrf, expiresAt: now + this.ttl };
};

SessionStore.prototype.get = function (token) {
  if (typeof token !== 'string' || !token) return null;
  var s = this._map.get(token);
  if (!s) return null;
  if (s.expiresAt < Date.now()) {
    this._map.delete(token);
    return null;
  }
  return s;
};

SessionStore.prototype.touch = function (token) {
  var s = this.get(token);
  if (!s) return false;
  s.expiresAt = Date.now() + this.ttl;
  return true;
};

SessionStore.prototype.destroy = function (token) {
  return this._map.delete(token);
};

SessionStore.prototype.destroyAllForUser = function (username) {
  var n = 0;
  this._map.forEach(function (s, k, m) {
    if (s.user && s.user.username === username) { m.delete(k); n++; }
  });
  return n;
};

SessionStore.prototype.purgeExpired = function () {
  var now = Date.now();
  var n = 0;
  this._map.forEach(function (s, k, m) {
    if (s.expiresAt < now) { m.delete(k); n++; }
  });
  return n;
};

SessionStore.prototype.size = function () { return this._map.size; };

SessionStore.prototype.stop = function () {
  if (this._sweep) { clearInterval(this._sweep); this._sweep = null; }
};

// ==========================================================
// 5. Cookie helpers (no external dep)
// ==========================================================
function parseCookies(header) {
  var out = Object.create(null);
  if (typeof header !== 'string' || !header) return out;
  header.split(';').forEach(function (part) {
    var idx = part.indexOf('=');
    if (idx === -1) return;
    var k = part.slice(0, idx).trim();
    var v = part.slice(idx + 1).trim();
    if (!k) return;
    try { out[k] = decodeURIComponent(v); }
    catch (e) { out[k] = v; }
  });
  return out;
}

function serializeCookie(name, value, opts) {
  opts = opts || {};
  var parts = [name + '=' + encodeURIComponent(value)];
  if (opts.maxAge != null) parts.push('Max-Age=' + Math.floor(opts.maxAge / 1000));
  if (opts.path)           parts.push('Path=' + opts.path);
  if (opts.domain)         parts.push('Domain=' + opts.domain);
  if (opts.expires)        parts.push('Expires=' + opts.expires.toUTCString());
  if (opts.httpOnly)       parts.push('HttpOnly');
  if (opts.secure)         parts.push('Secure');
  if (opts.sameSite)       parts.push('SameSite=' + opts.sameSite);
  return parts.join('; ');
}

// ==========================================================
// 6. CSRF helpers
// ==========================================================
function csrfMatches(session, headerToken) {
  if (!session || !session.csrf) return false;
  return safeEqual(session.csrf, headerToken || '');
}

// ==========================================================
// 7. UserStore — minimal in-memory user table
//    (swappable for file-backed in Phase 5)
//    Each user: { username, displayName, role, passwordHash, createdAt }
// ==========================================================
function UserStore() {
  this._users = new Map();
}

UserStore.prototype.add = async function (username, password, profile) {
  if (typeof username !== 'string' || !username) throw new Error('username required');
  if (this._users.has(username)) throw new Error('user exists');
  var hash = await hashPassword(password);
  var rec = {
    username: username,
    displayName: (profile && profile.displayName) || username,
    role: (profile && profile.role) || 'user',
    passwordHash: hash,
    createdAt: new Date().toISOString()
  };
  this._users.set(username, rec);
  return Object.assign({}, rec, { passwordHash: undefined });
};

UserStore.prototype.find = function (username) {
  return this._users.get(username) || null;
};

UserStore.prototype.verify = async function (username, password) {
  var u = this._users.get(username);
  if (!u) {
    // Fixed-time fake hash to prevent username enumeration timing attacks
    await verifyPassword(password || '', 'scrypt$4000$00$00');
    return null;
  }
  var ok = await verifyPassword(password, u.passwordHash);
  if (!ok) return null;
  return { username: u.username, displayName: u.displayName, role: u.role };
};

UserStore.prototype.list = function () {
  var arr = [];
  this._users.forEach(function (u) {
    arr.push({ username: u.username, displayName: u.displayName, role: u.role, createdAt: u.createdAt });
  });
  return arr;
};

UserStore.prototype.size = function () { return this._users.size; };

// ==========================================================
// EXPORTS
// ==========================================================
module.exports = {
  hashPassword:  hashPassword,
  verifyPassword: verifyPassword,
  safeEqual:     safeEqual,
  randomToken:   randomToken,
  SessionStore:  SessionStore,
  UserStore:     UserStore,
  parseCookies:  parseCookies,
  serializeCookie: serializeCookie,
  csrfMatches:   csrfMatches,
  // exposed for tests
  _config: {
    SCRYPT_COST: SCRYPT_COST,
    SCRYPT_BLOCK: SCRYPT_BLOCK,
    SCRYPT_PARALL: SCRYPT_PARALL,
    SCRYPT_KEYLEN: SCRYPT_KEYLEN,
    SESSION_BYTES: SESSION_BYTES,
    DEFAULT_TTL_MS: DEFAULT_TTL_MS
  }
};
