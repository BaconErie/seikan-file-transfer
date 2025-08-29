# Connection Process

1. A requests for a tunnel
2. B connects to that tunnel
3. A sends a public key. B converts this key into an image, displayed to user.
4. B uses this public key to encrypt an identifying string. A converts this key
   to an image, displayed to user.
5. If images on both sides match, then B accepts with "b-accept", and sends a
   transport-key, encrypted with the public key. Server keeps track of this, and
   sends "b-accept" to A
6. A will also send "a-accept" once they accept, and this will be passed to B
7. Once both sides accept, data can be transferred using "data" events. Data is
   sent in 10,000 byte (10 KB) chunks.
8. Tunnel is closed if either side closes socket connection or server closes.

# Seikan Server API

## `/seikan-api`

Used by the client to verify that a Seikan server is available.

## `/seikan-api/tunnel`

Creates a new
